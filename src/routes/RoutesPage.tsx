import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
const AuthCallback = lazy(() => import("../pages/AuthCallback/AuthCallback"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound"));
const Home = lazy(() => import("../pages/Home/Home"));

export default function RoutesPage() {
  return (
    <Routes>
      <Route
        path="/"
        element={<PublicLayout />}
      >
        <Route
          path="/"
          element={<Home />}
        />
        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />
        <Route />
      </Route>
      <Route
        path="/*"
        element={<NotFound />}
      />
    </Routes>
  );
}
