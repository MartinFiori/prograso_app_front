import React from "react";
import { Link } from "react-router-dom";
import { CardExamples } from "../../CardExamples";

export default function Home() {
  return (
    <div>
      Home <Link to="/prueba">Ir a prueba</Link>
      <CardExamples />
    </div>
  );
}
