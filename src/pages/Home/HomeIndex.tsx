import { Navigate, useLocation } from "react-router-dom";

import Home from "./Home";

export default function HomeIndex() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));

  if (searchParams.has("code") || hashParams.has("code")) {
    return (
      <Navigate
        to={`/auth/callback${location.search}${location.hash}`}
        replace
      />
    );
  }

  return <Home />;
}
