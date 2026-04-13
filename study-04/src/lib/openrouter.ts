const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

const VISION_MODELS = [
  { id: 'google/gemma-3-27b-it:free', maxTokens: 300 },
  { id: 'nvidia/nemotron-nano-12b-v2-vl:free', maxTokens: 1500 },
  { id: 'google/gemma-3-12b-it:free', maxTokens: 300 },
]

const VISION_PROMPT = `You are a food recognition AI. Look at this image carefully and list ALL visible food ingredients, groceries, or food items you can see.
Return ONLY a JSON array of ingredient names in Korean. No explanation, no other text.
Example: ["당근", "계란", "우유", "양파", "두부"]
If you cannot identify any food items, return: ["인식 불가"]`

async function callVisionModel(model: string, maxTokens: number, imageUrl: string): Promise<Response> {
  return fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: VISION_PROMPT },
          ],
        },
      ],
    }),
  })
}

export async function recognizeIngredients(base64Image: string, mimeType: string): Promise<string[]> {
  const imageUrl = `data:${mimeType};base64,${base64Image}`
  let lastError = ''

  for (const { id: model, maxTokens } of VISION_MODELS) {
    const res = await callVisionModel(model, maxTokens, imageUrl)
    const data = await res.json()

    if (!res.ok) {
      const code = data?.error?.code
      if (code === 429 || code === 503) {
        lastError = data?.error?.message ?? '일시적 오류'
        continue
      }
      throw new Error(data?.error?.message ?? '이미지 인식에 실패했습니다.')
    }

    const text: string = data.choices?.[0]?.message?.content ?? ''

    // content가 비어있으면 (추론 토큰 부족 등) 다음 모델로
    if (!text.trim()) {
      lastError = `${model}: 응답 없음`
      continue
    }

    const match = text.match(/\[[\s\S]*?\]/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as string[]
        if (parsed.length > 0) return parsed
      } catch {
        // fallback
      }
    }

    const lines = text
      .split('\n')
      .map(l => l.replace(/^[-•*\d.]\s*/, '').trim())
      .filter(l => l.length > 0 && l.length < 20)

    if (lines.length > 0) return lines

    // 파싱 결과도 비어있으면 다음 모델로
    lastError = `${model}: 파싱 실패`
    continue
  }

  throw new Error(`모든 이미지 인식 모델이 일시적으로 사용 불가합니다. 잠시 후 다시 시도해 주세요.\n(${lastError})`)
}

export async function* streamRecipe(
  ingredients: string[],
  servings: number,
  time: string,
  diet: string,
): AsyncGenerator<string> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.6-plus',
      max_tokens: 1500,
      stream: true,
      messages: [
        {
          role: 'system',
          content: `너는 전문 요리사야. 주어진 재료로 만들 수 있는 실용적인 레시피를 추천해줘.
반드시 다음 JSON 형식으로만 응답해. 다른 텍스트 없이 JSON만:
{
  "recipes": [
    {
      "name": "요리 이름",
      "time": "조리 시간(예: 15분)",
      "servings": 인분수(숫자),
      "ingredients": ["재료1 분량", "재료2 분량"],
      "steps": ["1단계 설명", "2단계 설명"],
      "tip": "요리 팁"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `냉장고에 있는 재료: ${ingredients.join(', ')}
인분 수: ${servings}인분
조리 시간: ${time}
식이 제한: ${diet}
레시피 2개를 추천해줘.`,
        },
      ],
    }),
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data?.error?.message ?? '레시피 생성에 실패했습니다.')
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

    for (const line of lines) {
      const payload = line.slice(6)
      if (payload === '[DONE]') return
      try {
        const json = JSON.parse(payload)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch {
        // 파싱 실패한 청크 무시
      }
    }
  }
}
