import { createBrowserRouter, Navigate } from "react-router";
import { Root } from "./Root";
import { GuestHome } from "./pages/GuestHome";
import { StudentDashboard } from "./pages/StudentDashboard";
import { CounselorDashboard } from "./pages/CounselorDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ArticlesPage } from "./pages/ArticlesPage";
import { CounselorsPage } from "./pages/CounselorsPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { Role, useAuth } from "./context/AuthContext";

function DashboardRedirect() {
  const { role } = useAuth();

  if (role === "student") {
    return <Navigate to="/student" replace />;
  }

  if (role === "counselor") {
    return <Navigate to="/counselor" replace />;
  }

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/" replace />;
}

function RequireRole({
  allowedRole,
  children,
}: {
  allowedRole: Exclude<Role, "guest">;
  children: React.ReactNode;
}) {
  const { role } = useAuth();

  if (role === "guest") {
    return <Navigate to="/login" replace />;
  }

  if (role !== allowedRole) {
    return <DashboardRedirect />;
  }

  return <>{children}</>;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();

  if (role !== "guest") {
    return <DashboardRedirect />;
  }

  return <>{children}</>;
}

function StudentProtectedPage() {
  return (
    <RequireRole allowedRole="student">
      <StudentDashboard />
    </RequireRole>
  );
}

function CounselorProtectedPage() {
  return (
    <RequireRole allowedRole="counselor">
      <CounselorDashboard />
    </RequireRole>
  );
}

function AdminProtectedPage() {
  return (
    <RequireRole allowedRole="admin">
      <AdminDashboard />
    </RequireRole>
  );
}

function LoginPublicPage() {
  return (
    <PublicOnly>
      <LoginPage />
    </PublicOnly>
  );
}

function SignupPublicPage() {
  return (
    <PublicOnly>
      <SignupPage />
    </PublicOnly>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: GuestHome },
      { path: "articles", Component: ArticlesPage },
      { path: "counselors", Component: CounselorsPage },

      { path: "student", Component: StudentProtectedPage },
      { path: "counselor", Component: CounselorProtectedPage },
      { path: "admin", Component: AdminProtectedPage },

      { path: "login", Component: LoginPublicPage },
      { path: "signup", Component: SignupPublicPage },
    ],
  },
]);