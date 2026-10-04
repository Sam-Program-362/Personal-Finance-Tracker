import { useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { clearSession, getToken } from "./lib/session";
import { Spinner } from "./components/ui";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

/**
 * Guards a route behind a valid session. Signed-out visitors are sent to
 * /auth with their intended destination preserved in `returnTo`.
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const token = getToken();
  const me = useQuery(api.users.me, { token: token ?? undefined });

  useEffect(() => {
    if (me === null && token) clearSession();
  }, [me, token]);

  if (me === undefined) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="h-6 w-6 text-mint-400" />
      </div>
    );
  }

  if (!token || me === null) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
