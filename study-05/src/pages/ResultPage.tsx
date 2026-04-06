import { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import type { ScoreRecord } from '../types/quiz';
import { getCategoryLabel } from '../utils/categoryLabel';

const STORAGE_KEY = 'quizScores';
const MAX_RECORDS = 50;

// ── 유틸 ────────────────────────────────────────────────────────────────────

const loadScores = (): ScoreRecord[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
};

const saveScores = (records: ScoreRecord[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const getGradeMessage = (score: number, total: number): string => {
  const pct = score / total;
  if (pct === 1) return '완벽해요! 🏆';
  if (pct >= 0.7) return '잘했어요! 👏';
  if (pct >= 0.5) return '절반은 맞혔어요 😊';
  return '다시 도전해봐요! 💪';
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}`;
};

const RANK_STYLES: Record<number, string> = {
  0: 'bg-yellow-900/40 border-yellow-600',
  1: 'bg-slate-600/40 border-slate-400',
  2: 'bg-orange-900/40 border-orange-700',
};

const RANK_LABELS = ['🥇', '🥈', '🥉'];

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

type Tab = 'result' | 'ranking';

interface LocationState {
  score: number;
  total: number;
}

const ResultPage = () => {
  const { category = '' } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  // state 없으면 홈으로
  useEffect(() => {
    if (!state) navigate('/', { replace: true });
  }, [state, navigate]);

  const [tab, setTab] = useState<Tab>('result');
  const [nickname, setNickname] = useState('');
  const [toast, setToast] = useState(false);
  const [rankings, setRankings] = useState<ScoreRecord[]>([]);

  // 랭킹 탭 진입 시 읽기
  useEffect(() => {
    if (tab === 'ranking') {
      const sorted = loadScores().sort((a, b) => b.score / b.total - a.score / a.total || b.score - a.score);
      setRankings(sorted.slice(0, 10));
    }
  }, [tab]);

  if (!state) return null;

  const { score, total } = state;

  const handleSave = () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;

    const record: ScoreRecord = {
      nickname: trimmed,
      category: category as ScoreRecord['category'],
      score,
      total,
      date: new Date().toISOString(),
    };

    const prev = loadScores();
    const next = [...prev, record];
    if (next.length > MAX_RECORDS) next.splice(0, next.length - MAX_RECORDS);
    saveScores(next);

    setToast(true);
    setTimeout(() => setToast(false), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* 헤더 */}
        <h1 className="text-3xl font-extrabold text-center mb-6 tracking-tight">
          퀴즈 결과
        </h1>

        {/* 탭 */}
        <div className="flex rounded-xl overflow-hidden border border-slate-700 mb-8">
          {(['result', 'ranking'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors duration-150 ${
                tab === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {t === 'result' ? '내 결과' : '랭킹'}
            </button>
          ))}
        </div>

        {/* ── 내 결과 탭 ── */}
        {tab === 'result' && (
          <div className="flex flex-col items-center gap-6">
            {/* 점수 */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full py-10 flex flex-col items-center gap-2">
              <span className="text-slate-400 text-sm">
                {getCategoryLabel(category)}
              </span>
              <span className="text-6xl font-extrabold text-indigo-400">
                {score}
                <span className="text-3xl text-slate-500"> / {total}</span>
              </span>
              <span className="text-xl font-semibold mt-2">
                {getGradeMessage(score, total)}
              </span>
            </div>

            {/* 닉네임 저장 */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full p-6 flex flex-col gap-3">
              <p className="text-sm text-slate-400 font-medium">점수를 기록하세요</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="닉네임 입력"
                  maxLength={12}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSave}
                  disabled={!nickname.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 rounded-xl text-sm font-bold transition-colors duration-150"
                >
                  기록 저장
                </button>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => navigate(`/quiz/${category}`)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all duration-150 rounded-xl py-3 font-bold text-sm"
              >
                다시 도전
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all duration-150 rounded-xl py-3 font-bold text-sm"
              >
                홈으로
              </button>
            </div>
          </div>
        )}

        {/* ── 랭킹 탭 ── */}
        {tab === 'ranking' && (
          <div className="flex flex-col gap-3">
            {rankings.length === 0 ? (
              <div className="text-center text-slate-500 py-16 text-sm">
                아직 기록이 없어요
              </div>
            ) : (
              rankings.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 border rounded-xl px-4 py-3 text-sm ${
                    RANK_STYLES[i] ?? 'bg-slate-800 border-slate-700'
                  }`}
                >
                  {/* 순위 */}
                  <span className="w-7 text-center font-bold text-base shrink-0">
                    {i < 3 ? RANK_LABELS[i] : i + 1}
                  </span>
                  {/* 닉네임 */}
                  <span className="flex-1 font-semibold truncate">{r.nickname}</span>
                  {/* 카테고리 */}
                  <span className="text-slate-400 shrink-0 hidden sm:inline">
                    {getCategoryLabel(r.category)}
                  </span>
                  {/* 점수 */}
                  <span className="font-bold text-indigo-400 shrink-0">
                    {r.score}
                    <span className="text-slate-500 font-normal">/{r.total}</span>
                  </span>
                  {/* 날짜 */}
                  <span className="text-slate-500 shrink-0">{formatDate(r.date)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 토스트 */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm font-semibold px-6 py-3 rounded-full shadow-lg transition-all duration-300 ${
          toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        저장되었습니다!
      </div>
    </div>
  );
};

export default ResultPage;
