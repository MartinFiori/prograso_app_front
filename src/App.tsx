import "./App.css";
import RoutesPage from "./routes/RoutesPage";
import { BrowserRouter } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <RoutesPage />
    </BrowserRouter>
  );
}

export default App;
