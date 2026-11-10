import { useEffect, useRef, useState } from "react";
import { ImagePlus, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { compressImage, videoPoster, VIDEO_MAX_BYTES, VIDEO_TYPES } from "@/lib/image";

const fmt = (v) => new Date(v).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
const OCTET = { headers: { "Content-Type": "application/octet-stream" } };

// Videos go up in pieces (the server and Vercel both reject large single requests).
async function uploadVideo(file, onPart) {
  if (file.size > VIDEO_MAX_BYTES) throw new Error(`"${file.name}" is ${mb(file.size)} — videos must be under 10 MB`);
  const poster = await videoPoster(file);
  const { data: init } = await api.post("/v1/admin/gallery/video/init", { size: file.size, w: poster?.width, h: poster?.height });
  try {
    for (let i = 0; i < init.chunks; i++) {
      onPart?.(i + 1, init.chunks);
      await api.put(`/v1/admin/gallery/video/${init.id}/chunks/${i}`, file.slice(i * init.chunkSize, (i + 1) * init.chunkSize), OCTET);
    }
    if (poster) {
      await api
        .put(`/v1/admin/gallery/video/${init.id}/poster`, poster.blob, { headers: { "Content-Type": "image/jpeg" } })
        .catch(() => {}); // thumbnail is optional
    }
    return (await api.post(`/v1/admin/gallery/video/${init.id}/complete`)).data;
  } catch (e) {
    await api.delete(`/v1/admin/gallery/${init.id}`).catch(() => {}); // clean up the half-finished upload
    throw e;
  }
}

function PhotoCard({ photo, onDelete, onSaved }) {
  const [caption, setCaption] = useState(photo.caption || "");
  const save = async () => {
    if (caption.trim() === (photo.caption || "")) return;
    try {
      const { data } = await api.patch(`/v1/admin/gallery/${photo.id}`, { caption });
      onSaved(data);
      toast.success("Caption saved");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not save caption"));
    }
  };
  return (
    <div data-testid={`gallery-admin-${photo.id}`} className="overflow-hidden rounded-xl border border-gold/30 bg-ivory/70">
      <div className="relative">
        {photo.type === "video" ? (
          <>
            {photo.poster ? (
              <img src={photo.poster} alt={photo.caption || "Wedding video"} loading="lazy" className="aspect-square w-full object-cover" />
            ) : (
              <video src={photo.url} preload="metadata" muted playsInline className="aspect-square w-full bg-maroon-deep object-cover" />
            )}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-maroon/80 p-3 text-ivory"><Play className="h-5 w-5 fill-current" /></span>
            </span>
            <span className="absolute left-2 top-2 rounded-full bg-maroon/85 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-ivory">VIDEO</span>
          </>
        ) : (
          <img src={photo.url} alt={photo.caption || "Wedding photo"} loading="lazy" className="aspect-square w-full object-cover" />
        )}
      </div>
      <div className="space-y-2 p-3">
        <input
          className="input-royal !py-2 text-xs"
          value={caption}
          maxLength={200}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          placeholder="Add a caption (optional)"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-brown/55">{fmt(photo.createdAt)}{photo.type === "video" && photo.size ? ` · ${mb(photo.size)}` : ""}</span>
          <button onClick={() => onDelete(photo)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" aria-label={photo.type === "video" ? "Delete video" : "Delete photo"}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GallerySettings() {
  const [photos, setPhotos] = useState(null);
  const [progress, setProgress] = useState(null); // { done, total }
  const input = useRef(null);

  useEffect(() => {
    api
      .get("/v1/gallery")
      .then(({ data }) => setPhotos(data.photos))
      .catch((e) => toast.error(getErrorMessage(e, "Could not load gallery")));
  }, []);

  const upload = async (fileList) => {
    // Files are uploaded in the order picked, so the last one picked ends up newest (top of the gallery).
    const files = [...fileList].filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    if (!files.length) return toast.error("Please choose photos or videos");
    let ok = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const base = { done: i, total: files.length };
      setProgress(base);
      try {
        let item;
        if (f.type.startsWith("video/")) {
          if (!VIDEO_TYPES.includes(f.type)) throw new Error(`"${f.name}" — only MP4, MOV or WebM videos are supported`);
          item = await uploadVideo(f, (part, parts) => setProgress({ ...base, part, parts }));
        } else {
          const { blob, width, height } = await compressImage(f);
          item = (await api.post(`/v1/admin/gallery?w=${width}&h=${height}`, blob, { headers: { "Content-Type": "image/jpeg" } })).data;
        }
        setPhotos((p) => [item, ...(p || [])]);
        ok++;
      } catch (e) {
        toast.error(e.response ? getErrorMessage(e, "Upload failed") : e.message);
      }
    }
    setProgress(null);
    if (input.current) input.current.value = "";
    if (ok) toast.success(`${ok} item${ok > 1 ? "s" : ""} added to the gallery`);
  };

  const remove = async (photo) => {
    if (!window.confirm("Delete this item from the gallery? This cannot be undone.")) return;
    try {
      await api.delete(`/v1/admin/gallery/${photo.id}`);
      setPhotos((p) => p.filter((x) => x.id !== photo.id));
      toast.success("Photo deleted");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not delete photo"));
    }
  };

  return (
    <section data-testid="gallery-settings" className="card-royal mt-8 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-maroon">Gallery</h3>
          <p className="mt-1 text-sm text-brown/65">
            Upload wedding photos and short videos — the newest upload appears first on the website. Photos are resized automatically; videos can be up to 10 MB (MP4, MOV or WebM).
          </p>
        </div>
        <div>
          <input ref={input} data-testid="gallery-upload-input" type="file" accept="image/*,video/mp4,video/quicktime,video/webm" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
          <button data-testid="gallery-upload-btn" onClick={() => input.current?.click()} disabled={!!progress} className="btn-maroon !px-5 !py-2.5 text-xs disabled:opacity-60">
            <ImagePlus className="h-4 w-4" />
            {progress ? `Uploading ${progress.done + 1} of ${progress.total}${progress.parts ? ` (part ${progress.part}/${progress.parts})` : ""}…` : "Upload photos / videos"}
          </button>
        </div>
      </div>

      {!photos ? (
        <p className="py-8 text-center italic text-brown/55">Loading photos…</p>
      ) : photos.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-gold/50 bg-gold/5 py-10 text-center text-sm italic text-brown/60">
          Nothing uploaded yet. The website is showing the illustrated gallery until you add some.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {photos.map((p) => (
            <PhotoCard key={p.id} photo={p} onDelete={remove} onSaved={(u) => setPhotos((list) => list.map((x) => (x.id === u.id ? u : x)))} />
          ))}
        </div>
      )}
    </section>
  );
}
