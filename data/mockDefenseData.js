export const defenseLevels = [
  {
    id: 'lvl1',
    title: 'Zombie Outbreak (Basic)',
    description: 'Defend the tower against the first wave of grammar zombies.',
    difficulty: 'Easy',
    enemyCount: 10,
    spawnRate: 3000, // ms
    questions: [
      { id: 1, question: "___ you happy today?", options: ["Are", "Is", "Am", "Be"], answer: "Are" },
      { id: 2, question: "She ___ to school every day.", options: ["go", "going", "goes", "gone"], answer: "goes" },
      { id: 3, question: "They ___ playing football now.", options: ["is", "are", "am", "be"], answer: "are" },
      { id: 4, question: "I ___ a student.", options: ["is", "are", "am", "be"], answer: "am" },
      { id: 5, question: "We ___ not hungry.", options: ["is", "are", "am", "do"], answer: "are" },
      { id: 6, question: "He ___ like pizza.", options: ["don't", "doesn't", "isn't", "aren't"], answer: "doesn't" },
      { id: 7, question: "___ she your sister?", options: ["Are", "Is", "Am", "Do"], answer: "Is" },
      { id: 8, question: "What ___ you doing?", options: ["is", "are", "do", "does"], answer: "are" },
      { id: 9, question: "The cat ___ black.", options: ["are", "is", "am", "have"], answer: "is" },
      { id: 10, question: "___ they from England?", options: ["Is", "Am", "Are", "Do"], answer: "Are" },
      { id: 11, question: "I ___ got a car.", options: ["has", "have", "having", "had"], answer: "have" },
      { id: 12, question: "She ___ eating an apple.", options: ["is", "are", "am", "does"], answer: "is" }
    ]
  },
  {
    id: 'lvl2',
    title: 'Grammar Siege (Hard)',
    description: 'Faster enemies and harder questions.',
    difficulty: 'Hard',
    enemyCount: 15,
    spawnRate: 2000,
    questions: [
      { id: 1, question: "If I ___ you, I would study harder.", options: ["was", "were", "am", "be"], answer: "were" },
      { id: 2, question: "She has ___ living here for 2 years.", options: ["been", "being", "be", "is"], answer: "been" },
      { id: 3, question: "I look forward to ___ you.", options: ["see", "seeing", "saw", "seen"], answer: "seeing" },
      { id: 4, question: "By this time tomorrow, I ___ arrived.", options: ["will", "will have", "would", "had"], answer: "will have" },
      { id: 5, question: "She asked me where ___.", options: ["was I", "I was", "am I", "I am"], answer: "I was" },
      // Add more as needed to ensure enough ammo
    ]
  }
];