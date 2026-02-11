export type ExerciseType = 'walking' | 'stretching' | 'running';

export interface ExerciseRecord {
  exerciseId: string;
  userId: string;
  exerciseType: ExerciseType;
  recordDate: string;
  duration: number;
  distance?: number;
  steps?: number;
  notes?: string;
  createdAt: string;
}
