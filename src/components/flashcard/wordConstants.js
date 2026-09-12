// RATING SYSTEM CONSTANTS
export const ALL_LEVELS = [
  { min: 0, max: 50, title: 'Danh hiệu Mèo Mập', img: 'https://i.postimg.cc/zfHKSDK4/fat-cat-1.png', color: '#595959' },
  { min: 51, max: 80, title: 'Danh hiệu Cún Con', img: 'https://i.postimg.cc/MHS7Gkcd/wolf-1.jpg', color: '#3c3f42' },
  { min: 81, max: 99, title: 'Danh hiệu Hổ Béo', img: 'https://i.postimg.cc/hPMLK5KM/fat-tiger-1.png', color: '#fa8c16' },
  { min: 100, max: 100, title: 'Danh hiệu Kim Long', img: 'https://i.postimg.cc/zXmzVzGV/dragon-1.jpg', color: '#37eef1' },
];

export const getRatingInfo = (score) => {
  if (score === 100) return ALL_LEVELS[3];
  if (score > 80) return ALL_LEVELS[2];
  if (score > 50) return ALL_LEVELS[1];
  return ALL_LEVELS[0];
};