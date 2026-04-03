# `_motion` V3.3 — Timeline Analítica & Filtros

**Fase Operacional:** V3.3 (Isolada)
**Responsável Técnico:** Antigravity

Esta iteração introduz ferramentas puramente analíticas (leitura visual e filtros reactivos) num ecrã central – o Ecrã de Progresso (`MotionProgress.tsx`). O objetivo arquitetural foi não poluir o Read Model (`workoutHistory`) da aplicação global, contendo toda a lógica de filtros num _hook_ UI e num serviço numérico simples.

## 1. O que foi adicionado

1. **`types.ts`**
   - Injetamos as definições temporais e contratuais literais (`MotionTimelineFilterState`, `MotionTimelineRange`, `MotionTimelineAnalytics`).
2. **`motionTimelineAnalyticsService.ts`**
   - Um processador *in-bound* passivo, concebido sem efeitos secundários (pure functions).
   - `filterHistory`: Absorve a amostragem bruta e limita o Array com base nas configurações de interface (Datas, Origens, Sincronização e Enriquecimento).
   - `computeAnalytics`: Extrai a matemática estrutural baseada apenas nesse subconjunto recém-filtrado, gerando contagens justas sem distorções (e gerando extrapolações de frequências de treino baseadas no tempo ou nas janelas _7d/30d/90d_).
3. **`useMotionTimelineFacade.ts`**
   - Criação de uma *UI Store Facade*. Contém _useState_ próprio. Expõe à View os relatórios filtrados servindo diretamente como a _source of truth_ transitória no `MotionProgress`.
4. **`MotionTimelineAnalyticsViews.tsx`**
   - Contém dois componentes minimalistas e compactos reutilizando as folhas de estilo orgânicas (`MotionTimelineFilters` e `MotionTimelineAnalyticsSummary`).
   - Apresentam de forma factível, e coerente com a versão V2.6, os controlos reativos.

## 2. Abordagem Metodológica 

Para manter integridade:
- **A layer não tem score mechanisms**: Os contadores focam se em métricas seguras do sistema: *Quantos treinos? Qual a proporção ativos/inferidos? Quantos têm detalhe manual? E estão Sincronizados?*
- **Lógica de Planeamento Cíclico Limitada**: Tal como ditado pelas regras inegociáveis, a exibição de metas fechadas de ciclo temporal como "Total Planeado no Ciclo" foi restringida. Apenas é exibida quando o scope selecionado é o completo ("Todos"), desligando-se do interface imediatamente ao interagir-se com "7 dias" de modo a não criar dissonância cognitiva no cruzamento entre "Janela de visualização" vs "Target Operacional de Fundo".

## 3. Limitações Assumidas (Handoff V3.3)

- Esteticamente, o utilizador faz "Scroll" lateral à procura das `Pills` (chips). Tratando-se de interfaces mobile em web/mini-app, os dropdowns pesavam excessivamente a vista analítica. Opção por chips mantém o ambiente contido e minimalista em formato "Auditoria rápida".
- A "Semana" não é um calendário estrito, a frequência semanal do Analytics calcula a densidade rácio dividindo os eventos pela span linear (em meses, ex: N period 30 / 7).
- Esta feature afeta apenas a reatividade superficial, os relatórios globais de *Wellness* ou os registos mantêm-se alheios e factuais, provando o isolamento rígido da frente V3.3 em relação as versões passadas.
