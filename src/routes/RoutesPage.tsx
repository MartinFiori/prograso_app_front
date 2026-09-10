import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import AdminLayout from "../layouts/AdminLayout";
import AdminRoute from "./guards/AdminRoute";

const AuthCallback = lazy(() => import("../pages/AuthCallback/AuthCallback"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound"));
const HomeIndex = lazy(() => import("../pages/Home/HomeIndex"));
const ProfilePage = lazy(() => import("../pages/Profile/ProfilePage"));
const CategoryEvents = lazy(
  () => import("../pages/CategoryEvents/CategoryEvents"),
);
const EventDetail = lazy(() => import("../pages/EventDetail/EventDetail"));
const LegacyEventRedirect = lazy(
  () => import("../pages/EventDetail/LegacyEventRedirect"),
);
const EventCategoriesList = lazy(
  () => import("../pages/admin/EventCategories/EventCategoriesList"),
);
const EventCategoryCreatePage = lazy(
  () => import("../pages/admin/EventCategories/EventCategoryCreatePage"),
);
const EventCategoryEditPage = lazy(
  () => import("../pages/admin/EventCategories/EventCategoryEditPage"),
);
const EventsList = lazy(() => import("../pages/admin/Events/EventsList"));
const EventCreatePage = lazy(
  () => import("../pages/admin/Events/EventCreatePage"),
);
const EventEditPage = lazy(() => import("../pages/admin/Events/EventEditPage"));
const RegistrationsPage = lazy(
  () => import("../pages/admin/Registrations/RegistrationsPage"),
);
const UsersList = lazy(() => import("../pages/admin/Users/UsersList"));
const UserDetailPage = lazy(() => import("../pages/admin/Users/UserDetailPage"));
const EventStatusesPage = lazy(
  () => import("../pages/admin/EventStatuses/EventStatusesPage"),
);
const RegistrationStatusesPage = lazy(
  () => import("../pages/admin/RegistrationStatuses/RegistrationStatusesPage"),
);
const AuditLogsPage = lazy(
  () => import("../pages/admin/AuditLogs/AuditLogsPage"),
);

export default function RoutesPage() {
  return (
    <Routes>
      <Route
        path="/"
        element={<PublicLayout />}
      >
        <Route
          index
          element={<HomeIndex />}
        />
        <Route
          path="profile"
          element={<ProfilePage />}
        />
        <Route
          path="events"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
        <Route
          path="event/:category_id/:event_id"
          element={<EventDetail />}
        />
        <Route
          path="event/:category_id"
          element={<CategoryEvents />}
        />
        <Route
          path="eventos"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
        <Route
          path="eventos/:id"
          element={<LegacyEventRedirect />}
        />
        <Route
          path="auth/callback"
          element={<AuthCallback />}
        />
        <Route element={<AdminRoute />}>
          <Route
            path="admin"
            element={<AdminLayout />}
          >
            <Route
              index
              element={
                <Navigate
                  to="categorias"
                  replace
                />
              }
            />
            <Route
              path="categorias"
              element={<EventCategoriesList />}
            />
            <Route
              path="categorias/nueva"
              element={<EventCategoryCreatePage />}
            />
            <Route
              path="categorias/:id/editar"
              element={<EventCategoryEditPage />}
            />
            <Route
              path="eventos"
              element={<EventsList />}
            />
            <Route
              path="eventos/nuevo"
              element={<EventCreatePage />}
            />
            <Route
              path="eventos/:id/editar"
              element={<EventEditPage />}
            />
            <Route
              path="inscripciones"
              element={<RegistrationsPage />}
            />
            <Route
              path="inscripciones/:eventId"
              element={<RegistrationsPage />}
            />
            <Route
              path="usuarios"
              element={<UsersList />}
            />
            <Route
              path="usuarios/:userId"
              element={<UserDetailPage />}
            />
            <Route
              path="estados-evento"
              element={<EventStatusesPage />}
            />
            <Route
              path="estados-inscripcion"
              element={<RegistrationStatusesPage />}
            />
            <Route
              path="auditoria"
              element={<AuditLogsPage />}
            />
          </Route>
        </Route>
      </Route>
      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}
