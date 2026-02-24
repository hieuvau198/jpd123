export const TOWER_HP_MAX = 5;
export const TOWER_SIZE = 80;
export const TOWER_X = 50;

export const FRAME_COUNT = 10;
export const ANIMATION_SPEED = 4;

export const getFrames = (skinNum) => Array.from({ length: FRAME_COUNT }, (_, i) => {
  const num = (i + 1).toString().padStart(4, '0');
  return `/game_objects/zombies/skin_${skinNum}/Run_Body_270_${num}.png`;
});

export const ZOMBIE_FRAMES = {
  1: getFrames(1),
  2: getFrames(2),
  3: getFrames(3)
};

export const DIFFICULTIES = {
  Noob:     { label: 'Noob',     color: 'default', p1: 0.8, p2: 0.2, p3: 0.0 },
  Beginner: { label: 'Beginner', color: 'primary', p1: 0.6, p2: 0.4, p3: 0.0 },
  Master:   { label: 'Master',   color: 'primary', danger: true, p1: 0.5, p2: 0.4, p3: 0.1 },
  Hell:     { label: 'Hell',     color: 'dashed',  danger: true, p1: 0.2, p2: 0.6, p3: 0.2 },
  Legend:   { label: 'Legend',   color: 'primary', danger: true, p1: 0.0, p2: 0.5, p3: 0.5 }
};

export const SKIN_PROPS = {
  1: { hp: 1, size: 180,  speedMod: 1.0 },
  2: { hp: 2, size: 240, speedMod: 0.8 },
  3: { hp: 3, size: 300, speedMod: 0.6 }
};

export const BACKGROUND_IMAGES = [
  'https://i.postimg.cc/ncJKQkSz/Snowy-Top-Down-2D-Game-Tileset3.webp',
  'https://i.postimg.cc/wx5b17x0/background_grass_field_2b.png',
  'https://i.postimg.cc/t70Q5cfP/background_grass_field.png',
  'https://i.postimg.cc/Kj4kh1JW/background_snow_field.png'
];