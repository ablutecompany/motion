/**
 * repQualityEngine.ts — RC1.4
 *
 * Motor central de qualidade de execução do conta-movimento.
 * Garante que apenas movimento físico real e plausível conta como repetição.
 *
 * REGRA CENTRAL: acceptedRep = movimento físico real + amplitude suficiente + qualidade mínima
 *
 * Pipeline:
 *   rawMotion  →  RepPhaseDetector  →  ExecutionQualityScorer  →  VisualGaugeMapper
 *
 * RC1.4 — Adaptação para AIG (accelerationIncludingGravity) como sinal primário:
 *   - Entrada em fase por COERÊNCIA DIRECIONAL (não só por spike de amplitude)
 *   - Amplitude medida como range de smoothY (não só delta de magnitude)
 *   - Thresholds de entrada em fase separados do threshold de aceitação de rep
 */

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------

export type RepPhase =
  | 'idle'    // em repouso, à espera de movimento
  | 'eccen'   // fase excêntrica (descida no supino)
  | 'bottom'  // fundo — amplitude máxima
  | 'concen'  // fase concêntrica (subida no supino)
  | 'top';    // topo / lockout

export interface RawSample {
  x: number;
  y: number;
  z: number;
  timestamp: number; // ms
}

export interface RepResult {
  executionQualityScore: number; // 0..1
  phaseTimings: Partial<Record<RepPhase, number>>; // ms por fase
  amplitudeRatio: number; // vs referenceROM (0..1)
  cadenceOk: boolean;
  noiseLevel: number; // 0..1
  completed: boolean; // rep concluída com todas as fases
}

export interface QualityEngineState {
  currentPhase: RepPhase;
  repProgress: number;         // 0..1 — progresso dentro da rep
  visualGaugeProgress: number; // 0..100 — controla anel
  executionQualityScore: number; // 0..1 — score técnico
  liveAmplitude: number;       // RC1.8.1 — For live real-time debug inspection
  repCount: number;            // APENAS reps com movimento físico real validado
  celebrationTrigger: boolean;
  referenceROM: number | null; // calibrado na 1ª rep válida
  lastRepResult: RepResult | null;
  rejectionReason: string;
}

// ---------------------------------------------------------------------------
// CONSTANTES E THRESHOLDS
// ---------------------------------------------------------------------------

const GRAVITY = 9.81;

// Limiar de spike instantâneo para sair de idle (caminho rápido — ACC/AIG brusco)
// 2.8 m/s² ≈ 28% de 1G extra: exige movimento intencional, não vibração de mesa.
const IDLE_THRESHOLD = 2.8;

// Threshold de entrada em fase dentro da rep (mais permissivo que IDLE_THRESHOLD).
// Separado para não obrigar a spike alto em cada transição bottom→concen.
const PHASE_ENTRY_THRESHOLD = 0.8; // m/s²

// ── Coerência direcional (caminho suave para sair de idle) ─────────────────
// Se |smoothY| > DIRECTION_THRESHOLD por COHERENT_ENTRY_SAMPLES amostras
// consecutivas, entra em fase mesmo sem spike de magnitude.
// Captura reps controladas com AIG onde delta ≈ 0 mas smoothY varia.
const DIRECTION_THRESHOLD = 0.9;      // unidades de AIG (m/s²)
const COHERENT_ENTRY_SAMPLES = 6;     // amostras (~120ms a 50Hz, ~180ms a 33Hz)

// Amplitude mínima de smoothY range para considerar que houve arco real de movimento.
// 1.5 corresponds roughly to the Y-component changing 1.5 m/s² over the arc —
// significativamente menor que IDLE_THRESHOLD pois AIG cobre mais sinal direcional.
const MIN_SMOOTH_Y_RANGE = 1.5;       // m/s² de range de smoothY

// Limiares de Y suavizado para transições de fase (AIG: Y indica inclinação do braço)
const BOTTOM_ENTRY_Y  =  0.8;  // eccen→bottom: braço chegou ao fundo
const CONCEN_TOP_Y    =  0.8;  // concen→top:   Y volta a baixar após subida

// Amplitude mínima para que uma rep seja aceite (validação final).
// Usando max(peakDelta, smoothYRange) — funciona com ACC e AIG.
const MIN_ACCEPTED_AMPLITUDE = 1.5;   // m/s² (reduzido de 2.5; range de Y é diferente de delta)

// Score mínimo de qualidade para contabilizar a rep.
const MIN_QUALITY_FOR_COUNT = 0.30;

// Duração mínima de uma fase para ser válida (ms)
const MIN_PHASE_DURATION_MS = 120; // Reduzido drasticamente para repetições dinâmicas e explosivas

// Duração máxima de uma fase — após este tempo, RESET para idle
const MAX_PHASE_DURATION_MS = 7000;

// Tempo mínimo em idle antes de permitir nova entrada por coerência direcional.
const IDLE_REARM_MS = 400;

// Requisitos de Pose de Prontidão (Ready-Pose) — RC1.8
const READY_POSE_STABILITY_MS = 400; // Estabilidade mais rápida para não falhar 1ª rep
const READY_ORIENTATION_LIMIT = 5.0; // Desvio máximo
const POSTURE_SHIFT_LIMIT     = 3.0; // Limite lateral severamente reduzido (antes 6.5) para bloquear lateral

// Cadência ótima por fase (ms)
const CADENCE_MIN_MS = 180; // Tolerância máxima para o fluxo natural/rápido de um ginásio
const CADENCE_MAX_MS = 3500;

// Limiar de ruído lateral (std dev de X/Z normalizado)
const NOISE_HIGH_THRESHOLD   = 0.35;
const NOISE_MEDIUM_THRESHOLD = 0.15;

// Score mínimo para microcelebração
const CELEBRATION_THRESHOLD = 0.88;

// Pesos do VisualGaugeMapper
const WEIGHT_QUALITY = 0.82;
const WEIGHT_RAW     = 0.18;

// Cap visual por condição degradada
const CAP_CHAOTIC_CADENCE   = 0.50;
const CAP_INSUFFICIENT_AMP  = 0.45;
const CAP_INCOMPLETE_PHASES = 0.35;

// ---------------------------------------------------------------------------
// UTILITÁRIOS
// ---------------------------------------------------------------------------

function magnitude(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

function lateralNoise(samples: RawSample[]): number {
  if (samples.length < 3) return 0;
  const xVals = samples.map(s => s.x);
  const zVals = samples.map(s => s.z);
  const meanX = xVals.reduce((a, b) => a + b, 0) / xVals.length;
  const meanZ = zVals.reduce((a, b) => a + b, 0) / zVals.length;
  const varX = xVals.reduce((a, b) => a + (b - meanX) ** 2, 0) / xVals.length;
  const varZ = zVals.reduce((a, b) => a + (b - meanZ) ** 2, 0) / zVals.length;
  return Math.min(1, Math.sqrt(varX + varZ) / 3);
}

// ---------------------------------------------------------------------------
// REP PHASE DETECTOR — RC1.4
// ---------------------------------------------------------------------------

/**
 * Máquina de estados para deteção de fases de repetição.
 * Optimizado para supino reto + AIG (accelerationIncludingGravity) como fonte primária.
 *
 * MODELO DE SINAL (AIG):
 *  magnitude(AIG) ≈ 9.81 durante movimento lento → delta ≈ 0.
 *  A informação de trajectória real está em smoothY:
 *    smoothY < −DIRECTION_THRESHOLD → braço em descida (eccen)
 *    smoothY > +BOTTOM_ENTRY_Y     → braço no fundo (bottom)
 *    smoothY < −CONCEN_TOP_Y       → braço no topo (lockout)
 *
 * DUPLO CAMINHO DE ENTRADA EM IDLE:
 *  1. Spike (ACC/AIG brusco): delta > IDLE_THRESHOLD → entrada imediata
 *  2. Coerência direcional (AIG suave): |smoothY| > DIRECTION_THRESHOLD
 *     por COHERENT_ENTRY_SAMPLES amostras consecutivas → entrada gradual
 *
 * AMPLITUDE:
 *  max(peakDelta, smoothYRange) — funciona com ACC (delta real) e AIG (Y range).
 */
export class RepPhaseDetector {
  private phase: RepPhase = 'idle';
  private phaseStartTime = 0;
  private phaseBuffer: RawSample[] = [];
  private phaseTimings: Partial<Record<RepPhase, number>> = {};

  // EMA de Y — alpha 0.18 (ligeiramente mais rápido que 0.15 para AIG)
  private smoothY = 0;
  private readonly alpha = 0.18;

  // Amplitude via deviation de magnitude (compatível com ACC)
  private peakDelta = 0;

  // Amplitude via range de smoothY (fiável com AIG em movimento lento)
  private smoothYMin =  Infinity;
  private smoothYMax = -Infinity;

  // Estado de coerência direcional para entrada suave em idle
  private directionCount = 0;
  private directionSign  = 0; // -1 = descida, +1 = subida
  private idleBaselineY  = NaN;

  // Estado de Armamento (RC1.7)
  private isArmed = false;
  private readyPoseStartTime = 0;
  private rejectionReason = '—';

  reset() {
    this.phase          = 'idle';
    this.phaseStartTime = 0;
    this.phaseBuffer    = [];
    this.phaseTimings   = {};
    this.peakDelta      = 0;
    this.smoothYMin     =  Infinity;
    this.smoothYMax     = -Infinity;
    this.maxDirectionRun = 0;
    this.directionCount = 0;
    this.directionSign  = 0;
    // RC1.5/RC1.6: reseta as médias
    this.smoothY        = 0;
    this.idleBaselineY  = NaN;
    this.isArmed        = false;
    this.readyPoseStartTime = 0;
    this.rejectionReason = '—';
  }

  processSample(sample: RawSample): {
    newPhase: RepPhase;
    phaseTimings: Partial<Record<RepPhase, number>>;
    amplitudeDelta: number;
    repCompleted: boolean;
    phaseSamples: RawSample[];
    rejectionReason: string;
  } | null {
    const mag   = magnitude(sample.x, sample.y, sample.z);
    const delta = Math.abs(mag - GRAVITY);
    const oldSmoothY = this.smoothY;
    this.smoothY = this.smoothY * (1 - this.alpha) + sample.y * this.alpha;

    // RC1.7.5: Lógica de direção para detetar chatter
    const diff = this.smoothY - oldSmoothY;
    const isSameDir = Math.sign(diff) === this.directionSign && Math.abs(diff) > 0.05;
    if (isSameDir) {
      this.directionCount += 1;
    } else {
      this.directionSign  = Math.sign(diff);
      this.directionCount = 1;
    }
    this.maxDirectionRun = Math.max(this.maxDirectionRun, this.directionCount);

    this.phaseBuffer.push(sample);
    if (this.phaseBuffer.length > 80) this.phaseBuffer.shift();

    const now = sample.timestamp;
    if (this.phaseStartTime === 0) this.phaseStartTime = now;
    const phaseDuration = now - this.phaseStartTime;

    let newPhase: RepPhase | null = null;
    let repCompleted = false;

    switch (this.phase) {

      case 'idle': {
        const hasSpike = delta > IDLE_THRESHOLD;

        // RC1.7: Monitorização de Ready-Pose (Estabilidade + Orientação)
        // No supino, o telemóvel está horizontal. X e Z devem ser baixos.
        const lateralDev = Math.max(Math.abs(sample.x), Math.abs(sample.z));
        const isStable   = delta < 1.0; // Movimento quase nulo
        const isCorrectOrientation = lateralDev < READY_ORIENTATION_LIMIT;

        if (isStable && isCorrectOrientation) {
          if (this.readyPoseStartTime === 0) this.readyPoseStartTime = now;
          if (now - this.readyPoseStartTime > READY_POSE_STABILITY_MS) {
            this.isArmed = true;
            this.rejectionReason = '—';
          }
        } else {
          this.readyPoseStartTime = 0;
          // RC1.8.1: NUNCA resetar a flag isArmed por simples oscilações menores.
          // Se o utilizador já armou o motor para a atividade, não perde o arming.
          if (!isCorrectOrientation) {
             this.rejectionReason = 'not_ready_pose';
             this.isArmed = false; // Só reseta se cometer falha lateral severa (ex: levantar-se)
          } else if (!isStable && !this.isArmed) {
             this.rejectionReason = 'wait_stability';
          }
        }

        // EMA Baseline
        if (Number.isNaN(this.idleBaselineY)) {
          this.idleBaselineY = sample.y;
        } else {
          this.idleBaselineY = this.idleBaselineY * 0.98 + sample.y * 0.02;
        }

        // Deteção de Movimento
        const diffFromRest = Math.abs(this.smoothY - this.idleBaselineY);
        if (diffFromRest > 0.8) {
          this.directionCount++;
        } else {
          this.directionCount = 0;
        }
        
        const hasSustainedDirection = this.directionCount >= COHERENT_ENTRY_SAMPLES;
        const idleReady = phaseDuration > (hasSpike ? 150 : IDLE_REARM_MS);

        if ((hasSpike || hasSustainedDirection) && idleReady) {
          if (!this.isArmed) {
             // Tenta entrar mas não está armado (ex: agitação repentina)
             this.rejectionReason = 'not_armed_setup';
             this.reset();
             break;
          }
          newPhase = 'eccen';
          this.directionCount = 0;
          this.directionSign  = 0;
          this.maxDirectionRun = 0;
          this.smoothYMin = this.smoothY;
          this.smoothYMax = this.smoothY;
          this.peakDelta  = delta;
        }
        break;
      }

      case 'eccen': {
        // RC1.7: Rejeição por Postura Global
        const lateralDev = Math.max(Math.abs(sample.x), Math.abs(sample.z));
        if (lateralDev > POSTURE_SHIFT_LIMIT) {
          this.rejectionReason = 'global_posture_shift';
          this.reset();
          break;
        }

        this.peakDelta  = Math.max(this.peakDelta, delta);
        this.smoothYMin = Math.min(this.smoothYMin, this.smoothY);
        this.smoothYMax = Math.max(this.smoothYMax, this.smoothY);

        // Inversão de Y (de negativo → positivo) = braço chegou ao fundo
        if (this.smoothY > BOTTOM_ENTRY_Y && phaseDuration > MIN_PHASE_DURATION_MS) {
          newPhase = 'bottom';
        }
        if (phaseDuration > MAX_PHASE_DURATION_MS) { this.reset(); }
        break;
      }

      case 'bottom': {
        this.smoothYMin = Math.min(this.smoothYMin, this.smoothY);
        this.smoothYMax = Math.max(this.smoothYMax, this.smoothY);

        // Validar que houve arco real até aqui (por range de Y ou spike)
        const smoothYRange = this.smoothYMax - this.smoothYMin;
        const hasRealArc   = smoothYRange >= MIN_SMOOTH_Y_RANGE || this.peakDelta >= PHASE_ENTRY_THRESHOLD;

        if (hasRealArc && phaseDuration > MIN_PHASE_DURATION_MS) {
          // Qualquer spike leve OU movimento Y de retorno = início da subida
          if (delta > PHASE_ENTRY_THRESHOLD || (this.smoothY - this.smoothYMin) > 0.4) {
            newPhase = 'concen';
          }
        }
        if (phaseDuration > MAX_PHASE_DURATION_MS) { this.reset(); }
        break;
      }

      case 'concen': {
        // RC1.7: Posture rejection na subida
        const lateralDev = Math.max(Math.abs(sample.x), Math.abs(sample.z));
        if (lateralDev > POSTURE_SHIFT_LIMIT) {
          this.rejectionReason = 'global_posture_shift';
          this.reset();
          break;
        }

        this.smoothYMax = Math.max(this.smoothYMax, this.smoothY);

        // Y volta a descer abaixo de limiar = chegou ao topo/lockout
        if (this.smoothY < -CONCEN_TOP_Y && phaseDuration > MIN_PHASE_DURATION_MS) {
          newPhase = 'top';
        }
        if (phaseDuration > MAX_PHASE_DURATION_MS) { this.reset(); }
        break;
      }

      case 'top': {
        if (phaseDuration > MIN_PHASE_DURATION_MS) {
          // Amplitude = máximo entre as duas métricas
          const smoothYRange = this.smoothYMax - this.smoothYMin;
          const amp          = Math.max(this.peakDelta, smoothYRange);

          if (amp >= MIN_ACCEPTED_AMPLITUDE) {
            // RC1.8: Rejeição estrita por caos/chatter
            const lNoise = lateralNoise(this.phaseBuffer);
            if (this.maxDirectionRun < 8 || lNoise > 0.35) {
              this.rejectionReason = lNoise > 0.35 ? 'chaotic_shake' : 'phase_chatter_shake';
              this.reset();
              break;
            }

            // Rep física real aceite
            const samples   = [...this.phaseBuffer];
            const timings   = { ...this.phaseTimings };
            
            // RC1.6: ANTI-CAOS LATCH
            // Força o sistema a voltar a IDLE após aceitar a repetição. 
            // Uma série de oscilações rápidas (abanões) não consegue ciclar
            // eccen->bottom->concen->top instantaneamente sem passar por IDLE
            // e cumprir obrigatoriamente os IDLE_REARM_MS (400ms) de cooldown.
            const nextPhase: RepPhase = 'idle';
            repCompleted = true;

            // RC1.5/RC1.6: reset COMPLETO de todo o estado transitório
            this.smoothY        = 0;
            this.idleBaselineY  = NaN;
            this.directionCount = 0;
            this.directionSign  = 0;
            this.maxDirectionRun = 0;
            this.peakDelta      = 0;
            this.smoothYMin     =  Infinity;
            this.smoothYMax     = -Infinity;
            this.phaseTimings   = {};
            this.phaseStartTime = now;
            this.phase          = nextPhase;
            this.phaseBuffer    = [];

            return {
              newPhase: nextPhase,
              phaseTimings: timings,
              amplitudeDelta: amp,
              repCompleted,
              phaseSamples: samples,
              rejectionReason: this.rejectionReason
            };
          } else {
            // Arco insuficiente — reset silencioso
            this.reset();
          }
        }
        if (phaseDuration > MAX_PHASE_DURATION_MS) { this.reset(); }
        break;
      }
    }

    if (newPhase !== null && newPhase !== this.phase) {
      this.phaseTimings[this.phase] = phaseDuration;
      this.phaseStartTime = now;
      this.phase          = newPhase;
      this.phaseBuffer    = []; // Clear buffer for new phase
    }

    return {
      newPhase: this.phase,
      phaseTimings: this.phaseTimings,
      amplitudeDelta: Math.max(this.peakDelta, this.smoothYMax - this.smoothYMin),
      repCompleted,
      phaseSamples: this.phaseBuffer,
      rejectionReason: this.rejectionReason,
    };
  }

  getCurrentPhase(): RepPhase {
    return this.phase;
  }

  getCurrentPhaseDuration(now: number): number {
    if (this.phaseStartTime === 0) return 0;
    return now - this.phaseStartTime;
  }
}

// ---------------------------------------------------------------------------
// EXECUTION QUALITY SCORER
// ---------------------------------------------------------------------------

export class ExecutionQualityScorer {
  private referenceROM: number | null = null;
  private repHistory: number[] = [];

  calibrateIfValid(amplitudeDelta: number): boolean {
    if (this.referenceROM === null && amplitudeDelta > MIN_ACCEPTED_AMPLITUDE) {
      this.referenceROM = amplitudeDelta;
      return true;
    }
    return false;
  }

  getReferenceROM(): number | null {
    return this.referenceROM;
  }

  scoreRep(
    phaseTimings: Partial<Record<RepPhase, number>>,
    amplitudeDelta: number,
    phaseSamples: RawSample[]
  ): RepResult {
    let baseScore = 0.50;
    let visualCap = 1.0;

    // ── 1. COMPLETUDE DE FASES ─────────────────────────────────────────────
    const hasEccen  = 'eccen'  in phaseTimings;
    const hasBottom = 'bottom' in phaseTimings;
    const hasConcen = 'concen' in phaseTimings;
    const phasesComplete = hasEccen && hasBottom && hasConcen;

    if (!phasesComplete) {
      baseScore -= 0.15;
      visualCap = Math.min(visualCap, CAP_INCOMPLETE_PHASES);
    } else {
      baseScore += 0.18;
    }

    // ── 2. CADÊNCIA POR FASE (ANTI-CAOS AGRESSIVO) ──────────────────────
    const eccenMs  = phaseTimings['eccen']  ?? 0;
    const concenMs = phaseTimings['concen'] ?? 0;
    
    // RC1.8.1: Se for incrivelmente rápido (< 180ms por fase), é vibração/caos impossível de ser humano. Zero.
    if (eccenMs < 180 && concenMs < 180) {
       return { executionQualityScore: 0, phaseTimings, amplitudeRatio: 0, cadenceOk: false, noiseLevel: 1, completed: false };
    }

    const eccenOk  = eccenMs  >= CADENCE_MIN_MS && eccenMs  <= CADENCE_MAX_MS;
    const concenOk = concenMs >= CADENCE_MIN_MS && concenMs <= CADENCE_MAX_MS;
    const cadenceOk = eccenOk && concenOk;

    if (!cadenceOk) {
      if (eccenMs < CADENCE_MIN_MS / 1.5 || concenMs < CADENCE_MIN_MS / 1.5) {
        baseScore -= 0.25;
        visualCap = Math.min(visualCap, CAP_CHAOTIC_CADENCE);
      } else {
        baseScore -= 0.10;
      }
    } else {
      baseScore += 0.12;
    }

    // ── 3. AMPLITUDE ──────────────────────────────────────────────────────
    let amplitudeRatio = 1.0;
    if (this.referenceROM !== null && this.referenceROM > 0) {
      amplitudeRatio = Math.min(1.0, amplitudeDelta / this.referenceROM);
      if (amplitudeRatio < 0.60) {
        baseScore -= 0.20;
        visualCap = Math.min(visualCap, CAP_INSUFFICIENT_AMP);
      } else if (amplitudeRatio >= 0.90) {
        baseScore += 0.12;
      }
    }

    // ── 4. RUÍDO LATERAL ──────────────────────────────────────────────────
    const noiseLevel = lateralNoise(phaseSamples);
    if (noiseLevel > NOISE_HIGH_THRESHOLD) {
      baseScore -= 0.15;
    } else if (noiseLevel < NOISE_MEDIUM_THRESHOLD) {
      baseScore += 0.08;
    }

    const rawScore   = Math.max(0, Math.min(1, baseScore));
    const finalScore = Math.max(0, Math.min(rawScore, visualCap));

    this.repHistory.push(finalScore);
    if (this.repHistory.length > 10) this.repHistory.shift();

    return {
      executionQualityScore: finalScore,
      phaseTimings,
      amplitudeRatio,
      cadenceOk,
      noiseLevel,
      completed: phasesComplete
    };
  }

  getAverageScore(): number {
    if (this.repHistory.length === 0) return 0;
    return this.repHistory.reduce((a, b) => a + b, 0) / this.repHistory.length;
  }
}

// ---------------------------------------------------------------------------
// VISUAL GAUGE MAPPER
// ---------------------------------------------------------------------------

export class VisualGaugeMapper {
  private smoothedGauge = 0;
  private readonly alpha = 0.10;

  compute(
    qualityScore: number,
    rawMotionNorm: number,
    currentPhase: RepPhase,
    repProgress: number
  ): number {
    const qualityComponent = qualityScore * WEIGHT_QUALITY;
    const rawCapped    = Math.min(rawMotionNorm, 0.25);
    const rawComponent = rawCapped * WEIGHT_RAW;

    let target = (qualityComponent + rawComponent) * 100;

    if (currentPhase !== 'idle') {
      const phaseBoost = repProgress * 12;
      target = Math.min(100, target + phaseBoost);
    } else {
      target = target * 0.25; // descida rápida em idle
    }

    this.smoothedGauge = this.smoothedGauge * (1 - this.alpha) + target * this.alpha;
    return Math.max(0, Math.min(100, this.smoothedGauge));
  }

  reset() {
    this.smoothedGauge = 0;
  }
}

// ---------------------------------------------------------------------------
// QUALITY ENGINE (ponto de entrada principal)
// ---------------------------------------------------------------------------

export class RepQualityEngine {
  private phaseDetector = new RepPhaseDetector();
  private scorer        = new ExecutionQualityScorer();
  private gaugeMapper   = new VisualGaugeMapper();

  private state: QualityEngineState = {
    currentPhase: 'idle',
    repProgress: 0,
    visualGaugeProgress: 0,
    executionQualityScore: 0,
    liveAmplitude: 0,
    repCount: 0,
    celebrationTrigger: false,
    referenceROM: null,
    lastRepResult: null,
    rejectionReason: '—',
  };

  private celebrationTs    = 0;
  private lastQualityScore = 0;
  private phaseProgressMap: Record<RepPhase, number> = {
    idle: 0, eccen: 0.15, bottom: 0.50, concen: 0.70, top: 0.95
  };

  processSample(sample: RawSample): QualityEngineState {
    const result = this.phaseDetector.processSample(sample);

    if (result !== null) {
      const { newPhase, phaseTimings, amplitudeDelta, repCompleted, phaseSamples, rejectionReason } = result;
      this.state.currentPhase = newPhase;
      this.state.rejectionReason = rejectionReason;
      this.state.liveAmplitude = amplitudeDelta;

      if (repCompleted) {
        this.scorer.calibrateIfValid(amplitudeDelta);

        const repResult = this.scorer.scoreRep(phaseTimings, amplitudeDelta, phaseSamples);
        this.state.lastRepResult = repResult;
        this.state.executionQualityScore = repResult.executionQualityScore;
        this.state.referenceROM = this.scorer.getReferenceROM();

        // ── NOISE GATE: só conta se há movimento físico real suficiente ──
        const isRealMovement    = amplitudeDelta >= MIN_ACCEPTED_AMPLITUDE;
        const passesQualityGate = repResult.executionQualityScore >= MIN_QUALITY_FOR_COUNT;

        if (isRealMovement && passesQualityGate) {
          this.lastQualityScore = repResult.executionQualityScore;

          // RC1.8: Repitação imediatamente aceite após validação do ciclo
          this.state.repCount += 1;

          if (repResult.executionQualityScore >= CELEBRATION_THRESHOLD) {
            this.state.celebrationTrigger = true;
            this.celebrationTs = sample.timestamp;
          }
        } else {
          // Expor motivo de rejeição por ciclo inútil
          if (!isRealMovement) this.state.rejectionReason = 'amplitude_too_low';
          else if (!passesQualityGate) this.state.rejectionReason = 'low_quality_execution';
        }
      }
    }

    if (this.state.celebrationTrigger && sample.timestamp - this.celebrationTs > 1800) {
      this.state.celebrationTrigger = false;
    }

    const phaseBase        = this.phaseProgressMap[this.state.currentPhase] ?? 0;
    const phaseDuration    = this.phaseDetector.getCurrentPhaseDuration(sample.timestamp);
    const phaseProgressBump = Math.min(0.2, phaseDuration / 3000 * 0.2);
    this.state.repProgress = Math.min(1, phaseBase + phaseProgressBump);

    const mag     = magnitude(sample.x, sample.y, sample.z);
    const rawNorm = Math.min(1, Math.abs(mag - GRAVITY) / 12);

    this.state.visualGaugeProgress = this.gaugeMapper.compute(
      this.lastQualityScore,
      rawNorm,
      this.state.currentPhase,
      this.state.repProgress
    );

    return { ...this.state };
  }

  reset() {
    this.phaseDetector.reset();
    this.gaugeMapper.reset();
    this.lastQualityScore = 0;
    this.state = {
      currentPhase: 'idle',
      repProgress: 0,
      visualGaugeProgress: 0,
      executionQualityScore: 0,
      liveAmplitude: 0,
      repCount: 0,
      celebrationTrigger: false,
      referenceROM: null,
      lastRepResult: null,
      rejectionReason: '—',
    };
  }
}
