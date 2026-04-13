import { useNavigate } from 'react-router-dom';
import type { Question } from '../types/quiz';

interface CategoryInfo {
  id: Question['category'];
  label: string;
  description: string;
  emoji: string;
}

const CATEGORIES: CategoryInfo[] = [
  {
    id: 'popsong',
    label: '팝송',
    description: '비틀즈, 마이클 잭슨, 에드 시런 등\n유명 팝송에 관한 문제',
    emoji: '🎵',
  },
  {
    id: 'worldmap',
    label: '세계지도',
    description: '수도, 국기, 지형 등\n세계 지리에 관한 문제',
    emoji: '🌍',
  },
  {
    id: 'movie',
    label: '외국영화',
    description: '아카데미 수상작, 명대사, 감독 등\n영화에 관한 문제',
    emoji: '🎬',
  },
  {
    id: 'general',
    label: '일반상식',
    description: '과학, 역사, 스포츠 등\n폭넓은 상식 문제',
    emoji: '📚',
  },
];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight mb-3">
          상식 퀴즈 게임
        </h1>
        <p className="text-slate-400 text-lg">
          카테고리를 선택하고 퀴즈에 도전하세요!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/quiz/${cat.id}`)}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all duration-150 rounded-2xl p-6 text-left cursor-pointer border border-slate-700 hover:border-slate-500"
          >
            <div className="text-4xl mb-3">{cat.emoji}</div>
            <h2 className="text-xl font-bold mb-1">{cat.label}</h2>
            <p className="text-slate-400 text-sm whitespace-pre-line leading-relaxed">
              {cat.description}
            </p>
            <div className="mt-4 text-xs text-slate-500">총 10문제</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
