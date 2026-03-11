import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Flex } from 'antd';
import { ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css'; // Required for KaTeX styling

const { Title, Text } = Typography;

const DefinitionSession = ({ data, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Fallback to empty array. Adjust property names based on your actual data structure
  const reactions = data?.reactions || data?.questions || [];

  // Reset flip state when moving to a new card
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < reactions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFlipped, reactions.length]);

  // Helper function to safely render values that might be objects (like Valency)
  const renderValue = (val) => {
    if (!val) return null;
    if (typeof val === 'object') {
      return Object.entries(val)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }
    return val;
  };

  if (!reactions || reactions.length === 0) {
    return (
      <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto flex flex-col items-center">
        <div className="w-full flex justify-start mb-6">
          <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
            Back to Modes
          </Button>
        </div>
        <div className="bg-white/10 p-12 rounded-2xl w-full text-center text-white border border-white/20">
          <h2 className="text-2xl font-bold mb-4">No reactions found</h2>
        </div>
      </div>
    );
  }

  const currentReaction = reactions[currentIndex];

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex justify-between mb-6 items-center">
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          Back to Modes
        </Button>
        <span className="text-white font-semibold">
          {currentIndex + 1} / {reactions.length}
        </span>
      </div>

      {/* Flashcard */}
      <Card
        hoverable
        onClick={handleFlip}
        style={{
          width: '100%',
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 30,
          cursor: 'pointer',
          textAlign: 'center',
          borderRadius: 16,
        }}
        styles={{
          body: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }
        }}
      >
        {!isFlipped ? (
          /* Front of the Card */
          <Flex vertical align="center" gap="large">
            <Title level={2} style={{ color: '#1890ff', margin: 0 }}>
              {currentReaction.name || 'Unknown Reaction'}
            </Title>
            <Text type="secondary" style={{ marginTop: 20 }}>
              Click or press Space to flip
            </Text>
          </Flex>
        ) : (
          /* Back of the Card */
          <Flex vertical align="center" gap="middle" style={{ width: '100%' }}>
            
            {/* KaTeX Formula Rendering */}
            <div style={{ color: '#52c41a', fontSize: '1.5rem', marginBottom: '10px' }}>
              {currentReaction.formula ? (
                 <BlockMath math={currentReaction.formula} />
              ) : (
                 <Title level={3} style={{ color: '#52c41a', margin: 0 }}>No formula provided</Title>
              )}
            </div>

            {currentReaction.valency && (
              <Text strong style={{ fontSize: 16 }}>
                Valency:{' '}
                <Text style={{ fontWeight: 'normal' }}>
                  {renderValue(currentReaction.valency)}
                </Text>
              </Text>
            )}

            {currentReaction.condition && (
              <Text strong style={{ fontSize: 16 }}>
                Condition:{' '}
                <Text style={{ fontWeight: 'normal' }}>
                  {renderValue(currentReaction.condition)}
                </Text>
              </Text>
            )}

            {currentReaction.description && (
              <Text strong style={{ fontSize: 16 }}>
                Description:{' '}
                <Text style={{ fontWeight: 'normal' }}>
                  {renderValue(currentReaction.description)}
                </Text>
              </Text>
            )}

            <Text type="secondary" style={{ marginTop: 20 }}>
              Click or press Space to flip back
            </Text>
          </Flex>
        )}
      </Card>

      {/* Controls */}
      <Flex justify="center" gap="middle">
        <Button
          size="large"
          icon={<ArrowLeft size={16} />}
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          disabled={currentIndex === 0}
        >
          Prev
        </Button>
        <Button
          size="large"
          icon={<RotateCw size={16} />}
          onClick={(e) => {
            e.stopPropagation();
            handleFlip();
          }}
        >
          Flip
        </Button>
        <Button
          size="large"
          icon={<ArrowRight size={16} />}
          iconPlacement="end"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          disabled={currentIndex === reactions.length - 1}
        >
          Next
        </Button>
      </Flex>
    </div>
  );
};

export default DefinitionSession;