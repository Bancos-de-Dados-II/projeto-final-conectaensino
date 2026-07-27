import EntityManager from "../components/crud/EntityManager";
import { monitorsResource } from "../config/resources";

function MonitorsPage() {
  return <EntityManager config={monitorsResource} />;
}

export default MonitorsPage;
