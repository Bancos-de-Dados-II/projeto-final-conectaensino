import EntityManager from "../components/crud/EntityManager";
import { subjectsResource } from "../config/resources";

function SubjectsPage() {
  return <EntityManager config={subjectsResource} />;
}

export default SubjectsPage;
