// Every tunable number of Prism Breaker in one place: the field, the paddle,
// the ball, the scoring and the ten sectors (levels). Levels are patterns of
// characters, one row per string, ten columns wide:
//   '.' empty   '1'..'3' a brick with that many hits   'S' unbreakable steel
//   'B' bomb brick (bursts its neighbours)   'D' drifting brick (slides sideways)
//   'C' the sector core (many hits, slides sideways, only in sector 10)
export const FIELD = {
  width: 960,
  height: 640,
  top: 96,
  brickCols: 10,
  brickWidth: 84,
  brickHeight: 26,
  brickGap: 6,
};

export const PADDLE = {
  y: 600,
  height: 14,
  width: 112,
  wideWidth: 168,
  speed: 640,
  corner: 7,
};

export const BALL = {
  radius: 7,
  baseSpeed: 430,
  speedPerLevel: 14,
  maxSpeed: 640,
  serveOffset: -26,
};

export const RULES = {
  startLives: 3,
  maxBalls: 6,
  powerupDropChance: 0.2,
  powerupFallSpeed: 150,
  comboWindow: 2.5,
  comboStep: 0.1,
  comboMax: 3.0,
  brickScore: 50,
  levelClearBonus: 500,
  lifeBonus: 250,
  laserCooldown: 0.28,
  boltSpeed: 760,
  wideSeconds: 12,
  laserSeconds: 9,
  slowSeconds: 8,
  stickySeconds: 10,
  fireSeconds: 8,
};

export const SCREEN = {
  TITLE: 'title',
  SERVE: 'serve',
  PLAY: 'play',
  PAUSED: 'paused',
  LEVEL_CLEAR: 'levelclear',
  GAME_OVER: 'gameover',
  VICTORY: 'victory',
};

export const POWERUP_TYPES = ['W', 'M', 'L', 'S', 'G', 'F', '+'];
export const POWERUP_NAMES = {
  W: 'WIDE PADDLE',
  M: 'MULTI BALL',
  L: 'LASER CANNONS',
  S: 'SLOW BALL',
  G: 'STICKY PADDLE',
  F: 'FIREBALL',
  '+': 'EXTRA LIFE',
};
export const POWERUP_COLORS = {
  W: '#38e1ff',
  M: '#ff9f1c',
  L: '#ff3d71',
  S: '#7CFC98',
  G: '#c77dff',
  F: '#ff5d3b',
  '+': '#ffe14d',
};
export const POWERUP_WEIGHTS = { W: 3, M: 3, L: 2, S: 2, G: 2, F: 2, '+': 1 };

/** Neon palette per sector: [brick1, brick2, brick3, steel, bomb, drift, core]. */
export const SECTOR_COLORS = [
  ['#2ee6a8', '#38bdf8', '#a78bfa', '#8b98a9', '#ff5d5d', '#ffd166', '#ffffff'],
  ['#38bdf8', '#818cf8', '#f472b6', '#8b98a9', '#ff5d5d', '#ffd166', '#ffffff'],
  ['#f472b6', '#fb7185', '#fbbf24', '#8b98a9', '#ff5d5d', '#7CFC98', '#ffffff'],
  ['#fbbf24', '#fb923c', '#f472b6', '#8b98a9', '#ff5d5d', '#38e1ff', '#ffffff'],
  ['#a3e635', '#2ee6a8', '#38bdf8', '#8b98a9', '#ff5d5d', '#ffd166', '#ffffff'],
  ['#818cf8', '#c084fc', '#f472b6', '#8b98a9', '#ff5d5d', '#7CFC98', '#ffffff'],
  ['#38e1ff', '#2ee6a8', '#fbbf24', '#8b98a9', '#ff5d5d', '#ffd166', '#ffffff'],
  ['#fb7185', '#f472b6', '#818cf8', '#8b98a9', '#ff5d5d', '#38e1ff', '#ffffff'],
  ['#fbbf24', '#a3e635', '#38e1ff', '#8b98a9', '#ff5d5d', '#7CFC98', '#ffffff'],
  ['#ffffff', '#ffd166', '#ff5d3b', '#8b98a9', '#ff5d5d', '#38e1ff', '#ffe14d'],
];

export const SECTOR_NAMES = [
  'FIRST LIGHT',
  'TIDE POOL',
  'ROSE QUARTZ',
  'EMBER ROW',
  'VERDANT GRID',
  'VIOLET STORM',
  'CYAN DEEP',
  'CRIMSON MAZE',
  'GOLDEN HOUR',
  'THE PRISM CORE',
];

/** Ten hand-designed sector layouts. Each row is ten characters wide. */
export const LEVELS = [
  [
    '..........',
    '.11111111.',
    '.11111111.',
    '..222222..',
    '...1111...',
    '..........',
  ],
  [
    '1.1.11.1.1',
    '.11111111.',
    '11.1111.11',
    '.12222221.',
    '..111111..',
    '..........',
  ],
  [
    '...1..1...',
    '..111111..',
    '.11122111.',
    '1112B2111.',
    '.11122111.',
    '..111111..',
  ],
  [
    'S.111111.S',
    '.12222221.',
    '1123333211',
    '.12222221.',
    '..111111..',
    '..........',
  ],
  [
    '1D111111D1',
    '.11111111.',
    '11.2..2.11',
    '.11222211.',
    '..1.11.1..',
    '....11....',
  ],
  [
    '.33333333.',
    '3222222223',
    '3211111123',
    '32.1BB1.23',
    '3211111123',
    '.33333333.',
  ],
  [
    '1..1..1..1',
    '.11.11.11.',
    '1111111111',
    '1S111111S1',
    '.11.11.11.',
    '1..1..1..1',
  ],
  [
    '..D....D..',
    '.11111111.',
    '1122222211',
    '1233333321',
    '1122222211',
    '.11111111.',
  ],
  [
    'B.111111.B',
    '.12121212.',
    '1123232321',
    '.12121212.',
    '1123232321',
    '.12121212.',
  ],
  [
    'S........S',
    '.33333333.',
    '.3D2222D3.',
    '..3C33C3..',
    '.3D2222D3.',
    '.33333333.',
  ],
];
