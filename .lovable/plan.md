

# Fix: Upload falha com "object exceeded maximum allowed size"

## Problema
O bucket `videos` no Supabase não tem `file_size_limit` definido, então usa o default do plano (50MB). O arquivo que você tentou enviar excede esse limite.

O código client-side permite até 100MB (`maxSize = 100 * 1024 * 1024`), mas o bucket no servidor rejeita acima de 50MB.

## Solução

### Migration SQL
Atualizar o bucket `videos` para aceitar até 100MB:

```sql
UPDATE storage.buckets 
SET file_size_limit = 104857600  -- 100MB
WHERE id = 'videos';
```

### Alteração no frontend
Nenhuma — o código já valida 100MB no client-side, que ficará consistente com o bucket.

## Arquivos
- 1 migration SQL (UPDATE storage.buckets)

