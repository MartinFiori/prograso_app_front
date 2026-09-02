import React, { Suspense, useEffect, useState } from "react";
import Loader from "../components/Loader/Loader";
import { isConnectionError, useConnection } from "../hooks/useConnection";
import { ApiResponse } from "../types/index";
import { Route, Routes } from "react-router-dom";

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
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login"></Route>
      </Routes>
    </Suspense>
  );
}
