import { useEffect, useState } from "react";
import api from "@/lib/api";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default function Admin() {
  const [state, setState] = useState("checking"); // checking | guest | authed

  useEffect(() => {
    api
      .get("/v1/admin/me")
      .then(() => setState("authed"))
      .catch(() => setState("guest"));
  }, []);

  if (state === "checking") {
    return (
      <div data-testid="admin-loading" className="flex min-h-screen items-center justify-center bg-maroon-deep">
        <p className="font-script text-3xl text-gold">Loading…</p>
      </div>
    );
  }

  if (state === "guest") return <AdminLogin onLogin={() => setState("authed")} />;

  return <AdminDashboard onLogout={() => setState("guest")} />;
}
