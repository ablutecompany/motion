# `_motion` V2.6 — Freeze Formal & Handoff Técnico

**Estado:** CONGELADA (Baseline Estável)
**Data de Freeze:** 3 de Abril 2026

A versão V2.6 formaliza o fim da transição conceptual da `_motion`, unificando a maturidade funcional e de ecossistema (V1 – V2.5) numa interface gráfica nativa, premium e transversal através do `MotionUI` kit. Nenhuma alteração disruptiva foi introduzida aos motores lógicos, mantendo a integridade da ponte com a arquitetura `ablute_ wellness` intacta.

---

## 1. Auditoria Funcional & Visual

A arquitetura encontra-se contida e estabilizada. Os motores *core* garantem a execução síncrona sem ruturas.

### Estado Funcional
- **Sólido (Solid):** Gestão de estado na *store*; resolução local-only vs synced; persistência síncrona do *Timeline* agrupado; inferência pendente passiva (preserva e avança para aprovação); enriquecimento formatado pelo *WorkoutEnrichment*.
- **Aceitável (Acceptable):** *Ambient Mode* em Sessão (mantém UI orientada a leitura, mas ainda não opera em total *background execution mode* de hardware); Lógica unificadora de *Wellness Impact* e *Feedback* (respeita contratos e mostra projeções honestas baseadas num sistema *rule-based* restrito).
- **Follow-up / Limitação:** Integração com sensores de hardware do OS (dados ainda são imputados por rotinas *simuladas* determinísticas na fachada); Reconciliação robusta de histórico do Host aquando a falhas de rede.

### Estado Visual
A aplicação parece e comporta-se agora como um produto *premium*:
- **Headers & Cards:** Suportam todo o esqueleto transversal entre as vistas. O `StyleSheet` perdeu entropia local.
- **Status Pills:** Semântica fechada e determinística; não há rótulos ad-hoc de "erro" ou "sincronizado", todos usam propulsores partilhados.
- **Continuidade (Home → Plan → Session → Progress):** Não restam vazios estruturais. As tipografias, *spacing* (gaps e paddings), e paletas de cores respondem previsivelmente ao longo das *features*. Não restam componentes órfãos.

---

## 2. Matriz de QA Operacional

| Fluxo Testado | Detalhe do Estado Esperado | Resultado Atual | Veredicto |
| :--- | :--- | :--- | :--- |
| **Treino ativo completo** | O fluxo começa, gere blocos/orientação e resolve para *synced/local_only*. | A UI responde ao estado exato sem quebra. `MotionUI` garante layout limpo no *ambient mode*. | ✅ OK |
| **Treino inferido confirmado** | Aceitar a inferência converte para sessão válida na Timeline e plano progride. | Resolução suave, regista como passiva com enriquecimento e sem perdas de layout. | ✅ OK |
| **Treino inferido rejeitado/adiado** | Rejeitar devolve estado ao _idle_ com notificação limpa. Adiar guarda em pendente. | Funcionalidade corre localmente sem sujar dados de Host. | ✅ OK |
| **Enrichment completo/parcial** | Sinais vitais traduzidos para `wellnessImpact`; render visual na timeline agrupada. | Blocos distintivos (`ecfdf5`) renderizam caso enriquecidos. | ✅ OK |
| **Ambient Mode** | Ecrã de sessão simplificado mantendo-se focado sem obstruir interação. | UI de acompanhamento estabilizada. Falta hardware runtime puro. | 🟡 LIMITAÇÃO ACEITE |
| **Demo local-only** | Tentativa de enviar p/ host retida silenciosamente no ecosistema interno. | Notificações visuais através de badges clarificam modo local. Ocorre 100% de coerência no histórico. | ✅ OK |
| **Histórico read-only** | Sessão validada do passado desactiva botões de input operativo/formato treino. | Botões opacos/desativados; mensagem explícita no cabecalho e Setup. | ✅ OK |
| **Sync Failed** | Falha transacional deve ser identificada com cor de erro e retida no read-model. | *Status pill* a vermelho captura "Failed". O dado fica em local_storage. | ✅ OK |
| **Timeline agrupada** | Dados devem organizar-se por grupo (Hoje, Ontem, etc.) e expandir por item. | O `MotionProgress` empilha corretamente e expande os detalhes dos sinais *wellness*. | ✅ OK |
| **Wellness Feedback PROJ. vs HOST** | Se não há Host, gera uma projeção `local_projection` e alerta visual. | Identificador "Retorno Projetado (Demo)" funciona plenamente para evitar mentira semântica. | ✅ OK |

---

## 3. Limitações Conhecidas V2.6

Estes aspetos não representam problemas ("bugs"), mas sim fronteiras deliberadas impostas sobre a versão 2.6:

1. **Inferência Passiva sem Binding Real:** O sistema deteta e constrói registos pendentes unicamente via mecânicas *trigger* da fachada central. Não há escuta aos serviços vitais do Android/iOS (HealthKit / Google Fit).
2. **Ambient Mode Simulativo:** É uma UX fantástica, bloqueando distrações durante o treino, mas o telefone ainda pode entrar em suspensão se o hardware OS assim ditar. Não há "WakeLock" imperativo no React Native nativo nesta versão.
3. **Timeline como Log (Leve):** Não possibilita ordenação complexa, paginação agressiva (lazy loading pesado) ou gráficos analíticos. É, para já, linear em memória.
4. **Offline First Simples:** Não existe reconciliador ou `Retry-Queue` para falhas de *Sync Status* para com o `writebackService`. Um dado `failed` não tenta ser reenviado silenciosamente no fundo.

---

## 4. Backlog Estruturado (V3.x)

Próximos incrementos. Respeitam as dependências progressivas do ecossistema:

| Milestone | Título Prioritário | Objetivo & Valor | Dependência | Prioridade |
| :--- | :--- | :--- | :--- | :--- |
| **V3.1** | Binding de Sinais Biométricos (Inferência Real) | Substituir os disparos de simulação com leitura direta de OS Sensors para real time detection. Aporta realismo brutal à shell passiva. | Host Bridge Hooks / OS Capabilities | Alta |
| **V3.2** | Queue Offline Reconciliativa | Criar um "Background Sync Engine" que reencontra rede e faz retry de *contributions* pendentes. Torna a app imortal a perdas de GSM/Wifi. | `writebackService` estendido | Alta |
| **V3.3** | Timeline Analítica e Fitragem (Macro) | Suportar visualização do gráfico de progresso (volume vs intensidade). Vital para justificação fisiológica a longo prazo. | Novo serviço de agregados | Média |
| **V3.4** | Execution Execution Runtime Completo (WakeLock) | Obrigar o telefone a não fechar e a tratar de reprodução audível local (Text-to-Speech) de *cues* no Mode "Orientado". | Acesso explícito ao HW do device | Média |
| **V3.5** | Integração Circular de Wellness Dinâmica | Fim das "Projeções". As respostas do ecosistema `ablute` devem devolver metas semanais novas (ex: *dormiu mal -> diminui carga da sessão amanhã*). | V3.1 e Shell Core de Recuperação | Baixa |
| **V3.6** | Optimização Binária (Bundle e Assets) | Purga de bibliotecas para _Release_ de Produto ao consumidor. | V3.2 e V3.4 estabilizadas | Baixa |

---

## 5. Handoff de Continuação

A `_motion` está consolidada em três pilares base fundamentais:
- A camada arquitetural **Gestão de Estado & Local Read-Model** (`useMotionStore`).
- A camada transacional para o Host **Ablute Adapter & Writeback** (`hostBridge`, `writeback`).
- A camada de Apresentação Uniforme **V2 UI Kit** (`MotionUI`, Componentes Isolados).

### 🚫 Onde **NÃO** Mexer Levianamente:
- A mecânica do **Contexto Síncrono** (`MotionRoot` e `MotionContext`): O encadeamento do demo vs modo histórico foi cravado com *fallback* explícito de propriedades de escrita. Romper isto trará inconsistências nos fluxos passivos.
- O mapeador e inferência (`workoutInferenceService` e `workoutContributionMapper`): Estes traduzem sinais abstratos para *payloads* determinísticos que o Host `ablute` consegue ler. Um tipo solto ou incorreto nesta área gera panico na base de dados global.
- Os **MotionEvents**: A taxonomia de _analytics_ está imaculada com ações estritas (v2.4). Alterar nomenclatura viola o tracking do _DataLake_.

### 🚪 Melhores Pontos de Entrada P/ Evolução:
- **`src/facades/useMotionExecutionFacade.ts`**: Qualquer nova "funcionalidade mágica" de treino (como novos sensores V3.1) deverá expor uma fachada ou integrar nesta para que as Views se mantenham ignorantes e simples.
- **`src/features/screens/MotionPlan.tsx`**: Para escalar as sessões de treino para modos complexos (V3.2 e V3.5), o `MotionPlan` é a fonte nativa de re-estruturação.

---
*(Fim da Especificação Operacional V2.6)*
