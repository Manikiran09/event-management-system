import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminUsersPage from "./pages/AdminUsersPage";
import DashboardPage from "./pages/DashboardPage";
import EventsPage from "./pages/EventsPage";
import LoginPage from "./pages/LoginPage";
import MyRegistrationsPage from "./pages/MyRegistrationsPage";
import PhoneSetupPage from "./pages/PhoneSetupPage";
import RegisterPage from "./pages/RegisterPage";
import { useAuth } from "./context/AuthContext";

const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/phone-setup" element={<PhoneSetupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["admin", "organizer", "participant"]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute roles={["admin", "organizer", "participant"]}>
            <EventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-registrations"
        element={
          <ProtectedRoute roles={["participant"]}>
            <MyRegistrationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

export default App;
