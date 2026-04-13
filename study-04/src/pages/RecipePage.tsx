import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { streamRecipe } from '../lib/openrouter'
import { useApp } from '../context/AppContext'
import type { Recipe } from '../types'

const TIME_OPTIONS = [
  { value: '빠름(15분 이내)', label: '빠름 (15분↓)' },
  { value: '보통(30분)', label: '보통 (30분)' },
  { value: '여유(1시간)', label: '여유 (1시간)' },
]

const DIET_OPTIONS = [
  { value: '없음', label: '제한 없음' },
  { value: '채식', label: '채식' },
  { value: '글루텐프리', label: '글루텐프리' },
]

type Status = 'idle' | 'streaming' | 'success' | 'error'

export default function RecipePage() {
  const navigate = useNavigate()
  const { dispatch } = useApp()

  const [ingredients, setIngredients] = useState<string[]>([])
  const [servings, setServings] = useState(2)
  const [time, setTime] = useState(TIME_OPTIONS[1].value)
  const [diet, setDiet] = useState(DIET_OPTIONS[0].value)
  const [status, setStatus] = useState<Status>('idle')
  const [streamBuffer, setStreamBuffer] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = sessionStorage.getItem('fridge_ingredients')
    if (!stored) { navigate('/'); return }
    setIngredients(JSON.parse(stored))
  }, [navigate])

  async function generate() {
    setStatus('streaming')
    setStreamBuffer('')
    setRecipes([])
    setErrorMsg('')

    try {
      let full = ''
      for await (const chunk of streamRecipe(ingredients, servings, time, diet)) {
        full += chunk
        setStreamBuffer(full)
      }
      const parsed = parseRecipes(full, ingredients)
      setRecipes(parsed)
      setStatus('success')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '오류가 발생했습니다.')
      setStatus('error')
    }
  }

  function saveRecipe(recipe: Recipe) {
    dispatch({ type: 'SAVE_RECIPE', payload: recipe })
    setSavedIds(prev => new Set([...prev, recipe.id]))
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-2xl font-bold text-emerald-700">🍳 레시피 추천</h1>
      </div>

      {/* 재료 표시 */}
      <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <p className="text-xs text-gray-400 mb-2">인식된 재료</p>
        <div className="flex flex-wrap gap-1">
          {ingredients.map((item, i) => (
            <span key={i} className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-full">{item}</span>
          ))}
        </div>
      </div>

      {/* 옵션 */}
      <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-2">인분 수</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setServings(n)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  servings === n ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {n}인
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 block mb-2">조리 시간</label>
          <div className="flex gap-2">
            {TIME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTime(opt.value)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  time === opt.value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 block mb-2">식이 제한</label>
          <div className="flex gap-2">
            {DIET_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDiet(opt.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  diet === opt.value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={generate}
        disabled={status === 'streaming'}
        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors mb-6"
      >
        {status === 'streaming' ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span> 레시피 생성 중...
          </span>
        ) : status === 'success' ? '🔄 다시 생성' : '레시피 생성하기'}
      </button>

      {/* 스트리밍 중 원문 */}
      {status === 'streaming' && streamBuffer && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <pre className="text-xs text-gray-500 whitespace-pre-wrap font-mono">{streamBuffer}<span className="animate-pulse">▌</span></pre>
        </div>
      )}

      {/* 오류 */}
      {status === 'error' && (
        <div className="bg-red-50 rounded-xl p-4 text-sm text-red-600">{errorMsg}</div>
      )}

      {/* 레시피 카드 */}
      {status === 'success' && recipes.length > 0 && (
        <div className="space-y-4">
          {recipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isSaved={savedIds.has(recipe.id)}
              onSave={() => saveRecipe(recipe)}
            />
          ))}
        </div>
      )}

      {/* 파싱 실패 폴백 */}
      {status === 'success' && recipes.length === 0 && streamBuffer && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">{streamBuffer}</pre>
        </div>
      )}
    </div>
  )
}

function RecipeCard({ recipe, isSaved, onSave }: { recipe: Recipe; isSaved: boolean; onSave: () => void }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setOpen(v => !v)}
      >
        <div>
          <h3 className="font-bold text-gray-800">{recipe.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">⏱ {recipe.time} · 👤 {recipe.servings}인분</p>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">재료</p>
            <ul className="text-sm text-gray-700 space-y-0.5">
              {recipe.ingredients.map((ing, i) => <li key={i}>• {ing}</li>)}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">조리 순서</p>
            <ol className="text-sm text-gray-700 space-y-1">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-600 font-semibold shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {recipe.tip && (
            <div className="bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700">
              💡 {recipe.tip}
            </div>
          )}

          <button
            onClick={onSave}
            disabled={isSaved}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isSaved
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isSaved ? '✅ 저장됨' : '🔖 저장하기'}
          </button>
        </div>
      )}
    </div>
  )
}

function parseRecipes(text: string, sourceIngredients: string[]): Recipe[] {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return []

  try {
    const parsed = JSON.parse(match[0])
    const list = parsed.recipes ?? []
    return list.map((r: Omit<Recipe, 'id' | 'createdAt' | 'sourceIngredients'>) => ({
      ...r,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      sourceIngredients,
    }))
  } catch {
    return []
  }
}
