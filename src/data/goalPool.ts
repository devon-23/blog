// Pool of candidate monthly goals that `scripts/new-month.mjs` draws from at
// random. This is a starter set — edit this array freely any time to add,
// tweak, or remove ideas (removing here just means it won't be drawn again,
// it doesn't touch any month that already drew it, since drawn goals live in
// their own committed src/content/goals/YYYY-MM.md file).
export const GOAL_POOL: string[] = [
  // Reading
  'Finish a book',
  'Start a book you\'ve been putting off',
  'Read a book outside your usual genre',
  'Reread an old favorite',
  'Read one article a day for the whole month',

  // Cooking / baking
  'Bake a cake from scratch',
  'Try a new recipe you\'ve never made before',
  'Cook a dish from a cuisine you rarely eat',
  'Make bread from scratch',
  'Recreate a restaurant dish at home',

  // Fitness / movement
  'Go for a run 8 times this month',
  'Try a new workout class',
  'Go on a long hike',
  'Stretch every morning for a week straight',
  'Learn a new sport basic',

  // Creative
  'Finish a drawing or painting',
  'Write a short story',
  'Learn a new song on an instrument',
  'Take one photo a day for a week',
  'Start a new creative project',

  // Social
  'Write a letter to a friend',
  'Host a dinner for friends',
  'Call someone you haven\'t talked to in a while',
  'Plan a hangout with an old friend',

  // Travel prep / exploration
  'Plan the next trip in detail',
  'Explore a neighborhood you\'ve never been to',
  'Try a new coffee shop',
  'Go on a day trip somewhere new',
  'Visit a museum or gallery',

  // Home
  'Deep clean one room',
  'Declutter a closet or drawer',
  'Finally hang that thing on the wall',
  'Organize digital photos from the last few months',

  // Learning
  'Learn 10 new words in another language',
  'Watch a documentary on something new',
  'Take an online class on a topic of interest',
  'Learn a new recipe technique',

  // Misc / life admin
  'Update the budget/finances',
  'Do a full digital declutter (files, inbox, photos)',
  'Try meditating for a week straight',
  'Go a full week without a takeout order',
  'Watch a classic film you\'ve never seen',
];
