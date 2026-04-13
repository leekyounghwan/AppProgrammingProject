import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function SavedDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const recipe = state.savedRecipes.find(r => r.id === id)

  if (!recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400 px-4">
        <div className="text-5xl mb-3">😅</div>
        <p>레시피를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/saved')} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm">
          목록으로
        </button>
      </div>
    )
  }

  function handleDelete() {
    if (confirm('이 레시피를 삭제할까요?')) {
      dispatch({ type: 'DELETE_RECIPE', payload: recipe!.id })
      navigate('/saved')
    }
  }

  function copyToClipboard() {
    const text = [
      `[${recipe!.name}]`,
      `⏱ ${recipe!.time} · 👤 ${recipe!.servings}인분`,
      '',
      '재료',
      ...recipe!.ingredients.map(i => `• ${i}`),
      '',
      '조리 순서',
      ...recipe!.steps.map((s, i) => `${i + 1}. ${s}`),
      ...(recipe!.tip ? ['', `💡 팁: ${recipe!.tip}`] : []),
    ].join('\n')
    navigator.clipboard.writeText(text)
    alert('클립보드에 복사되었습니다!')
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/saved')} className="text-gray-400 hover:text-gray-600">← 목록</button>
        <button onClick={handleDelete} className="text-gray-300 hover:text-red-400 text-lg">🗑</button>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">{recipe.name}</h1>
      <div className="flex gap-3 text-sm text-gray-400 mb-1">
        <span>⏱ {recipe.time}</span>
        <span>👤 {recipe.servings}인분</span>
        <span>📅 {new Date(recipe.savedAt).toLocaleDateString('ko-KR')}</span>
      </div>
      <p className="text-xs text-gray-300 mb-6">원본 재료: {recipe.sourceIngredients.join(', ')}</p>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">재료</h2>
          <ul className="text-sm text-gray-700 space-y-1">
            {recipe.ingredients.map((ing, i) => <li key={i}>• {ing}</li>)}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">조리 순서</h2>
          <ol className="text-sm text-gray-700 space-y-2">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-emerald-600 font-semibold shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {recipe.tip && (
          <div className="bg-amber-50 rounded-lg px-3 py-2 text-sm text-amber-700">
            💡 {recipe.tip}
          </div>
        )}
      </div>

      <button
        onClick={copyToClipboard}
        className="mt-4 w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
      >
        📋 클립보드에 복사
      </button>
    </div>
  )
}
