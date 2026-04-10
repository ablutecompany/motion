/**
 * repQualityEngine.ts
 *
 * Motor central de qualidade de execução do conta-movimento.
 * Garante que apenas movimento físico real e plausível conta como repetição.
 *
 * REGRA CENTRAL: acceptedRep = movimento físico real + amplitude suficiente + qualidade mínima
 *
 * Pipeline:
 *   rawMotion  →  RepPhaseDetector  →  ExecutionQualityScorer  →  VisualGaugeMapper
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
  repCount: number;            // APENAS reps com movimento físico real validado
  celebrationTrigger: boolean;
  referenceROM: number | null; // calibrado na 1ª rep válida
  lastRepResult: RepResult | null;
}

// ---------------------------------------------------------------------------
// CONSTANTES E THRESHOLDS
// ---------------------------------------------------------------------------

const GRAVITY = 9.81;

// Limiar mínimo para sair de idle — elevado para evitar ruído de sensor.
// 2.8 m/s² ≈ 28% de 1G extra: exige movimento intencional, não vibração ou mesa.
const IDLE_THRESHOLD = 2.8;

// Limiar de mudança de fase — mais exigente.
const PHASE_CHANGE_THRESHOLD = 1.5;

// Amplitude mínima para que uma rep seja aceite.
// Menos de 2.5 m/s² de pico = não foi movimento real de exercício.
const MIN_ACCEPTED_AMPLITUDE = 2.5;

// Score mínimo de qualidade para contabilizar a rep (noise gate).
// Impede que ruído aleatório passe por "repetição".
const MIN_QUALITY_FOR_COUNT = 0.15;

// Duração mínima de uma fase para ser válida (ms)
const MIN_PHASE_DURATION_MS = 350;

// Duração máxima de uma fase — após este tempo, RESET para idle (não avança rep)
const MAX_PHASE_DURATION_MS = 7000;

// Cadência ótima por fase (ms): entre 700ms e 3000ms
const CADENCE_MIN_MS = 700;
const CADENCE_MAX_MS = 3000;

// Limiar de ruído lateral (std dev de X/Z normalizado)
const NOISE_HIGH_THRESHOLD = 0.35;
const NOISE_MEDIUM_THRESHOLD = 0.15;

// Score mínimo para microcelebração
const CELEBRATION_THRESHOLD = 0.88;

// Pesos do VisualGaugeMapper
const WEIGHT_QUALITY = 0.82;
const WEIGHT_RAW     = 0.18;

// Cap visual por condição degradada
const CAP_CHAOTIC_CADENCE  = 0.50;
const CAP_INSUFFICIENT_AMP = 0.45;
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
// REP PHASE DETECTOR
// ---------------------------------------------------------------------------

/**
 * Máquina de estados para deteção de fases de repetição.
 * Optimizado para supino reto (eixo Y = vertical quando tlm no braço).
 *
 * REGRA DE SEGURANÇA:
 * - Nenhuma fase avança automaticamente por tempo (sem timer-based transitions)
 * - Timeouts resetam para idle, NUNCA avançam a rep
 * - Uma rep só é concluída se houver amplitude física suficiente
 */
export class RepPhaseDetector {
  private phase: RepPhase = 'idle';
  private phaseStartTime = 0;
  private phaseBuffer: RawSample[] = [];
  private phaseTimings: Partial<Record<RepPhase, number>> = {};

  // Histórico de aceleração vertical suavizado (alpha baixo = mais lento, mais estável)
  private smoothY = 0;
  private readonly alpha = 0.15;

  // Amplitude real detetada na fase excêntrica
  private peakDelta = 0;
  private sessionStarted = false;

  reset() {
    this.phase = 'idle';
    this.phaseStartTime = 0;
    this.phaseBuffer = [];
    this.phaseTimings = {};
    this.peakDelta = 0;
  }

  processSample(sample: RawSample): {
    newPhase: RepPhase;
    phaseTimings: Partial<Record<RepPhase, number>>;
    amplitudeDelta: number;
    repCompleted: boolean;
    phaseSamples: RawSample[];
  } | null {
    const mag = magnitude(sample.x, sample.y, sample.z);
    const delta = Math.abs(mag - GRAVITY);
    this.smoothY = this.smoothY * (1 - this.alpha) + sample.y * this.alpha;

    this.phaseBuffer.push(sample);
    if (this.phaseBuffer.length > 80) this.phaseBuffer.shift();

    const now = sample.timestamp;
    if (this.phaseStartTime === 0) this.phaseStartTime = now;
    const phaseDuration = now - this.phaseStartTime;

    let newPhase: RepPhase | null = null;
    let repCompleted = false;

    switch (this.phase) {
      case 'idle': {
        // Exige delta ELEVADO para sair de idle — ruído e vibração de mesa não ativam
        if (delta > IDLE_THRESHOLD && phaseDuration > 150) {
          // Determinar direção: Y negativo = descida (eccen), Y positivo = subida (concen)
          newPhase = this.smoothY < -1.0 ? 'eccen' : 'concen';
        }
        break;
      }

      case 'eccen': {
        // Manter registo de pico de amplitude
        this.peakDelta = Math.max(this.peakDelta, delta);

        // Inversão de Y (de negativo para positivo) = chegou ao fundo
        if (this.smoothY > 0.8 && phaseDuration > MIN_PHASE_DURATION_MS) {
          newPhase = 'bottom';
        }

        // TIMEOUT: não avança rep, reseta para idle
        if (phaseDuration > MAX_PHASE_DURATION_MS) {
          this.reset();
        }
        break;
      }

      case 'bottom': {
        // Fundo: aguarda movimento para subir
        // EXIGE delta > PHASE_CHANGE_THRESHOLD — não avança por timer
        if (delta > PHASE_CHANGE_THRESHOLD && phaseDuration > MIN_PHASE_DURATION_MS) {
          // Só avança se há amplitude real acumulada
          if (this.peakDelta >= MIN_ACCEPTED_AMPLITUDE * 0.7) {
            newPhase = 'concen';
          }
        }

        // TIMEOUT: reseta para idle, NÃO completa rep
        if (phaseDuration > MAX_PHASE_DURATION_MS) {
          this.reset();
        }
        break;
      }

      case 'concen': {
        // Fase concêntrica: Y volta a descer = chegou ao topo
        if (this.smoothY < -0.8 && phaseDuration > MIN_PHASE_DURATION_MS) {
          newPhase = 'top';
        }

        // TIMEOUT: reseta para idle
        if (phaseDuration > MAX_PHASE_DURATION_MS) {
          this.reset();
        }
        break;
      }

      case 'top': {
        // Topo/lockout: validar se houve movimento real suficiente
        if (phaseDuration > MIN_PHASE_DURATION_MS) {
          const amp = this.peakDelta;

          if (amp >= MIN_ACCEPTED_AMPLITUDE) {
            // Rep física real aceite — retornar resultado
            const samples = [...this.phaseBuffer];
            const timings = { ...this.phaseTimings };

            const nextPhase: RepPhase = delta < IDLE_THRESHOLD ? 'idle' : 'eccen';
            repCompleted = true;

            this.peakDelta = 0;
            this.phaseTimings = {};
            this.phaseStartTime = now;
            this.phase = nextPhase;
            this.phaseBuffer = [];

            return {
              newPhase: nextPhase,
              phaseTimings: timings,
              amplitudeDelta: amp,
              repCompleted,
              phaseSamples: samples
            };
          } else {
            // Amplitude insuficiente para ser rep real — reset silencioso
            this.reset();
          }
        }

        // TIMEOUT: reseta
        if (phaseDuration > MAX_PHASE_DURATION_MS) {
          this.reset();
        }
        break;
      }
    }

    if (newPhase !== null && newPhase !== this.phase) {
      this.phaseTimings[this.phase] = phaseDuration;
      const prevSamples = [...this.phaseBuffer];
      this.phaseBuffer = [];

      this.phase = newPhase;
      this.phaseStartTime = now;

      return {
        newPhase,
        phaseTimings: { ...this.phaseTimings },
        amplitudeDelta: this.peakDelta,
        repCompleted: false,
        phaseSamples: prevSamples
      };
    }

    return null;
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

    // ── 2. CADÊNCIA POR FASE ───────────────────────────────────────────────
    const eccenMs  = phaseTimings['eccen']  ?? 0;
    const concenMs = phaseTimings['concen'] ?? 0;
    const eccenOk  = eccenMs  >= CADENCE_MIN_MS && eccenMs  <= CADENCE_MAX_MS;
    const concenOk = concenMs >= CADENCE_MIN_MS && concenMs <= CADENCE_MAX_MS;
    const cadenceOk = eccenOk && concenOk;

    if (!cadenceOk) {
      if (eccenMs < CADENCE_MIN_MS / 2 || concenMs < CADENCE_MIN_MS / 2) {
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
    repCount: 0,
    celebrationTrigger: false,
    referenceROM: null,
    lastRepResult: null,
  };

  private celebrationTs   = 0;
  private lastQualityScore = 0;
  private phaseProgressMap: Record<RepPhase, number> = {
    idle: 0, eccen: 0.15, bottom: 0.50, concen: 0.70, top: 0.95
  };

  processSample(sample: RawSample): QualityEngineState {
    const result = this.phaseDetector.processSample(sample);

    if (result !== null) {
      const { newPhase, phaseTimings, amplitudeDelta, repCompleted, phaseSamples } = result;
      this.state.currentPhase = newPhase;

      if (repCompleted) {
        this.scorer.calibrateIfValid(amplitudeDelta);

        const repResult = this.scorer.scoreRep(phaseTimings, amplitudeDelta, phaseSamples);
        this.state.lastRepResult = repResult;
        this.state.executionQualityScore = repResult.executionQualityScore;
        this.state.referenceROM = this.scorer.getReferenceROM();

        // ── NOISE GATE: só conta se há movimento físico real suficiente ──
        // amplitude física mínima E qualidade acima do limiar de ruído
        const isRealMovement = amplitudeDelta >= MIN_ACCEPTED_AMPLITUDE;
        const passesQualityGate = repResult.executionQualityScore >= MIN_QUALITY_FOR_COUNT;

        if (isRealMovement && passesQualityGate) {
          this.lastQualityScore = repResult.executionQualityScore;
          this.state.repCount += 1;

          if (repResult.executionQualityScore >= CELEBRATION_THRESHOLD) {
            this.state.celebrationTrigger = true;
            this.celebrationTs = sample.timestamp;
          }
        }
        // Movimento insuficiente ou ruído: repCount NÃO incrementa, gauge não celebra
      }
    }

    if (this.state.celebrationTrigger && sample.timestamp - this.celebrationTs > 1800) {
      this.state.celebrationTrigger = false;
    }

    const phaseBase = this.phaseProgressMap[this.state.currentPhase] ?? 0;
    const phaseDuration = this.phaseDetector.getCurrentPhaseDuration(sample.timestamp);
    const phaseProgressBump = Math.min(0.2, phaseDuration / 3000 * 0.2);
    this.state.repProgress = Math.min(1, phaseBase + phaseProgressBump);

    const mag    = magnitude(sample.x, sample.y, sample.z);
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
      repCount: 0,
      celebrationTrigger: false,
      referenceROM: null,
      lastRepResult: null,
    };
  }
}
