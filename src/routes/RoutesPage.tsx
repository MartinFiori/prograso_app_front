import { Link, Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import { lazy } from "react";
// import Home from "../pages/Home/Home";
const Home = lazy(() => import("../pages/Home/Home"));

export default function RoutesPage() {
  // const [exercises, setExercises] = useState<Exercise[]>([]);
  // const connection = useConnection();
  // useEffect(() => {
  //   async function getExercises() {
  //     const result = await connection<ApiResponse<Exercise[]>>({
  //       url: "/exercises",
  //     });
  //     if (isConnectionError(result)) {
  //       console.error(result.message);
  //       return;
  //     }
  //     console.log(result);
  //     setExercises(result.data ?? []);
  //   }

  //   void getExercises();
  // }, [connection]);

  return (
    // <Suspense fallback={<Loader />}>
    <Routes>
      <Route
        path="/"
        element={<PublicLayout />}
      >
        <Route
          path="/"
          element={<Home />}
        />
      </Route>
    </Routes>
    // </Suspense>
  );
}
