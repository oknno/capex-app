# Guia curto de UI

## Tokens visuais
Use os tokens centralizados em `src/app/components/ui/tokens.ts`:
- **cores** (`colors`): superfícies, bordas, textos e tons de estado.
- **espaçamentos** (`spacing`): xs/sm/md/lg/xl.
- **radius** (`radius`): sm/md/lg/pill.
- **tipografia** (`typography`): tamanhos e pesos padrão.

## Componentes base
Antes de criar novo estilo, priorize:
- `Button` para ações primária/secundária.
- `Card` para agrupamento visual.
- `Badge` para status e rótulos curtos.
- `Field` para rótulo + valor/controle.
- `Section` para título/subtítulo de blocos.
- `StateMessage` para estados de loading/error/empty/success.

## Padrões de estado
Sempre renderize mensagens de estado com `StateMessage`:
- loading: operação em andamento.
- error: falha de carregamento/ação.
- empty: ausência de dados.
- success: confirmação contextual.

## Regras rápidas
1. Evite novos hex/radius/font-size inline; reutilize tokens.
2. Evite `className="btn"` em novas telas; prefira `Button`.
3. Se precisar variar layout, componha com `Card` + `Section` + `Field`.
