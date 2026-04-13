# PRD Step 3 — 사용자 프로필 & 레시피 저장

## 개요

사용자 프로필을 생성하고, Step 2에서 생성된 레시피를 저장·관리하는 기능을 구현한다. 별도 백엔드 없이 `localStorage`로 데이터를 영속한다.

---

## 목표

- 사용자 프로필(닉네임, 식이 선호) 생성 및 수정
- 마음에 드는 레시피 저장 및 목록 조회
- 저장된 레시피 상세 보기 및 삭제

---

## 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | React + TypeScript |
| 라우팅 | React Router v6 |
| 데이터 저장 | localStorage |
| 상태관리 | React Context + useReducer |

---

## 페이지 구성

### 1. 프로필 설정 페이지 (`/profile`)

최초 접속 또는 설정 진입 시 표시.

```
┌─────────────────────────────────────────┐
│  👤 내 프로필                             │
│                                         │
│  닉네임  [              ]               │
│                                         │
│  식이 선호 (복수 선택)                     │
│  □ 채식   □ 비건   □ 글루텐프리            │
│  □ 저칼로리   □ 고단백                     │
│                                         │
│  알레르기 재료                             │
│  [재료 입력 + 추가]                        │
│  🏷 견과류  🏷 유제품  ✕                  │
│                                         │
│  [저장]                                  │
└─────────────────────────────────────────┘
```

### 2. 저장된 레시피 목록 (`/saved`)

```
┌─────────────────────────────────────────┐
│  🔖 저장된 레시피       [검색 🔍]          │
│                                         │
│  필터: [전체] [채식] [30분 이내] [최근순]   │
│                                         │
│  ┌────────────┐  ┌────────────┐         │
│  │ 당근 달걀볶음 │  │ 두부 된장찌개│         │
│  │ ⏱15분 👤2인 │  │ ⏱20분 👤2인│         │
│  │ 2026.04.13 │  │ 2026.04.12 │         │
│  └────────────┘  └────────────┘         │
│                                         │
│  총 12개 저장됨                           │
└─────────────────────────────────────────┘
```

### 3. 저장된 레시피 상세 (`/saved/:id`)

```
┌─────────────────────────────────────────┐
│  ← 목록으로   🥕 당근 달걀볶음  [삭제 🗑]  │
│                                         │
│  ⏱ 15분  👤 2인분  📅 2026.04.13        │
│  원본 재료: 당근, 계란, 소금               │
│  ─────────────────────────────          │
│  재료                                    │
│  • 당근 1개  • 달걀 2개  • 소금 약간       │
│                                         │
│  조리 순서                                │
│  1. 당근을 채 썬다.                        │
│  2. ...                                 │
│                                         │
│  💡 팁: 달걀을 마지막에 넣어야 부드럽습니다.  │
└─────────────────────────────────────────┘
```

---

## 기능 상세

### 1. 프로필 관리

**프로필 데이터 구조:**
```typescript
type UserProfile = {
  id: string;             // crypto.randomUUID()
  nickname: string;       // 닉네임
  dietPreferences: ('vegetarian' | 'vegan' | 'glutenfree' | 'lowcal' | 'highprotein')[];
  allergyIngredients: string[]; // 알레르기 재료
  createdAt: string;
  updatedAt: string;
};
```

- 앱 최초 실행 시 프로필 미존재면 `/profile`로 자동 이동
- 프로필은 `localStorage`의 `user_profile` 키에 저장
- 닉네임 미입력 시 저장 불가

### 2. 레시피 저장

- Step 2 레시피 카드의 "저장하기" 버튼 클릭 시 저장
- 동일 레시피 중복 저장 방지 (이름 + 재료 해시 비교)
- 저장 성공 시 토스트 메시지 표시: "레시피가 저장되었습니다 🔖"
- 저장 데이터는 `localStorage`의 `saved_recipes` 키에 JSON 배열로 저장

### 3. 레시피 목록 조회

**정렬 옵션:**
- 최근 저장순 (기본)
- 이름 가나다순
- 조리 시간 짧은순

**필터 옵션:**
- 전체 / 채식 / 30분 이내 / 오늘 저장

**검색:**
- 레시피 이름 + 재료명 대상 클라이언트 사이드 검색

### 4. 레시피 삭제

- 상세 페이지에서 개별 삭제
- 목록에서 스와이프 또는 길게 눌러 삭제 (모바일)
- 삭제 전 확인 다이얼로그 표시

### 5. 내보내기 (선택 기능)

- 레시피 상세 페이지에서 텍스트 복사 버튼 제공
- 클립보드에 레시피 전문 복사

---

## 데이터 구조 (localStorage)

```typescript
// localStorage['user_profile']
type UserProfile = {
  id: string;
  nickname: string;
  dietPreferences: string[];
  allergyIngredients: string[];
  createdAt: string;
  updatedAt: string;
};

// localStorage['saved_recipes']
type SavedRecipe = Recipe & {
  savedAt: string;  // 저장 일시
};
// SavedRecipe[] 배열로 저장
```

---

## 전역 상태 (Context)

```typescript
type AppState = {
  profile: UserProfile | null;
  savedRecipes: SavedRecipe[];
};

type AppAction =
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'SAVE_RECIPE'; payload: Recipe }
  | { type: 'DELETE_RECIPE'; payload: string }; // id
```

---

## 네비게이션 구조

```
/               → Step 1: 이미지 업로드
/recipe         → Step 2: 레시피 생성
/saved          → Step 3: 저장된 레시피 목록
/saved/:id      → Step 3: 레시피 상세
/profile        → Step 3: 프로필 설정
```

**하단 네비게이션 바 (모바일):**
```
[🧊 인식] [🍳 레시피] [🔖 저장] [👤 프로필]
```

---

## 오류 처리

| 상황 | 처리 방법 |
|------|----------|
| 프로필 미설정 접근 | `/profile`로 리다이렉트 |
| 저장된 레시피 없음 | 빈 상태 일러스트 + "레시피를 생성해보세요" 안내 |
| localStorage 용량 초과 | 오래된 레시피 삭제 안내 |
| 잘못된 `/saved/:id` | "레시피를 찾을 수 없습니다" + 목록으로 이동 버튼 |

---

## 완료 기준 (Definition of Done)

- [ ] 프로필 생성 및 수정 동작
- [ ] 프로필 미설정 시 자동 리다이렉트
- [ ] Step 2에서 레시피 저장 동작
- [ ] 저장된 레시피 목록 표시 (정렬/필터)
- [ ] 레시피 검색 동작
- [ ] 레시피 상세 페이지 표시
- [ ] 레시피 삭제 동작
- [ ] 하단 네비게이션 바 (모바일)
- [ ] localStorage 데이터 영속 확인
