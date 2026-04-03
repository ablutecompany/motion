# Motion V1 — Release Candidate & Freeze

## 1. Estado da Auditoria Funcional Final
A versão `V1` da mini-app `_motion` alcançou um estado operacional contido e altamente robusto. A bridge de dados local via _useMotionStore_ combinada com os adaptadores de _Facade_ encapsularam totalmente a lógica de negócio, expurgando as Views de processamento e garantindo integridade visual e contratual mesmo sem payload externo.

### O que está Sólido:
- **Separação de Preocupações:** Views ("burras") vs Facades (orquestração) vs Store (persistência local).
- **Hardening de Sincronização:** Todas as confirmações e detetações correm dentro dos wrappers que registam no read model os tempos e se as comunicações para fora (`writebackService`) devolveram Synced, Failed, ou foram intencionalmente bloqueadas no Demo.
- **Microcopy & UI:** Normalizado end-to-end nas últimas iterações, gerando um glossário contido sem jargão nem verbosidade. O UI reflete graciosamente a queda de sincronia sem a vender como um _crash_.

### Limitações Conhecidas V1
- O ambient mode é ainda um MVP visual e o placement recommendation é um hardcoded dummy para inferência mock.
- Enrichment guarda percepções, mas ainda atua de forma discreta no _Wellness Impact_.
- Histórico ainda carece de filtragem avançada por semanas.
- Sync hardening é pragmático e determinístico, mas não usa frameworks offline-first completos.

## 2. Matriz de QA V1

| Fluxo | Estado Esperado | Resultado V1 | Veredicto |
|-------|-----------------|--------------|-----------|
| **Treino ativo normal** | Abertura $\rightarrow$ Conclusão $\rightarrow$ Enrichment de rescaldo. | Funciona do princípio ao fim ligando a store e enviando evento correto. |  ✅ **OK** |
| **Pendente Inferido** | Homepage apresenta prompt caso não existam pre-empted targets nem sessões abertas. | Trigger mock de teste valida o fecho de treino e subsequente limpeza na store. | ✅ **OK** |
| **Treino Inferido Adiamento** | Se dispensado momentaneamente, permite readmissão. | Removido temporariamente do focus, mas trigger mantém-se apto na session base. | ✅ **OK** |
| **Rejeição Inferido** | Remove instância detetada como Falso Positivo. | Suprime da Facade e limpa payload de detetação. | ✅ **OK** |
| **Demo Local-Only** | Bloqueia sync remoto na root com alerta de UI para Demo. | As Actions marcam como "Restrito ao Demo" e previnem chamadas sem quebrar a app. | ✅ **OK** |
| **Histórico Read-Only** | Tudo congelado (no mutability). | Impossível dar complete ou enriquecer instâncias do _past_, inputs blindados via disabled. | ✅ **OK** |
| **Erro de Sincronização** | Mantém record com status *failed*. | Mantém a promessa determinística e expõe no Progresso sem destruir dados da sessão. | ✅ **OK** |
| **Update do Mismo ID (Enrichment)** | Destila keys atualizadas s/ duplicar records na Timeline real. | Reducer `addOrUpdateWorkoutRecord` garante imutabilidade seletiva sobrepondo apenas propriedades novas. | ✅ **OK** |
| **Wellness Impact Base** | O output regista utilidade e consistência limpas. | Aparecem boxes base na activity list informando coerência com guidelines de atividade. | ✅ **OK** |
| **Impacto Enriquecido** | Recebe overwrite metadata via Payload na facade e gera texto denso de "Dotação". | UI atualiza para _strong signal_ integrando RPE e Workout Type. | ✅ **OK** |

## 3. Backlog Estruturado para V2

As fundações da `_motion` provam o seu valor operando de modo isolado mas capaz. O backlog de transição V2 não deve quebrar esta abordagem:

### V2.1 — Refinamento de Inferência e Tracking
* **Objetivo:** Adicionar heurísticas de deteção passiva e sensores on-device contínuos.
* **Valor:** Validar inputs vitais substituindo a bridge hardcoded de accelerometer mock atual.
* **Dependência:** APIs Nativas de Hardware / HealthKit
* **Prioridade:** **Alta**

### V2.2 — Execution UX / Fluxos Ativos Guiados (Timer/Steps)
* **Objetivo:** Para o modo `guide`, suportar renderização de etapas (timers e checklists).
* **Valor:** A app ganha a proatividade em blocos de microtreino além da orquestração.
* **Prioridade:** **Baixa** (Conflita com intenção primária de uso "Discreto/Misto").

### V2.3 — Enrichment Rico no Wellness
* **Objetivo:** Iniciar painéis de reflexão diária mais apurados com RPE longo, mood scales, ou biometria auto reportada no pós-workout.
* **Valor:** Nutrir o algoritmo principal de wellness da root com mais sinais biológicos qualificados.
* **Prioridade:** **Média**

### V2.4 — Timeline de Histórico e Analytics Pessoais
* **Objetivo:** Visualização multi-mensal no MotionProgress, paginação contínua e sumarizações calóricas.
* **Valor:** Converter `MotionProgress` num portal de motivação em vez de simples log sequencial temporário.
* **Prioridade:** **Alta**

### V2.5 — Integração Profunda Wellness (Home Shell Connect)
* **Objetivo:** Refletir os _outcomes_ diários (Sinais Fortes de Desporto) num anel visual na Shell Principal que indique aos painéis parentais se a pessoa cumpriu a "Motion Quota".
* **Valor:** Interligação ecossistémica nativa fechada end-to-end.
* **Prioridade:** **Média/Alta** (Aguardando guidelines do Root).

## 4. Handoff V1

A equipa adquire agora total visibilidade tecnológica do estado atual do módulo.
- **A V1 FAZ:** Gestão autónoma do plano de treino, resolve context states (Demo/History), fecha loops de treino e garante a sincronização visual honesta via `writeback` encapsulado. Garantiu robustez UX (nenhuma "unhandled rejection") se a shell estiver abaixo ou sem permissões.
- **A V1 NÃO FAZ (DELIBERADA E CORRETAMENTE):** Contagem de reps, uso de cronómetro para séries, criação livre offline de sessões ad-hoc ou sistemas de recompensas. O Enrichment e Inferences param a promessa de features onde faz sentido fechar o loop root da V1.
- **ZONAS SENSÍVEIS _DO NOT TOUCH_:** A arquitetura das *Facades* (ex: `useMotionExecutionFacade.ts`) centralizou todo o motor. Desviar lógicas deste centro para os ecrãs novamente é regressão técnica grave em V1+. 
- **PRÓPRIO TOUCHPOINT SEGURO:** Qualquer evolutiva de rendering ou copy pode ser efetuada na View level via hooks porque os modelos estritamente conformes blindam a UI do caos da rede.

**STATUS:** Congelado como V1 (Release Candidate Seguro).
