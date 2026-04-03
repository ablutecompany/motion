# Governação Operacional em Produção (V5.0)

Este documento dita a política máxima de **Congelamento Funcional** da app `_motion`. A partir desta versão, o ecossistema `_motion` deixa de viver em escalada de *roadmap* (construção funcional) para residir em modelo de *Maintenance Lane*, focado unicamente na honradez dos Contratos com Master Host e segurança de estado.

---

## 1. Regras de Ouro (Freeze Funcional)
Nenhum desenvolvimento com a classificação de "hotfix" ou "maintenance" pode ser usado como via rápida para entregar melhorias de produto.
- ⛔ **ZERO novas funcionalidades**.
- ⛔ **ZERO revisões estéticas (UX/UI)** salvo para mitigação de quebras *blocking*.
- ⛔ **ZERO refactoring abstrato** para "limpeza de código" sem prova de falha operacional associada.

---

## 2. Fronteiras de Classificação

O responsável técnico ou Triage Officer deve categorizar rigidamente qualquer ticket que afete a `_motion`:

### Hotfix (Prioridade: Imediata)
Só se admite se pertencer a:
* Um *Crash Native/React* na Root Render (e.g. ecrã branco).
* Arrranque impedido por falsos de *Host Context* quebrados;
* Quebra confirmada do Runtime Contract de I/O (Timeout, Rejeição silenciada);
* Bloqueios ou fugas nos *Guards de Demo e History Mode*;
* Perda irrecuperável de transação sem providência na *RetryQueue* local.

### Maintenance (Prioridade: Roadmap Pipeline)
Admissível nas seguintes ocorrências limitadas:
* Necessidade provada no *Staged Rollout* de afinar Tempos de Timeout (e.g. Host está demorar 8s e não 5s a devolver Acks).
* Adaptação a depurações da Webview base providenciando mais *telemetria* para deteção dos Null Pointers.
* Correções das *Labels* textuais que estejam efetivamente erradas.

### Backlog Futuro (Exclusão Imediata da Maintenance Lane)
* Sugestões visuais provenientes de UX Designers na infraestrutura master.
* Repensar os Motores Simulados (Planet/Phase) a favor de integração Clínica real.
* Pedidos para gravar mais "Telemetria Analítica Permanente".

---

## 3. Caminho de Passagem Transacional (Promotion Path)
Exigem-se as sucessivas autorizações para passagem a ambiente master:
1. **Local/Dev**: Ausência de Regressão V2.6–V4.3 atestada.
2. **Validation Harness**: O *Webhook* Dummy validou as promessas do adaptador perfeitamente em dev sem poluição extra.
3. **Pilot / Staged Rollout**: Tolerância monitorizada de percentis; Telemetria aponta para < 1% Falhas Críticas de `BOOT_FALLBACK`.
4. **Produção (100%)**: Deploy completo com *observabilidade estéril* ativa.

---

## 4. Matrizes de Avaliação

### 4.A. Matriz de Severidade Operacional
| Grau | Sinais Observados | Resposta Exigida |
| :--- | :--- | :--- |
| **BLOCKER** | App Crash Absoluto na Invocação. `TypeError` descontrolados. Falha grave nos *Guards Read-Only* forçando Writebacks em Demos. Corrupção da RetryQueue com Repetições Duplicadas Diárias. | **Hotfix Imediato** e **Rollback** |
| **CRITICAL** | Host rejeita ou dá Payload Malformed consistentemente sem dar fallback correto à App. Timeout sistemático. | **Hotfix Rápido** ou **Hold Rollback** |
| **HIGH** | Falhas marginais com a Reconciliação; Timings não ótimos que prejudicam o Flow local mas persistem na fila síncrona. | Acompanhamento e Manutenção Escalonada |
| **MEDIUM** | Gaps passivos nas descrições de estado Sync| Em fila; Pode Subir no próximo _Minor Release_ |
| **LOW** | Dívida não crítica de Tipagem em dev. | Mantido sem Intervenção na Release Principal |

### 4.B. Regras Disjuntoras (Hold & Rollback Criteria)
*   **HOLD Condition**: Falência dos *Acks* no Piloto ou Telemetria gritando `HOST_RECONCILIATION_TIMEOUT` contínuo. Pára o *Scaled Rollout*, mas os ativos correntes mantêm-se visto possuírem redundância de falhas. 
*   **ROLLBACK Condition**: Deteção provada ou registada de Duplicação DB (Transação dupla do writeback adapter não contida pela Queue). Ou quebra total das views dos Master Hosts (iFrame ou WebViews caindo constantemente aquando o *mount* de `_motion`). Injetação cega de dados de Teste (Sandbox) na DB principal devido a *burlas nos Guard Rails*.

---

## 5. Riscos Residuais (Aceites em Produção)
Esta versão é lacrada assumindo tecnicamente e clinicamente o seguinte:
- A `_motion` recai na fidelidade do Master Host. Se o Host não lhe despachar o objecto inicial limpo via prop formal do `HostInboundContext`, a app *degrada para Fallback* e não serve planos personalizados.
- Existe uma flag de bypass e instrumentação de teste adormecida globalmente `mountValidationHarness()`. Ela foi confirmada passiva e destina-se apenas a simplificar as rotinas para Staged Builds.
- O motor interno de `Universes`, `Phases` e `Scores` funciona numa lógica perfeitamente isolada, simulada por cálculo determinístico temporal e não por recomendação biológica baseada em cloud (até existir um redesign completo, intencionado da V6+ num Roadmap remoto paralelo). Estes **TODOs core** foram declarados como limite imposto em V3.6.
