// Ingredients and recipes for Sizzle & Serve.
// Every ingredient knows where it is prepared: the grill, the fryer, the
// chopping board, or straight onto the plate. A recipe is a multiset of
// ingredient ids; the plate matches an order when it holds exactly that
// multiset, in any order.

export const INGREDIENTS = {
  bun:     { id: 'bun',     name: 'Bun',     station: 'plate',  color: '#e8b06a', dark: '#b97f3e', key: '1' },
  patty:   { id: 'patty',   name: 'Patty',   station: 'grill',  color: '#7a4a2b', dark: '#54301a', key: '2' },
  lettuce: { id: 'lettuce', name: 'Lettuce', station: 'board',  color: '#7dc242', dark: '#4d8a26', key: '3' },
  tomato:  { id: 'tomato',  name: 'Tomato',  station: 'board',  color: '#e8442e', dark: '#a82615', key: '4' },
  cheese:  { id: 'cheese',  name: 'Cheese',  station: 'board',  color: '#ffc93c', dark: '#d99a12', key: '5' },
  fries:   { id: 'fries',   name: 'Fries',   station: 'fryer',  color: '#ffd94d', dark: '#d9a400', key: '6' },
};

// Preparation times in seconds. A cooked item left too long after it is
// ready burns and must be thrown away.
export const PREP_TIME = { grill: 4.0, fryer: 5.0, board: 2.5 };
export const BURN_AFTER = { grill: 6.0, fryer: 6.0, board: 9.0 };

export const RECIPES = [
  {
    id: 'classic',
    name: 'Classic Burger',
    items: ['bun', 'patty', 'lettuce'],
    reward: 12,
    minLevel: 1,
    blurb: 'The house favourite.',
  },
  {
    id: 'melt',
    name: 'Cheese Melt',
    items: ['bun', 'patty', 'cheese', 'tomato'],
    reward: 18,
    minLevel: 1,
    blurb: 'Gooey, red and proud.',
  },
  {
    id: 'garden',
    name: 'Garden Stack',
    items: ['bun', 'lettuce', 'tomato', 'cheese'],
    reward: 14,
    minLevel: 1,
    blurb: 'No grill, all crunch.',
  },
  {
    id: 'loaded',
    name: 'Loaded Fries',
    items: ['fries', 'cheese', 'tomato'],
    reward: 15,
    minLevel: 2,
    blurb: 'A basket that fights back.',
  },
  {
    id: 'double',
    name: 'Double Trouble',
    items: ['bun', 'patty', 'patty', 'cheese'],
    reward: 24,
    minLevel: 3,
    blurb: 'Two patties. One brave cook.',
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

// Recipes available at a given level (difficulty ramp).
export function availableRecipes(level) {
  return RECIPES.filter((r) => r.minLevel <= level);
}

// True when the plate's ingredients are exactly the recipe's, any order.
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.items.length) return false;
  const have = [...plate].sort().join(',');
  const want = [...recipe.items].sort().join(',');
  return have === want;
}
