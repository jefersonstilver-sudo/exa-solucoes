

# Adicionar Multiplas Datas Personalizadas no CreateTaskModal

## O que sera feito

Permitir que o usuario selecione **2, 3 ou mais datas** ao criar uma tarefa. Em vez de um unico date picker, havera um sistema de "adicionar datas" com botao "+".

## Como funciona

Como a tabela `tasks` tem apenas **um campo `data_prevista`** (uma data por registro), a abordagem sera:

- O usuario seleciona varias datas no modal (ex: 10/02, 12/02, 15/02)
- Ao salvar, o sistema cria **uma task identica para cada data** selecionada
- Todas as tasks terao o mesmo titulo, descricao, responsaveis, lead, propostas, etc.
- Isso garante que cada data aparece corretamente no calendario/agenda sem alterar o banco de dados

## Interface do usuario

1. O campo "Data" atual sera substituido por uma lista de datas com botao "+" para adicionar mais
2. Cada data pode ser removida individualmente (botao X)
3. Pelo menos 1 data e obrigatoria
4. Sem limite maximo, mas visualmente otimizado para 2-5 datas
5. Hora inicio e hora limite aplicam-se a todas as datas igualmente

## Detalhes Tecnicos

### Arquivo modificado
`src/components/admin/agenda/CreateTaskModal.tsx`

### Mudanca de estado

Trocar:
```
const [dataPrevista, setDataPrevista] = useState<Date | undefined>();
```
Por:
```
const [datasPrevistas, setDatasPrevistas] = useState<Date[]>([]);
```

### Nova UI de datas

- Lista vertical de badges mostrando cada data selecionada (dd/MM/yyyy) com botao X
- Botao "+ Adicionar data" que abre um Popover com Calendar
- Ao selecionar uma data no calendario, ela e adicionada ao array (sem duplicatas)
- Se so tiver 1 data, nao mostra o X (obrigatorio ter pelo menos 1)

### Mutacao atualizada

Em vez de um unico insert, fara um insert por data:

```
for (const data of datasPrevistas) {
  const { data: taskData } = await supabase.from('tasks').insert({
    ...campos,
    data_prevista: format(data, 'yyyy-MM-dd'),
  }).select('id').single();

  // Vincular propostas e responsaveis para cada task criada
  if (taskData?.id && selectedPropostas.length > 0) {
    await supabase.from('task_propostas').insert(
      selectedPropostas.map(pid => ({ task_id: taskData.id, proposta_id: pid }))
    );
  }
}
```

### Reset do formulario

Trocar `setDataPrevista(undefined)` por `setDatasPrevistas([])`.

### Validacao

Exigir pelo menos 1 data selecionada antes de permitir salvar. Mostrar toast de erro se nenhuma data for escolhida.

### Nenhum outro arquivo sera modificado

Apenas `CreateTaskModal.tsx`. A agenda, central de tarefas e minha manha continuam funcionando normalmente pois cada task criada tera sua propria `data_prevista`.

