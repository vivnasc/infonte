import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

// Bypass de admin via env. Como o projeto Supabase é partilhado com
// outras apps, não queremos criar conta Supabase só para administrar a
// Infonte. As env vars ADMIN_EMAIL e ADMIN_PASSWORD ficam na Vercel.

export const COOKIE_ADMIN = "infonte_admin_v1";

type Pseudo = {
  id: string;
  auth_id: null;
  email: string;
  nome: string;
  is_admin: true;
  comprou: false;
  criada_em: null;
};

function segredo(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

function credenciais(): { email: string; password: string } | null {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

function assinar(email: string, password: string, seg: string): string {
  return createHmac("sha256", seg).update(`${email}:${password}`).digest("hex");
}

function compararConstante(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function verificarCredenciaisAdmin(
  email: string,
  password: string
): boolean {
  const cred = credenciais();
  if (!cred) return false;
  return (
    compararConstante(email.trim().toLowerCase(), cred.email.trim().toLowerCase()) &&
    compararConstante(password, cred.password)
  );
}

export function tokenAdmin(): string | null {
  const seg = segredo();
  const cred = credenciais();
  if (!seg || !cred) return null;
  return assinar(cred.email, cred.password, seg);
}

export async function getAdminViaEnv(): Promise<Pseudo | null> {
  const seg = segredo();
  const cred = credenciais();
  if (!seg || !cred) return null;

  const jar = await cookies();
  const cookieToken = jar.get(COOKIE_ADMIN)?.value;
  if (!cookieToken) return null;

  const esperado = assinar(cred.email, cred.password, seg);
  if (!compararConstante(cookieToken, esperado)) return null;

  return {
    id: "env-admin",
    auth_id: null,
    email: cred.email,
    nome: "admin",
    is_admin: true,
    comprou: false,
    criada_em: null,
  };
}
