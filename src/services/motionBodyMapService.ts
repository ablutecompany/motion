import { BodyMapModel } from '../contracts/metricsModels';

/**
 * Tabela Estática de Mapeamento: Evita adivinhar músculos.
 * Associa "Tipos de Workout" validados à Taxonomia do Sistema.
 */
const SYSTEM_MAPPING: Record<string, { id: string; label: string; intensityMap: 'low'|'medium'|'high' }> = {
  strength: { id: 'sys-musc', label: 'Carga Muscular e Força', intensityMap: 'high' },
  cardio: { id: 'sys-cardio', label: 'Foco Cardiovascular', intensityMap: 'high' },
  mobility: { id: 'sys-art', label: 'Mobilidade e Controlo', intensityMap: 'low' },
  mixed: { id: 'sys-int', label: 'Sistema Dinâmico Integrado', intensityMap: 'medium' }
};

export const generateBodyMap = (typeCounts: Record<string, number>): BodyMapModel | null => {
  let dominantType = 'unknown';
  let maxCount = 0;
  
  const zones: BodyMapModel['zones'] = [];

  Object.entries(typeCounts).forEach(([type, count]) => {
    if (type !== 'unknown' && SYSTEM_MAPPING[type]) {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
      zones.push({
        zoneId: SYSTEM_MAPPING[type].id,
        label: SYSTEM_MAPPING[type].label,
        intensityLevel: SYSTEM_MAPPING[type].intensityMap,
        volume: count
      } as any);
    }
  });

  if (zones.length === 0) return null; // Triggers Empty State premium na UI

  return {
    zones,
    dominantSystemLabel: SYSTEM_MAPPING[dominantType]?.label || 'Esforço Multissistémico'
  };
};
