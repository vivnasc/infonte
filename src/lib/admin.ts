import { getUtilizadoraAtual } from "@/lib/supabase/server";

export async function exigirAdmin() {
  const u = await getUtilizadoraAtual();
  if (!u || !u.is_admin) return null;
  return u;
}
