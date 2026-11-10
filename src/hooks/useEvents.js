import { useEffect, useState } from "react";
import api from "@/lib/api";
import { EVENTS as DEFAULT_EVENTS } from "@/config/weddingDetails";

const withDefaults = (list) =>
  DEFAULT_EVENTS.map((base) => ({ side: "both", visible: true, ...base, ...(list.find((e) => e.id === base.id) || {}) }));

// Events as configured by the couple in the admin panel, falling back to the built-in defaults.
export default function useEvents({ includeHidden = false } = {}) {
  const [events, setEvents] = useState(() => withDefaults([]));
  useEffect(() => {
    let live = true;
    api
      .get("/v1/events")
      .then(({ data }) => live && setEvents(withDefaults(data.events || [])))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return includeHidden ? events : events.filter((e) => e.visible);
}

export const SIDE_LABEL = { both: "Both families", bride: "Bride's side", groom: "Groom's side" };
export const eventVisibleToSide = (event, side) => !side || event.side === "both" || event.side === side;
