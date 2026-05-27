// Emails via Resend.
// Para clientes: FROM noreply@vivannedossantos.com
// Notificações para a autora: TO ola@vivannedossantos.com

const EMAIL_AUTORA = "ola@vivannedossantos.com";

type EnviarOpcoes = {
  para: string;
  assunto: string;
  html: string;
  replyTo?: string;
};

async function enviar(o: EnviarOpcoes) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "infonte <noreply@vivannedossantos.com>";
  if (!key) {
    console.warn("[email] RESEND_API_KEY ausente, não envio:", o.assunto);
    return { ok: false, motivo: "sem-resend-key" };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: o.para,
      subject: o.assunto,
      html: o.html,
      reply_to: o.replyTo ?? EMAIL_AUTORA,
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    console.error("[email] Resend erro", r.status, t);
    return { ok: false, motivo: t };
  }
  return { ok: true };
}

const moldura = (corpo: string) => `
<div style="background:#F2E8DC;padding:40px 20px;font-family:Georgia,serif;color:#1F1810;">
  <div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid rgba(74,47,27,0.12);border-radius:12px;padding:32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-family:Georgia,serif;font-size:22px;color:#4A2F1B;">infonte</div>
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#5C5C3E;margin-top:4px;">da Sete Ecos</div>
    </div>
    <div style="font-size:16px;line-height:1.65;color:#1F1810;">
      ${corpo}
    </div>
    <div style="text-align:center;margin-top:32px;font-size:12px;color:#5C5C3E;">
      Vivianne dos Santos · Sete Ecos<br/>
      <a href="https://infonte.vivannedossantos.com" style="color:#B8843D;text-decoration:none;">infonte.vivannedossantos.com</a>
    </div>
  </div>
</div>`;

// ═══════════════════════════════════════════════════
// EMAILS PARA CLIENTES (FROM noreply@, REPLY-TO ola@)
// ═══════════════════════════════════════════════════

export async function enviarEmailCompra(o: { email: string; nome?: string | null }) {
  const nome = o.nome ? `, ${o.nome}` : "";
  const corpo = `
    <p>Olá${nome}.</p>
    <p>A tua compra do percurso completo da Infonte está confirmada. Tens agora acesso vitalício às sete etapas e às ferramentas que ficam.</p>
    <p>Podes aceder ao teu percurso a qualquer momento em <a href="https://infonte.vivannedossantos.com/painel" style="color:#B8843D;">infonte.vivannedossantos.com/painel</a>.</p>
    <p>A etapa 2 abre 3 dias depois de abrires a etapa 1. Aviso-te quando for tempo.</p>
    <p>Em paz,<br/>Vivianne</p>
  `;

  // Email para a cliente
  const resultado = await enviar({
    para: o.email,
    assunto: "Abriste o percurso completo da Infonte",
    html: moldura(corpo),
  });

  // Notificação para a autora
  await enviarNotificacaoAutora({
    assunto: `Nova compra: ${o.email}`,
    corpo: `<p><strong>${o.nome ?? o.email}</strong> (${o.email}) acabou de comprar o percurso completo.</p>`,
  });

  return resultado;
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
      <a href="${o.url}" style="display:inline-block;background:#B8843D;color:#fff;padding:14px 28px;border-radius:999px;text-decoration:none;font-family:Inter,sans-serif;font-size:14px;font-weight:500;">
        Abrir a etapa ${o.etapa}
      </a>
    </p>
    <p>Sem pressa.<br/>Vivianne</p>
  `;
  return enviar({
    para: o.email,
    assunto: `A tua etapa ${o.etapa} abriu`,
    html: moldura(corpo),
  });
}

export async function enviarEmailBoasVindas(o: { email: string; nome?: string | null }) {
  const nome = o.nome ? `, ${o.nome}` : "";
  const corpo = `
    <p>Olá${nome}.</p>
    <p>Bem-vinda à Infonte. A etapa 1 está aberta para ti, é gratuita.</p>
    <p>Não é mais um curso de mentalidade. É um percurso com ferramentas que ficam para a vida. Começa quando estiveres pronta.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="https://infonte.vivannedossantos.com/etapa/1" style="display:inline-block;background:#B8843D;color:#fff;padding:14px 28px;border-radius:999px;text-decoration:none;font-family:Inter,sans-serif;font-size:14px;font-weight:500;">
        Começar a etapa 1
      </a>
    </p>
    <p>Em paz,<br/>Vivianne</p>
  `;
  return enviar({
    para: o.email,
    assunto: "Bem-vinda à Infonte",
    html: moldura(corpo),
  });
}

// ═══════════════════════════════════════════════════
// NOTIFICAÇÕES PARA A AUTORA (TO ola@)
// ═══════════════════════════════════════════════════

async function enviarNotificacaoAutora(o: { assunto: string; corpo: string }) {
  return enviar({
    para: EMAIL_AUTORA,
    assunto: `[Infonte] ${o.assunto}`,
    html: moldura(o.corpo),
    replyTo: EMAIL_AUTORA,
  });
}
