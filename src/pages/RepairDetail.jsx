import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Spin, message } from 'antd';
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  GripVertical, 
  Trophy, 
  ArrowRight,
  List as ListIcon,
  Check,
  X
} from 'lucide-react';
import { getRepairById } from '../firebase/repairService';

const { Title, Text } = Typography;

const RepairDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [repairSet, setRepairSet] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- SESSION STATE ---
  // Store the state of ALL questions: { words: [], status: 'pending'|'correct'|'incorrect', isChecked: false }
  const [sessionState, setSessionState] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  // --- LOCAL UI STATE (Current Question) ---
  const [words, setWords] = useState([]); 
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const data = await getRepairById(id);
    if (data) {
      setRepairSet(data);
      initializeSession(data.questions);
    } else {
      message.error("Repair set not found");
      navigate('/repairs');
    }
    setLoading(false);
  };

  // Initialize the session state for all questions
  const initializeSession = (questions) => {
    const initialState = questions.map(q => {
      // Prepare initial shuffled words
      let initialWords = [];
      if (Array.isArray(q.question)) {
        initialWords = [...q.question];
      } else {
        initialWords = q.question.includes('/') 
          ? q.question.split('/').map(w => w.trim()) 
          : q.question.split(' ');
      }
      
      return {
        words: initialWords,
        status: 'pending', // pending, correct, incorrect
        isChecked: false
      };
    });

    setSessionState(initialState);
    loadQuestionState(0, initialState);
  };

  // Load a specific question's state into the UI
  const loadQuestionState = (index, currentSessionState = sessionState) => {
    const state = currentSessionState[index];
    setWords([...state.words]);
    setIsChecked(state.isChecked);
    setIsCorrect(state.status === 'correct');
    setCurrentIndex(index);
  };

  // --- DRAG AND DROP HANDLERS ---
  const onDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  };

  const onDragOver = (e) => e.preventDefault();

  const onDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || isChecked) return;

    const newWords = [...words];
    const itemToMove = newWords[draggedItemIndex];
    
    newWords.splice(draggedItemIndex, 1);
    newWords.splice(dropIndex, 0, itemToMove);

    setWords(newWords);
    setDraggedItemIndex(null);

    // Sync changes to session state immediately so they persist if we navigate away
    updateSessionState(currentIndex, { words: newWords });
  };

  const updateSessionState = (index, updates) => {
    const newState = [...sessionState];
    newState[index] = { ...newState[index], ...updates };
    setSessionState(newState);
  };

  // In src/pages/RepairDetail.jsx

  const checkAnswer = () => {
    // 1. Join with spaces first
    // 2. Use Regex to remove any whitespace (\s+) found immediately before punctuation ([,!.?;:])
    const currentSentence = words.join(' ')
      .replace(/\s+([,!.?;:])/g, '$1') 
      .trim();

    const correctSentence = repairSet.questions[currentIndex].answer.trim();
    
    // Log for debugging if needed
    // console.log("User constructed:", currentSentence);
    // console.log("Target answer:", correctSentence);

    const correct = currentSentence === correctSentence;
    
    setIsCorrect(correct);
    setIsChecked(true);
    
    // Save result
    updateSessionState(currentIndex, {
      status: correct ? 'correct' : 'incorrect',
      isChecked: true,
      words: words // Ensure final order is saved
    });
  };

  const goToQuestion = (index) => {
    loadQuestionState(index);
  };

  const nextQuestion = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < repairSet.questions.length) {
      goToQuestion(nextIdx);
    } else {
      setCompleted(true);
    }
  };

  const restart = () => {
    setCompleted(false);
    initializeSession(repairSet.questions);
  };

  // --- SCORE CALCULATION ---
  const calculateScore = () => {
    const correctCount = sessionState.filter(s => s.status === 'correct').length;
    const total = repairSet.questions.length;
    // Convert to scale of 10
    const scoreOn10 = ((correctCount / total) * 10).toFixed(1); 
    // Remove .0 if it exists
    return scoreOn10.endsWith('.0') ? scoreOn10.slice(0, -2) : scoreOn10;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spin size="large" /></div>;

  // --- COMPLETED VIEW ---
  if (completed) {
    const finalScore = calculateScore();
    const numericScore = parseFloat(finalScore);
    
    let messageText = "Good Job!";
    let colorClass = "text-blue-500";
    if (numericScore === 10) { messageText = "Perfect!"; colorClass = "text-green-500"; }
    else if (numericScore < 5) { messageText = "Keep Practicing!"; colorClass = "text-orange-500"; }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl rounded-3xl text-center p-8 border-0 bg-white/90 backdrop-blur-sm">
          <div className="mb-6 flex justify-center">
            <div className={`p-6 rounded-full bg-opacity-10 ${numericScore === 10 ? 'bg-green-500' : 'bg-blue-500'}`}>
              <Trophy size={64} className={colorClass} />
            </div>
          </div>
          
          <Title level={2} className="!mb-2">{messageText}</Title>
          <Text className="text-gray-500 text-lg block mb-8">
            Score: <span className={`font-bold text-3xl ${colorClass}`}>{finalScore}</span> / 10
          </Text>

          <div className="flex flex-col gap-3">
            <Button 
              type="primary" 
              size="large" 
              onClick={restart} 
              className="h-12 bg-indigo-600 hover:bg-indigo-500 border-none rounded-xl font-semibold shadow-lg shadow-indigo-200"
              icon={<RefreshCw size={18} />}
            >
              Practice Again
            </Button>
            <Button size="large" type="text" onClick={() => navigate('/repairs')} className="h-12 text-gray-500 hover:bg-gray-100 rounded-xl">
              Back to List
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // --- MAIN LAYOUT ---
  return (
    <div className="min-h-screen flex flex-col items-center py-6 px-4 font-sans max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="w-full flex justify-between items-center mb-6 px-2">
        <Button 
          type="text" 
          icon={<ArrowLeft size={20} />} 
          onClick={() => navigate('/repairs')}
          className="hover:bg-white/50 rounded-full text-slate-600"
        >
          Exit
        </Button>
        <Title level={4} className="!m-0 text-slate-700 hidden sm:block">{repairSet.title}</Title>
        <div className="w-[80px]"></div> {/* Spacer for alignment */}
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        
        {/* LEFT COLUMN: GAME AREA */}
        <div className="flex flex-col gap-6">
          <Card 
            className="shadow-lg rounded-3xl border-0 overflow-hidden relative bg-white/95 backdrop-blur-sm min-h-[500px] flex flex-col"
            bodyStyle={{ padding: '2.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}
          >
             <div className="flex justify-between items-center mb-8">
                <Text className="text-slate-400 font-medium text-lg">Question {currentIndex + 1}</Text>
                {isChecked && (
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isCorrect ? "Correct" : "Incorrect"}
                  </span>
                )}
             </div>

            <div className="text-center mb-8">
              <Title level={3} className="!mb-2 !text-slate-800">Construct the Sentence</Title>
              {!isChecked && <Text className="text-slate-400">Drag words to order</Text>}
            </div>

            {/* Draggable Area */}
            <div className="flex-grow flex items-center justify-center">
              <div className="flex flex-wrap gap-3 justify-center content-center transition-all p-4 bg-slate-50/50 rounded-2xl w-full border border-dashed border-slate-200 min-h-[120px]">
                {words.map((word, index) => (
                  <div
                    key={`${index}-${word}`}
                    draggable={!isChecked}
                    onDragStart={(e) => onDragStart(e, index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDrop(e, index)}
                    className={`
                      group relative flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-lg cursor-grab select-none transition-all duration-200 transform
                      ${isChecked 
                        ? (isCorrect 
                            ? 'bg-green-100 border-2 border-green-500 text-green-700' 
                            : 'bg-red-50 border-2 border-red-400 text-red-700')
                        : 'bg-white border-2 border-slate-200 border-b-4 text-slate-700 hover:-translate-y-1 hover:border-indigo-300 hover:text-indigo-600 active:border-b-2 active:translate-y-[2px] shadow-sm'
                      }
                      ${draggedItemIndex === index ? 'opacity-40 scale-95' : 'opacity-100'}
                      ${isChecked ? 'cursor-default' : ''}
                    `}
                  >
                    {!isChecked && (
                      <GripVertical size={16} className="text-slate-300 group-hover:text-indigo-300 transition-colors" />
                    )}
                    {word}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-10 h-24 flex flex-col justify-end">
              {isChecked ? (
                <div className="animate-fade-in flex flex-col items-center w-full">
                  {!isCorrect && (
                     <div className="mb-4 text-center">
                       <Text className="text-slate-400 block text-sm">Correct Answer:</Text>
                       <Text className="text-slate-800 font-medium text-lg">{repairSet.questions[currentIndex].answer}</Text>
                     </div>
                  )}
                  
                  <div className="flex gap-4 w-full">
                     {/* If it's the last question, show 'Finish' button */}
                     {currentIndex === repairSet.questions.length - 1 ? (
                        <Button 
                          type="primary"
                          size="large" 
                          onClick={() => setCompleted(true)}
                          className="flex-1 h-12 text-lg font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-700 border-none"
                        >
                          See Results
                        </Button>
                     ) : (
                        <Button 
                          type="primary" // Always primary color for 'Next' flow
                          size="large" 
                          onClick={nextQuestion}
                          className={`flex-1 h-12 text-lg font-semibold rounded-xl border-none shadow-md
                            ${isCorrect ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-800 hover:bg-slate-700'}
                          `}
                          icon={<ArrowRight size={20} />}
                        >
                          Next Question
                        </Button>
                     )}
                  </div>
                </div>
              ) : (
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={checkAnswer} 
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 border-none rounded-xl text-lg font-semibold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
                >
                  Check Answer
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: PROGRESS SIDEBAR */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-slate-100 lg:sticky lg:top-6">
          <div className="flex items-center gap-2 mb-6 text-slate-600 font-semibold">
            <ListIcon size={20} />
            <span>Progress</span>
          </div>

          <div className="grid grid-cols-5 lg:grid-cols-4 gap-3">
            {sessionState.map((state, idx) => {
              let btnClass = "bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200";
              let icon = null;

              // Active Question Styling
              if (idx === currentIndex) {
                btnClass = "ring-2 ring-offset-2 ring-indigo-500 bg-white text-indigo-600 border-indigo-200 font-bold";
              } 
              // Completed Question Styling
              else if (state.status === 'correct') {
                btnClass = "bg-green-100 text-green-600 border-green-200";
                icon = <Check size={14} strokeWidth={3} />;
              } else if (state.status === 'incorrect') {
                btnClass = "bg-red-50 text-red-500 border-red-200";
                icon = <X size={14} strokeWidth={3} />;
              }

              return (
                <button
                  key={idx}
                  onClick={() => goToQuestion(idx)}
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all border
                    ${btnClass}
                  `}
                >
                  {icon || (idx + 1)}
                </button>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
             <div className="flex justify-between items-center text-sm text-slate-500 mb-2">
                <span>Completed</span>
                <span className="font-semibold text-slate-700">
                  {sessionState.filter(s => s.status !== 'pending').length} / {repairSet.questions.length}
                </span>
             </div>
             <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-500" 
                  style={{ width: `${(sessionState.filter(s => s.status !== 'pending').length / repairSet.questions.length) * 100}%` }}
                ></div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RepairDetail;