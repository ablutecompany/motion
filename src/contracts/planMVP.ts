export interface ExerciseDef {
  id: string;
  name: string;
  muscleGroup: string;
  family: string;
  modality: 'gym' | 'bodyweight' | 'machine' | 'mixed';
  supportsMotionTracking: boolean;
  defaultTargetReps: number;
  defaultTargetSets: number;
  defaultLoadUnit?: 'kg' | 'lbs' | 'bw';
}

export interface TrainingPlanBlock {
  blockId: string;
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  targetLoad?: number;
  notes?: string;
  order: number;
}

export interface TrainingPlanMVP {
  planId: string;
  name: string;
  description?: string;
  blocks: TrainingPlanBlock[];
}
