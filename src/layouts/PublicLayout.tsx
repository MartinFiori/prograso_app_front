import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import { Suspense } from "react";
// import Loader from "../components/Loader/Loader";
import { PadelLoader } from "../components/PadelLoader/PadelLoader";

export default function PublicLayout() {
  return (
    <div>
      <Navbar />
      <Suspense
        fallback={
          <PadelLoader
            fullScreen
            size="lg"
            label="Preparando la cancha..."
          />
        }
      >
        <Outlet />
      </Suspense>
    </div>
  );
}
