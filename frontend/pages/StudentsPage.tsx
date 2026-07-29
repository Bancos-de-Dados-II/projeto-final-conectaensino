import EntityManager from "../components/crud/EntityManager";
import { studentsResource } from "../config/resources";

function StudentsPage() {
  return <EntityManager config={studentsResource} />;
}

export default StudentsPage;
