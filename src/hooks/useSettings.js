import { useEffect, useState } from "react";
import api from "@/lib/api";

export const SETTING_DEFAULTS = { showTimeline: false };

// Site-wide switches controlled from the admin panel (defaults apply until they load).
export default function useSettings() {
  const [settings, setSettings] = useState(SETTING_DEFAULTS);
  useEffect(() => {
    let live = true;
    api
      .get("/v1/settings")
      .then(({ data }) => live && setSettings({ ...SETTING_DEFAULTS, ...data.settings }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return settings;
}
