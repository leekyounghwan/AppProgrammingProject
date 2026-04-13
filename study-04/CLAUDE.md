# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # 개발 서버 실행 (http://localhost:5173 또는 5174)
npm run build    # TypeScript 타입 체크 + 프로덕션 빌드
npm run preview  # 빌드 결과물 미리보기
```

## Architecture

React + TypeScript + Vite + Tailwind CSS 기반 SPA. 백엔드 없이 OpenRouter API, sessionStorage, localStorage만 사용.

### 데이터 흐름

```
UploadPage → sessionStorage("fridge_ingredients") → RecipePage → AppContext("savedRecipes") → SavedPage
```

- **Step 1 (UploadPage)**: 이미지를 canvas로 1024px 리사이즈 → base64 → OpenRouter 비전 API → 재료 배열을 sessionStorage에 저장
- **Step 2 (RecipePage)**: sessionStorage에서 재료 읽기 → OpenRouter 텍스트 API(스트리밍) → JSON 파싱 → Recipe 카드
- **Step 3 (SavedPage / ProfilePage)**: AppContext에서 전역 관리, localStorage에 영속

### API 레이어 (`src/lib/openrouter.ts`)

- **이미지 인식**: `recognizeIngredients()` — `VISION_MODELS` 배열 순서대로 폴백 시도. 429/503이면 다음 모델로. NVIDIA 모델은 reasoning 모델이라 `maxTokens: 1500` 필요 (300이면 reasoning만 하다 content null 반환).
- **레시피 생성**: `streamRecipe()` — SSE 스트리밍, `data:` 라인 파싱, `[DONE]` 시 종료.
- `qwen/qwen3.6-plus`는 유료 모델이므로 `max_tokens: 1500` 초과 시 크레딧 오류 발생.

### 상태 관리 (`src/context/AppContext.tsx`)

`useReducer` + Context. 초기화 시 localStorage에서 profile과 savedRecipes를 복원. `SET_PROFILE` / `SAVE_RECIPE` / `DELETE_RECIPE` 액션이 각각 localStorage도 동기화.

### 환경변수

`.env`에 `VITE_OPENROUTER_API_KEY` 필요. Vite 특성상 `VITE_` 접두사 없으면 클라이언트에서 접근 불가.

## 알려진 제약

- `google/gemma-3-27b-it:free` 등 Gemma 모델은 Google AI Studio rate limit으로 자주 429 반환 → NVIDIA 모델로 폴백
- OpenRouter 무료 계정은 크레딧 한도 있어 `qwen/qwen3.6-plus` 요청 시 `max_tokens`를 낮게 유지해야 함
