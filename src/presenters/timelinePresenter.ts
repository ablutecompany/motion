import { ConfirmedWorkoutRecord } from '../contracts/types';

export interface MotionTimelineItem {
  record: ConfirmedWorkoutRecord;
  displayTime: string;
  sourceLabel: string;
  primarySummary: string;
  secondarySummary: string | null;
  hasWellnessImpact: boolean;
  hasWellnessFeedback: boolean;
  isEnriched: boolean;
}

export interface MotionTimelineGroup {
  key: string;
  title: string;
  items: MotionTimelineItem[];
}

export const generateMotionTimeline = (records: ConfirmedWorkoutRecord[]): MotionTimelineGroup[] => {
  const sorted = [...records].sort((a, b) => new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime());
  
  const groups: Record<string, MotionTimelineGroup> = {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  sorted.forEach(record => {
    const d = new Date(record.confirmedAt);
    let groupKey = 'older';
    let groupTitle = 'Anteriores';

    if (d >= today) {
      groupKey = 'today';
      groupTitle = 'Hoje';
    } else if (d >= yesterday) {
      groupKey = 'yesterday';
      groupTitle = 'Ontem';
    } else if (d >= thisWeek) {
      groupKey = 'thisWeek';
      groupTitle = 'Esta Semana';
    }

    if (!groups[groupKey]) {
      groups[groupKey] = { key: groupKey, title: groupTitle, items: [] };
    }

    const isEnriched = record.enrichmentStatus === 'enriched' || record.enrichmentStatus === 'partial';
    
    // Formatting presentation
    const displayTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sourceLabel = record.source === 'session' ? 'Sessão Orientada' : 'Inferência Passiva';
    
    let primarySummary = record.source === 'session' ? 'Treino Manual' : 'Atividade Detetada';
    if (record.workoutType && record.workoutType !== 'unknown') {
      const wType = record.workoutType === 'strength' ? 'Força' : record.workoutType === 'cardio' ? 'Cardio' : record.workoutType === 'mobility' ? 'Mobilidade' : 'Treino Misto';
      const wInt = record.perceivedIntensity === 'light' ? 'Leve' : record.perceivedIntensity === 'moderate' ? 'Moderação' : record.perceivedIntensity === 'hard' ? 'Forte' : '';
      primarySummary = wInt ? `${wType} · ${wInt}` : wType;
    }

    let secondarySummary = null;
    const parts = [];
    if (record.feltState && record.feltState !== 'unknown') parts.push(`Sensação: ${record.feltState}`);
    if (record.discomfortReported && record.discomfortReported !== 'none') parts.push(`Desconforto: Ligeiro`);
    if (parts.length > 0) secondarySummary = parts.join(' • ');

    groups[groupKey].items.push({
      record,
      displayTime,
      sourceLabel,
      primarySummary,
      secondarySummary,
      hasWellnessImpact: !!record.wellnessImpact,
      hasWellnessFeedback: !!record.wellnessFeedback,
      isEnriched
    });
  });

  return ['today', 'yesterday', 'thisWeek', 'older']
    .filter(k => groups[k])
    .map(k => groups[k]);
};
