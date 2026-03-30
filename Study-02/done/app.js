/* ================================
   DONE - 할 일 관리 앱
   State  → tasks[], currentFilter, lastDeleted, undoTimer, dragSrcId
   Flow   → load → render → event → save
   ================================ */
'use strict';

/* ── Constants ── */
const STORAGE_KEY  = 'done_tasks';
const THEME_KEY    = 'done_theme';
const MAX_TEXT_LEN = 200;

const CATEGORY_LABEL = {
  all:      '전체',
  work:     '업무',
  personal: '개인',
  study:    '공부',
};

/* ── State ── */
let tasks         = [];
let currentFilter = 'all';
let lastDeleted   = null;
let undoTimer     = null;
let dragSrcId     = null;

/* ── Storage ── */
// ✓ OK: QuotaExceededError catch → 콘솔 경고, 앱 크래시 방지
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('localStorage 용량 초과: 저장에 실패했습니다.');
    } else {
      throw e;
    }
  }
}

// ✓ OK: JSON.parse 실패 → [] fallback
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/* ── ID 생성 ── */
// ✓ OK: crypto.randomUUID 미지원 환경 폴백 처리
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now();
}

/* ── Validation ── */
// ✓ OK: 공백만 입력 거부 / 200자 초과 거부
function validateText(text) {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: '내용을 입력해 주세요.' };
  if (trimmed.length > MAX_TEXT_LEN) return { ok: false, reason: `최대 ${MAX_TEXT_LEN}자까지 입력 가능합니다.` };
  return { ok: true, value: trimmed };
}

/* ── Theme ── */
// documentElement(html)에 클래스를 적용 → 인라인 스크립트와 동일한 대상으로 FOUC 방지
// ✓ OK: 다크/라이트 전환 즉시 적용, 새로고침 후 유지
function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.getElementById('theme-toggle').textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

/* ── Undo Toast ── */
// ✓ OK: 토스트 뜬 상태에서 또 삭제 → clearTimeout 후 새 토스트
function showUndoToast() {
  clearTimeout(undoTimer);

  let toast = document.getElementById('undo-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'undo-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  // 애니메이션 재실행을 위한 강제 reflow
  toast.style.animation = 'none';
  void toast.offsetHeight;
  toast.style.animation = '';

  toast.innerHTML = '할 일을 삭제했어요 <span class="undo-btn" role="button" tabindex="0">되돌리기</span>';

  const undoBtn = toast.querySelector('.undo-btn');

  function restoreTask() {
    clearTimeout(undoTimer);
    if (lastDeleted) {
      // order 기준으로 원래 위치에 재삽입
      const idx = tasks.findIndex(t => t.order > lastDeleted.order);
      if (idx === -1) {
        tasks.push(lastDeleted);
      } else {
        tasks.splice(idx, 0, lastDeleted);
      }
      lastDeleted = null;
      saveToStorage();
      renderTasks();
    }
    removeUndoToast();
  }

  undoBtn.addEventListener('click', restoreTask);
  // 키보드 접근성: Enter/Space로 되돌리기
  undoBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); restoreTask(); }
  });

  undoTimer = setTimeout(removeUndoToast, 3000);
}

function removeUndoToast() {
  const toast = document.getElementById('undo-toast');
  if (toast) toast.remove();
}

/* ── CRUD ── */
function addTask(text, category = 'work') {
  const { ok, value, reason } = validateText(text);
  if (!ok) {
    alert(reason);
    return;
  }

  const now = Date.now();
  const task = {
    id: generateId(),
    text: value,
    category,
    completed: false,
    createdAt: now,
    updatedAt: now,
    order: tasks.length,
  };

  tasks.push(task);
  saveToStorage();
  renderTasks();
}

function deleteTask(id) {
  const target = tasks.find(t => t.id === id);
  if (!target) return;
  lastDeleted = { ...target };
  tasks = tasks.filter(t => t.id !== id);
  saveToStorage();
  renderTasks();
  showUndoToast();
}

// ✓ OK: 체크박스 빠른 연속 클릭 → renderTasks()가 DOM 재구성하므로 이벤트 중복 없음
function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  task.updatedAt = Date.now();
  saveToStorage();
  renderTasks();
}

function editTask(id, newText) {
  const { ok, value, reason } = validateText(newText);
  if (!ok) {
    alert(reason);
    return false;
  }
  const task = tasks.find(t => t.id === id);
  if (!task) return false;
  task.text = value;
  task.updatedAt = Date.now();
  saveToStorage();
  renderTasks();
  return true;
}

function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveToStorage();
  renderTasks();
}

/* ── Render: Header Dashboard ── */
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 34; // ≈ 213.6

// ✓ OK: total === 0 일 때 ratio = 0 처리 (NaN 방지)
function updateHeader() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const ratio     = total === 0 ? 0 : completed / total;

  // Gauge
  document.getElementById('gauge-progress').setAttribute(
    'stroke-dasharray',
    (GAUGE_CIRCUMFERENCE * ratio).toFixed(1) + ' ' + GAUGE_CIRCUMFERENCE
  );
  document.getElementById('gauge-text').textContent = Math.round(ratio * 100) + '%';

  // Category counters
  ['work', 'personal', 'study'].forEach(cat => {
    const catTotal     = tasks.filter(t => t.category === cat).length;
    const catCompleted = tasks.filter(t => t.category === cat && t.completed).length;
    document.getElementById(`counter-${cat}`).textContent = `${catCompleted} / ${catTotal}`;
  });

  // Summary text
  const summary = document.getElementById('header-summary');
  if (total === 0) {
    summary.textContent = '할 일을 추가해 보세요';
  } else if (completed === 0) {
    summary.textContent = '아직 완료한 일이 없어요';
  } else {
    summary.textContent = `오늘 완료 ${completed}개 · 남은 할 일 ${total - completed}개`;
  }

  // 완료 일괄 삭제 버튼 — 완료 항목 있을 때만 노출
  const clearBtn = document.getElementById('clear-completed');
  if (completed > 0) {
    clearBtn.textContent = `완료 삭제 (${completed})`;
    clearBtn.style.display = '';
  } else {
    clearBtn.style.display = 'none';
  }
}

/* ── Render: Filter Tabs ── */
function getIncompleteCount(category) {
  return tasks.filter(t =>
    !t.completed && (category === 'all' || t.category === category)
  ).length;
}

// ✓ OK: 탭 배지 숫자 실시간 반영
function renderFilterTabs() {
  document.querySelectorAll('.filter-tab').forEach(btn => {
    const filter   = btn.dataset.filter;
    const count    = getIncompleteCount(filter);
    const isActive = filter === currentFilter;

    btn.textContent = count > 0
      ? `${CATEGORY_LABEL[filter]} ${count}`
      : CATEGORY_LABEL[filter];

    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

/* ── Render: Tasks ── */
// ✓ OK: 미완료(createdAt 역순) → 완료(updatedAt 역순) 정렬
function getFilteredSortedTasks() {
  const filtered = currentFilter === 'all'
    ? tasks
    : tasks.filter(t => t.category === currentFilter);

  const incomplete = filtered
    .filter(t => !t.completed)
    .sort((a, b) => b.createdAt - a.createdAt);

  const complete = filtered
    .filter(t => t.completed)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return [...incomplete, ...complete];
}

/* ── Drag & Drop ── */
function addDragEvents(li, task) {
  li.draggable = true;

  li.addEventListener('dragstart', (e) => {
    dragSrcId = task.id;
    e.dataTransfer.setData('text/plain', task.id);
    // requestAnimationFrame: dragstart 중 즉시 opacity 적용 시 드래그 이미지도 투명해지는 버그 방지
    requestAnimationFrame(() => li.classList.add('dragging'));
  });

  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
    dragSrcId = null;
  });

  li.addEventListener('dragover', (e) => {
    e.preventDefault();
    li.classList.add('drag-over');
  });

  li.addEventListener('dragleave', () => {
    li.classList.remove('drag-over');
  });

  // ✓ OK: drop → order swap → 저장 → 새로고침 후 순서 유지
  li.addEventListener('drop', (e) => {
    e.preventDefault();
    li.classList.remove('drag-over');
    if (!dragSrcId || dragSrcId === task.id) return;

    const srcTask = tasks.find(t => t.id === dragSrcId);
    const tgtTask = tasks.find(t => t.id === task.id);
    if (!srcTask || !tgtTask) return;

    const tmpOrder = srcTask.order;
    srcTask.order  = tgtTask.order;
    tgtTask.order  = tmpOrder;

    saveToStorage();
    renderTasks();
  });
}

function createTaskCard(task) {
  const li = document.createElement('li');
  li.className        = 'task-card' + (task.completed ? ' completed' : '');
  li.dataset.id       = task.id;
  li.dataset.category = task.category;

  // Checkbox — ✓ OK: aria-label 추가
  const checkbox = document.createElement('input');
  checkbox.type      = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked   = task.completed;
  checkbox.setAttribute('aria-label', '할 일 완료 토글');
  checkbox.addEventListener('change', () => toggleComplete(task.id));

  // Category dot
  const dot = document.createElement('span');
  dot.className  = `cat-dot cat-${task.category}`;
  dot.setAttribute('aria-hidden', 'true');

  // Text span
  const textSpan = document.createElement('span');
  textSpan.className   = 'task-text';
  textSpan.textContent = task.text;

  if (!task.completed) {
    textSpan.setAttribute('title', '클릭하여 수정');
    textSpan.addEventListener('click', () => startEdit(task, li, textSpan));
  }

  // Delete button — ✓ OK: aria-label="삭제" 이미 있음
  const deleteBtn = document.createElement('button');
  deleteBtn.className   = 'task-delete';
  deleteBtn.textContent = '×';
  deleteBtn.setAttribute('aria-label', '삭제');
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  li.append(checkbox, dot, textSpan, deleteBtn);
  addDragEvents(li, task);

  return li;
}

// ✓ OK: ESC → 원래 텍스트 완전 복원
// Fix: committed 플래그로 Enter 후 blur 이중 호출 방지
function startEdit(task, li, textSpan) {
  if (li.querySelector('.task-edit-input')) return;

  let committed = false;

  const input = document.createElement('input');
  input.type      = 'text';
  input.className = 'task-edit-input';
  input.value     = task.text;
  input.maxLength = MAX_TEXT_LEN;
  input.setAttribute('aria-label', '할 일 수정');

  textSpan.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    if (committed) return;
    committed = true;                       // alert() 도중 blur 재진입 차단
    const success = editTask(task.id, input.value);
    if (!success) {
      committed = false;                    // 유효성 실패 시 재입력 허용
      input.focus();
    }
  }

  function cancel() {
    if (committed) return;
    committed = true;
    input.replaceWith(textSpan);
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });

  // ✓ OK: blur 시 변경된 경우만 저장, 동일하면 취소
  input.addEventListener('blur', () => {
    if (committed) return;
    if (input.value.trim() !== task.text) {
      commit();
    } else {
      cancel();
    }
  });
}

// ✓ OK: 필터별 빈 상태 메시지 정상 노출
function renderTasks() {
  const list = document.getElementById('task-list');
  list.innerHTML = '';

  renderFilterTabs();

  const sorted = getFilteredSortedTasks();

  if (sorted.length === 0) {
    const empty = document.createElement('li');
    empty.id = 'empty-state';
    const label = CATEGORY_LABEL[currentFilter];
    empty.textContent = currentFilter === 'all'
      ? '할 일이 없습니다. 새로운 할 일을 추가해 보세요!'
      : `${label} 할 일이 없어요`;
    list.appendChild(empty);
    updateHeader();
    return;
  }

  sorted.forEach(task => list.appendChild(createTaskCard(task)));
  updateHeader();
}

/* ── Event Bindings ── */
function bindEvents() {
  const input          = document.getElementById('task-input');
  const addBtn         = document.getElementById('add-btn');
  const categorySelect = document.getElementById('category-select');
  const themeToggle    = document.getElementById('theme-toggle');
  const clearBtn       = document.getElementById('clear-completed');

  // 테마 토글
  themeToggle.addEventListener('click', toggleTheme);

  // 완료 일괄 삭제
  clearBtn.addEventListener('click', clearCompleted);

  // 카테고리 select 왼쪽 border 색상 동적 변경
  const catColors = {
    work:     'var(--cat-work)',
    personal: 'var(--cat-personal)',
    study:    'var(--cat-study)',
  };

  function updateSelectBorder() {
    categorySelect.style.borderLeftColor = catColors[categorySelect.value];
  }
  categorySelect.addEventListener('change', updateSelectBorder);
  updateSelectBorder();

  // 추가
  function handleAdd() {
    addTask(input.value, categorySelect.value);
    input.value = '';
    input.focus();
  }

  addBtn.addEventListener('click', handleAdd);
  // ✓ OK: Enter 키로 추가
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
  });

  // 필터 탭 — 클릭 위임
  document.getElementById('filters').addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    currentFilter = tab.dataset.filter;
    renderTasks();
  });
}

/* ── Init ── */
// ✓ OK: 새로고침 후 데이터·테마·정렬 순서 모두 복원
function init() {
  tasks = loadFromStorage();

  // 저장된 테마 복원 (인라인 스크립트가 이미 html class를 설정했으므로 아이콘만 갱신)
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme);

  bindEvents();
  renderTasks();
}

init();
