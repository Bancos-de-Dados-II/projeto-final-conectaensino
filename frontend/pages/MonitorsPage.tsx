import EntityManager from "../components/crud/EntityManager";
import { monitorsResource } from "../config/resources";
import { useAuth } from "../hooks/useAuth";
import { canManageMonitors } from "../utils/auth-role";

function MonitorsPage() {
  const { user } = useAuth();

  return (
    <EntityManager
      config={monitorsResource}
      readOnly={!canManageMonitors(user)}
    />
  );
}

export default MonitorsPage;
