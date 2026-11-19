import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DAYS, EVENTS as DEFAULT_EVENTS } from "@/config/weddingDetails";

// The server list is the truth (it includes events the admin added); built-in pictures and map links fill the gaps.
const dayLabel = (day) => DAYS.find((d) => d.day === day)?.dateLabel || "";
const withDefaults = (list) =>
  (list.length ? list : DEFAULT_EVENTS).map((e) => {
    const base = DEFAULT_EVENTS.find((b) => b.id === e.id) || {};
    return { side: "both", visible: true, ...base, ...e, image: e.image || base.image || null, dateLabel: dayLabel(e.day) || base.dateLabel };
  });

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
