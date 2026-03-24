// ── Swap these with your real backend URLs ──
export const API_URLS = {
  fertilizer: 'https://YOUR_BACKEND_URL/api/fertilizer/recommend',
  yield:      'https://YOUR_BACKEND_URL/api/yield/predict',
  // Coming soon — not yet wired up:
  disease:    'https://YOUR_BACKEND_URL/api/disease/predict',
  weather:    'https://YOUR_BACKEND_URL/api/weather/advice',
};

export const CROPS_COMMON = [
  'Wheat', 'Rice', 'Maize (Corn)', 'Tomato', 'Potato',
  'Cotton', 'Soybean', 'Sugarcane', 'Chickpea', 'Other',
];

export const CROPS_EXTENDED = [
  'Wheat', 'Rice', 'Maize', 'Tomato', 'Potato',
  'Cotton', 'Soybean', 'Sugarcane', 'Chickpea',
  'Groundnut', 'Mustard', 'Other',
];

export const GROWTH_STAGES = [
  'Seedling', 'Vegetative', 'Flowering',
  'Fruiting / Pod Fill', 'Maturity',
];

export const SOIL_TYPES = [
  'Alluvial', 'Black (Regur)', 'Red Loamy', 'Laterite',
  'Arid / Desert', 'Sandy Loam', 'Clay Loam', 'Silt Loam',
];

export const SOIL_TYPES_SHORT = [
  'Alluvial', 'Black', 'Red Loamy', 'Laterite',
  'Sandy Loam', 'Clay Loam',
];

export const SEASONS = [
  'Kharif (Jun–Nov)', 'Rabi (Oct–Apr)',
  'Zaid (Mar–Jun)', 'Year-round',
];

export const IRRIGATION_SOURCES = [
  'Canal', 'Drip', 'Sprinkler',
  'Borewell / Tubewell', 'Rainfed', 'Tank / Pond',
];
