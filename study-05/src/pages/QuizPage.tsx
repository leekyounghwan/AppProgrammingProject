import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Question } from '../types/quiz';
import { getQuestionsByCategory } from '../data/questions';

const OPTION_PREFIXES = ['①', '②', '③', '④'] as const;
const TOTAL = 10;

const shuffle = <T,>(arr: T[]): T[] =>
  [...arr].sort(() => Math.random() - 0.5);

const QuizPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();

  const questions: Question[] = useMemo(() => {
    const pool = getQuestionsByCategory(
      category as Question['category'],
    );
    return shuffle(pool).slice(0, TOTAL);
  }, [category]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const current = questions[currentIndex];

  const handleSelect = (optionIndex: number) => {
    if (isAnswered || !current) return;

    setSelectedAnswer(optionIndex);
    setIsAnswered(true);
    if (optionIndex === current.answerIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex === TOTAL - 1) {
      navigate(`/result/${category}`, { state: { score, total: TOTAL } });
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  const getOptionClass = (optionIndex: number): string => {
    const base =
      'w-full text-left px-5 py-3 rounded-xl font-medium transition-colors duration-150 border text-sm sm:text-base';

    if (!isAnswered) {
      return `${base} bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-slate-400 cursor-pointer`;
    }

    const isCorrect = optionIndex === current.answerIndex;
    const isSelected = optionIndex === selectedAnswer;

    if (isCorrect) {
      return `${base} bg-green-500 border-green-400 text-white pointer-events-none`;
    }
    if (isSelected) {
      return `${base} bg-red-500 border-red-400 text-white pointer-events-none`;
    }
    return `${base} bg-slate-800 border-slate-700 text-slate-400 pointer-events-none`;
  };

  if (!current) return null;

  const progressPercent = ((currentIndex + 1) / TOTAL) * 100;
  const isCorrect = selectedAnswer === current.answerIndex;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-xl">
        {/* 진행 바 */}
        <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 진행 텍스트 */}
        <div className="flex justify-between text-slate-400 text-sm mb-6">
          <span>문제 {currentIndex + 1} / {TOTAL}</span>
          <span>현재 점수: {score}</span>
        </div>

        {/* 질문 */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
          <p className="text-lg font-semibold leading-relaxed">{current.question}</p>
        </div>

        {/* 보기 버튼 */}
        <div className="flex flex-col gap-3 mb-6">
          {current.options.map((option, i) => (
            <button
              key={i}
              className={getOptionClass(i)}
              onClick={() => handleSelect(i)}
            >
              <span className="mr-2 font-bold text-indigo-400">
                {OPTION_PREFIXES[i]}
              </span>
              {option}
            </button>
          ))}
        </div>

        {/* 피드백 */}
        {isAnswered && (
          <div
            className={`rounded-xl px-5 py-4 mb-6 text-sm font-medium border ${
              isCorrect
                ? 'bg-green-900/40 border-green-700 text-green-300'
                : 'bg-red-900/40 border-red-700 text-red-300'
            }`}
          >
            {isCorrect ? (
              <span>✓ 정답입니다!</span>
            ) : (
              <span>
                ✗ 오답! 정답은{' '}
                <strong className="text-white">
                  {current.options[current.answerIndex]}
                </strong>
                입니다.
              </span>
            )}
            {current.explanation && (
              <p className="mt-2 text-slate-400 font-normal">{current.explanation}</p>
            )}
          </div>
        )}

        {/* 다음 문제 버튼 */}
        {isAnswered && (
          <button
            onClick={handleNext}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all duration-150 rounded-xl py-3 font-bold text-white"
          >
            {currentIndex === TOTAL - 1 ? '결과 보기' : '다음 문제 →'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
