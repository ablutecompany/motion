# `_motion` V3.1 — Bindings Reais de Sinais & Sensores OS

**Fase Operacional:** V3.1 (Isolada)
**Responsável Técnico:** Antigravity

Esta documentação formaliza a inclusão da camada independente de captura e resolução de Capabilities (Device Motion e Platform Health), transacionando a clássica inferência estritamente baseada em triggers (V2) para uma arquitetura "evidence-based". O foco central foi o absoluto encapsulamento desta lógica para não criar regressões na baseline V2.6.

## 1. O que foi adicionado

A implementação não tocou nos motores core destrutivamente, limitando-se a injetar os tipos e serviços necessários para uma interpretação futura real:

1. **Camada de Capabilities (`motionSignalCapabilities.ts`)**
   - Um resolver não-intrusivo que audita a plataforma operacional: `environment` (web, native), suporte a `DeviceMotionEvent` e o `permissionState` atual, sem forçar prompts bloqueantes na view do utilizador.
2. **Signal Facade (`useMotionSignalFacade.ts`)**
   - Ponto de integração isolado para as views consumirem. Esta facade empacota a geração de janelas de prova (`gatherSignalEvidence`). Como fallback Web (modo atual de teste/host web simulador), não pede ativamente HW e degrada as janelas confiantemente (`confidence: 0.1` e `fallback_active: true`) resultando no comportamento herdado "Legacy".
3. **Extensão de Evidence no _InferenceService_**
   - O `workoutInferenceService` aceita opcionalmente um parâmetro de _real evidence_. Analisando os graus biométricos de *confidence*, altera o `evidenceSource` para `legacy_heuristic`, `hybrid` ou `real_signal`.

## 2. Comportamento Novo vs Herança

Se o sistema corre em mobile (onde _hooks_ V3+ se expandirão ativamente no Native Layer), os labels reagem:
- **`Inferido (sinais reais)`**: Totalmente governado pela OS / Wearable.
- **`Inferido (sinais + heurística)`**: Combinação. (Ex: o pedómetro nativo deu dicas mínimas, a engine usou os _triggers_ estáticos para compor o resto).
- **`Inferido (heurística)`**: Fallback clássico.

A UI não cresceu em densidade inútil, não existindo janelas/ecrãs de dashboard biométricos adicionais. Apresenta-se honesta no _Home_ reportando pacatamente `Sinais do dispositivo: indisponíveis` até existirem autorizações ou capacidades físicas de base.

## 3. Limitações Assumidas (Handoff V3.1)

Como ditado, a presente fase não cria conectores explícitos `react-native-sensors` ou equivalentes:
- A _facade_ implementada recai estritamente no fallback degradado se os injetores nativos de permissões não estiverem resolvidos.
- Background sync real e _WakeLock_ para garantir longos blocos de recolha de giroscópio e barómetro ainda não se encontram ativos, pelo que a fonte `hybrid` será natural durante a testagem preliminar e a transição.
- O Timeline exibe agora o label traduzido da `MotionInferenceEvidenceSource`. Esta label rege unicamente como a fonte do workout operou — o tratamento de *Wellness Impact/Feedback* e o histórico `ConfirmedWorkoutRecord` preservam exatamente a mesma persistência passiva sem corrupções.

A _V2.6_ base continua intacta — provando, na prática, um acréscimo "Layer 2" modular e passível de desligamento central.
