import { listStatusesPath } from "../../../services/eventsApi";
import StatusCatalogPage from "../StatusCatalog/StatusCatalogPage";

export default function EventStatusesPage() {
  return (
    <StatusCatalogPage
      title="Estados de evento"
      path={listStatusesPath()}
      emptyMessage="No hay estados de evento."
    />
  );
}
