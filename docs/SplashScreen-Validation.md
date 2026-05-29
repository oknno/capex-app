# TASK 5 — Validação final da SplashScreen padrão CAPEX

Data da validação: 2026-05-29.

## 1. Arquivos criados e alterados validados

### Arquivos criados anteriormente e presentes

- `src/app/components/SplashScreen/SplashScreen.tsx`
- `src/app/components/SplashScreen/SplashScreen.css`
- `src/assets/branding/.gitkeep`
- `src/assets/splash/.gitkeep`

### Pastas presentes

- `src/app/components/SplashScreen/`
- `src/assets/branding/`
- `src/assets/splash/`

### Arquivos alterados anteriormente e revalidados

- `src/App.tsx`
- `src/index.css`

### Arquivos e áreas verificados sem alteração nesta validação

- `ProjectsPage` e componentes derivados.
- `BootstrapLoader`.
- `repositories`, `services`, `use cases`, domínio e regras funcionais.
- Integrações de SharePoint.
- Filtros, tabelas, `CommandBar`, modais, botões e header.

A comparação do intervalo da implantação da Splash confirmou alterações somente em `src/App.tsx`, `src/index.css`, `src/app/components/SplashScreen/SplashScreen.tsx`, `src/app/components/SplashScreen/SplashScreen.css` e placeholders `.gitkeep` dos diretórios de assets.

## 2. Status dos assets reais

Os assets reais esperados ainda estão pendentes no repositório:

- Pendente: `src/assets/branding/arcelormittal-logo.svg`
- Pendente: `src/assets/splash/splash-building.webp`

A pendência é manual e não foi corrigida com URL externa, base64, download ou imagem falsa. Como os imports apontam para esses arquivos, o build completo do Vite/TypeScript deve ser executado somente depois da inclusão manual desses assets reais, ou falhará por import ausente.

## 3. Validação de `SplashScreen.tsx`

Resultado: aderente ao padrão CAPEX, com pendência apenas dos assets físicos importados.

Confirmações:

- Exporta `SplashScreen` corretamente.
- Declara props opcionais `onExitStart` e `onFinish`.
- Usa `useState` para `isExiting` e para fallbacks visuais de logo/imagem.
- Usa `useEffect` para controlar timers.
- Limpa `exitTimer` e `finishTimer` no cleanup.
- Define `splashDurationInMs = 3000`.
- Define `splashExitDurationInMs = 560`.
- Chama `onExitStart` no início do fade out.
- Chama `onFinish` apenas depois de `3000ms + 560ms`.
- Aplica `capex-splash--exit` quando `isExiting === true`.
- Importa `SplashScreen.css`.
- Importa os assets pelos caminhos `src/assets/branding/arcelormittal-logo.svg` e `src/assets/splash/splash-building.webp` a partir do componente.
- Possui fallback para erro no logo.
- Possui fallback para erro na imagem.
- Não usa biblioteca externa de animação.
- Não usa URL externa.
- Não usa base64.

Textos validados:

- `SISTEMA CORPORATIVO`
- `Cadastro de Projetos CAPEX`
- `Gestão e Controle de Projetos`
- `Desenvolvido por Gerência de CAPEX`

## 4. Validação de `SplashScreen.css`

Resultado: aderente ao padrão CAPEX.

Confirmações do overlay `.capex-splash`:

- `position: fixed`
- `inset: 0`
- `z-index: 2147483647`
- `width: 100vw`
- `height: 100vh`
- `overflow: hidden`
- `background: #ffffff`
- `color: #111111`
- `font-family: "Segoe UI", Arial, sans-serif`

Confirmações de `.capex-splash--exit`:

- Usa `pointer-events: none`.
- Aplica animação própria de saída.
- Usa `animation ... forwards`.
- Não depende de `App.tsx` para animar a saída.

Classes estruturais validadas:

- `.capex-splash__content`
- `.capex-splash__brand`
- `.capex-splash__logo`
- `.capex-splash__brandFallback`
- `.capex-splash__titleBlock`
- `.capex-splash__eyebrow`
- `.capex-splash__progress`
- `.capex-splash__visual`
- `.capex-splash__visualFrame`
- `.capex-splash__image`
- `.capex-splash__curve`
- `.capex-splash__line`
- `.capex-splash__credits`

Keyframes validados:

- `capexSplashEnter`
- `capexSplashExit`
- `capexSplashLift`
- `capexSplashProgress`

Também foram validados responsividade e suporte a `prefers-reduced-motion`.

## 5. Validação de `App.tsx`

Resultado: aderente ao padrão CAPEX e sem alteração de regra funcional.

Confirmações:

- Importa `useCallback`.
- Importa `SplashScreen`.
- `showSplash` inicia como `true`.
- `isAppVisible` inicia como `false`.
- `handleSplashExitStart` chama `setIsAppVisible(true)`.
- `handleSplashFinish` chama `setShowSplash(false)`.
- O conteúdo atual está dentro de `.capex-appContent`.
- `.capex-appContent--hiddenDuringSplash` é aplicada quando `isAppVisible === false`.
- `SplashScreen` é irmã de `appContent` dentro de `ToastProvider`.
- `ToastProvider` foi preservado.
- `.capex-app` foi preservada.
- `.capex-container` foi preservada.
- `mainContent` foi preservado.
- `mainContent` continua alternando entre `BootstrapLoader` em loading, `BootstrapLoader` de erro em error e `ProjectsPage` em ready.
- Não existe return condicional substituindo o app por Splash.
- `bootState`, `bootstrap`, autorização, carregamento SharePoint e regras funcionais foram preservados.

Observação validada: durante parte da Splash, o conteúdo por trás pode ser `BootstrapLoader`, porque o bootstrap original foi preservado. Isso é aceitável nesta implantação.

## 6. Validação de `index.css`

Resultado: aderente ao padrão CAPEX.

Confirmações:

- `.capex-appContent` mantém o app montado e visível por padrão, com `opacity: 1`, `visibility: visible`, `transform: translateY(0)` e transições de `opacity`, `transform` e `visibility`.
- `.capex-appContent--hiddenDuringSplash` oculta o app durante a Splash com `opacity: 0`, `visibility: hidden`, `pointer-events: none`, `transform: translateY(4px)` e atraso de `visibility` compatível com o fade in.
- Há suporte a `prefers-reduced-motion` para reduzir transições.
- Não foram identificadas alterações indevidas em `.capex-app`, `.capex-container`, `.capex-bootstrap`, tabelas, filtros, modais, botões ou header nesta validação.

## 7. Comportamento esperado validado por análise

Ao pressionar F5:

- `showSplash` inicia como `true`, então a Splash é renderizada no primeiro render.
- `isAppVisible` inicia como `false`, então o appContent já está montado, porém invisível.
- A Splash usa overlay fixo de tela cheia com z-index máximo, cobrindo BootstrapLoader, CommandBar, tabela e demais conteúdos.
- O appContent oculto também bloqueia interação por `pointer-events: none`.

Durante a Splash:

- O conteúdo funcional permanece montado atrás do overlay.
- O usuário não interage com o appContent.
- A Splash apresenta marca/fallback, título, subtítulo, imagem/fallback, barra de progresso e assinatura.

No final:

- Após 3000ms, `SplashScreen` ativa `isExiting` e chama `onExitStart`.
- `onExitStart` torna `isAppVisible` verdadeiro, iniciando o fade in do app.
- `.capex-splash--exit` aplica o fade out da Splash por 560ms.
- Após 3560ms, `onFinish` remove a Splash do DOM.
- Como a remoção ocorre depois do fade out, não há corte seco.

Depois da inicialização:

- A Splash não é conectada a filtros, modais, atualização de dados ou ações da `CommandBar`.
- A Splash só reaparece em um novo carregamento completo da aplicação, como F5, porque os estados `showSplash` e `isAppVisible` são estados locais inicializados no mount do `App`.

## 8. Resultado de build, typecheck e lint

- `npm run lint`: executado com sucesso.
- `npm run build`: não executado nesta validação porque os assets reais esperados estão ausentes e o build completo tende a falhar por import ausente.
- `npm run typecheck`: não executado nesta validação pelo mesmo motivo do build completo.

## 9. Pendências finais

- Adicionar manualmente `src/assets/branding/arcelormittal-logo.svg`.
- Adicionar manualmente `src/assets/splash/splash-building.webp`.
- Após a inclusão dos assets reais, executar `npm run build` e `npm run typecheck` para concluir a validação completa de empacotamento.
