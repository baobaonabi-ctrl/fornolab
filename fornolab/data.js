/* FornoLab — catalog, flavor profiles, compatibility rules, recipes.
   Everything is plain editable data. Flavor vectors are ESTIMATED visual scores (0-5),
   in this order: HEAT, SALT, ACIDITY, FAT, UMAMI, AROMA. */
const FL = {};

FL.DIMS = ['HEAT', 'SALT', 'ACIDITY', 'FAT', 'UMAMI', 'AROMA'];
FL.DOUGH = { flavor: [0, 1.5, 0.5, 0.5, 1, 2], tags: ['gluten'], why: 'Wheat dough' };
FL.MAX_LEVEL = 3;
FL.MAX_SAUCES = 2;

FL.STEPS = [
  { id: 'sauce', label: 'Sauce', title: 'Sauce station', hint: 'Pick a squeeze bottle, then drag across the dough to pour.' },
  { id: 'cheese', label: 'Cheese', title: 'Cheese station', hint: 'Drag a pan onto the pizza, or tap it to scatter.' },
  { id: 'protein', label: 'Proteins', title: 'Protein station', hint: 'One main protein — or Beef Bacon / Curry Sausage with Chorizo.' },
  { id: 'vegetable', label: 'Vegetables', title: 'Vegetable station', hint: 'Add as much green, purple and red as you like.' },
  { id: 'garnish', label: 'Finishers', title: 'Garnishes & finishers', hint: 'These land after the oven, light and delicate.' },
  { id: 'bake', label: 'Bake', title: 'Ready for the oven', hint: 'Review your pizza, then fire the oven.' }
];

/* Sauces (visual pours, not toppings). */
FL.SAUCES = [
  { name: 'Cream Sauce', color: '#f2e5c2', dark: '#d8c48e', hi: '#fffbee', flavor: [0, 1, 0, 4, 1, 1], tags: ['dairy'], why: 'Cream-based sauces usually contain dairy' },
  { name: 'Peri Sauce', color: '#d9561f', dark: '#a23a10', hi: '#ff9358', flavor: [3.5, 1.5, 1.5, 1, 1.5, 3], tags: ['spicy', 'nightshade', 'allium'], why: 'Chili-based; may contain garlic' },
  { name: 'Red Pepper Pesto', color: '#b32a20', dark: '#7d1912', hi: '#e8665a', flavor: [1.5, 1.5, 2, 2, 2, 3], tags: ['nightshade', 'treenuts', 'dairy'], why: 'Pesto styles often include nuts and cheese' },
  { name: 'Basil Pesto', color: '#4f8a2b', dark: '#33601a', hi: '#9acb62', flavor: [0, 2, 0.5, 3.5, 2, 4.5], tags: ['treenuts', 'dairy', 'allium'], why: 'Traditional pesto contains nuts, cheese and garlic' },
  { name: 'Tomato Sauce', color: '#c9261b', dark: '#8f150e', hi: '#f06a52', flavor: [0.5, 1, 3.5, 0.5, 2, 2], tags: ['nightshade', 'allium'], why: 'Tomato; may contain garlic or onion' }
];

/* layer: 'cheese' (under toppings), 'pre' (pre-bake toppings), 'post' (after the oven)
   n: pieces for a full-pizza scatter. */
FL.INGREDIENTS = [
  // CHEESES
  { name: 'Shredded Cheese', cat: 'cheese', layer: 'cheese', n: 300, flavor: [0, 2, 0, 3.5, 2, 1], tags: ['dairy'], why: 'Cheese' },
  { name: 'Mozzarella', cat: 'cheese', layer: 'cheese', n: 24, flavor: [0, 1.5, 0.5, 3, 1.5, 1], tags: ['dairy'], why: 'Cheese' },
  { name: 'Blue Cheese', cat: 'cheese', layer: 'cheese', n: 34, flavor: [0.5, 4, 1, 3, 4, 3.5], tags: ['dairy'], why: 'Cheese (mould-ripened)' },
  { name: 'Parmesan', cat: 'cheese', layer: 'cheese', n: 80, flavor: [0, 4, 0.5, 2, 4.5, 2.5], tags: ['dairy'], why: 'Cheese' },
  { name: 'Cream Cheese', cat: 'cheese', layer: 'post', n: 11, flavor: [0, 1, 1, 4, 0.5, 0.5], tags: ['dairy'], why: 'Cheese' },
  // PROTEINS
  { name: 'Marinated Chicken', cat: 'protein', layer: 'pre', n: 20, flavor: [0.5, 2, 0, 1.5, 3, 2.5], tags: ['poultry', 'meat', 'gluten', 'allium'], why: 'Poultry; marinade composition unverified' },
  { name: 'Beef Bacon', cat: 'protein', layer: 'pre', n: 18, flavor: [0.5, 4, 0, 3.5, 4, 3.5], tags: ['beef', 'meat'], why: 'Beef' },
  { name: 'Turkey Bacon', cat: 'protein', layer: 'pre', n: 18, flavor: [0.5, 3.5, 0, 2, 3.5, 3], tags: ['poultry', 'meat'], why: 'Turkey' },
  { name: 'Chorizo', cat: 'protein', layer: 'pre', n: 22, flavor: [3, 3.5, 0.5, 3.5, 3.5, 4], tags: ['pork', 'meat', 'spicy', 'nightshade', 'allium'], why: 'Typically pork, paprika and garlic (unverified)' },
  { name: 'Pastrami', cat: 'protein', layer: 'pre', n: 14, flavor: [1, 4, 0.5, 2.5, 4, 4], tags: ['beef', 'meat', 'allium'], why: 'Cured beef' },
  { name: 'Steak', cat: 'protein', layer: 'pre', n: 18, flavor: [0.5, 2.5, 0, 2.5, 4.5, 3], tags: ['beef', 'meat'], why: 'Beef' },
  { name: 'Fermented Salami', cat: 'protein', layer: 'pre', n: 20, flavor: [1, 4, 1, 3, 4, 3], tags: ['pork', 'meat'], why: 'Typically pork (unverified)' },
  { name: 'Curry Sausage', cat: 'protein', layer: 'pre', n: 18, flavor: [3, 3, 0.5, 3, 3, 4], tags: ['meat', 'unknownMeat', 'spicy', 'gluten', 'allium'], why: 'Meat type and fillers unverified' },
  // VEGETABLES
  { name: 'Mushroom', cat: 'vegetable', layer: 'pre', n: 22, flavor: [0, 0.5, 0, 0.5, 3.5, 2.5], tags: ['mushroom'], why: 'Mushroom' },
  { name: 'Eggplant', cat: 'vegetable', layer: 'pre', n: 16, flavor: [0, 0.5, 0, 1.5, 1.5, 1], tags: ['nightshade'], why: 'Nightshade family' },
  { name: 'Spinach', cat: 'vegetable', layer: 'pre', n: 20, flavor: [0, 0.5, 0.5, 0, 1, 1.5], tags: [], why: '' },
  { name: 'Olive', cat: 'vegetable', layer: 'pre', n: 26, flavor: [0, 4, 1.5, 2, 1.5, 2], tags: [], why: '' },
  { name: 'Onion', cat: 'vegetable', layer: 'pre', n: 26, flavor: [0.5, 0, 1, 0, 1, 3], tags: ['allium'], why: 'Onion' },
  { name: 'Cherry Tomato', cat: 'vegetable', layer: 'pre', n: 16, flavor: [0, 0.5, 3.5, 0, 2.5, 1.5], tags: ['nightshade'], why: 'Nightshade family' },
  { name: 'Garlic Paste', cat: 'vegetable', layer: 'pre', n: 24, flavor: [1, 1, 0, 0.5, 1.5, 5], tags: ['allium'], why: 'Garlic' },
  // GARNISHES & FINISHERS
  { name: 'Radish', cat: 'garnish', layer: 'post', n: 16, flavor: [1.5, 0, 1, 0, 0, 1], tags: [], why: '' },
  { name: 'Microgreens', cat: 'garnish', layer: 'post', n: 22, flavor: [0, 0, 0.5, 0, 0.5, 3], tags: [], why: '' },
  { name: 'Potato Strips', cat: 'garnish', layer: 'post', n: 26, flavor: [0, 2, 0, 2.5, 0.5, 1.5], tags: ['nightshade', 'gluten'], why: 'Potato; coating unverified' },
  { name: 'Green Onion', cat: 'garnish', layer: 'post', n: 50, flavor: [0.5, 0, 0.5, 0, 0.5, 2.5], tags: ['allium'], why: 'Onion family' },
  { name: 'Pistachio Powder', cat: 'garnish', layer: 'post', n: 90, flavor: [0, 0.5, 0, 2, 0.5, 2], tags: ['treenuts'], why: 'Tree nut' },
  { name: 'Walnut', cat: 'garnish', layer: 'post', n: 20, flavor: [0, 0.5, 0, 2.5, 1, 2.5], tags: ['treenuts'], why: 'Tree nut' },
  { name: 'Cajun Sauce', cat: 'garnish', layer: 'post', n: 16, flavor: [3.5, 2.5, 0.5, 1, 1, 3], tags: ['spicy', 'nightshade', 'allium'], why: 'Spice blend; composition unverified' },
  { name: 'Pesto Drizzle', cat: 'garnish', layer: 'post', n: 14, flavor: [0, 1.5, 0.5, 2.5, 1.5, 3.5], tags: ['treenuts', 'dairy', 'allium'], why: 'Pesto styles often include nuts and cheese' },
  { name: 'Basil Pesto Garnish', cat: 'garnish', layer: 'post', n: 16, flavor: [0, 1.5, 0.5, 2, 1.5, 3.5], tags: ['treenuts', 'dairy', 'allium'], why: 'Pesto styles often include nuts and cheese' }
];
FL.CATS = { sauce: 'Sauce', cheese: 'Cheese', protein: 'Protein', vegetable: 'Vegetables', garnish: 'Garnishes' };
FL.ING = Object.fromEntries(FL.INGREDIENTS.map(i => [i.name, i]));
FL.SAUCE = Object.fromEntries(FL.SAUCES.map(s => [s.name, s]));

/* ---- Protein compatibility (reusable logic) ---- */
FL.PROTEIN_PAIRS = [['Beef Bacon', 'Chorizo'], ['Curry Sausage', 'Chorizo']];
FL.proteinSetValid = function (list) {
  const u = [...new Set(list)];
  if (u.length <= 1) return true;
  if (u.length > 2) return false;
  return FL.PROTEIN_PAIRS.some(p => p.includes(u[0]) && p.includes(u[1]));
};
/* Returns null when `adding` fits, otherwise {blocking:[names]} */
FL.proteinConflict = function (current, adding) {
  if (current.includes(adding)) return null;
  if (FL.proteinSetValid([...current, adding])) return null;
  return { blocking: [...current] };
};

/* ---- Recipes ----
   verified:false => composition not confirmed; never fabricated. */
const CH = ['Shredded Cheese', 'Mozzarella'];
FL.RECIPES = [
  { name: 'Pastrami Pizza', official: true, verified: true, sauces: ['Peri Sauce', 'Cream Sauce'], items: [...CH, 'Pastrami', 'Cream Cheese', 'Radish', 'Microgreens'] },
  { name: 'Curry Su', official: true, verified: true, sauces: ['Peri Sauce'], items: [...CH, 'Curry Sausage', 'Chorizo', 'Cajun Sauce', 'Green Onion'] },
  { name: 'Peri Bacon', official: true, verified: true, sauces: ['Peri Sauce'], items: [...CH, 'Beef Bacon', 'Chorizo', 'Cajun Sauce'] },
  { name: 'Bacon Panna', official: true, verified: true, sauces: ['Cream Sauce'], items: [...CH, 'Beef Bacon', 'Mushroom', 'Garlic Paste'] },
  { name: 'Turkey Panna', official: true, verified: true, sauces: ['Cream Sauce'], items: [...CH, 'Blue Cheese', 'Turkey Bacon', 'Basil Pesto Garnish', 'Pistachio Powder', 'Walnut'],
    note: 'The official list names the finisher "Basil Pesto"; it is shown here with the catalog garnish Basil Pesto Garnish.' },
  { name: 'Spinaci Funghi', official: true, verified: true, sauces: ['Cream Sauce'], items: [...CH, 'Blue Cheese', 'Mushroom', 'Spinach', 'Garlic Paste'] },
  { name: 'Chicken Panna', official: true, verified: true, sauces: ['Cream Sauce'], items: [...CH, 'Marinated Chicken', 'Mushroom', 'Garlic Paste', 'Potato Strips'] },
  { name: 'Steak Panna', official: true, verified: true, sauces: ['Cream Sauce'], items: [...CH, 'Steak', 'Garlic Paste'] },
  { name: 'PEP Steak', official: true, verified: true, sauces: ['Red Pepper Pesto'], items: [...CH, 'Steak'] },
  { name: 'PEP Chicken', official: true, verified: true, sauces: ['Red Pepper Pesto'], items: [...CH, 'Marinated Chicken'] },
  { name: 'PEP Bacon', official: true, verified: true, sauces: ['Red Pepper Pesto'], items: [...CH, 'Beef Bacon'] },
  { name: 'Chicken Pesto', official: true, verified: true, sauces: ['Basil Pesto'], items: [...CH, 'Marinated Chicken'] },
  { name: 'Turkey Pesto', official: true, verified: true, sauces: ['Basil Pesto'], items: [...CH, 'Turkey Bacon'] },
  { name: 'Garlic Steak', official: true, verified: false },
  { name: 'Diavola', official: true, verified: false },
  { name: 'Bacon Mushroom', official: true, verified: false },
  { name: 'Verdure', official: true, verified: false },
  { name: 'Eggplant Parmesan', official: true, verified: false },
  { name: 'Steak Pesto', official: false, verified: true, sauces: ['Basil Pesto'], items: [...CH, 'Steak'],
    note: 'Custom variation — not one of the 18 official menu items.' }
];
FL.RECIPES.forEach(r => { if (r.verified) { const p = r.items.filter(i => FL.ING[i].cat === 'protein'); if (!FL.proteinSetValid(p)) throw new Error('Recipe breaks protein rules: ' + r.name); } });

/* ---- Restriction screening options ---- */
FL.RESTRICTIONS = [
  { id: 'dairy', label: 'Dairy' }, { id: 'gluten', label: 'Gluten / wheat' }, { id: 'treenuts', label: 'Tree nuts' },
  { id: 'pork', label: 'Pork' }, { id: 'beef', label: 'Beef' }, { id: 'poultry', label: 'Poultry' }, { id: 'meat', label: 'Any meat' },
  { id: 'mushroom', label: 'Mushrooms' }, { id: 'allium', label: 'Onion & garlic' }, { id: 'spicy', label: 'Spicy heat' }, { id: 'nightshade', label: 'Nightshades' }
];
