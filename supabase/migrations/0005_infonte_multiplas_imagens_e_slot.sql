-- Adicionar suporte a múltiplas imagens por post de campanha.
-- O campo imagem_url (texto único) fica para retrocompatibilidade.
-- O campo imagens (array de URLs) é o principal para carrosséis.

alter table infonte.campanha_posts
  add column if not exists imagens text[] default array[]::text[];

-- Slot de publicação: manhã (10:00) ou tarde (13:00)
alter table infonte.campanha_posts
  add column if not exists slot text default 'manha';

-- Trocar unique(dia) para unique(dia, slot) para suportar 2 posts por dia
alter table infonte.campanha_posts
  drop constraint if exists campanha_posts_dia_key;

create unique index if not exists campanha_posts_dia_slot_idx
  on infonte.campanha_posts (dia, slot);
