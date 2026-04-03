# `_motion` Operations & Triage Runbook (V5.1)

Documento ativo de *First-Response*. Descreve o protocolo da Maintenance Lane da aplicação `_motion` em Regime Governado. Sem exceções. Todo e qualquer relato de anomalia tem de ser reduzido a um formulário *Intake* e percorrido na presente Árvore de Decisão antes de gerar uma branch corretiva.

---

## 1. Como Abrir um Incidente (Intake Workflow)
Qualquer anomalia reportada deve constar de um Tíquete formal. "Acho que vi" não garante ação técnica; apenas comportamento provado e rastreável garante Hotfix.

### Template de Intake (Copiar para o Tracker/Jira)
```markdown
**[INCIDENT INTAKE] `_motion`**
- **ID do Incidente**: [E.g., INC-2026-004]
- **Data/Hora da Ocorrência**: [E.g., 2026-04-03 14:00 GMT]
- **Ambiente Afetado**: [Local / Validation / Pilot / Staged / Production]
- **Versão Afetada**: [E.g., V5.0]
- **Fluxo Afetado**: [E.g., Writeback | Boot | Feedback | Demo Guard | Retry Queue]
- **Frequência Operacional**: [Uma vez | Intermitente | Sistémico]
- **Severidade do Ticket**: [Blocker | Critical | High | Medium | Low]

**Decrição Factual / Comportamento Observado**
[Descrever o erro tecnicamente sem sugestão visual.]

**Impacto Operacional**
[A UI cai? Os dados perdem-se? Ou há Fallback limpo providenciado?]

**Passos de Reprodução**
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

**Resultado Esperado vs Resultado Observado**
- *Esperado*: [O que as restrições da V4/V5 exigem]
- *Observado*: [O evento falhado]

**Evidência Obrigatória Anexada**
[X] Log da Consola / Erro Nativo Tracker.
[X] ID do Recorde impactado.
[ ] Vídeo de ecrã evidenciando Crash.

**Existe Fallback Operacional Ativo?**
[Sim / Não - A Retry Queue apanhou? A App não caiu?]

**Decisão Provisória de Triagem**
[Hotfix | Hold | Rollback | Backlog | Monitorizar]
```

---

## 2. Árvore de Decisão (Triage Flow)

Utilizar este caminho crítico para converter a *Decisão Provisória de Triagem* da tabela anterior em Ação Técnica definitiva pelo mantenedor da `_motion`.

1. **A App Faz Crash Absoluto (React Root / Runtime Error)?**
   - ➜ `HOTFIX IMEDIATO`. Rollback imediato se não existir fix de >4 horas.
2. **O Host Falha Boot Inteiro e a UI Reage Abruptamente?**
   - ➜ `HOTFIX IMEDIATO`. (Erro em parsing ou no *adapter*).
3. **Writeback Partido. Os Treinos Concluídos NUNCA Acusam Ack de Sucesso?**
   - ➜ `HOTFIX IMEDIATO`. (Falência assíncrona do payload de resposta).
4. **Duplicação de Registos Provada na Base de Dados Host?**
   - ➜ `HOTFIX IMEDIATO / ROLLBACK LOCAL`. *Guards* ou *Retry Queue* encontram-se furados.
5. **Guardas Demo/Histórico Falharam (Ação de Teste poluiu Produção)?**
   - ➜ `HOTFIX IMEDIATO / ROLLBACK LOCAL`. 
6. **Ocorrem Timeouts no Host, contudo a App retém Fallback íntegro (RetryQueue Local Offline ativa)?**
   - ➜ `HOLD / MONITORIZAR`. Não justificado o perigo de Hotfix pois a arquitetura Offline absorve de forma *Host-Safe*. Problema deve ser reportado para a equipa gerir latência da *Master Shell*.
7. **Problema de Design / Novo Rótulo (Melhoria Visual, UX)?**
   - ➜ `BACKLOG`. Zero Alterações operacionais no regime da Maintenance Lane (Strict Governance). Reavaliado para roadmap de Major Release futura (e.g. V6+).
8. **Comportamento não Provado (Relato de User sem Evidência/Reprodução)?**
   - ➜ `MONITORIZAR ATÉ HAVER EVIDÊNCIA CLARA`. Bloqueio de ticket.

---

## 3. Política Mínima de Evidência para Hotfix

A `_motion` apenas quebra selos arquiteturais mediante a seguinte prova indisputável submetida pelo Q.A. ou Eng. Triador:
* Log da Consola exibindo `TypeError`, Fallback Excecionado ou `BOOT_FALLBACK` track events.
* IDs unívocos de Correlação (`messageId`, `workoutRecordId`) onde o *Transaction Failed* ou corrompeu DB.
* Passo-a-passo viabilizável num test-harness isolado que reproduza a quebra mecânica.

---

## 4. Checklist Pós-Hotfix (Validação de Remoção de Incidente)

Antes de aprovar *Merge* e transitar o incidente para `CLOSED`, auditar este quadro:
- [x] O fix é puramente arquitetural, cirúrgico, sem contaminação Visual.
- [x] Regressões atestadas a `zero` via testes nos Fluxos Críticos vizinhos.
- [x] Fallback Web/Mini-App retém comportamento seguro na nova *branch*.
- [x] Não contém reabertura desnecessária da semântica originária (*Universes/Phases* base mantêm a placeholder intacto).
- [x] Nenhuma dependência externa nova (vendors) injetada (regra V4.3).
- [x] (Se O Hotfix Tocou em Contratos V4.0) ➜ Comunicação imediata executada à *Host/Master Team* para alinhamento dos Types in/out na *Shell*. 

---

## 5. Mapeamento de Risco (Fluxos Críticos Intocáveis na Manutenção)
*(Nota mental obrigatória ao Operador de Hotfix)*

Não mexer nestes nós vitais durante reparações se não forem a causa provada raiz:
* **Impact vs Feedback**: Não baralhar a pontuação gerada passivamente (`_motion`) vs retorno Real (*webhook shell*).
* **Sync Semantics e Retry**: Qualquer perturbação à fila pode desajustar envio de treinos retidos (*enqueued fail attempts*).
* **Proteção Demo**: Modo blindado onde nada submete transações persistidas. 

***Fim do Runbook. Qualquer anomalia segue esta escada.***
