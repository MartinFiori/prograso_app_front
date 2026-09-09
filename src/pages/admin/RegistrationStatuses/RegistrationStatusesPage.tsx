import { listRegistrationStatusesPath } from "../../../services/adminApi";
import StatusCatalogPage from "../StatusCatalog/StatusCatalogPage";

export default function RegistrationStatusesPage() {
  return (
    <StatusCatalogPage
      title="Estados de inscripción"
      path={listRegistrationStatusesPath()}
      emptyMessage="No hay estados de inscripción."
    />
  );
}
