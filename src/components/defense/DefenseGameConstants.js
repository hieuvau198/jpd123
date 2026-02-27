import spaceship1_1 from '../../assets/spaceship/spaceship_270_1.png';
import spaceship1_2 from '../../assets/spaceship/spaceship_270_2.png';

import spaceship2_1 from '../../assets/spaceship/spaceship_270_3.png';
import spaceship2_2 from '../../assets/spaceship/spaceship_270_4.png';

import spaceship3_1 from '../../assets/spaceship/spaceship_270_5.png';

export const TOWER_HP_MAX = 5;
export const TOWER_SIZE = 80;
export const TOWER_X = 50;

// Replaced Zombie Frames with Spaceship Assets
export const SPACESHIP_ASSETS = {
  1: [
    spaceship1_1, 
    spaceship1_2
  ],
  2: [
    spaceship2_1, 
    spaceship2_2
  ],
  3: [
    spaceship3_1
  ]
};

export const DIFFICULTIES = {
  Noob:     { label: 'Noob',     color: 'default', p1: 0.8, p2: 0.2, p3: 0.0 },
  Beginner: { label: 'Beginner', color: 'primary', p1: 0.6, p2: 0.4, p3: 0.0 },
  Master:   { label: 'Master',   color: 'primary', danger: true, p1: 0.5, p2: 0.4, p3: 0.1 },
  Hell:     { label: 'Hell',     color: 'dashed',  danger: true, p1: 0.2, p2: 0.6, p3: 0.2 },
  Legend:   { label: 'Legend',   color: 'primary', danger: true, p1: 0.0, p2: 0.5, p3: 0.5 }
};

export const SKIN_PROPS = {
  1: { hp: 1, size: 150, speedMod: 1.0 },
  2: { hp: 2, size: 200, speedMod: 0.7 },
  3: { hp: 3, size: 250, speedMod: 0.5 }
};

export const BACKGROUND_IMAGES = [
  'https://i.postimg.cc/ncJKQkSz/Snowy-Top-Down-2D-Game-Tileset3.webp',
  'https://i.postimg.cc/wx5b17x0/background_grass_field_2b.png',
  'https://i.postimg.cc/t70Q5cfP/background_grass_field.png',
  'https://i.postimg.cc/Kj4kh1JW/background_snow_field.png'
];