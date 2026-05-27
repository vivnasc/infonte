-- Adicionar suporte a múltiplas imagens por post de campanha.
-- O campo imagem_url (texto único) fica para retrocompatibilidade.
-- O campo imagens (array de URLs) é o principal para carrosséis.

alter table infonte.campanha_posts
  add column if not exists imagens text[] default array[]::text[];

-- Slot de publicação: manhã (10:00) ou noite (13:00)
alter table infonte.campanha_posts
  add column if not exists slot text default 'manha';
