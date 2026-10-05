// src/components/reading/sections/ReadingComprehensionSection.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Drawer, Badge } from 'antd';
import { CheckCircle2, XCircle, HelpCircle, X } from 'lucide-react';
import InteractiveText from '../InteractiveText';

const ReadingComprehensionSection = ({
  section,
  value = {},
  onChange,
  submitted,
  glossary,
}) => {
  const [openDrawer, setOpenDrawer] = useState(false);

  // --- STATE & REF CHO NÚT KÉO THẢ (DRAGGABLE) ---
  const [btnPos, setBtnPos] = useState({ x: null, y: null });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0, hasMoved: false });
  const floatingBtnRef = useRef(null);

  // Khởi tạo vị trí mặc định góc dưới bên phải
  useEffect(() => {
    const initX = window.innerWidth - 180;
    const initY = window.innerHeight - 90;
    setBtnPos({ x: Math.max(16, initX), y: Math.max(16, initY) });
  }, []);

  const onTouchStart = (e) => {
    const touch = e.touches[0];
    isDraggingRef.current = true;
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      originX: btnPos.x,
      originY: btnPos.y,
      hasMoved: false,
    };
  };

  const onTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.startX;
    const dy = touch.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      dragStartRef.current.hasMoved = true;
    }

    const btnWidth = floatingBtnRef.current?.offsetWidth || 150;
    const btnHeight = floatingBtnRef.current?.offsetHeight || 56;

    // Giữ nút không bị trôi ra ngoài màn hình
    const maxX = window.innerWidth - btnWidth - 10;
    const maxY = window.innerHeight - btnHeight - 10;

    const newX = Math.min(Math.max(10, dragStartRef.current.originX + dx), maxX);
    const newY = Math.min(Math.max(10, dragStartRef.current.originY + dy), maxY);

    setBtnPos({ x: newX, y: newY });
  };

  const onTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const handleFloatingClick = (e) => {
    // Nếu là thao tác kéo di chuyển thì không mở drawer
    if (dragStartRef.current.hasMoved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setOpenDrawer(true);
  };

  // --- LOGIC BÀI ĐỌC ---
  const handleSelectOption = (qid, optKey) => {
    if (submitted) return;
    onChange({ ...value, [qid]: optKey });
  };

  const questions = section.questions || [];
  const answeredCount = questions.filter((q) => value[q.qid] !== undefined).length;

  const renderQuestionsList = () => (
    <div className="flex flex-col gap-6">
      {questions.map((q, qIdx) => {
        const selectedOpt = value[q.qid];
        const isCorrect = selectedOpt === q.correct_answer;
        return (
          <Card key={q.qid} className="rounded-xl border border-slate-200 shadow-sm">
            <div className="font-bold text-base text-slate-800 mb-3 flex gap-2">
              <span>{qIdx + 1}.</span>
              <span>
                <InteractiveText text={q.question} glossary={glossary} />
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {q.options?.map((opt) => {
                const isChoice = selectedOpt === opt.key;
                let btnStyle = 'border-slate-200 bg-white text-slate-700 hover:border-blue-400';
                if (submitted) {
                  if (opt.key === q.correct_answer) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold';
                  } else if (isChoice && !isCorrect) {
                    btnStyle = 'border-rose-500 bg-rose-50 text-rose-800';
                  } else {
                    btnStyle = 'border-slate-100 bg-slate-50 text-slate-400';
                  }
                } else if (isChoice) {
                  btnStyle = 'border-blue-500 bg-blue-50 text-blue-700 font-semibold';
                }
                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={submitted}
                    onClick={() => handleSelectOption(q.qid, opt.key)}
                    className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition-all ${btnStyle}`}
                  >
                    <span>
                      <strong className="mr-2">{opt.key}.</strong>
                      <InteractiveText text={opt.text} glossary={glossary} />
                    </span>
                    {submitted && opt.key === q.correct_answer && (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    )}
                    {submitted && isChoice && !isCorrect && (
                      <XCircle size={16} className="text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <div className="mt-3 p-3 bg-blue-50/60 rounded-lg text-xs text-blue-900 border border-blue-200/50">
                <strong>Giải thích:</strong> {q.explanation}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* CỘT ĐOẠN VĂN: Thêm pb-28 trên mobile để tạo khoảng trống cuộn qua nút */}
        <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200/60 lg:sticky lg:top-4 pb-28 lg:pb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs uppercase tracking-wider text-amber-800 font-bold">
              Đọc hiểu (Bấm từ để tra nghĩa)
            </span>
            <span className="text-xs text-amber-700 font-medium lg:hidden">
              {answeredCount}/{questions.length} câu
            </span>
          </div>
          <div className="text-slate-800 text-lg leading-relaxed text-justify">
            <InteractiveText text={section.passage} glossary={glossary} />
          </div>
        </div>

        {/* CỘT CÂU HỎI TRÊN DESKTOP */}
        <div className="hidden lg:block">
          {renderQuestionsList()}
        </div>
      </div>

      {/* NÚT TỰ DO KÉO THẢ (DRAGGABLE) TRÊN MOBILE */}
      <div
        ref={floatingBtnRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'fixed',
          left: btnPos.x !== null ? `${btnPos.x}px` : 'auto',
          top: btnPos.y !== null ? `${btnPos.y}px` : 'auto',
          right: btnPos.x === null ? 20 : 'auto',
          bottom: btnPos.y === null ? 24 : 'auto',
          touchAction: 'none',
          userSelect: 'none',
        }}
        className="z-40 lg:hidden cursor-grab active:cursor-grabbing"
      >
        <Badge
          count={`${answeredCount}/${questions.length}`}
          color="#1677ff"
          offset={[-10, 5]}
        >
          <Button
            type="primary"
            size="large"
            icon={<HelpCircle size={20} />}
            onClick={handleFloatingClick}
            className="!h-14 !px-5 !rounded-full !bg-blue-600 hover:!bg-blue-500 shadow-2xl flex items-center gap-2 border-2 border-white font-bold text-base"
          >
            Xem câu hỏi
          </Button>
        </Badge>
      </div>

      {/* DRAWER HIỂN THỊ CÂU HỎI TRÊN MOBILE */}
      <Drawer
        placement="bottom"
        height="82vh"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        closeIcon={null}
        title={
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-base">
              <HelpCircle size={18} className="text-blue-600" />
              <span>Danh sách câu hỏi</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono">
                {answeredCount}/{questions.length}
              </span>
            </div>
            <Button
              type="text"
              shape="circle"
              icon={<X size={20} />}
              onClick={() => setOpenDrawer(false)}
            />
          </div>
        }
        styles={{
          body: {
            padding: '16px',
            backgroundColor: '#f8fafc',
            overflowY: 'auto',
          },
          header: {
            borderBottom: '1px solid #e2e8f0',
            padding: '12px 16px',
          },
        }}
      >
        {renderQuestionsList()}

        <div className="mt-6 mb-4">
          <Button
            type="default"
            block
            size="large"
            onClick={() => setOpenDrawer(false)}
            className="rounded-xl h-12 font-medium"
          >
            Quay lại bài đọc
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

ReadingComprehensionSection.calculateScore = (section, userAnswers = {}) => {
  const currentAnswers = userAnswers[section.id] || {};
  let correct = 0;
  const questions = section.questions || [];
  questions.forEach((q) => {
    if (currentAnswers[q.qid] === q.correct_answer) correct += 1;
  });
  return { total: questions.length, correct };
};

export default ReadingComprehensionSection;