import { Route, Routes } from "react-router-dom";

// Helpers
import { AuthRoute } from "./helpers/AuthRoute";
import { GuestRoute } from "./helpers/GuestRoute";

// Pages
import LoginPage from "../pages/LoginPage";
import AuthRandomPage from "../pages/AuthRandomPage";

const publicRoutes = [
  {
    path: "/login",
    element: <LoginPage />,
  },
] as const;

const authRoutes = [
  {
    path: "/auth-random-page",
    element: <AuthRandomPage />
  }
] as const;

export function AppRoutes() {
  return (
    <Routes>
      {/* Guest routes, cannot access when auth */}
      {publicRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={<GuestRoute>{element}</GuestRoute>}
        />
      ))}

      {/* Auth routes, cannot access when no auth */}
      {authRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={<AuthRoute>{element}</AuthRoute>}
        />
      ))}
    </Routes>
  );
}