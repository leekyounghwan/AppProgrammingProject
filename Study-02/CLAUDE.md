# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**DONE** — 바닐라 JS 기반 할 일 관리 앱. 빌드 도구 없이 브라우저에서 직접 실행.

```
done/
├── index.html   — 레이아웃 골격 (#header, #input-area, #task-list)
├── style.css    — CSS 변수 기반 스타일 (라이트 모드, Step 4에서 다크 모드 추가 예정)
└── app.js       — 전체 로직 (상태, CRUD, 렌더링, localStorage)
```

## 실행 방법

빌드 단계 없음. `done/index.html`을 브라우저에서 직접 열거나 Live Server로 실행.

## 아키텍처

### 상태 관리
- 전역 배열 `tasks`가 단일 진실 공급원
- 모든 변경은 **수정 → `saveToStorage()` → `renderTasks()`** 순서를 따름
- `renderTasks()`는 항상 전체 DOM을 재구성 (부분 업데이트 없음)

### Task 객체 스펙 (변경 불가)
```js
{
  id: string,          // crypto.randomUUID() 또는 폴백
  text: string,        // 최대 200자
  category: 'work' | 'personal' | 'study',
  completed: boolean,
  createdAt: number,   // Date.now()
  updatedAt: number,
  order: number
}
```

### localStorage
- 키: `'done_tasks'`
- `QuotaExceededError` 예외 처리 포함
- `loadFromStorage()`: 파싱 실패 시 `[]` 반환

### 정렬 기준 (`renderTasks`)
미완료(createdAt 역순) → 완료(updatedAt 역순)

### CSS 변수 (라이트 모드)
```css
--bg: #f5f5f5 | --surface: #ffffff | --border: #e0e0e0
--text: #1a1a1a | --muted: #888 | --accent: #5b5bd6
--cat-work: #4f9eff | --cat-personal: #ff7eb3 | --cat-study: #ffbe55
```

### 카테고리 / 필터
- 상태 변수 `currentFilter`: `'all' | 'work' | 'personal' | 'study'`
- 필터 탭 클릭 → `currentFilter` 변경 → `renderTasks()` 재호출
- 각 탭에 미완료 수 배지 표시 (`renderFilterTabs()` 내부에서 갱신)
- 카드 왼쪽 border 3px = 카테고리 색상, 완료 시 `var(--border)`로 흐리게
- `#category-select` 왼쪽 border 색상은 JS로 동적 교체

## 단계별 개발 계획

- **Step 1** ✅ 기본 구조 + CRUD
- **Step 2** ✅ 카테고리 필터 탭 + 카드 UI 개선
- **Step 3** ✅ 진행률 대시보드 (게이지 + 카테고리 카운터 + 요약 텍스트, sticky 헤더)
- **Step 4** ✅ 다크 모드 + Undo 토스트 + 드래그 앤 드롭 + 완료 일괄 삭제
- **Step 5** ✅ 엣지케이스·접근성·FOUC 수정, 최종 최적화 (현재)

## 주요 버그·결정 사항

- **다크모드 FOUC**: `<head>` 인라인 `<script>`로 `html` 요소에 `.dark` 클래스 즉시 적용. CSS는 `body.dark` 대신 `:root.dark` 사용.
- **수정 이중 commit 버그**: `startEdit` 내 `committed` 플래그로 Enter 후 alert → blur 재진입 차단.
- **삭제 버튼 키보드 접근성**: `.task-delete:focus-visible { opacity: 1 }` 추가.
