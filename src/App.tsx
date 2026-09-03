import { SecurityProvider } from "./context/SecurityContext";
import RoutesPage from "./routes/RoutesPage";
import { BrowserRouter } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <SecurityProvider>
        <RoutesPage />
      </SecurityProvider>
    </BrowserRouter>
  );
}

export default App;
