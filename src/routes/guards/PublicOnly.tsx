import { ReactNode } from "react";
import { useSecurity } from "../../context/SecurityContext";
import Loader from "../../components/Loader/Loader";
import { Navigate, useLocation } from "react-router-dom";

type Props = {
  children: ReactNode;
};

export default function PublicOnly({ children }: Props) {
  const { user, loading } = useSecurity();
  console.log({ user, loading });
  const location = useLocation();
  if (loading) return <Loader />;
  if (user) {
    const to =
      (location.state && location.state.from && location.state.from.pathname) ||
      "/";
    return (
      <Navigate
        to={to}
        replace
      />
    );
  }
  return children;
}
