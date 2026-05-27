-- Expandir campanha para 60 posts (30 manhã + 30 tarde)
-- Dias 1-30: manhã (10h, didático)
-- Dias 31-60: tarde (13h, emocional, gerado via Claude API)

alter table infonte.campanha_posts
  drop constraint if exists campanha_posts_dia_check;

alter table infonte.campanha_posts
  add constraint campanha_posts_dia_check check (dia between 1 and 60);
