-- Remover o trigger que criava linha em infonte.utilizadoras para TODOS
-- os registos em auth.users (problemático em Supabase partilhado com
-- outros produtos). A app agora cria a linha lazy, na primeira visita.

drop trigger if exists on_auth_user_created_infonte on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists infonte.handle_new_user();
drop function if exists public.handle_new_user();
