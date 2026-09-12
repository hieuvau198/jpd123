// src/components/flashcard/view/FlashcardCard.jsx
import React from 'react';
import { Flex, Button, Typography } from 'antd';
import { Volume2, BookmarkCheck } from 'lucide-react';

const { Title, Text } = Typography;

const FlashcardCard = ({ currentCard, isFlipped, isFlagged, onFlip, onManualSpeech }) => {
  return (
    <div 
      className="select-none mb-8 mt-2 relative w-full cursor-pointer px-2 sm:px-4"
      style={{ minHeight: 390 }}
      onClick={onFlip}
    >
      <div className="w-full h-full min-h-[390px] p-6 sm:p-10 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-950/95 backdrop-blur-xl shadow-2xl flex flex-col justify-between border border-cyan-500/25 relative overflow-hidden rounded-2xl sm:rounded-3xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <Flex justify="space-between" align="center" className="relative z-10 px-2 sm:px-4 mb-4">
          <div>
            {isFlagged && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                <BookmarkCheck size={13} /> Lưu lại
              </span>
            )}
          </div>
          <Button
            type="text"
            shape="circle"
            icon={<Volume2 size={30} className="text-cyan-400 hover:text-cyan-300 hover:scale-110 transition-transform" />}
            onClick={(e) => {
              e.stopPropagation();
              onManualSpeech();
            }}
          />
        </Flex>

        <Flex vertical align="center" justify="center" className="flex-1 px-2 sm:px-4 relative z-10 w-full my-auto gap-4">
          <div className="text-center w-full px-2">
            <Title 
              level={2} 
              className="!m-0 !text-cyan-300 tracking-tight font-bold drop-shadow-sm break-words whitespace-normal text-2xl sm:text-3xl md:text-4xl"
            >
              {currentCard.front}
            </Title>
          </div>
          
          <div className="text-center w-full min-h-[24px] flex items-center justify-center">
            {currentCard.ipa && (
              <Text className="text-slate-400 font-mono text-sm sm:text-base tracking-wide">
                /{currentCard.ipa}/
              </Text>
            )}
          </div>

          <div className="text-center w-full px-2">
            <div 
              className={`transition-none w-full ${
                isFlipped ? 'opacity-100 visible' : 'opacity-0 invisible select-none'
              }`}
            >
              <Title 
                level={2} 
                className="!m-0 !text-[#e9d5ff] font-bold drop-shadow-sm break-words whitespace-normal text-2xl sm:text-3xl md:text-4xl"
              >
                {currentCard.back || ' '}
              </Title>
            </div>
          </div>
        </Flex>
      </div>
    </div>
  );
};

export default FlashcardCard;