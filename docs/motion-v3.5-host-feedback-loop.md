# `_motion` V3.5 — Handshake Circular Host & Metas Operacionais

**Fase Operacional:** V3.5 (Isolada)
**Responsável Técnico:** Antigravity

Esta iteração avança na consolidação orgânica do ciclo de vida dos Workouts. Previamente, enviamos o *writeback* e aguardávamos (de forma pendente em Retry ou passiva) até nos silenciarmos. Agora, a `_motion` fecha um ciclo bidirecional, assimilando respeitosamente o Feedback providenciado pelo Host (`ablute_ wellness` ecossistema central).

## 1. O Princípio da Honestidade Operacional do Feedback

A regra mestra adotada foi a da substituição controlada dentro da própria entidade nativa. Não recriamos *records* extra (para evitar dupla cardinalidade) nem apagamos registos *offline* se o host disser o contrário — nós sobrepomos os dados recém-chegados (`hostFeedback`) num sub-grafo próprio dentro do exato e mesmo `ConfirmedWorkoutRecord`.

**Comportamento Local vs Remoto:**
Se não tivermos suporte ou *Network* não reverter (como dita a fallback Web-Safe e os cenários `demo`), a App assume como "Projeção Local" ou "Sinal detalhado em histórico local". No momento que o _Hook_ do serviço escuta a confirmação que os dados são processados remetendo carga paramétrica (e.g. `PRIORITIZE_RECOVERY` Flag), substituímos esse rótulo de leitura na UI para *"Feedback do ecossistema"*.

## 2. Metas Operacionais Dinâmicas

Se o *feedback* remoto contiver métricas acionáveis (Flags de ação como `PRIORITIZE_RECOVERY`), o `motionOperationalGoalsService` infere passivamente ajustes:
1. São mapeados como instâncias passivas do modelo `MotionOperationalGoalAdjustment`.
2. Estas instâncias são guardadas no Record do Treino para nunca perderem a semântica da ocasião (Não alteram magicamente o "Universo Global", honrando a regra da reversibilidade e impedindo reesvaziamentos rudes).
3. Aparecem visíveis ao utilizador exata-e-apenas ao mergulhar em detalhe nesse específico esforço pelo Histórico/Progress, através de _Cards_ laranjas distintos e rastreáveis na causa.

## 3. Os Artefactos Entregues

1. **`motionHostFeedbackAdapter.ts`**
   - Um Harness/Mock que funciona em substituição da interjeção da API central enquanto esta não existe ou é contornada em ambientes sandbox. Ele implementa o timeout de emulação e garante que exporta expressamente `{ isSimulatedHostFeedback: true }` não poluindo a base real de analytics.

2. **`motionHostFeedbackService.ts`**
   - O orquestrador reconciliador. Apenas engatilhado pelos envios bem sucedidos das instâncias na Facade base do Execution (quer do follow-up prompt ou do writeback direto).

3. **`motionOperationalGoalsService.ts`**
   - O mapeador e adaptador estratégico de _actionable flags_.

4. **`useMotionHostFeedbackFacade.ts`**
   - Facade reativa limpa e segura (isenta de anti-patterns de map-loops per-instance) para providenciar a tradução textual entre estados `local_projection` e `host_feedback` ao Canvas.

## Limitações Assumidas (Handoff V3.5)

- O "Mock" envia recuperações estritamente baseadas na casualidade de um `perceivedIntensity` ter um report adverso (ou de omissão em _light workouts_ para comprovação das projeções estáticas intocáveis).
- Estas _goals_ táticas não alteram verdadeiramente o esqueleto do ecossistema (`useMotionStore`). Apenas decoram o painel de histórico para prova de viabilidade passiva antes da Fase 4.
