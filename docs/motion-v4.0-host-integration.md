# `_motion` V4.0 — Host Master API Binding & Infraestrutura de Produção

**Fase Operacional:** V4.0 (Integração Real Isolada)
**Responsável Técnico:** Antigravity

Esta iteração cumpre o desígnio de migrar o módulo `_motion` de uma infraestrutura simulada (Mocks) para Contractos Runtime Reais (`ablute_ wellness` Master Host). Na V4.0, a aplicação deixa de ser cega ou de funcionar segundo *fire-and-forget* para encetar verdadeiros *Handshakes* (Acks) com a _Shell_ que a aloja, suportando de igual modo sandboxes (Web) via "Honest Fallbacks".

## 1. Contratos Estruturais V4.0 (`hostRuntimeContract.ts`)

Foram consolidadas e injetadas the Types of Truth do sistema Master:
- **`HostInboundContext`**: Input real consumido no arrranque da App via `motionHostContextAdapter`.
- **`HostOutboundMessage`**: Eventos enviados via React Native WebView PostMessage / iFrame.
- **`HostAckMessage`**: A promessa base do Writeback (agora as contribuições não emitem falsos sucessos. Aguardam o master garantir se foi _success, fail_ ou _timeout_ com base num `messageId` injetado na frame).
- **`HostInboundFeedbackEvent`**: O webhook de providência de _Operational Goals_.

## 2. Abordagem de Adapters Reais (`motionHostIntegrationFacade.ts`)

Todos os serviços avulsos foram fundidos num Gateway protegido, a Facade Unificada.

1. **`motionHostContextAdapter`**: Substituto do `shellContextAdapter`. Limpo, consome os payload bounds estritos para inicializar as `ActiveMotionContext`.
2. **`motionHostWritebackAdapter`**: Substituto vital do `writebackService`. Agora a sua Promessa escuta efetivamente uma resposta do `MessageEvent` bus atrelada em janela por 5 segundos. O Timeout desencadeia elegantemente a `motionRetryQueueService` (Offline V3.2), prevenindo crash se a rede Master oscilar.
3. **`motionHostFeedbackAdapter`**: Abandonou o *Hardcoded Mocking*. Ele procura uma mensagem de `type: "host_feedback_inbound"` ligada ao ID do Workout. Contudo, continua a preservar orgulhosamente o *Sandbox Bypass* de testes caso a Variavel de Host nativa `_MOTION_TEST_BYPASS_FEEDBACK` for inserida pela equipa de Testes — onde a flag interna `isSimulatedHostFeedback` não deixará dúvidas sobre proveniência.

## 3. Segurança do Entrypoint

O ficheiro nativo `index.tsx` atua nativamente em `try/catch`. 
Se a _Shell_ injetar contextos ausentes (`!activeContext.analysisId`), a app declina o arrancador não deflagrando crashes na root nativa, reportando `{ ready: false, fallbackMode: true, reason: '...' }` ativando assim os ecrãs Graceful dos hosts. Da mesma forma, *Lints* e *Typings* perdidos foram selados, resolvendo fugas do build estático.

## 4. O Fim da Ilusão (Host Parcial = Fallback Honesto)

O Princípio Mestre da V4 não é o de forçar a *Shell* a portar-se bem, mas de permitir que a própria _Mini-App_ continue perfeitamente fluida perante o erro originado:
- Se falha o contexto = Fallback App.
- Se Mestre ignora Timeout de Gravação (Ack) = Local Only & Retry Queue.
- Se Webhook de Feedback não é disparado = Nenhuma UI nova de "Meta" salta no histórico, revertendo à projeção nativa natural (Timeline Semanal limpo).

## Ponto de Situação e Dívida Eliminada
Todos os *Stubs* passados assinalados com ficheiros extintos (`writebackService.ts`) ou Mocks soltos não transitam como *dependências impeditivas* ou lógicos falsos de prod. Apenas os **Motores Fisiológicos Intocáveis** da Base (*universes, phases*) aguardam refactor perante aprovação transversal para estarem sincronizados com um algoritmo clínico Real na V5+. As fundações infraestruturais estão, no entanto, prontas a escutar produção.
