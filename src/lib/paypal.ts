// Cliente PayPal mínimo (REST API, sem SDK), suficiente para criar e capturar
// ordens. Usamos servidor + redirecionamento ao approve_url do PayPal.

const PRECO_USD = "77.00";
const MOEDA = "USD";

function baseUrl(): string {
  const env = (process.env.PAYPAL_ENV ?? "sandbox").toLowerCase();
  return env === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function obterToken(): Promise<string> {
  const client = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!client || !secret) {
    throw new Error("Faltam variáveis PayPal (client id e/ou secret).");
  }
  const r = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${client}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`PayPal token, ${r.status}`);
  const j = await r.json();
  return j.access_token as string;
}

export async function criarOrdemPaypal(opcoes: {
  returnUrl: string;
  cancelUrl: string;
  referencia: string;
  valor?: string;
}): Promise<{ id: string; url_aprovacao: string; valor: string; moeda: string }> {
  const token = await obterToken();
  const valor = opcoes.valor ?? PRECO_USD;
  const r = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: opcoes.referencia,
          description: "Infonte, percurso completo (acesso vitalício)",
          amount: { currency_code: MOEDA, value: valor },
        },
      ],
      application_context: {
        brand_name: "Infonte",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: opcoes.returnUrl,
        cancel_url: opcoes.cancelUrl,
      },
    }),
    cache: "no-store",
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`PayPal create order, ${r.status}, ${t}`);
  }
  const j = await r.json();
  const approve = (j.links as { rel: string; href: string }[]).find(
    (l) => l.rel === "approve"
  );
  if (!approve) throw new Error("Sem URL de aprovação do PayPal.");
  return {
    id: j.id,
    url_aprovacao: approve.href,
    valor,
    moeda: MOEDA,
  };
}

export async function capturarOrdemPaypal(id: string): Promise<{
  estado: string;
  valor: string;
  moeda: string;
}> {
  const token = await obterToken();
  const r = await fetch(`${baseUrl()}/v2/checkout/orders/${id}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`PayPal capture, ${r.status}, ${t}`);
  }
  const j = await r.json();
  const unit = j.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    estado: j.status ?? unit?.status ?? "UNKNOWN",
    valor: unit?.amount?.value ?? PRECO_USD,
    moeda: unit?.amount?.currency_code ?? MOEDA,
  };
}

export const INFONTE_PRECO = { valor: PRECO_USD, moeda: MOEDA };
