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

// Escapar input do utilizador antes de o pôr em HTML de email.
const esc = (v: string | null | undefined) =>
  (v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

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
    <p style="text-align:center;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9A6C2C;margin:0;">Obrigada</p>
    <h2 style="font-family:Georgia,serif;font-weight:normal;text-align:center;font-size:22px;color:#4A2F1B;margin:8px 0 24px;">A tua travessia começa agora.</h2>
    <p>Olá${nome}.</p>
    <p>A tua compra do percurso completo da infonte está confirmada. Tens agora <strong>acesso vitalício</strong> às sete etapas e às ferramentas que ficam para a vida.</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="https://infonte.vivannedossantos.com/painel" style="display:inline-block;background:#EBAE4A;color:#2A1C12;padding:14px 36px;border-radius:12px;text-decoration:none;font-family:Inter,sans-serif;font-size:14px;font-weight:600;">
        Abrir o meu percurso
      </a>
    </p>
    <p>A etapa 2 abre 3 dias depois de abrires a etapa 1. Aviso-te quando for tempo, sem pressa.</p>
    <p style="font-size:13px;color:#5C5C3E;">Guarda este email. É o teu recibo e a tua porta de entrada.</p>
    <p>Em paz,<br/>Vivianne</p>
  `;

  // Email para a cliente
  const resultado = await enviar({
    para: o.email,
    assunto: "Obrigada. O teu percurso da infonte está aberto",
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

// Lista de espera: auto-reply à inscrita (com código) + aviso para a autora.
// Devolve o resultado do email à inscrita, para o endpoint saber se ficou
// pendente. A notificação à autora não bloqueia.
export async function enviarEmailsListaEspera(o: {
  email: string;
  nome: string;
  codigoDesconto: string;
  fonte?: string | null;
  total: number;
}) {
  const corpoInscrita = `
    <p>Olá ${esc(o.nome)},</p>
    <p>Apontada. És das primeiras a saber.</p>
    <p>A infonte abre no dia <strong>1 de Julho</strong>. Quem entrou na lista
    de espera tem acesso antecipado e uma condição especial:
    <strong>25% de desconto</strong> no lançamento.</p>
    <p>O teu código é:</p>
    <p style="text-align:center;margin:20px 0;">
      <span style="display:inline-block;background:#F2E8DC;border:1px solid rgba(74,47,27,0.2);border-radius:8px;padding:12px 20px;font-family:Georgia,serif;font-size:18px;letter-spacing:1px;color:#4A2F1B;">${esc(o.codigoDesconto)}</span>
    </p>
    <p>Guarda-o. No dia 1 vais recebê-lo outra vez, com o link para entrares
    antes de todas. Não precisas de fazer nada até lá.</p>
    <p>Até breve,<br/>Vivianne dos Santos</p>
  `;

  const resultado = await enviar({
    para: o.email,
    assunto: "Estás na lista, infonte abre 1 de Julho",
    html: moldura(corpoInscrita),
  });

  // Aviso para a autora (não bloqueia a inscrição se falhar).
  try {
    await enviarNotificacaoAutora({
      assunto: `Nova inscrição na lista de espera (${o.total} no total)`,
      corpo: `
        <p>Nova inscrição na lista de espera da infonte.</p>
        <p>Nome: <strong>${esc(o.nome)}</strong><br/>
        Email: ${esc(o.email)}<br/>
        Fonte: ${esc(o.fonte ?? "direto")}<br/>
        Código gerado: ${esc(o.codigoDesconto)}</p>
        <p>Total de inscritas agora: <strong>${o.total}</strong></p>
        <p>Vês a lista completa em
        <a href="https://infonte.vivannedossantos.com/admin/lista-espera" style="color:#B8843D;">/admin/lista-espera</a>.</p>
      `,
    });
  } catch (e) {
    console.warn("[email] aviso autora lista-espera falhou", e);
  }

  return resultado;
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
