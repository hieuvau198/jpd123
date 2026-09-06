// src/components/flashcard/typeB/typeBGenerator.js

export const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const generateTypeBQuestions = (
  allCards = [],
  selectedTypes = { words: true, phrases: true, sentences: true }
) => {
  let defs = [];
  let reverseDefs = [];
  let phrases = [];
  let sentences = [];
  let misspells = [];

  allCards.forEach((card, cIdx) => {
    // 1. Words (Definition, Reverse, & Misspell)
    if (selectedTypes.words && card.defs && card.defs.length > 0) {
      const def = card.defs[0];
      defs.push({
        id: `${card.word}_def_${cIdx}`,
        phase: 'Definition',
        displayQuestion: card.word,
        correctAnswer: def.m,
        options: shuffleArray([def.m, ...def.wm.slice(0, 3)]),
        correctAttemptsNeeded: 1,
        qLang: 'en-US',
        aLang: 'vi-VN',
        hint: card.hint || ''
      });

      const otherWords = allCards.filter(c => c.word !== card.word).map(c => c.word);
      const distractors = shuffleArray(otherWords).slice(0, 3);
      reverseDefs.push({
        id: `${card.word}_reverse_${cIdx}`,
        phase: 'Reverse',
        displayQuestion: def.m,
        correctAnswer: card.word,
        options: shuffleArray([card.word, ...distractors]),
        correctAttemptsNeeded: 1,
        qLang: 'vi-VN',
        aLang: 'en-US',
        hint: card.hint || ''
      });

      if (card.misspell && card.misspell.length > 0) {
        misspells.push({
          id: `${card.word}_misspell_${cIdx}`,
          phase: 'Misspell',
          displayQuestion: def.m,
          correctAnswer: card.word,
          options: shuffleArray([card.word, ...card.misspell.slice(0, 3)]),
          correctAttemptsNeeded: 1,
          qLang: 'vi-VN',
          aLang: 'en-US',
          hint: card.hint || ''
        });
      }
    }

    // 2. Phrases
    if (selectedTypes.phrases && card.phrases && card.phrases.length > 0) {
      const p = shuffleArray(card.phrases)[0];
      phrases.push({
        id: `${card.word}_phrase_${cIdx}`,
        phase: 'Phrase',
        displayQuestion: p.text,
        correctAnswer: p.m,
        options: shuffleArray([p.m, ...p.wm.slice(0, 3)]),
        correctAttemptsNeeded: 1,
        qLang: 'en-US',
        aLang: 'vi-VN',
        hint: p.hint || card.hint || ''
      });
    }

    // 3. Sentences
    if (selectedTypes.sentences && card.sentences && card.sentences.length > 0) {
      const s = shuffleArray(card.sentences)[0];
      sentences.push({
        id: `${card.word}_sentence_${cIdx}`,
        phase: 'Sentence',
        displayQuestion: s.text,
        correctAnswer: s.m,
        options: shuffleArray([s.m, ...s.wm.slice(0, 3)]),
        correctAttemptsNeeded: 1,
        qLang: 'en-US',
        aLang: 'vi-VN',
        hint: s.hint || card.hint || ''
      });
    }
  });

  return [
    ...shuffleArray(defs),
    ...shuffleArray(reverseDefs),
    ...shuffleArray(phrases),
    ...shuffleArray(sentences),
    ...shuffleArray(misspells)
  ];
};