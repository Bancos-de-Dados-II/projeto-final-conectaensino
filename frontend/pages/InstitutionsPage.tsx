import EntityManager from "../components/crud/EntityManager";
import { institutionsResource } from "../config/resources";

function InstitutionsPage() {
  return <EntityManager config={institutionsResource} />;
}

export default InstitutionsPage;
