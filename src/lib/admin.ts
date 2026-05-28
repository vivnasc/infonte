import { getUtilizadoraAtual } from "@/lib/supabase/server";
import { getAdminViaEnv } from "@/lib/admin-env";

export async function exigirAdmin() {
  const envAdmin = await getAdminViaEnv();
  if (envAdmin) return envAdmin;

  const u = await getUtilizadoraAtual();
  if (!u || !u.is_admin) return null;
  return u;
}
