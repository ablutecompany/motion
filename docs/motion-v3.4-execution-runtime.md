# `_motion` V3.4 — Execution Runtime Imersivo

**Fase Operacional:** V3.4 (Isolada)
**Responsável Técnico:** Antigravity

Esta iteração alarga o plano original de Aferição Passiva, introduzindo o novo Runtime Imersivo no Core do `MotionSession`.  O foco central desta frente é assegurar suporte real e honesto para "Wake Lock" e "Voice Guidance", nunca fingindo capacidades operacionais ou degradando a User Experience perante WebViews limitadas intrinsecamente.

## 1. O que foi adicionado

1. **`types.ts`**
   - Foram consolidados os construtos tipificados em torno do _Hardware Level Support_. As *Flags* passivas foram substituídas pelos arrays `unsupported | idle | active | failed` para se alinharem universalmente pelo report do `try-catch` em APIs desconhecidas.
   - Acrescentadas interfaces essenciais do pipeline iterativo para o decorrer vivo da sessão (`MotionExecutionBlockState` e `MotionExecutionRuntimeState`).

2. **`motionWakeLockService.ts` & `motionGuidanceService.ts`**
   - São serviços envolventes defensivos e _capability-aware_. Em vez de chamar a WebScreen Lock API nua (levando a interrupções nos WebViews nativos como iOS Chrome/Safari embedded), operam com inspeção base `window.speechSynthesis` ou `navigator.wakeLock`. Em caso negativo reagem graciosamente devolvendo estado `unsupported`.

3. **`useMotionExecutionRuntimeFacade.ts`**
   - Um gancho gerador de estado React passivo. Através de um array estático/mocked providencia a noção rítmica que compõe um esforço orgânico (ex: *Aquecimento*, *Trabalho Específico*, *Retorno*). Coordena as chamadas unificadas e reativas ao TTS (Text-to-Speech) e ao WakeLock apenas depois da ação humana explícita (*action.startSession*).

4. **`MotionSession.tsx` (Atualização)**
   - Um novo grupo visual elegante foi providenciado dentro da componente da tela primária de exercícios. A sessão não desata a arrancar áudios ou a devorar bateria sem interação do desportista. É facultado agora o botão "*Iniciar Fases*". Os botões indicadores contêm, em letras discretas cinza/azuis consoante o sucesso, os labels honestos requeridos à equipa (Ex: *"Sem guidance"*, *"Falha ao manter ecrã ativo"*).

## 2. Limitações Assumidas (Handoff V3.4)

- Os "Blocos" presentes no _Facade_ são abstrações conceptuais para instigar o _State Iterativo_. Deverão ser acoplados a tempos passados do backend no futuro real para se moldarem ao que a UI precisa, contudo interagem já organicamente com o play/pause.
- As permissões para TTS (_Guidance_) foram acauteladas. Como o utilizador dita na preferência Web de _Autoplays_ do Safari/Chrome as restrições à execução sonora por JavaScript, preferimos lançar o `voice_optional` apenas sob a salvaguarda de requisição UI, não chocando contra um "failed" surdo ao qual a app pudesse reagir com frustração.
- A promessa de manter o ecrã desperto foi estritamente restringida aos browsers Chromium que adotam a W3C Screen API padrão a 100%. iOS/WebKit antigos são traduzidos em "Indisponível", opondo-nos à promessa falaciosa dos velhos "Fake Video loops" usados na indústria como Hacks poluentes.
