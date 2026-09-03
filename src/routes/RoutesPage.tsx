import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
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
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
        <Route />
      </Route>
      {/* <Route
        path="/*"
        element={<NotFound />}
      /> */}
    </Routes>
  );
}
