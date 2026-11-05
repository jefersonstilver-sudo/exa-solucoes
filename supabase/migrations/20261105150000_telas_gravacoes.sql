-- Gravações da tela das TVs novas (app EXA Tela 1.0.5+): bucket privado, só a função exa-tela
-- (service role) grava e gera links assinados para a equipe assistir.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('telas-gravacoes', 'telas-gravacoes', false, 104857600, array['video/mp4'])
on conflict (id) do nothing;
