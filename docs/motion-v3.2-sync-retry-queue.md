# `_motion` V3.2 — Offline Retry Queue & Reconciliador

**Fase Operacional:** V3.2 (Isolada)
**Responsável Técnico:** Antigravity

Esta documentação detalha a implementação do Reconciliador e Retry Queue local, transformando os registos "Failed" (que antes se tratavam de verdadeiros becos sem saída) em entidades recuperáveis, sem infringir na complexidade de arquitetura ou background handlers agressivos.

## 1. O que foi adicionado

1. **`motionSyncPolicy.ts`**
   - Criação de uma política estrita sobre quem dita o ritmo de reconciliação, limitando *attempts* (máx 5) e cooldowns regressivos curtos. Mantém os Históricos em Read-Only e o Demo inativos na queue.
2. **`motionRetryQueueService.ts`**
   - Utilitário passivo chamado obrigatoriamente logo após uma falha global no `writebackService` de V1. Acondiciona o item dentro do state persistente `execution.syncQueue`, garantindo segurança na recolocação do payload original.
3. **`motionSyncReconciler.ts`**
   - O coração desta fase; injeta iteradores que chamam os *payloads* em _"Failed/Pending"_ armazenados, invoca uma nova chamada explícita ao `writebackService`, e, caso obedeça (success=true), atualiza o Registo Primário associando o fim desta viagem à _Queue_. Em caso de inadaptação, incrementa as `attempts` de erro até ao expurgo permanente estipulado na `Policy`.
4. **`useMotionSyncFacade.ts`**
   - Reúne os seletores e computadores UI essenciais de Sync, abstraindo-os do acoplamento do *Execution Facade*. Disponibiliza as views a veracidade sobre um registo (`getSyncDisplayState`) e liberta um trigger explícito de ação manual.

## 2. Abordagem de Reconciliação Adotada

*A principal premissa delineada foi: Não Criar Registos Órfãos.*
Pela via antiga, um fail resultava na morte de um _Writeback_. Com a V3.2 acoplada:
1. O Writeback inicial falha (`failed`).
2. O "V3.2 Engine" acolhe o resíduo (`motionRetryQueueService.enqueueFailedContribution`).
3. O Utilizador pode ver "Falha de Sincronização" no ecrã e um subtil CTA: "Tentar Novamente (Sync)".
4. Clicando, o registo passa ativamente a `pending`, e o `Reconciler` invoca o `Writeback`.
5. Se validado, a entrada original na Histórico altera para `synced` e o item é dropado da Queue permanentemente.

## 3. Limitações Assumidas (Handoff V3.2)

- **A fila é controlada e localmente dependente da Store**. Se o telemóvel for purgado de storage num estado _failed_, a queue não tem redundância cloud global antes das confirmações e desaparece (voltando a ser _legacy failed_, em vez de _failed recuperável_).
- **Sem Background Service:** A reconciliação, no modo Web base atual (sem PWA push e sync APIs do Service Worker puro), depende de triggers `manual_retry` em interface por parte do Utilizador. A queue está montada de forma abstrata suportando qualquer trigger no horizonte (ex: `auto_on_resume`), contudo na manifestação da UI optei pelo trigger UI minimalista de retry explicito como mandatado.
- Os labels estabilizados não sofreram inflamação visual (adotei um botão nativo padrão e contido no expand content do V2.6).

A app permanece com o seu ADN imutado. Todo e qualquer fluxo orgânico passa impune pela versão **V2.6** sem sequer suspeitar da queue, até ao momento em que ocorra uma rutura de sincronização externa real.
