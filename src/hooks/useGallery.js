import { useEffect, useState } from "react";
import api from "@/lib/api";

// Photos uploaded from the admin panel, newest first.
export default function useGallery() {
  const [photos, setPhotos] = useState([]);
  useEffect(() => {
    let live = true;
    api
      .get("/v1/gallery")
      .then(({ data }) => live && setPhotos(data.photos || []))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return photos;
}
