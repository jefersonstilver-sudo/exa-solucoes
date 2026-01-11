# Arquitetura de RH - EXA

## Visão Geral

O módulo de RH do EXA separa **Identidade** (tabela `users`) de **Vínculo Contratual** (tabela `funcionarios`), permitindo que um usuário do sistema possa ou não ter um vínculo empregatício formal.

---

## Estrutura de Dados

### Tabela `funcionarios`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `user_id` | UUID | FK para `users.id` (UNIQUE) |
| `nome_completo` | TEXT | Nome completo do funcionário |
| `tipo_contrato` | TEXT | Tipo de vínculo (ver seção abaixo) |
| `departamento` | TEXT | Área de atuação |
| `cargo` | TEXT | Cargo/função |
| `salario_mensal` | NUMERIC | Salário para CLT/Estagiário |
| `valor_contrato` | NUMERIC | Valor para PJ/Freelancer/Sócio |
| `data_admissao` | DATE | Data de início |
| `data_desligamento` | DATE | Data de término (se aplicável) |
| `ativo` | BOOLEAN | Status ativo/inativo |

---

## Tipos de Contrato

| Tipo | Descrição | Campo de Remuneração |
|------|-----------|---------------------|
| `clt` | Colaborador com carteira assinada | `salario_mensal` |
| `estagiario` | Estagiário com bolsa | `salario_mensal` |
| `pj` | Pessoa Jurídica prestadora de serviço | `valor_contrato` |
| `freelancer` | Profissional autônomo por projeto | `valor_contrato` |
| `socio` | Sócio/proprietário | `valor_contrato` (pró-labore) |

### Regra de Remuneração Exclusiva

```sql
CHECK (
  (tipo_contrato IN ('clt', 'estagiario') AND salario_mensal IS NOT NULL AND valor_contrato IS NULL)
  OR
  (tipo_contrato IN ('pj', 'freelancer', 'socio') AND valor_contrato IS NOT NULL AND salario_mensal IS NULL)
  OR
  (tipo_contrato NOT IN ('clt', 'estagiario', 'pj', 'freelancer', 'socio'))
)
```

**Importante**: Novos tipos de contrato podem ser criados livremente (campo TEXT), mas devem definir qual campo de remuneração utilizar.

---

## Departamentos

Departamentos são campos TEXT flexíveis. Sugestões padrão:

| Departamento | Descrição |
|--------------|-----------|
| `vendas` | Equipe comercial |
| `marketing` | Marketing e comunicação |
| `operacao` | Operações e técnico |
| `financeiro` | Financeiro e contabilidade |
| `rh` | Recursos humanos |
| `diretoria` | Diretores e sócios |
| `ti` | Tecnologia da informação |

---

## Integração com Financeiro

### Responsável por Despesa

A tabela `despesas_fixas` possui `responsavel_id` (FK para `funcionarios`), permitindo:

- Rastrear custos por colaborador
- Agrupar despesas por departamento
- Gerar relatórios de custo por área

### Fluxo de Custo

```
Funcionário → Departamento → Centro de Custo → DRE
     ↓
Despesas Fixas (salários, benefícios, ferramentas)
```

---

## Governança

### Regras de Imutabilidade

1. **Dados históricos**: Registros de funcionários desligados não devem ser deletados
2. **Auditoria**: Alterações em `salario_mensal` e `valor_contrato` devem ser rastreadas
3. **Desligamento**: Usar `data_desligamento` e `ativo=false` em vez de DELETE

### Permissões

| Ação | Roles Permitidas |
|------|------------------|
| Visualizar funcionários | `super_admin`, `admin`, `admin_financeiro` |
| Criar/Editar funcionários | `super_admin`, `admin` |
| Alterar remuneração | `super_admin` |
| Desligar funcionário | `super_admin`, `admin` |

---

## Próximas Evoluções

1. **Onboarding**: Fluxo guiado por tipo de cargo
2. **Centro de Custo**: Orçamentos por departamento
3. **Benefícios**: Gestão de VR, VT, plano de saúde
4. **Férias/Licenças**: Controle de afastamentos

---

*Última atualização: Janeiro 2026*
