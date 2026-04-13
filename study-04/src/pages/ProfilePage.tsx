import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { UserProfile } from '../types'

const DIET_OPTIONS = [
  { value: 'vegetarian', label: '채식' },
  { value: 'vegan', label: '비건' },
  { value: 'glutenfree', label: '글루텐프리' },
  { value: 'lowcal', label: '저칼로리' },
  { value: 'highprotein', label: '고단백' },
]

export default function ProfilePage() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()

  const [nickname, setNickname] = useState('')
  const [dietPreferences, setDietPreferences] = useState<string[]>([])
  const [allergyInput, setAllergyInput] = useState('')
  const [allergyIngredients, setAllergyIngredients] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (state.profile) {
      setNickname(state.profile.nickname)
      setDietPreferences(state.profile.dietPreferences)
      setAllergyIngredients(state.profile.allergyIngredients)
    }
  }, [state.profile])

  function toggleDiet(value: string) {
    setDietPreferences(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  function addAllergy() {
    const val = allergyInput.trim()
    if (!val || allergyIngredients.includes(val)) return
    setAllergyIngredients(prev => [...prev, val])
    setAllergyInput('')
  }

  function saveProfile() {
    if (!nickname.trim()) return
    const profile: UserProfile = {
      id: state.profile?.id ?? crypto.randomUUID(),
      nickname: nickname.trim(),
      dietPreferences,
      allergyIngredients,
      createdAt: state.profile?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    dispatch({ type: 'SET_PROFILE', payload: profile })
    setSaved(true)
    setTimeout(() => { setSaved(false); navigate('/') }, 1200)
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-emerald-700 mb-6">👤 내 프로필</h1>

      <div className="space-y-5">
        {/* 닉네임 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="text-sm font-medium text-gray-600 block mb-2">닉네임 *</label>
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* 식이 선호 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="text-sm font-medium text-gray-600 block mb-3">식이 선호</label>
          <div className="flex flex-wrap gap-2">
            {DIET_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => toggleDiet(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  dietPreferences.includes(opt.value)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 알레르기 재료 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="text-sm font-medium text-gray-600 block mb-3">알레르기 재료</label>
          <div className="flex gap-2 mb-3">
            <input
              value={allergyInput}
              onChange={e => setAllergyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAllergy()}
              placeholder="재료 입력 후 Enter"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={addAllergy}
              className="px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
            >
              추가
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {allergyIngredients.map((item, i) => (
              <span key={i} className="flex items-center gap-1 bg-red-50 text-red-600 text-sm px-3 py-1 rounded-full">
                {item}
                <button
                  onClick={() => setAllergyIngredients(prev => prev.filter((_, idx) => idx !== i))}
                  className="hover:text-red-800 ml-0.5"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 저장 */}
        <button
          onClick={saveProfile}
          disabled={!nickname.trim() || saved}
          className={`w-full py-3 rounded-xl font-semibold transition-colors ${
            saved
              ? 'bg-gray-100 text-gray-400'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60'
          }`}
        >
          {saved ? '✅ 저장되었습니다!' : '저장'}
        </button>
      </div>
    </div>
  )
}
