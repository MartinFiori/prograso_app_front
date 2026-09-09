import { Navigate, Outlet } from "react-router-dom";

import { PadelLoader } from "../../components/PadelLoader/PadelLoader";
import { useSecurity } from "../../context/SecurityContext";

export default function AdminRoute() {
  const { loading, profileLoading, isAuthenticated, isAdmin } = useSecurity();

  if (loading || profileLoading) {
    return (
      <PadelLoader
        fullScreen
        size="lg"
        label="Verificando permisos..."
      />
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
}
