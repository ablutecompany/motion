/**
 * repQualityEngine.ts
 *
 * Motor central de qualidade de execução do conta-movimento.
 * Transforma rawMotion (acelerómetro bruto) em visualGaugeProgress
 * que reflete qualidade técnica da repetição, não velocidade isolada.
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
  repProgress: number;        // 0..1 — progresso dentro da rep
  visualGaugeProgress: number; // 0..100 — controla anel
  executionQualityScore: number; // 0..1 — score técnico
  repCount: number;
  celebrationTrigger: boolean;
  referenceROM: number | null; // calibrado na 1ª rep válida
  lastRepResult: RepResult | null;
}

// ---------------------------------------------------------------------------
// CONSTANTES E THRESHOLDS
// ---------------------------------------------------------------------------

const GRAVITY = 9.81;

// Limiar mínimo de movimento para sair de idle (m/s² delta acima da gravidade)
const IDLE_THRESHOLD = 1.2;

// Limiar para detetar fundo/topo (inversão de aceleração vertical)
const PHASE_CHANGE_THRESHOLD = 0.8;

// Duração mínima de uma fase para ser válida (ms)
const MIN_PHASE_DURATION_MS = 250;

// Duração máxima de uma fase antes de ser considerada "caótica" (ms)
const MAX_PHASE_DURATION_MS = 6000;

// Cadência ótima por fase (ms): entre 800ms e 2500ms
const CADENCE_MIN_MS = 800;
const CADENCE_MAX_MS = 2500;

// Limiar de ruído lateral (std dev de X/Z normalizado)
const NOISE_HIGH_THRESHOLD = 0.35;
const NOISE_MEDIUM_THRESHOLD = 0.15;

// Score mínimo para celebração
const CELEBRATION_THRESHOLD = 0.88;

// Pesos do VisualGaugeMapper
const WEIGHT_QUALITY = 0.82;
const WEIGHT_RAW = 0.18;

// Cap visual por condição degradada
const CAP_CHAOTIC_CADENCE = 0.50;   // cadência demasiado rápida
const CAP_INSUFFICIENT_AMP = 0.45;  // amplitude insuficiente
const CAP_INCOMPLETE_PHASES = 0.35; // fases saltadas

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
  // Normalizado 0..1 contra um máximo de 3 m/s²
  return Math.min(1, Math.sqrt(varX + varZ) / 3);
}

// ---------------------------------------------------------------------------
// REP PHASE DETECTOR
// ---------------------------------------------------------------------------

/**
 * Máquina de estados para deteção de fases de repetição.
 * Optimizado para supino reto (eixo Y = vertical quando tlm no braço).
 * Funciona de forma tolerante - não exige sequência perfeita.
 */
export class RepPhaseDetector {
  private phase: RepPhase = 'idle';
  private phaseStartTime = 0;
  private phaseBuffer: RawSample[] = [];
  private phaseTimings: Partial<Record<RepPhase, number>> = {};

  // Histórico de aceleração vertical suavizado
  private smoothY = 0;
  private readonly alpha = 0.2;

  // Amplitude máxima detetada na fase excêntrica
  private peakDelta = 0;
  private minDelta = Infinity;

  reset() {
    this.phase = 'idle';
    this.phaseStartTime = 0;
    this.phaseBuffer = [];
    this.phaseTimings = {};
    this.peakDelta = 0;
    this.minDelta = Infinity;
  }

  /**
   * Processa uma nova amostra do acelerómetro.
   * Retorna null se a fase não mudou, ou {newPhase, timings, amplitude} se mudou.
   */
  processSample(sample: RawSample): {
    newPhase: RepPhase;
    phaseTimings: Partial<Record<RepPhase, number>>;
    amplitudeDelta: number;
    repCompleted: boolean;
    phaseSamples: RawSample[];
  } | null {
    // Suavizar eixo Y (aceleração vertical)
    const mag = magnitude(sample.x, sample.y, sample.z);
    const delta = Math.abs(mag - GRAVITY);
    this.smoothY = this.smoothY * (1 - this.alpha) + sample.y * this.alpha;

    this.phaseBuffer.push(sample);
    // Manter buffer limitado
    if (this.phaseBuffer.length > 60) this.phaseBuffer.shift();

    const now = sample.timestamp;
    const phaseDuration = now - this.phaseStartTime;

    let newPhase: RepPhase | null = null;
    let repCompleted = false;

    switch (this.phase) {
      case 'idle': {
        // Movimento suficiente para arrancar
        if (delta > IDLE_THRESHOLD && phaseDuration > 100) {
          newPhase = this.smoothY < -0.5 ? 'eccen' : 'concen';
        }
        break;
      }
      case 'eccen': {
        // Procurar inversão: Y começa a subir (chegou ao fundo)
        if (this.smoothY > 0.4 && phaseDuration > MIN_PHASE_DURATION_MS) {
          this.peakDelta = Math.max(this.peakDelta, delta);
          newPhase = 'bottom';
        }
        // Timeout: fase demasiado longa = reset
        if (phaseDuration > MAX_PHASE_DURATION_MS) {
          this.reset();
        }
        break;
      }
      case 'bottom': {
        // Pausa < 1.5s e depois entra em concêntrica
        if (delta > PHASE_CHANGE_THRESHOLD && phaseDuration > 150) {
          newPhase = 'concen';
        }
        if (phaseDuration > 1500) {
          newPhase = 'concen'; // força saída do fundo
        }
        break;
      }
      case 'concen': {
        // Y desce de novo → chegou ao topo
        if (this.smoothY < -0.2 && phaseDuration > MIN_PHASE_DURATION_MS) {
          this.minDelta = Math.min(this.minDelta, delta);
          newPhase = 'top';
        }
        if (phaseDuration > MAX_PHASE_DURATION_MS) {
          this.reset();
        }
        break;
      }
      case 'top': {
        // Pausa breve e volta ao idle ou eccen (rep seguinte)
        if (phaseDuration > 300) {
          const samples = [...this.phaseBuffer];
          const timings = { ...this.phaseTimings };
          const amp = this.peakDelta;

          if (delta < IDLE_THRESHOLD) {
            newPhase = 'idle';
          } else {
            newPhase = 'eccen';
          }
          repCompleted = true;

          // Reset para próxima rep
          this.peakDelta = 0;
          this.minDelta = Infinity;

          this.phaseTimings = {};
          this.phaseStartTime = now;
          this.phase = newPhase;
          this.phaseBuffer = [];

          return { newPhase, phaseTimings: timings, amplitudeDelta: amp, repCompleted, phaseSamples: samples };
        }
        break;
      }
    }

    if (newPhase !== null && newPhase !== this.phase) {
      this.phaseTimings[this.phase] = phaseDuration;
      const prevSamples = [...this.phaseBuffer];
      this.phaseBuffer = [];
      const prevPhase = this.phase;

      this.phase = newPhase;
      this.phaseStartTime = now;

      return {
        newPhase,
        phaseTimings: { ...this.phaseTimings },
        amplitudeDelta: this.peakDelta,
        repCompleted,
        phaseSamples: prevSamples
      };
    }

    return null;
  }

  getCurrentPhase(): RepPhase {
    return this.phase;
  }

  getCurrentPhaseDuration(now: number): number {
    return now - this.phaseStartTime;
  }
}

// ---------------------------------------------------------------------------
// EXECUTION QUALITY SCORER
// ---------------------------------------------------------------------------

/**
 * Pontuador de qualidade técnica da repetição.
 * Transforma dados das fases num score 0..1 com penalidades.
 */
export class ExecutionQualityScorer {
  private referenceROM: number | null = null;
  private repHistory: number[] = [];

  calibrateIfValid(amplitudeDelta: number): boolean {
    // Só calibra se a primeira rep tiver amplitude mínima plausível (> 2 m/s²)
    if (this.referenceROM === null && amplitudeDelta > 2.0) {
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
    let baseScore = 0.55; // score base neutral
    const penalties: string[] = [];
    let visualCap = 1.0;

    // ── 1. COMPLETUDE DE FASES ─────────────────────────────────────────────
    const hasEccen  = 'eccen'  in phaseTimings;
    const hasBottom = 'bottom' in phaseTimings;
    const hasConcen = 'concen' in phaseTimings;
    const hasTop    = 'top'    in phaseTimings;

    const phasesComplete = hasEccen && hasBottom && hasConcen;
    if (!phasesComplete) {
      baseScore -= 0.20;
      visualCap = Math.min(visualCap, CAP_INCOMPLETE_PHASES);
      penalties.push('incomplete_phases');
    } else {
      baseScore += 0.15; // bonus por fases completas
    }

    // ── 2. CADÊNCIA POR FASE ───────────────────────────────────────────────
    const eccenMs  = phaseTimings['eccen']  ?? 0;
    const concenMs = phaseTimings['concen'] ?? 0;

    const eccenOk  = eccenMs  >= CADENCE_MIN_MS && eccenMs  <= CADENCE_MAX_MS;
    const concenOk = concenMs >= CADENCE_MIN_MS && concenMs <= CADENCE_MAX_MS;
    const cadenceOk = eccenOk && concenOk;

    if (!cadenceOk) {
      if (eccenMs < CADENCE_MIN_MS / 2 || concenMs < CADENCE_MIN_MS / 2) {
        // Demasiado rápido = caótico
        baseScore -= 0.25;
        visualCap = Math.min(visualCap, CAP_CHAOTIC_CADENCE);
        penalties.push('cadence_chaotic');
      } else {
        baseScore -= 0.10;
        penalties.push('cadence_suboptimal');
      }
    } else {
      baseScore += 0.10; // bonus cadência
    }

    // ── 3. AMPLITUDE ──────────────────────────────────────────────────────
    let amplitudeRatio = 1.0;
    if (this.referenceROM !== null && this.referenceROM > 0) {
      amplitudeRatio = Math.min(1.0, amplitudeDelta / this.referenceROM);
      if (amplitudeRatio < 0.60) {
        baseScore -= 0.20;
        visualCap = Math.min(visualCap, CAP_INSUFFICIENT_AMP);
        penalties.push('insufficient_amplitude');
      } else if (amplitudeRatio >= 0.90) {
        baseScore += 0.12; // boa amplitude
      }
    }

    // ── 4. RUÍDO LATERAL (ESTABILIDADE) ───────────────────────────────────
    const noiseLevel = lateralNoise(phaseSamples);
    if (noiseLevel > NOISE_HIGH_THRESHOLD) {
      baseScore -= 0.15;
      penalties.push('high_noise');
    } else if (noiseLevel < NOISE_MEDIUM_THRESHOLD) {
      baseScore += 0.08; // bonus estabilidade
    }

    // ── FINAL SCORE ────────────────────────────────────────────────────────
    const rawScore = Math.max(0, Math.min(1, baseScore));
    const cappedScore = Math.min(rawScore, visualCap);
    const finalScore = Math.max(0, Math.min(1, cappedScore));

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

  /** Score médio das últimas reps (suavizado) */
  getAverageScore(): number {
    if (this.repHistory.length === 0) return 0;
    return this.repHistory.reduce((a, b) => a + b, 0) / this.repHistory.length;
  }
}

// ---------------------------------------------------------------------------
// VISUAL GAUGE MAPPER
// ---------------------------------------------------------------------------

/**
 * Converte executionQualityScore + rawMotion em visualGaugeProgress (0..100).
 * O score de qualidade tem peso dominante (82%). O rawMotion contribui ligeiramente (18%).
 * Agitação isolada não pode levar ao máximo.
 */
export class VisualGaugeMapper {
  private smoothedGauge = 0;
  private readonly alpha = 0.10; // suavização da gauge

  /**
   * @param qualityScore     0..1 (do ExecutionQualityScorer)
   * @param rawMotionNorm    0..1 (magnitude acelerómetro normalizada)
   * @param currentPhase     fase atual (influencia progresso visual)
   * @param repProgress      0..1 progresso dentro da rep
   */
  compute(
    qualityScore: number,
    rawMotionNorm: number,
    currentPhase: RepPhase,
    repProgress: number
  ): number {
    // Componente de qualidade (dominante)
    const qualityComponent = qualityScore * WEIGHT_QUALITY;

    // Componente de atividade bruta (minoritária) — para dar feedback imediato
    // Cap máximo: rawMotion sozinho nunca passa de 30%
    const rawCapped = Math.min(rawMotionNorm, 0.30);
    const rawComponent = rawCapped * WEIGHT_RAW;

    // Base gauge: mistura ponderada
    let target = (qualityComponent + rawComponent) * 100;

    // Boost de fase ativa (feedback imediato durante movimento)
    if (currentPhase !== 'idle') {
      // Anima suavemente de acordo com o progresso dentro da rep
      const phaseBoost = repProgress * 15; // máximo +15 pontos durante a rep
      target = Math.min(100, target + phaseBoost);
    } else {
      // Em idle, desce suavemente
      target = target * 0.3;
    }

    // Low-pass filter para fluidez
    this.smoothedGauge = this.smoothedGauge * (1 - this.alpha) + target * this.alpha;
    return Math.max(0, Math.min(100, this.smoothedGauge));
  }

  reset() {
    this.smoothedGauge = 0;
  }
}

// ---------------------------------------------------------------------------
// QUALITY ENGINE STATE MACHINE (ponto de entrada principal)
// ---------------------------------------------------------------------------

/**
 * Motor principal. Instanciado como singleton no facade.
 * Recebe amostras brutas e emite QualityEngineState a cada tick.
 */
export class RepQualityEngine {
  private phaseDetector = new RepPhaseDetector();
  private scorer = new ExecutionQualityScorer();
  private gaugeMapper = new VisualGaugeMapper();

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

  private celebrationTs = 0;
  private lastQualityScore = 0;
  private phaseProgressMap: Record<RepPhase, number> = {
    idle: 0, eccen: 0.15, bottom: 0.5, concen: 0.70, top: 0.95
  };

  processSample(sample: RawSample): QualityEngineState {
    const result = this.phaseDetector.processSample(sample);

    if (result !== null) {
      const { newPhase, phaseTimings, amplitudeDelta, repCompleted, phaseSamples } = result;
      this.state.currentPhase = newPhase;

      if (repCompleted) {
        // Tentar calibrar referência ROM
        this.scorer.calibrateIfValid(amplitudeDelta);

        // Pontuar a repetição
        const repResult = this.scorer.scoreRep(phaseTimings, amplitudeDelta, phaseSamples);
        this.lastQualityScore = repResult.executionQualityScore;
        this.state.lastRepResult = repResult;
        this.state.repCount += 1;
        this.state.executionQualityScore = repResult.executionQualityScore;
        this.state.referenceROM = this.scorer.getReferenceROM();

        // Microcelebração
        if (repResult.executionQualityScore >= CELEBRATION_THRESHOLD) {
          this.state.celebrationTrigger = true;
          this.celebrationTs = sample.timestamp;
        }
      }
    }

    // Desativar celebração após 1.8s
    if (this.state.celebrationTrigger && sample.timestamp - this.celebrationTs > 1800) {
      this.state.celebrationTrigger = false;
    }

    // Calcular repProgress (0..1) com base na fase
    const phaseBase = this.phaseProgressMap[this.state.currentPhase] ?? 0;
    const phaseDuration = this.phaseDetector.getCurrentPhaseDuration(sample.timestamp);
    const phaseProgressBump = Math.min(0.2, phaseDuration / 3000 * 0.2);
    this.state.repProgress = Math.min(1, phaseBase + phaseProgressBump);

    // Calcular rawMotion normalizado (0..1)
    const mag = magnitude(sample.x, sample.y, sample.z);
    const rawNorm = Math.min(1, Math.abs(mag - GRAVITY) / 12);

    // Computar gauge visual
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
