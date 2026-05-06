export type PorsukPose =
  | 'idle'
  | 'walking'
  | 'running'
  | 'sitting'
  | 'sit'
  | 'sitting-relaxed'
  | 'lying'
  | 'sleeping'
  | 'curled-sleeping'
  | 'grooming-face'
  | 'grooming-side'
  | 'stretching'
  | 'yawning'
  | 'drinking'
  | 'eating'
  | 'begging'
  | 'playing'
  | 'happy-dance'
  | 'celebrating'
  | 'sad'
  | 'worried'
  | 'surprised'
  | 'reacting'
  | 'waving';

export interface PoseConfig {
  legsAnimated: boolean;
  bodyBob: boolean;
  breathe: boolean;
}

export const POSE_CONFIGS: Record<string, PoseConfig> = {
  walking:         { legsAnimated: true,  bodyBob: true,  breathe: false },
  running:         { legsAnimated: true,  bodyBob: true,  breathe: false },
  sitting:         { legsAnimated: false, bodyBob: false, breathe: true  },
  sit:             { legsAnimated: false, bodyBob: false, breathe: true  },
  sleeping:        { legsAnimated: false, bodyBob: false, breathe: true  },
  celebrating:     { legsAnimated: false, bodyBob: true,  breathe: false },
  waving:          { legsAnimated: false, bodyBob: false, breathe: true  },
  sad:             { legsAnimated: false, bodyBob: false, breathe: true  },
  worried:         { legsAnimated: false, bodyBob: false, breathe: true  },
  surprised:       { legsAnimated: false, bodyBob: false, breathe: false },
  reacting:        { legsAnimated: false, bodyBob: false, breathe: false },
  idle:            { legsAnimated: false, bodyBob: false, breathe: true  },
};

export function getPoseConfig(pose: PorsukPose): PoseConfig {
  return POSE_CONFIGS[pose] ?? POSE_CONFIGS.idle;
}
