const FURNITURE_SUGGESTIONS = {
  sofa: ['sofa set', 'sofa bed', 'corner sofa', 'leather sofa', 'fabric sofa'],
  couch: ['sofa', 'sectional sofa', 'loveseat', 'recliner'],
  chair: ['dining chair', 'office chair', 'accent chair', 'armchair', 'recliner chair'],
  table: ['dining table', 'coffee table', 'side table', 'console table', 'center table'],

  bed: ['king size bed', 'queen bed', 'single bed', 'double bed', 'bed with storage'],
  mattress: ['memory foam mattress', 'spring mattress', 'orthopedic mattress'],
  wardrobe: ['wardrobe with mirror', '3 door wardrobe', 'sliding wardrobe'],
  dresser: ['chest of drawers', 'dressing table', 'bedside table'],

  dining: ['dining table', 'dining set', 'dining chair', '6 seater dining'],
  kitchen: ['kitchen cabinet', 'kitchen island', 'bar stool', 'kitchen table'],

  desk: ['study table', 'office desk', 'computer table', 'writing desk'],
  office: ['office chair', 'office table', 'filing cabinet', 'office furniture'],

  cabinet: ['kitchen cabinet', 'storage cabinet', 'display cabinet', 'tv cabinet'],
  shelf: ['bookshelf', 'wall shelf', 'display shelf', 'storage shelf'],
  drawer: ['chest of drawers', 'bedside table', 'storage drawer'],

  wood: ['wooden furniture', 'teak wood', 'sheesham wood', 'oak wood'],
  metal: ['metal furniture', 'steel furniture', 'iron furniture'],
  leather: ['leather sofa', 'leather chair', 'leather furniture'],
  fabric: ['fabric sofa', 'fabric chair', 'upholstered furniture'],

  modern: ['modern furniture', 'contemporary furniture', 'minimalist furniture'],
  classic: ['classic furniture', 'traditional furniture', 'vintage furniture'],
  luxury: ['luxury furniture', 'premium furniture', 'designer furniture'],

  soffa: ['sofa', 'sofa set'],
  chai: ['chair', 'dining chair'],
  tebal: ['table', 'dining table'],
  bead: ['bed', 'king size bed'],
  draw: ['drawer', 'chest of drawers'],
  cuboard: ['cupboard', 'wardrobe'],
  almari: ['wardrobe', 'almirah'],
  almira: ['wardrobe', 'almirah'],
  diwan: ['divan', 'daybed'],
  centre: ['center table', 'coffee table'],
  dinning: ['dining table', 'dining set'],
  matress: ['mattress', 'memory foam mattress'],
  wadrobe: ['wardrobe', 'wardrobe with mirror'],

  '3 seater': ['3 seater sofa', 'sofa set 3 seater'],
  '2 seater': ['2 seater sofa', 'loveseat'],
  '6 seater': ['6 seater dining table', 'dining set 6 seater'],
  '4 seater': ['4 seater dining table', 'dining set 4 seater'],
  king: ['king size bed', 'king bed'],
  queen: ['queen size bed', 'queen bed'],
  single: ['single bed', 'single seater'],
  double: ['double bed', 'double seater'],

  bedroom: ['bed', 'wardrobe', 'dressing table', 'bedside table'],
  livingroom: ['sofa', 'coffee table', 'tv unit', 'center table'],
  kitchen: ['dining table', 'kitchen cabinet', 'bar stool'],
  bathroom: ['bathroom cabinet', 'mirror cabinet', 'storage cabinet'],
  balcony: ['outdoor furniture', 'garden furniture', 'patio set'],
};

const FALLBACK_SUGGESTIONS = [
  'sofa',
  'bed',
  'dining table',
  'wardrobe',
  'office chair',
  'bookshelf',
];

export const getDidYouMeanSuggestions = (searchQuery) => {
  let suggestions = [];

  if (!searchQuery || typeof searchQuery !== 'string') {
    suggestions = FALLBACK_SUGGESTIONS.slice(0, 3);
    suggestions.isFallback = true;
    return suggestions;
  }

  const query = searchQuery.toLowerCase().trim();

  if (FURNITURE_SUGGESTIONS[query]) {
    suggestions = FURNITURE_SUGGESTIONS[query].slice(0, 3);
    suggestions.isFallback = false;
    return suggestions;
  }

  const partialMatches = [];
  for (const [key, items] of Object.entries(FURNITURE_SUGGESTIONS)) {
    if (key.includes(query) || query.includes(key)) {
      partialMatches.push(...items);
    }
  }

  if (partialMatches.length === 0) {
    for (const [key, items] of Object.entries(FURNITURE_SUGGESTIONS)) {
      if (levenshteinDistance(query, key) <= 2 && key.length > 2) {
        partialMatches.push(...items);
      }
    }
  }

  const unique = [...new Set(partialMatches)].slice(0, 3);

  if (unique.length > 0) {
    unique.isFallback = false;
    return unique;
  } else {
    const fallback = FALLBACK_SUGGESTIONS.slice(0, 3);
    fallback.isFallback = true;
    return fallback;
  }
};

function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j += 1) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator,
      );
    }
  }

  return matrix[str2.length][str1.length];
}

export default FURNITURE_SUGGESTIONS;
