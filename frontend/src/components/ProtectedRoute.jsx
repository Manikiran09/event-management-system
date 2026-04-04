import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-hero-radial px-4">
        <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-white/80 p-6 text-center shadow-glow backdrop-blur-md">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-700" />
          <p className="font-display text-xl font-semibold tracking-tight text-slate-950">Loading secure area</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Verifying your session and permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
