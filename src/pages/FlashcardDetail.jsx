import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import FlashcardSession from '../components/flashcard/FlashcardSession';
import { getFlashcardById } from '../firebase/flashcardService';

const FlashcardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag') || null;
  const numbersParam = searchParams.get('numbers');
  const initialNumbers = numbersParam && !isNaN(parseInt(numbersParam, 10))
    ? parseInt(numbersParam, 10)
    : null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getFlashcardById(id);

        if (res && res.type === 'flashcard-b' && Array.isArray(res.words)) {
          const expandedQuestions = [];
          let counter = 1;

          res.words.forEach((item) => {
            // 1. Base word card
            const wordMeaning = Array.isArray(item.defs)
              ? item.defs.map((d) => d.m || d.meaning || d).join(', ')
              : (item.meaning || item.answer || '');

            expandedQuestions.push({
              id: counter++,
              typeBadge: 'Word',
              word: item.word,
              phonetic: item.phonetic || item.ipa || '',
              meaning: wordMeaning,
              speak: item.word
            });

            // 2. Extra phrase cards
            if (Array.isArray(item.phrases)) {
              item.phrases.forEach((phraseObj) => {
                const phraseText = typeof phraseObj === 'string' ? phraseObj : (phraseObj.phrase || phraseObj.text || phraseObj.en);
                const phraseMeaning = typeof phraseObj === 'string' ? '' : (phraseObj.meaning || phraseObj.m || phraseObj.vi || '');
                if (phraseText) {
                  expandedQuestions.push({
                    id: counter++,
                    typeBadge: 'Phrase',
                    word: phraseText,
                    meaning: phraseMeaning,
                    speak: phraseText
                  });
                }
              });
            }

            // 3. Extra sentence cards
            if (Array.isArray(item.sentences)) {
              item.sentences.forEach((sentenceObj) => {
                const sentText = typeof sentenceObj === 'string' ? sentenceObj : (sentenceObj.sentence || sentenceObj.text || sentenceObj.en);
                const sentMeaning = typeof sentenceObj === 'string' ? '' : (sentenceObj.meaning || sentenceObj.m || sentenceObj.vi || '');
                if (sentText) {
                  expandedQuestions.push({
                    id: counter++,
                    typeBadge: 'Sentence',
                    word: sentText,
                    meaning: sentMeaning,
                    speak: sentText
                  });
                }
              });
            }
          });

          res.questions = expandedQuestions;
        } else if (res && (!res.questions || res.questions.length === 0) && Array.isArray(res.words)) {
          // Standard fallback
          res.questions = res.words.map((item, idx) => ({
            id: idx + 1,
            typeBadge: 'Word',
            word: item.word,
            meaning: item.defs ? item.defs.map((d) => d.m).join(', ') : (item.meaning || item.answer || ''),
            speak: item.word
          }));
        }

        setData(res);
      } catch (error) {
        console.error("Error fetching flashcard:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetch();
  }, [id]);

  const handleBackToList = () => {
    navigate(tag ? `/flashcards?tag=${tag}` : '/flashcards');
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!data) return (
    <Result
      status="404"
      title="Flashcard Not Found"
      subTitle="Sorry, the set you visited does not exist."
      extra={<Button type="primary" onClick={handleBackToList}>Back to List</Button>}
    />
  );

  return (
    <FlashcardSession
      data={data}
      onHome={handleBackToList}
      initialNumbers={initialNumbers}
    />
  );
};

export default FlashcardDetail;