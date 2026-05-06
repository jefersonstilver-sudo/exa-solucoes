## Causa real

Verifiquei no banco: `Residencial Miró` está com `tem_airbnb = true`. **O salvamento sempre funcionou.** O problema é na leitura.

`src/services/buildingsAdminProcessor.ts` mapeia o building campo a campo (linhas 20-63) e **omite `tem_airbnb`**. Por isso o objeto `building` que chega ao `BuildingFormDialog3` vem sem o campo, e o switch aparece desligado mesmo quando o banco está `true`.

## Correção (1 linha)

Em `src/services/buildingsAdminProcessor.ts`, adicionar `tem_airbnb: Boolean(building.tem_airbnb)` ao objeto retornado pelo `.map()`.

Sem outras mudanças.
