// src/components/reading/sections/index.js
import SentenceOrderingSection from './SentenceOrderingSection';
import ReadingComprehensionSection from './ReadingComprehensionSection';
import ClozeTestSection from './ClozeTestSection';

export const SECTION_REGISTRY = {
  'sentence-ordering': {
    name: 'Sắp xếp câu',
    component: SentenceOrderingSection,
    calculateScore: SentenceOrderingSection.calculateScore,
  },
  'reading-comprehension': {
    name: 'Đọc hiểu',
    component: ReadingComprehensionSection,
    calculateScore: ReadingComprehensionSection.calculateScore,
  },
  'cloze-test': {
    name: 'Điền từ',
    component: ClozeTestSection,
    calculateScore: ClozeTestSection.calculateScore,
  },
};

export const getSectionHandler = (type) => SECTION_REGISTRY[type] || null;