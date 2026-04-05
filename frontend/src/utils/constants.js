export const API_URLS = {
  disease:          'https://service-torch.onrender.com/disease/predict',
  fertilizer:       'https://service-tf.onrender.com/fertilizer/predict',
  fertilizerOptions:'https://service-tf.onrender.com/fertilizer/options',
  soil:             'https://service-tf.onrender.com/fertilizer/predict-soil',
  yield:            'https://service-tf.onrender.com/yield/predict',
  weather:          'https://service-tf.onrender.com/weather/advisory',
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
