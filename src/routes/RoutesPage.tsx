import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Loader from "../components/Loader/Loader";

// type Exercise = {
//   id: number;
//   created_at: string;
//   title: string;
// };

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
        element={<h1>hola</h1>}
      />
    </Routes>
    // </Suspense>
  );
}
