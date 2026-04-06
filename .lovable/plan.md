

# Correção: Auto-sync AWS para vídeos Master com base existente

## Problema
Quando um vídeo é enviado para um pedido Master que já possui vídeo base, o bloco `else` (linha 343-345 de `videoUploadService.ts`) apenas loga "mantendo apenas como aprovado" sem chamar a API externa. O vídeo fica aprovado no banco mas nunca chega na AWS.

## Correção

**Arquivo**: `src/services/videoUploadService.ts` (linhas 343-345)

Substituir:
```typescript
} else {
  console.log('👑 [MASTER] Vídeo base já existe — mantendo apenas como aprovado');
}
```

Por:
```typescript
} else {
  console.log('👑 [MASTER] Vídeo base já existe — mantendo apenas como aprovado');
  
  try {
    const { data: orderSync } = await supabase
      .from('pedidos')
      .select('lista_predios')
      .eq('id', orderId)
      .single();

    const buildingIds: string[] = orderSync?.lista_predios || [];
    if (buildingIds.length > 0) {
      console.log('🔄 [MASTER] Auto-sync prédios:', buildingIds);
      const { error: syncErr } = await supabase.functions.invoke('sync-buildings-external-api', {
        body: { pedido_id: orderId, action: 'add', building_ids: buildingIds }
      });
      if (syncErr) {
        console.error('⚠️ [MASTER] Auto-sync erro:', syncErr);
      } else {
        console.log('✅ [MASTER] Auto-sync prédios concluído');
      }
    }
  } catch (syncErr: any) {
    console.error('⚠️ [MASTER] Auto-sync exceção:', syncErr.message);
  }
}
```

Nenhum outro arquivo é alterado. A lógica replica exatamente o que já existe na aprovação manual e no `setBaseVideo`.

