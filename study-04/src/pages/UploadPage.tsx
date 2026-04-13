import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { recognizeIngredients } from '../lib/openrouter'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function UploadPage() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [ingredients, setIngredients] = useState<string[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [newIngredient, setNewIngredient] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('이미지 파일만 업로드할 수 있습니다.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('파일 크기는 10MB 이하여야 합니다.')
      return
    }
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setStatus('idle')
    setIngredients([])
    setErrorMsg('')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  async function recognize() {
    if (!imageFile) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const base64 = await toBase64(imageFile)
      const result = await recognizeIngredients(base64, 'image/jpeg')
      setIngredients(result)
      setStatus('success')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '오류가 발생했습니다.')
      setStatus('error')
    }
  }

  function removeIngredient(i: number) {
    setIngredients(prev => prev.filter((_, idx) => idx !== i))
  }

  function addIngredient() {
    const val = newIngredient.trim()
    if (!val) return
    setIngredients(prev => [...prev, val])
    setNewIngredient('')
  }

  function goToRecipe() {
    sessionStorage.setItem('fridge_ingredients', JSON.stringify(ingredients))
    navigate('/recipe')
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-emerald-700">🧊 냉장고 재료 인식</h1>

      {/* 업로드 영역 */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="미리보기" className="mx-auto max-h-60 rounded-xl object-contain" />
        ) : (
          <div className="text-gray-400">
            <div className="text-5xl mb-3">📷</div>
            <p className="text-sm">이미지를 드래그하거나 클릭해서 업로드하세요</p>
            <p className="text-xs mt-1">JPG, PNG, WEBP / 최대 10MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {/* 오류 메시지 */}
      {errorMsg && (
        <p className="mt-3 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
      )}

      {/* 인식 버튼 */}
      {imageFile && status !== 'success' && (
        <button
          onClick={recognize}
          disabled={status === 'loading'}
          className="mt-4 w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
        >
          {status === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin text-lg">⏳</span> 재료 인식 중...
            </span>
          ) : '재료 인식 시작'}
        </button>
      )}

      {/* 인식 결과 */}
      {status === 'success' && (
        <div className="mt-6">
          <h2 className="font-semibold text-gray-700 mb-3">인식된 재료</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {ingredients.map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-sm px-3 py-1 rounded-full"
              >
                {item}
                <button onClick={() => removeIngredient(i)} className="text-emerald-500 hover:text-red-400 ml-1">✕</button>
              </span>
            ))}
          </div>

          {/* 재료 추가 */}
          <div className="flex gap-2 mb-6">
            <input
              value={newIngredient}
              onChange={e => setNewIngredient(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addIngredient()}
              placeholder="재료 직접 추가"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={addIngredient}
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
            >
              추가
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStatus('idle')}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50"
            >
              다시 촬영
            </button>
            <button
              onClick={goToRecipe}
              disabled={ingredients.length === 0}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              레시피 추천 받기 →
            </button>
          </div>
        </div>
      )}

      {/* 재시도 */}
      {status === 'error' && imageFile && (
        <button
          onClick={recognize}
          className="mt-4 w-full py-3 border border-emerald-600 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50"
        >
          다시 시도
        </button>
      )}
    </div>
  )
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1024
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      resolve(dataUrl.split(',')[1])
    }
    img.onerror = reject
    img.src = url
  })
}
