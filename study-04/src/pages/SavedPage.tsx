import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

type SortKey = 'savedAt' | 'name' | 'time'

export default function SavedPage() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('savedAt')

  const filtered = state.savedRecipes
    .filter(r => {
      if (!query) return true
      const q = query.toLowerCase()
      return r.name.toLowerCase().includes(q) || r.ingredients.some(i => i.toLowerCase().includes(q))
    })
    .sort((a, b) => {
      if (sort === 'savedAt') return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      if (sort === 'name') return a.name.localeCompare(b.name, 'ko')
      return a.time.localeCompare(b.time)
    })

  function deleteRecipe(id: string) {
    if (confirm('이 레시피를 삭제할까요?')) {
      dispatch({ type: 'DELETE_RECIPE', payload: id })
    }
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-emerald-700 mb-4">🔖 저장된 레시피</h1>

      {/* 검색 */}
      <div className="relative mb-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="레시피 또는 재료 검색"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-emerald-400"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>

      {/* 정렬 */}
      <div className="flex gap-2 mb-4">
        {([['savedAt', '최근순'], ['name', '이름순'], ['time', '시간순']] as [SortKey, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              sort === key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center mt-20 text-gray-400">
          <div className="text-5xl mb-3">🍽</div>
          <p>{query ? '검색 결과가 없습니다.' : '저장된 레시피가 없습니다.'}</p>
          {!query && (
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm"
            >
              레시피 생성하러 가기
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">총 {filtered.length}개</p>
          <div className="space-y-3">
            {filtered.map(r => (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-4 shadow-sm flex justify-between items-start"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/saved/${r.id}`)}
                >
                  <h3 className="font-semibold text-gray-800">{r.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">⏱ {r.time} · 👤 {r.servings}인분</p>
                  <p className="text-xs text-gray-300 mt-0.5">{new Date(r.savedAt).toLocaleDateString('ko-KR')}</p>
                </div>
                <button
                  onClick={() => deleteRecipe(r.id)}
                  className="ml-3 text-gray-300 hover:text-red-400 transition-colors text-lg"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
