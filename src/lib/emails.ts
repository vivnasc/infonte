// Emails via Resend. Falha silenciosa se RESEND_API_KEY não estiver definida.

type EnviarOpcoes = {
  para: string;
  assunto: string;
  html: string;
};

async function enviar(o: EnviarOpcoes) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "infonte <ola@infonte.pt>";
  if (!key) {
    console.warn("[email] RESEND_API_KEY ausente, não envio em:", o.assunto);
    return { ok: false, motivo: "sem-resend-key" };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: o.para, subject: o.assunto, html: o.html }),
  });
  if (!r.ok) {
    const t = await r.text();
    console.error("[email] Resend erro", r.status, t);
    return { ok: false, motivo: t };
  }
  return { ok: true };
}

const moldura = (corpo: string) => `
<div style="background:#F2E8DC;padding:40px 20px;font-family:Georgia,serif;color:#2A2018;">
  <div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid rgba(92,61,36,0.15);border-radius:12px;padding:32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-family:Georgia,serif;font-size:22px;color:#5C3D24;">infonte</div>
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6B6B47;margin-top:4px;">da Sete Ecos</div>
    </div>
    <div style="font-size:16px;line-height:1.65;color:#2A2018;">
      ${corpo}
    </div>
    <div style="text-align:center;margin-top:32px;font-size:12px;color:#6B6B47;">
      Vivianne dos Santos · Sete Ecos
    </div>
  </div>
</div>`;

export async function enviarEmailCompra(o: { email: string; nome?: string | null }) {
  const nome = o.nome ? `, ${o.nome}` : "";
  const corpo = `
    <p>Olá${nome}.</p>
    <p>A tua compra do percurso completo da Infonte está confirmada. Tens agora acesso vitalício às sete etapas e às ferramentas que ficam.</p>
    <p>A etapa 2 abre 3 dias depois de abrires a etapa 1. Aviso-te quando for tempo.</p>
    <p>Em paz,<br/>Vivianne</p>
  `;
  return enviar({
    para: o.email,
    assunto: "abriste o percurso completo da Infonte",
    html: moldura(corpo),
  });
}

export async function enviarEmailEtapaAberta(o: {
  email: string;
  nome?: string | null;
  etapa: number;
  url: string;
}) {
  const nome = o.nome ? `, ${o.nome}` : "";
  const corpo = `
    <p>Olá${nome}.</p>
    <p>A tua etapa ${o.etapa} está aberta. Quando estiveres em silêncio, entra.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${o.url}" style="display:inline-block;background:#B8843D;color:#F2E8DC;padding:12px 24px;border-radius:999px;text-decoration:none;font-family:Inter,sans-serif;font-size:14px;">
        abrir a etapa ${o.etapa}
      </a>
    </p>
    <p>Sem pressa.<br/>Vivianne</p>
  `;
  return enviar({
    para: o.email,
    assunto: `a tua etapa ${o.etapa} abriu`,
    html: moldura(corpo),
  });
}
