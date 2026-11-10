import { useEffect, useState } from "react";
import api from "@/lib/api";
import { WEDDING } from "@/config/weddingDetails";

const DEFAULTS = { bride: WEDDING.contacts, groom: WEDDING.contacts };

// Contact numbers per side, as configured in the admin panel (falls back to the built-in defaults).
export default function useContacts() {
  const [contacts, setContacts] = useState(DEFAULTS);
  useEffect(() => {
    let live = true;
    api
      .get("/v1/contacts")
      .then(({ data }) => live && data.contacts && setContacts({ ...DEFAULTS, ...data.contacts }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return contacts;
}

// Contacts to show for a page: that side's list, or both (de-duplicated) on the common page.
export function contactsForSide(contacts, side) {
  if (side) return contacts[side] || [];
  const seen = new Set();
  return [...contacts.groom, ...contacts.bride].filter((c) => !seen.has(c.number) && seen.add(c.number));
}
