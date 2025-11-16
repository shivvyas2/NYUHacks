export const PLAYER_STATES = {
  IDLE: 'IDLE',
  WALK: 'WALK',
  RUN: 'RUN',
  DANCE: 'DANCE',
  DEAD: 'DEAD',
} as const;

export const DOLL_STATES = {
  GREEN_LIGHT: 'GREEN_LIGHT',
  RED_LIGHT: 'RED_LIGHT',
  ELIMINATE_ALL: 'ELIMINATE_ALL',
} as const;

export type PlayerState = typeof PLAYER_STATES[keyof typeof PLAYER_STATES];
export type DollState = typeof DOLL_STATES[keyof typeof DOLL_STATES];

