import { useEffect, useState } from "react";
import api from "@/lib/api";

let request = null; // one shared fetch for the gallery, nav and footer

// Photos and videos uploaded from the admin panel, newest first.
// `loaded` is false until the first response, so callers can avoid flashing an empty gallery.
export default function useGallery() {
  const [state, setState] = useState({ photos: [], loaded: false });
  useEffect(() => {
    let live = true;
    request ??= api.get("/v1/gallery").then(({ data }) => data.photos || []).catch(() => []);
    request.then((photos) => live && setState({ photos, loaded: true }));
    return () => {
      live = false;
    };
  }, []);
  return state;
}

// Menu links, minus the gallery link while nothing has been uploaded.
export function useNavLinks(links) {
  const { photos } = useGallery();
  return photos.length ? links : links.filter((l) => l.id !== "gallery");
}
