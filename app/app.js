import {
  getAllTodos,
  getTodosByDate,
  addTodo,
  updateTodo,
  getAllSummaries,
  getSummariesByDate,
  addSummary,
  updateSummary,
  deleteSummary,
  getMeta,
  setMeta,
  getAllRecurrenceRules,
  addRecurrenceRule,
  deleteRecurrenceRule,
  getTodosByRuleId
} from './db.js';
import * as bgm from './bgm.js';
import { initSync, syncNow, pushNow, pullNow, syncAllLocalToCloud, getUserId } from './sync.js';

const input = document.getElementById('todo-input');
const dueInput = document.getElementById('todo-due');
const addBtn = document.getElementById('add-btn');
const list = document.getElementById('todo-list');
const completedList = document.getElementById('completed-list');
const completedModule = document.getElementById('completed-module');
const status = document.getElementById('status');

const summaryInput = document.getElementById('summary-input');
const summaryStatus = document.getElementById('summary-status');
const summaryRating = document.getElementById('summary-rating');
const summaryModule = document.getElementById('summary-module');
const contributionChart = document.getElementById('contribution-chart');
const contributionSummary = document.getElementById('contribution-summary');
const contributionTitle = document.getElementById('contribution-title');
const taskStatusChart = document.getElementById('task-status-chart');
const taskStatusSummary = document.getElementById('task-status-summary');
const taskStatusTitle = document.getElementById('task-status-title');

const datePrevBtn = document.getElementById('date-prev');
const dateNextBtn = document.getElementById('date-next');
const dateResetBtn = document.getElementById('date-reset');
const datePicker = document.getElementById('date-picker');
const dateWeekday = document.getElementById('date-weekday');
const syncBtn = document.getElementById('sync-btn');
const syncPullBtn = document.getElementById('sync-pull-btn');
const syncFullBtn = document.getElementById('sync-full-btn');
const syncStatus = document.getElementById('sync-status');

const recurrenceOpenBtn = document.getElementById('recurrence-open');
const recurrenceModal = document.getElementById('recurrence-modal');
const recurrenceCloseBtn = document.getElementById('recurrence-close');
const recurrenceList = document.getElementById('recurrence-list');
const recurrenceText = document.getElementById('recurrence-text');
const recurrenceType = document.getElementById('recurrence-type');
const recurrenceCustom = document.getElementById('recurrence-custom');
const recurrenceWeekly = document.getElementById('recurrence-weekly');
const recurrenceMonthly = document.getElementById('recurrence-monthly');
const recurrenceDay = document.getElementById('recurrence-day');
const recurrenceYearly = document.getElementById('recurrence-yearly');
const recurrenceMonth = document.getElementById('recurrence-month');
const recurrenceYearDay = document.getElementById('recurrence-year-day');
const recurrenceInterval = document.getElementById('recurrence-interval');
const recurrenceUnit = document.getElementById('recurrence-unit');
const recurrenceAddBtn = document.getElementById('recurrence-add');
const themeToggleBtn = document.getElementById('theme-toggle');

const timerRemainingEl = document.getElementById('timer-remaining');
const timerRingEl = document.getElementById('timer-ring');
const timerMinutesInput = document.getElementById('timer-minutes');
const timerStatusEl = document.getElementById('timer-status');
const timerVersionEl = document.getElementById('timer-version');
const timerToggleBtn = document.getElementById('timer-toggle');
const timerStopBtn = document.getElementById('timer-stop');
const bgmFileInput = document.getElementById('bgm-file');
const bgmToggleBtn = document.getElementById('bgm-toggle');
const bgmModal = document.getElementById('bgm-modal');
const bgmCloseBtn = document.getElementById('bgm-close');
const bgmCurrentName = document.getElementById('bgm-current-name');
const bgmVolume = document.getElementById('bgm-volume');
const alarmVolume = document.getElementById('alarm-volume');
const APP_VERSION = 'v0.1.1';
const RECURRENCE_SKIP_META_KEY = 'recurrenceSkips';
const CONTRIBUTION_START_YEAR = 2026;
const TIMER_LEASE_KEY = 'pwaTodo.timerLease';
const TIMER_LEASE_TTL_MS = 4000;
const TIMER_LEASE_HEARTBEAT_MS = 2000;

let todos = [];
let summaries = [];
let selectedDate = formatDateLocal(new Date());
let migrationDone = false;
let recurrenceRules = [];
const MAX_IN_PROGRESS_TODOS = 2;
const IN_PROGRESS_META_KEY = 'todoInProgress';
let inProgressTodos = new Map();
let restoreInProgressPromise = null;
const runningTimeEls = new Map();
let runningTicker = null;
let contributionScores = new Map();
let taskCompletionStatusByDate = new Map();
let contributionResizeRaf = 0;
let contributionHalfKey = '';
let contributionFollowCurrentHalf = true;
let contributionLastCurrentHalfKey = '';
const timerInstanceId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// -------- Date helpers --------
function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function shiftDate(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeekMonday(date) {
  const next = new Date(date);
  const weekday = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - weekday);
  return next;
}

function formatMonthShort(date) {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function formatTooltipDate(dateStr) {
  return parseDateLocal(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getContributionHalfPeriod(date = new Date()) {
  const year = date.getFullYear();
  const half = date.getMonth() < 6 ? 1 : 2;
  return {
    year,
    half,
    key: `${year}-H${half}`
  };
}

function formatContributionHalfLabel(period) {
  return `${period.year}${period.half === 1 ? '上' : '下'}`;
}

function formatContributionHalfTitle(period) {
  return `${period.year}${period.half === 1 ? '上' : '下'}半年热力图`;
}

function getContributionHalfRange(period) {
  const startMonth = period.half === 1 ? 0 : 6;
  const endMonth = period.half === 1 ? 5 : 11;
  return {
    startDate: new Date(period.year, startMonth, 1),
    endDate: new Date(period.year, endMonth + 1, 0)
  };
}

function buildContributionHalfPeriods(today = new Date()) {
  const current = getContributionHalfPeriod(today);
  const periods = [];
  for (let year = CONTRIBUTION_START_YEAR; year <= current.year; year += 1) {
    periods.push({ year, half: 1, key: `${year}-H1` });
    if (year < current.year || current.half === 2) {
      periods.push({ year, half: 2, key: `${year}-H2` });
    }
  }
  return periods;
}

function getActiveContributionPeriod(periods, currentPeriod) {
  if (!periods.length) return null;
  if (
    contributionFollowCurrentHalf &&
    contributionLastCurrentHalfKey &&
    contributionLastCurrentHalfKey !== currentPeriod.key
  ) {
    contributionHalfKey = currentPeriod.key;
  }
  contributionLastCurrentHalfKey = currentPeriod.key;
  if (!contributionHalfKey || !periods.some(period => period.key === contributionHalfKey)) {
    contributionHalfKey = currentPeriod.key;
  }
  return periods.find(period => period.key === contributionHalfKey) || currentPeriod;
}

function updateContributionCellSize(wrapper) {
  if (!wrapper) return;
  const weekCount = Number(wrapper.style.getPropertyValue('--weeks'));
  if (!Number.isFinite(weekCount) || weekCount <= 0) return;
  const styles = getComputedStyle(wrapper);
  const labelWidth = parseFloat(styles.getPropertyValue('--contrib-label-width')) || 24;
  const gap = parseFloat(styles.getPropertyValue('--contrib-gap')) || 2;
  const gridGap = parseFloat(styles.gap) || 6;
  const chartWidth = wrapper.clientWidth;
  const cellsWidth = Math.max(0, chartWidth - labelWidth - gridGap);
  const size = Math.max(10, Math.floor((cellsWidth - gap * (weekCount - 1)) / weekCount));
  wrapper.style.setProperty('--contrib-cell-size', `${size}px`);
}

function pinContributionToTop() {
  const target = contributionChart?.closest('.contribution-card') || summaryModule;
  if (!target) return;
  target.scrollIntoView({ block: 'start' });
}

function schedulePinContributionToTop() {
  requestAnimationFrame(() => {
    requestAnimationFrame(pinContributionToTop);
  });
}

async function setSelectedDate(dateStr, options = {}) {
  const previousDate = selectedDate;
  selectedDate = dateStr;
  if (datePicker) datePicker.value = dateStr;
  if (dateWeekday) {
    const date = parseDateLocal(dateStr);
    const weekdays = ['\u5468\u65e5', '\u5468\u4e00', '\u5468\u4e8c', '\u5468\u4e09', '\u5468\u56db', '\u5468\u4e94', '\u5468\u516d'];
    dateWeekday.textContent = weekdays[date.getDay()];
  }
  ensureRecurrenceForDate(dateStr);
  if (previousDate) {
    const today = formatDateLocal(new Date());
    const yesterday = formatDateLocal(new Date(Date.now() - 86400000));
    if (previousDate === yesterday && dateStr === today) {
      await carryOverIncomplete(previousDate, dateStr);
      await loadForDate();
    } else {
      await loadForDate();
    }
  } else {
    await loadForDate();
  }
  if (options.keepContributionVisible) {
    schedulePinContributionToTop();
  }
}

function generateUUID() {
  if (crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function ensureUserId() {
  if (currentUserId) return currentUserId;
  const fromSync = getUserId();
  if (fromSync) {
    currentUserId = fromSync;
    return currentUserId;
  }
  currentUserId = generateUUID();
  return currentUserId;
}

// -------- Todo logic --------
async function migrateMissingTodoDates() {
  if (migrationDone) return;
  migrationDone = true;
  const all = await getAllTodos();
  const now = new Date().toISOString();
  const today = formatDateLocal(new Date());
  const missingDateTodos = all.filter(todo => !todo.date);
  await Promise.all(
    missingDateTodos
      .map(todo =>
        updateTodo({
          ...todo,
          date: today,
          updatedAt: todo.updatedAt || todo.createdAt || now
        })
      )
  );
  if (missingDateTodos.length) triggerChangeSync();
}

async function loadTodos() {
  if (restoreInProgressPromise) await restoreInProgressPromise;
  await migrateMissingTodoDates();
  await pruneInProgressTodos();
  todos = await getTodosByDate(selectedDate);
  renderTodos();
}

async function carryOverIncomplete(fromDate, toDate) {
  const fromTodos = await getTodosByDate(fromDate);
  const now = new Date().toISOString();
  let hasChanges = false;
  const normalizeTodoText = value => (typeof value === 'string' ? value.trim() : '');

  for (const todo of fromTodos) {
    if (todo.deletedAt) continue;
    if (todo.completed) continue;
    if (!todo.uuid) {
      todo.uuid = generateUUID();
      await updateTodo({ ...todo, updatedAt: now });
      hasChanges = true;
    }
    const latestToTodos = await getTodosByDate(toDate);
    const hasSameCarrySource = latestToTodos.some(target =>
      !target.deletedAt && target.carriedFrom === todo.uuid
    );
    if (hasSameCarrySource) continue;

    // 同一天已有同名任务（含日常自动生成）时，不再从昨日续延，避免先出现重复再靠同步清理
    const nextText = normalizeTodoText(todo.text);
    const hasSameNameTodo = latestToTodos.some(target =>
      !target.deletedAt && normalizeTodoText(target.text) === nextText
    );
    if (hasSameNameTodo) continue;

    // 兜底去重：兼容旧数据或跨端产生的无 carriedFrom 副本
    const hasSameFallbackCopy = latestToTodos.some(target =>
      !target.deletedAt &&
      !target.recurrenceRuleId &&
      !target.carriedFrom &&
      target.text === todo.text &&
      (target.dueMinutes ?? null) === (todo.dueMinutes ?? null)
    );
    if (hasSameFallbackCopy) continue;

    const userId = currentUserId ||
      (syncInitPromise ? (await syncInitPromise).userId : ensureUserId());
    await addTodo({
      date: toDate,
      text: todo.text,
      completed: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      dueMinutes: todo.dueMinutes ?? null,
      recurrenceRuleId: null,
      carriedFrom: todo.uuid,
      uuid: generateUUID(),
      userId
    });
    hasChanges = true;
  }
  if (hasChanges) triggerChangeSync();
}

function renderTodos() {
  list.innerHTML = '';
  if (completedList) completedList.innerHTML = '';
  runningTimeEls.clear();
  const visibleTodos = todos
    .filter(todo => !todo.deletedAt);
  const pendingTodos = visibleTodos
    .filter(todo => !todo.completed)
    .sort((a, b) => {
      const aTime = Date.parse(a.updatedAt || a.createdAt || 0);
      const bTime = Date.parse(b.updatedAt || b.createdAt || 0);
      return bTime - aTime;
    });
  const doneTodos = visibleTodos
    .filter(todo => todo.completed)
    .sort((a, b) => {
      const aTime = Date.parse(a.updatedAt || a.createdAt || 0);
      const bTime = Date.parse(b.updatedAt || b.createdAt || 0);
      return bTime - aTime;
    });

  const renderTodoItem = (todo, targetList) => {
    const li = document.createElement('li');
    li.className = todo.completed ? 'completed' : '';
    if (isTodoInProgress(todo)) li.classList.add('in-progress');
    li.dataset.id = String(todo.id);

    const content = document.createElement('div');
    content.className = 'todo-content';
    const mainRow = document.createElement('div');
    mainRow.className = 'todo-main';
    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;
    text.ondblclick = event => {
      event.stopPropagation();
      beginTodoEdit(todo, li, mainRow, text);
    };
    mainRow.appendChild(text);

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.type = 'button';
    del.textContent = '删除';
    del.onclick = async event => {
      event.stopPropagation();
      const now = new Date().toISOString();
      await updateTodo({
        ...todo,
        deletedAt: now,
        updatedAt: now
      });
      if (todo.recurrenceRuleId != null) {
        await addRecurrenceSkip(todo.date, Number(todo.recurrenceRuleId));
      }
      await clearTodoInProgress(todo.uuid);
      triggerChangeSync();
      loadTodos();
    };

    if (Number.isFinite(todo.dueMinutes)) {
      const due = document.createElement('span');
      due.className = 'todo-due';
      due.textContent = `预计 ${todo.dueMinutes} min`;
      mainRow.appendChild(due);
    }
    content.appendChild(mainRow);

    if (isTodoInProgress(todo) && todo.uuid) {
      const runningTime = document.createElement('div');
      runningTime.className = 'todo-running-time';
      runningTimeEls.set(todo.uuid, runningTime);
      updateRunningTimeEl(todo.uuid, runningTime);
      content.appendChild(runningTime);
    }

    const progressBtn = document.createElement('button');
    progressBtn.className = 'progress-btn';
    progressBtn.type = 'button';
    progressBtn.textContent = isTodoInProgress(todo) ? '停止' : '进行';
    progressBtn.onclick = async event => {
      event.stopPropagation();
      const changed = await toggleTodoInProgress(todo);
      if (changed) loadTodos();
    };

    const actions = document.createElement('div');
    actions.className = 'todo-actions';
    actions.appendChild(progressBtn);
    actions.appendChild(del);
    li.appendChild(content);
    li.appendChild(actions);
    li.onclick = async event => {
      if (event.detail > 1) return;
      if (li.classList.contains('editing')) return;
      const nextCompleted = !todo.completed;
      await updateTodo({
        ...todo,
        completed: nextCompleted,
        updatedAt: new Date().toISOString()
      });
      if (nextCompleted) await clearTodoInProgress(todo.uuid);
      triggerChangeSync();
      loadTodos();
    };
    targetList.appendChild(li);
  };

  pendingTodos.forEach(todo => renderTodoItem(todo, list));
  if (completedList) {
    doneTodos.forEach(todo => renderTodoItem(todo, completedList));
  }
  if (completedModule) {
    completedModule.classList.toggle('hidden', doneTodos.length === 0);
  }
}

function isTodoInProgress(todo) {
  return Boolean(todo && todo.uuid && inProgressTodos.has(todo.uuid));
}

function formatElapsed(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function updateRunningTimeEl(uuid, el) {
  const startAt = inProgressTodos.get(uuid);
  if (!startAt) {
    el.textContent = '进行中 00:00:00';
    return;
  }
  el.textContent = `进行中 ${formatElapsed(Date.now() - startAt)}`;
}

function tickRunningTimes() {
  for (const [uuid, el] of runningTimeEls.entries()) {
    if (!el.isConnected) {
      runningTimeEls.delete(uuid);
      continue;
    }
    updateRunningTimeEl(uuid, el);
  }
}

function ensureRunningTicker() {
  if (runningTicker) return;
  runningTicker = setInterval(tickRunningTimes, 1000);
}

async function persistInProgressTodos() {
  const payload = Array.from(inProgressTodos.entries())
    .slice(0, MAX_IN_PROGRESS_TODOS)
    .map(([uuid, startAt]) => ({ uuid, startAt }));
  await setMeta(IN_PROGRESS_META_KEY, payload);
}

async function restoreInProgressTodos() {
  const record = await getMeta(IN_PROGRESS_META_KEY);
  const value = record && Array.isArray(record.value) ? record.value : [];
  const next = new Map();
  const now = Date.now();
  for (const item of value) {
    if (!item || typeof item.uuid !== 'string') continue;
    if (next.size >= MAX_IN_PROGRESS_TODOS) break;
    const startAt = Number(item.startAt);
    next.set(item.uuid, Number.isFinite(startAt) && startAt > 0 ? startAt : now);
  }
  inProgressTodos = next;
}

async function pruneInProgressTodos() {
  if (!inProgressTodos.size) return;
  const all = await getAllTodos();
  const valid = new Set(
    all
      .filter(
        todo =>
          !todo.deletedAt &&
          !todo.completed &&
          todo.uuid &&
          todo.date === selectedDate
      )
      .map(todo => todo.uuid)
  );
  let changed = false;
  for (const uuid of Array.from(inProgressTodos.keys())) {
    if (valid.has(uuid)) continue;
    inProgressTodos.delete(uuid);
    changed = true;
  }
  if (inProgressTodos.size > MAX_IN_PROGRESS_TODOS) {
    const kept = Array.from(inProgressTodos.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, MAX_IN_PROGRESS_TODOS);
    const keepSet = new Set(kept.map(([uuid]) => uuid));
    for (const uuid of Array.from(inProgressTodos.keys())) {
      if (keepSet.has(uuid)) continue;
      inProgressTodos.delete(uuid);
      changed = true;
    }
  }
  if (changed) await persistInProgressTodos();
}

async function clearTodoInProgress(uuid) {
  if (!uuid || !inProgressTodos.has(uuid)) return false;
  inProgressTodos.delete(uuid);
  await persistInProgressTodos();
  return true;
}

async function toggleTodoInProgress(todo) {
  await pruneInProgressTodos();
  if (!todo || !todo.uuid) {
    setStatus('任务缺少标识，无法设为进行中');
    return false;
  }
  if (todo.completed || todo.deletedAt) {
    setStatus('已完成或已删除任务不能设为进行中');
    return false;
  }
  if (inProgressTodos.has(todo.uuid)) {
    inProgressTodos.delete(todo.uuid);
    await persistInProgressTodos();
    return true;
  }
  if (inProgressTodos.size >= MAX_IN_PROGRESS_TODOS) {
    setStatus('最多同时进行 2 个任务');
    return false;
  }
  inProgressTodos.set(todo.uuid, Date.now());
  await persistInProgressTodos();
  return true;
}

function beginTodoEdit(todo, li, textContainer, textNode) {
  if (li.classList.contains('editing')) return;
  li.classList.add('editing');
  const inputEdit = document.createElement('input');
  inputEdit.className = 'edit-input';
  inputEdit.type = 'text';
  inputEdit.value = todo.text;
  textContainer.replaceChild(inputEdit, textNode);
  inputEdit.focus();
  inputEdit.setSelectionRange(inputEdit.value.length, inputEdit.value.length);

  const finish = async save => {
    if (!li.classList.contains('editing')) return;
    li.classList.remove('editing');
    const nextText = inputEdit.value.trim();
    if (save && !nextText) {
      setStatus('内容不能为空');
      loadTodos();
      return;
    }
    if (save && nextText !== todo.text) {
      await updateTodo({
        ...todo,
        text: nextText,
        updatedAt: new Date().toISOString()
      });
      triggerChangeSync();
    }
    loadTodos();
  };

  inputEdit.onkeydown = event => {
    if (event.key === 'Enter') finish(true);
    if (event.key === 'Escape') finish(false);
  };
  inputEdit.onblur = () => finish(true);
  inputEdit.onclick = event => event.stopPropagation();
}

function setStatus(message) {
  if (!status) return;
  status.textContent = message;
  if (message) {
    setTimeout(() => {
      if (status.textContent === message) status.textContent = '';
    }, 1500);
  }
}

addBtn.onclick = async () => {
  const text = input.value.trim();
  if (!text) {
    setStatus('请输入待办事项');
    return;
  }
  let dueMinutes = null;
  if (dueInput && dueInput.value.trim()) {
    const parsed = Number(dueInput.value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setStatus('预计时长需为非负数字');
      return;
    }
    dueMinutes = Math.floor(parsed);
  }
  const now = new Date().toISOString();
  const initResult = syncInitPromise ? await syncInitPromise : null;
  const userId = currentUserId ||
    (initResult && initResult.userId ? initResult.userId : ensureUserId());
  await addTodo({
    date: selectedDate,
    text,
    completed: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    dueMinutes,
    uuid: generateUUID(),
    userId
  });
  triggerChangeSync();
  input.value = '';
  if (dueInput) dueInput.value = '';
  setStatus('');
  loadTodos();
};

input.addEventListener('keydown', event => {
  if (event.key === 'Enter') addBtn.click();
});

if (dueInput) {
  dueInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') addBtn.click();
  });
}

// -------- Summary logic --------
async function loadSummaries() {
  summaries = await getSummariesByDate(selectedDate);
  const latest = summaries
    .filter(summary => !summary.deletedAt)
    .sort((a, b) => {
      const aTime = Date.parse(a.updatedAt || a.createdAt || 0);
      const bTime = Date.parse(b.updatedAt || b.createdAt || 0);
      return bTime - aTime;
    })[0];
  summaryInput.value = latest ? latest.text : '';
  summaryRatingValue = latest && typeof latest.rating === 'number' ? latest.rating : 0;
  renderSummaryRating();
  autoResizeSummary();
  await renderContributionChart();
}

async function renderContributionChart() {
  if (!contributionChart && !taskStatusChart) return;
  const allSummaries = await getAllSummaries();
  const allTodos = await getAllTodos();
  const latestByDate = new Map();
  const todoStatusByDate = new Map();

  allSummaries
    .filter(summary => !summary.deletedAt)
    .sort((a, b) => {
      const aTime = Date.parse(a.updatedAt || a.createdAt || 0);
      const bTime = Date.parse(b.updatedAt || b.createdAt || 0);
      return bTime - aTime;
    })
    .forEach(summary => {
      if (!summary.date || latestByDate.has(summary.date)) return;
      const rawRating = typeof summary.rating === 'number' ? summary.rating : 0;
      const level = Math.max(0, Math.min(10, Math.round(rawRating * 2)));
      latestByDate.set(summary.date, level);
    });

  allTodos
    .filter(todo => !todo.deletedAt && todo.date)
    .forEach(todo => {
      const current = todoStatusByDate.get(todo.date) || { total: 0, completed: 0 };
      current.total += 1;
      if (todo.completed) current.completed += 1;
      todoStatusByDate.set(todo.date, current);
    });

  contributionScores = latestByDate;
  taskCompletionStatusByDate = new Map(
    [...todoStatusByDate.entries()].map(([date, status]) => [
      date,
      status.total > 0 && status.completed === status.total ? 'complete' : 'incomplete'
    ])
  );

  const periods = buildContributionHalfPeriods(new Date());
  const currentPeriod = getContributionHalfPeriod(new Date());
  const todayDateStr = formatDateLocal(new Date());
  if (!periods.length) return;
  const activePeriod = getActiveContributionPeriod(periods, currentPeriod);
  if (!activePeriod) return;

  const { startDate: firstDate, endDate } = getContributionHalfRange(activePeriod);
  const gridStart = startOfWeekMonday(firstDate);
  const diffDays = Math.round((endDate - gridStart) / 86400000);
  const totalDays = diffDays + 1;
  const weekCount = Math.ceil(totalDays / 7);

  const buildChart = ({ chartEl, getCellData, includePeriodNav = false }) => {
    if (!chartEl) return { countA: 0, countB: 0, countC: 0 };

    const layout = document.createElement('div');
    layout.className = 'contribution-layout';

    const wrapper = document.createElement('div');
    wrapper.className = 'contribution-grid';
    wrapper.style.setProperty('--weeks', String(weekCount));

    const months = document.createElement('div');
    months.className = 'contribution-months';
    let lastLabeledMonth = null;
    for (let week = 0; week < weekCount; week += 1) {
      const monthLabel = document.createElement('span');
      monthLabel.className = 'contribution-month';
      const weekStart = shiftDate(gridStart, week * 7);
      const columnDate = weekStart < firstDate ? firstDate : weekStart;
      const monthKey = `${columnDate.getFullYear()}-${columnDate.getMonth()}`;
      if (columnDate <= endDate && monthKey !== lastLabeledMonth) {
        monthLabel.textContent = formatMonthShort(columnDate);
        lastLabeledMonth = monthKey;
      }
      monthLabel.style.gridColumn = String(week + 1);
      months.appendChild(monthLabel);
    }

    const weekdays = document.createElement('div');
    weekdays.className = 'contribution-weekdays';
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(label => {
      const item = document.createElement('span');
      item.textContent = label;
      weekdays.appendChild(item);
    });

    const cells = document.createElement('div');
    cells.className = 'contribution-cells';
    const tooltip = document.createElement('div');
    tooltip.className = 'contribution-tooltip';
    tooltip.setAttribute('role', 'status');
    tooltip.setAttribute('aria-live', 'polite');

    let countA = 0;
    let countB = 0;
    let countC = 0;

    const hideTooltip = () => {
      tooltip.classList.remove('is-visible');
    };

    const showTooltip = (button, label) => {
      const chartRect = chartEl.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      tooltip.textContent = label;
      tooltip.classList.add('is-visible');
      const tooltipWidth = tooltip.offsetWidth;
      const tooltipHeight = tooltip.offsetHeight;
      const sideOffset = 12;
      const verticalOffset = 10;
      const rightLeft = buttonRect.right - chartRect.left + sideOffset;
      const leftLeft = buttonRect.left - chartRect.left - tooltipWidth - sideOffset;
      const maxLeft = Math.max(4, chartRect.width - tooltipWidth - 4);
      const left = rightLeft <= maxLeft ? rightLeft : Math.max(4, leftLeft);
      const belowTop = buttonRect.bottom - chartRect.top + verticalOffset;
      const aboveTop = buttonRect.top - chartRect.top - tooltipHeight - verticalOffset;
      const maxTop = Math.max(4, chartRect.height - tooltipHeight - 4);
      const top = belowTop <= maxTop ? belowTop : Math.max(4, aboveTop);
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };

    for (let week = 0; week < weekCount; week += 1) {
      for (let day = 0; day < 7; day += 1) {
        const cellDate = shiftDate(gridStart, week * 7 + day);
        if (cellDate < firstDate || cellDate > endDate) {
          const spacer = document.createElement('span');
          spacer.className = 'contribution-cell is-outside';
          spacer.setAttribute('aria-hidden', 'true');
          cells.appendChild(spacer);
          continue;
        }

        const dateStr = formatDateLocal(cellDate);
        const cell = getCellData(dateStr);
        countA += cell.countA || 0;
        countB += cell.countB || 0;
        countC += cell.countC || 0;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'contribution-cell';
        if (cell.level != null) button.dataset.level = String(cell.level);
        if (cell.status) button.dataset.status = cell.status;
        button.setAttribute('aria-label', cell.tooltip);
        button.addEventListener('mouseenter', () => showTooltip(button, cell.tooltip));
        button.addEventListener('focus', () => showTooltip(button, cell.tooltip));
        button.addEventListener('mouseleave', hideTooltip);
        button.addEventListener('blur', hideTooltip);
        button.addEventListener('click', () => {
          void setSelectedDate(dateStr, { keepContributionVisible: true });
        });
        cells.appendChild(button);
      }
    }

    wrapper.appendChild(months);
    wrapper.appendChild(weekdays);
    wrapper.appendChild(cells);
    layout.appendChild(wrapper);

    if (includePeriodNav) {
      const periodNav = document.createElement('div');
      periodNav.className = 'contribution-periods';
      periods
        .slice()
        .reverse()
        .forEach(period => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'contribution-period';
          if (period.key === activePeriod.key) button.classList.add('is-active');
          button.textContent = formatContributionHalfLabel(period);
          button.setAttribute('aria-pressed', period.key === activePeriod.key ? 'true' : 'false');
          button.addEventListener('click', () => {
            if (contributionHalfKey === period.key) return;
            contributionHalfKey = period.key;
            contributionFollowCurrentHalf = period.key === currentPeriod.key;
            void renderContributionChart();
          });
          periodNav.appendChild(button);
        });
      layout.appendChild(periodNav);
    }

    chartEl.replaceChildren(layout, tooltip);
    updateContributionCellSize(wrapper);
    return { countA, countB, countC };
  };

  const focusStats = buildChart({
    chartEl: contributionChart,
    includePeriodNav: true,
    getCellData: dateStr => {
      const level = contributionScores.get(dateStr) ?? 0;
      return {
        level,
        tooltip: `${formatTooltipDate(dateStr)}?\u4e13\u6ce8${level}\u6b21`,
        countA: level > 0 ? 1 : 0,
        countB: level
      };
    }
  });

  const taskStats = buildChart({
    chartEl: taskStatusChart,
    includePeriodNav: true,
    getCellData: dateStr => {
      const status = dateStr >= todayDateStr
        ? 'pending'
        : (taskCompletionStatusByDate.get(dateStr) || 'empty');
      const tooltipText = status === 'complete'
        ? '\u4efb\u52a1\u5df2\u5168\u90e8\u5b8c\u6210'
        : status === 'incomplete'
          ? '\u5b58\u5728\u672a\u5b8c\u6210\u4efb\u52a1'
          : status === 'empty'
            ? '\u5f53\u5929\u6ca1\u6709\u4efb\u52a1'
            : '\u5f53\u5929\u5c1a\u672a\u7ed3\u675f';
      return {
        status,
        tooltip: `${formatTooltipDate(dateStr)}?${tooltipText}`,
        countA: status === 'complete' ? 1 : 0,
        countB: status === 'incomplete' ? 1 : 0,
        countC: status === 'empty' ? 1 : 0
      };
    }
  });

  if (contributionTitle) {
    contributionTitle.textContent = formatContributionHalfTitle(activePeriod);
  }
  if (contributionChart) {
    contributionChart.setAttribute('aria-label', formatContributionHalfTitle(activePeriod));
  }
  if (contributionSummary) {
    const average = focusStats.countA ? (focusStats.countB / focusStats.countA).toFixed(1) : '0.0';
    contributionSummary.textContent = `${formatContributionHalfLabel(activePeriod)}\u4e13\u6ce8\u5171 ${focusStats.countB} \u6b21\uff0c\u5e73\u5747 ${average} / 10`;
  }
  if (taskStatusTitle) {
    taskStatusTitle.textContent = `${formatContributionHalfLabel(activePeriod)}\u4efb\u52a1\u5b8c\u6210\u56fe`;
  }
  if (taskStatusChart) {
    taskStatusChart.setAttribute('aria-label', `${formatContributionHalfLabel(activePeriod)}\u4efb\u52a1\u5b8c\u6210\u60c5\u51b5\u56fe`);
  }
  if (taskStatusSummary) {
    taskStatusSummary.textContent = `\u5168\u5b8c\u6210 ${taskStats.countA} \u5929\uff0c\u672a\u5b8c\u6210 ${taskStats.countB} \u5929\uff0c\u65e0\u4efb\u52a1 ${taskStats.countC} \u5929`;
  }
}

window.addEventListener('resize', () => {
  if (contributionResizeRaf) cancelAnimationFrame(contributionResizeRaf);
  contributionResizeRaf = requestAnimationFrame(() => {
    contributionResizeRaf = 0;
    updateContributionCellSize(contributionChart?.querySelector('.contribution-grid'));
    updateContributionCellSize(taskStatusChart?.querySelector('.contribution-grid'));
  });
});

// -------- Recurrence rules --------
async function loadRecurrenceRules() {
  recurrenceRules = (await getAllRecurrenceRules()).filter(rule => !rule.deletedAt);
  renderRecurrenceRules();
}

async function getSkippedRuleIdsForDate(dateStr) {
  const record = await getMeta(RECURRENCE_SKIP_META_KEY);
  if (!record || !record.value || typeof record.value !== 'object') return new Set();
  const ids = record.value[dateStr];
  if (!Array.isArray(ids)) return new Set();
  return new Set(ids.map(Number).filter(Number.isFinite));
}

async function addRecurrenceSkip(dateStr, ruleId) {
  if (!dateStr || !Number.isFinite(ruleId)) return;
  const record = await getMeta(RECURRENCE_SKIP_META_KEY);
  const value = record && record.value && typeof record.value === 'object'
    ? { ...record.value }
    : {};
  const current = Array.isArray(value[dateStr]) ? value[dateStr] : [];
  if (current.includes(ruleId)) return;
  value[dateStr] = [...current, ruleId];
  await setMeta(RECURRENCE_SKIP_META_KEY, value);
}

function renderRecurrenceRules() {
  if (!recurrenceList) return;
  recurrenceList.innerHTML = '';
  const ordered = [...recurrenceRules].sort((a, b) => a.id - b.id);
  ordered.forEach(rule => {
    const li = document.createElement('li');
    const text = document.createElement('span');
    text.className = 'recurrence-text';
    text.textContent = `${rule.text} · ${formatRecurrence(rule)}`;

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.type = 'button';
    del.textContent = '删除';
    del.onclick = async event => {
      event.stopPropagation();
      await deleteRecurrenceRule(rule.id);
      const today = getTodayDateStr();
      const related = await getTodosByRuleId(rule.id);
      const future = related.filter(todo => todo.date > today && !todo.deletedAt);
      await Promise.all(
        future.map(todo =>
          updateTodo({
            ...todo,
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        )
      );
      triggerChangeSync();
      loadRecurrenceRules();
    };

    li.appendChild(text);
    li.appendChild(del);
    recurrenceList.appendChild(li);
  });
}

function formatRecurrence(rule) {
  if (rule.type === 'daily') return '每天重复';
  if (rule.type === 'weekly') {
    const map = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const days = (rule.weekdays || []).map(d => map[d]).join('、');
    return `每周重复（${days || '未选'}）`;
  }
  if (rule.type === 'monthly') {
    return `每月重复（${rule.day || '-'}号）`;
  }
  if (rule.type === 'yearly') {
    const month = rule.month ? `${rule.month}月` : '-月';
    const day = rule.day ? `${rule.day}号` : '-号';
    return `每年重复（${month}${day}）`;
  }
  if (rule.type === 'workday') return '每个工作日重复';
  if (rule.type === 'custom') {
    const unitMap = { day: '天', week: '周', month: '月', year: '年' };
    return `每 ${rule.interval} ${unitMap[rule.unit] || ''}`;
  }
  return '';
}

function getTodayDateStr() {
  return formatDateLocal(new Date());
}

function isDateOnOrAfter(dateStr, compareStr) {
  return dateStr >= compareStr;
}

function dateMatchesRule(dateStr, rule) {
  const date = parseDateLocal(dateStr);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const weekday = date.getDay();

  if (rule.type === 'daily') return true;
  if (rule.type === 'weekly') {
    return Array.isArray(rule.weekdays) && rule.weekdays.includes(weekday);
  }
  if (rule.type === 'monthly') {
    return Number(rule.day) === day;
  }
  if (rule.type === 'yearly') {
    return Number(rule.month) === month && Number(rule.day) === day;
  }
  if (rule.type === 'workday') {
    return weekday >= 1 && weekday <= 5;
  }
  if (rule.type === 'custom') {
    const start = rule.createdAt ? parseDateLocal(rule.createdAt.slice(0, 10)) : null;
    if (!start || !rule.interval || !rule.unit) return false;
    const interval = Number(rule.interval);
    if (!interval || interval < 1) return false;
    if (rule.unit === 'day') {
      const diffDays = Math.floor((date - start) / 86400000);
      return diffDays >= 0 && diffDays % interval === 0;
    }
    if (rule.unit === 'week') {
      const diffDays = Math.floor((date - start) / 86400000);
      return diffDays >= 0 && diffDays % (interval * 7) === 0;
    }
    if (rule.unit === 'month') {
      const diffMonths = (date.getFullYear() - start.getFullYear()) * 12 +
        (date.getMonth() - start.getMonth());
      return diffMonths >= 0 && diffMonths % interval === 0 && day === start.getDate();
    }
    if (rule.unit === 'year') {
      const diffYears = date.getFullYear() - start.getFullYear();
      return diffYears >= 0 && diffYears % interval === 0 &&
        month === start.getMonth() + 1 && day === start.getDate();
    }
  }
  return false;
}

async function ensureRecurrenceForDate(dateStr) {
  const today = getTodayDateStr();
  if (!isDateOnOrAfter(dateStr, today)) return;
  const rules = (await getAllRecurrenceRules()).filter(rule => !rule.deletedAt);
  if (!rules.length) return;
  const skippedRuleIds = await getSkippedRuleIdsForDate(dateStr);
  const todosForDate = await getTodosByDate(dateStr);
  const normalizedNames = new Set(
    todosForDate
      .filter(todo => !todo.deletedAt)
      .map(todo => (typeof todo.text === 'string' ? todo.text.trim() : ''))
      .filter(Boolean)
  );
  const existingRuleIds = new Set(
    todosForDate
      .filter(todo => todo.recurrenceRuleId != null)
      .map(todo => todo.recurrenceRuleId)
  );
  const now = new Date().toISOString();
  let hasChanges = false;
  for (const rule of rules) {
    if (!dateMatchesRule(dateStr, rule)) continue;
    if (skippedRuleIds.has(rule.id)) continue;
    if (existingRuleIds.has(rule.id)) continue;
    const ruleText = typeof rule.text === 'string' ? rule.text.trim() : '';
    if (ruleText && normalizedNames.has(ruleText)) continue;
    const initResult = syncInitPromise ? await syncInitPromise : null;
    const userId = currentUserId ||
      (initResult && initResult.userId ? initResult.userId : ensureUserId());
    await addTodo({
      date: dateStr,
      text: rule.text,
      completed: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      dueMinutes: null,
      recurrenceRuleId: rule.id,
      uuid: generateUUID(),
      userId
    });
    if (ruleText) normalizedNames.add(ruleText);
    hasChanges = true;
  }
  if (hasChanges) triggerChangeSync();
}

function toggleRecurrenceCustom() {
  const type = recurrenceType ? recurrenceType.value : '';
  if (recurrenceCustom) {
    recurrenceCustom.classList.toggle('hidden', type !== 'custom');
  }
  if (recurrenceWeekly) {
    recurrenceWeekly.classList.toggle('hidden', type !== 'weekly');
  }
  if (recurrenceMonthly) {
    recurrenceMonthly.classList.toggle('hidden', type !== 'monthly');
  }
  if (recurrenceYearly) {
    recurrenceYearly.classList.toggle('hidden', type !== 'yearly');
  }
}

if (recurrenceType) recurrenceType.addEventListener('change', toggleRecurrenceCustom);

if (recurrenceAddBtn) {
  recurrenceAddBtn.addEventListener('click', async () => {
    const text = recurrenceText.value.trim();
    if (!text) return;
    const now = new Date().toISOString();
    const type = recurrenceType.value;
    let weekdays = null;
    let day = null;
    let month = null;
    if (type === 'weekly' && recurrenceWeekly) {
      const selected = Array.from(
        recurrenceWeekly.querySelectorAll('input[type=\"checkbox\"]:checked')
      ).map(el => Number(el.value));
      if (!selected.length) return;
      weekdays = selected;
    }
    if (type === 'yearly' && recurrenceMonth && recurrenceYearDay) {
      month = Number(recurrenceMonth.value);
      day = Number(recurrenceYearDay.value);
    } else if (type === 'monthly' && recurrenceDay) {
      day = Number(recurrenceDay.value);
    }
    const rule = {
      text,
      type,
      weekdays,
      day,
      month,
      interval: type === 'custom' ? Number(recurrenceInterval.value) : null,
      unit: type === 'custom' ? recurrenceUnit.value : null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      uuid: generateUUID()
    };
    await addRecurrenceRule(rule);
    triggerChangeSync();
    recurrenceText.value = '';
    if (recurrenceWeekly) {
      recurrenceWeekly.querySelectorAll('input[type=\"checkbox\"]').forEach(el => {
        el.checked = false;
      });
    }
    loadRecurrenceRules();
  });
}

if (recurrenceOpenBtn) {
  recurrenceOpenBtn.addEventListener('click', () => {
    if (!recurrenceModal) return;
    recurrenceModal.classList.remove('hidden');
    toggleRecurrenceCustom();
    loadRecurrenceRules();
  });
}

if (recurrenceCloseBtn) {
  recurrenceCloseBtn.addEventListener('click', () => {
    if (recurrenceModal) recurrenceModal.classList.add('hidden');
  });
}

if (recurrenceModal) {
  recurrenceModal.addEventListener('click', event => {
    if (event.target === recurrenceModal) recurrenceModal.classList.add('hidden');
  });
}

function setSummaryStatus(message) {
  if (!summaryStatus) return;
  summaryStatus.textContent = message;
  if (message) {
    setTimeout(() => {
      if (summaryStatus.textContent === message) summaryStatus.textContent = '';
    }, 1500);
  }
}

if (recurrenceCustom) toggleRecurrenceCustom();

function renderSummaryRating() {
  if (!summaryRating) return;
  const stars = summaryRating.querySelectorAll('.star');
  stars.forEach(star => {
    const index = Number(star.dataset.star);
    star.classList.remove('half', 'full');
    if (summaryRatingValue >= index) {
      star.classList.add('full');
    } else if (summaryRatingValue >= index - 0.5) {
      star.classList.add('half');
    }
  });
}

if (summaryRating) {
  summaryRating.addEventListener('click', event => {
    const target = event.target.closest('.star');
    if (!target) return;
    const index = Number(target.dataset.star);
    summaryRatingValue = index - 0.5;
    renderSummaryRating();
    scheduleSummarySave();
  });
  summaryRating.addEventListener('dblclick', event => {
    const target = event.target.closest('.star');
    if (!target) return;
    const index = Number(target.dataset.star);
    summaryRatingValue = index;
    renderSummaryRating();
    scheduleSummarySave();
  });
}

function buildRecurrenceDateOptions() {
  if (recurrenceDay) {
    recurrenceDay.innerHTML = '';
    for (let i = 1; i <= 31; i += 1) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = String(i);
      recurrenceDay.appendChild(option);
    }
  }
  if (recurrenceMonth) {
    recurrenceMonth.innerHTML = '';
    for (let i = 1; i <= 12; i += 1) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = String(i);
      recurrenceMonth.appendChild(option);
    }
  }
  if (recurrenceYearDay) {
    recurrenceYearDay.innerHTML = '';
    for (let i = 1; i <= 31; i += 1) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = String(i);
      recurrenceYearDay.appendChild(option);
    }
  }
}

buildRecurrenceDateOptions();

let summarySaveTimer = null;
let themeDark = true;
let summaryRatingValue = 0;
let bgmName = 'pinknoise';
let syncReady = false;
let currentUserId = null;
let syncInitPromise = null;
let pendingChangeSync = false;
let changeSyncInFlight = null;
let changeSyncQueued = false;
restoreInProgressPromise = restoreInProgressTodos();
ensureRunningTicker();

function triggerChangeSync() {
  pendingChangeSync = true;
  void flushChangeSync();
}

async function flushChangeSync() {
  if (!pendingChangeSync || !syncReady) return;
  if (changeSyncInFlight) {
    changeSyncQueued = true;
    return;
  }
  pendingChangeSync = false;
  changeSyncInFlight = (async () => {
    try {
      await pushNow();
    } finally {
      changeSyncInFlight = null;
      if (changeSyncQueued || pendingChangeSync) {
        changeSyncQueued = false;
        void flushChangeSync();
      }
    }
  })();
  await changeSyncInFlight;
}

function applyTheme() {
  document.body.classList.toggle('dark', themeDark);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = themeDark ? '☀' : '☾';
  }
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    themeDark = !themeDark;
    applyTheme();
    setMeta('theme', themeDark ? 'dark' : 'light');
  });
}

async function restoreTheme() {
  const record = await getMeta('theme');
  if (record && record.value) {
    themeDark = record.value === 'dark';
  }
  applyTheme();
}

restoreTheme();

function autoResizeSummary() {
  if (!summaryInput) return;
  summaryInput.style.height = 'auto';
  summaryInput.style.height = `${summaryInput.scrollHeight}px`;
}

function scheduleSummarySave() {
  if (summarySaveTimer) clearTimeout(summarySaveTimer);
  summarySaveTimer = setTimeout(saveSummaryNow, 600);
}

async function saveSummaryNow() {
  const text = summaryInput.value.trim();
  const now = new Date().toISOString();
  const existing = summaries
    .filter(summary => !summary.deletedAt)
    .sort((a, b) => {
      const aTime = Date.parse(a.updatedAt || a.createdAt || 0);
      const bTime = Date.parse(b.updatedAt || b.createdAt || 0);
      return bTime - aTime;
    })[0];

  if (!text && summaryRatingValue === 0) {
    if (existing) {
      await updateSummary({
        ...existing,
        deletedAt: now,
        updatedAt: now
      });
      triggerChangeSync();
      setSummaryStatus('已清空');
      loadSummaries();
    }
    return;
  }

  if (existing) {
    await updateSummary({
      ...existing,
      text,
      rating: summaryRatingValue,
      updatedAt: now,
      deletedAt: null
    });
    triggerChangeSync();
  } else {
    const initResult = syncInitPromise ? await syncInitPromise : null;
    const userId = currentUserId ||
      (initResult && initResult.userId ? initResult.userId : ensureUserId());
    await addSummary({
      date: selectedDate,
      text,
      rating: summaryRatingValue,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      uuid: generateUUID(),
      userId
    });
    triggerChangeSync();
  }
  setSummaryStatus('已保存');
  loadSummaries();
}


summaryInput.addEventListener('input', () => {
  autoResizeSummary();
  scheduleSummarySave();
});

// -------- Date module --------
async function loadForDate() {
  await Promise.all([loadTodos(), loadSummaries()]);
}

if (datePrevBtn) {
  datePrevBtn.onclick = () => {
    const date = parseDateLocal(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(formatDateLocal(date));
  };
}

if (dateNextBtn) {
  dateNextBtn.onclick = () => {
    const date = parseDateLocal(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(formatDateLocal(date));
  };
}

if (dateResetBtn) {
  dateResetBtn.onclick = () => {
    setSelectedDate(formatDateLocal(new Date()));
  };
}

if (datePicker) {
  datePicker.addEventListener('change', () => {
    if (datePicker.value) setSelectedDate(datePicker.value);
  });
}

setSelectedDate(selectedDate);

// -------- Timer module --------
const DEFAULT_MINUTES = 90;
let timerDurationMs = DEFAULT_MINUTES * 60 * 1000;
let timerInterval = null;
let timerRunning = false;
let timerRemainingMs = timerDurationMs;
let timerStartAt = Date.now();
let bellPhase = {
  state: 'work',
  restEndsAt: 0,
  nextBellAt: 0
};
let alarmVolumeRatio = 0.15;

let audioContext = null;
let lastPersistAt = 0;
let ownsTimerLease = false;
let timerLeaseInterval = null;

function readTimerLease() {
  try {
    const raw = window.localStorage.getItem(TIMER_LEASE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function writeTimerLease(now = Date.now()) {
  try {
    window.localStorage.setItem(TIMER_LEASE_KEY, JSON.stringify({
      ownerId: timerInstanceId,
      expiresAt: now + TIMER_LEASE_TTL_MS
    }));
    ownsTimerLease = true;
  } catch (err) {
    ownsTimerLease = true;
  }
}

function clearTimerTicking() {
  if (!timerInterval) return;
  clearInterval(timerInterval);
  timerInterval = null;
}

function ensureTimerTicking() {
  if (timerInterval) return;
  timerInterval = setInterval(tickTimer, 500);
}

function claimTimerLease() {
  const now = Date.now();
  const lease = readTimerLease();
  if (lease && lease.ownerId !== timerInstanceId && lease.expiresAt > now) {
    ownsTimerLease = false;
    return false;
  }
  writeTimerLease(now);
  return true;
}

function releaseTimerLease() {
  const lease = readTimerLease();
  if (lease && lease.ownerId === timerInstanceId) {
    try {
      window.localStorage.removeItem(TIMER_LEASE_KEY);
    } catch (err) {
      // ignore
    }
  }
  ownsTimerLease = false;
}

function updateTimerLease() {
  const wasOwner = ownsTimerLease;
  if (!timerRunning) {
    releaseTimerLease();
    clearTimerTicking();
    return;
  }
  if (claimTimerLease()) {
    ensureTimerTicking();
    if (!wasOwner) {
      bgm.play();
      tickTimer();
    }
    return;
  }
  clearTimerTicking();
  bgm.pause();
  setTimerStatus('倒计时已在另一页面运行');
}

function ensureTimerLeaseLoop() {
  if (timerLeaseInterval) return;
  timerLeaseInterval = setInterval(updateTimerLease, TIMER_LEASE_HEARTBEAT_MS);
}

function randomBellSeconds() {
  return 180 + Math.floor(Math.random() * 121);
}

function playTone(freq, durationMs) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = alarmVolumeRatio;
    osc.connect(gain);
    gain.connect(audioContext.destination);
    const now = audioContext.currentTime;
    osc.start(now);
    osc.stop(now + durationMs / 1000);
  } catch (err) {
    // 静默降级
  }
}

function setAlarmVolumePercent(value) {
  const parsed = Number(value);
  const safe = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 15;
  alarmVolumeRatio = safe / 100;
}

function updateTimerUI(remainingMs) {
  const totalSec = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = String(totalSec % 60).padStart(2, '0');
  if (timerRemainingEl) timerRemainingEl.textContent = `${minutes}:${seconds}`;
  if (timerRingEl) {
    const percent = Math.max(0, Math.min(1, remainingMs / timerDurationMs));
    timerRingEl.style.setProperty('--percent', `${Math.round(percent * 100)}%`);
  }
}

function setTimerStatus(text) {
  if (timerStatusEl) timerStatusEl.textContent = text;
}

function resetBellSchedule(now) {
  bellPhase = {
    state: 'work',
    restEndsAt: 0,
    nextBellAt: now + randomBellSeconds() * 1000
  };
}

function tickTimer() {
  if (!timerRunning || !ownsTimerLease) return;
  const now = Date.now();
  const remainingMs = Math.max(0, timerRemainingMs - (now - timerStartAt));
  updateTimerUI(remainingMs);

  if (remainingMs <= 0) {
    timerRunning = false;
    timerDurationMs = DEFAULT_MINUTES * 60 * 1000;
    timerRemainingMs = timerDurationMs;
    if (timerMinutesInput) timerMinutesInput.value = DEFAULT_MINUTES;
    updateTimerUI(timerRemainingMs);
    setTimerStatus('倒计时结束');
    playTone(600, 800);
    updateToggleLabel();
    persistTimerState();
    bgm.stop();
    releaseTimerLease();
    clearTimerTicking();
    return;
  }

  if (bellPhase.state === 'rest') {
    const restLeft = Math.max(0, Math.ceil((bellPhase.restEndsAt - now) / 1000));
    setTimerStatus(`休息中（${restLeft}s）`);
    if (restLeft <= 0) {
      bellPhase.state = 'work';
      bellPhase.nextBellAt = now + randomBellSeconds() * 1000;
      playTone(900, 180);
    }
    return;
  }

  const nextBellIn = Math.max(0, Math.ceil((bellPhase.nextBellAt - now) / 1000));
  setTimerStatus(`距离下次休息还有 ${nextBellIn} 秒`);
  if (nextBellIn <= 0) {
    bellPhase.state = 'rest';
    bellPhase.restEndsAt = now + 10000;
    playTone(420, 180);
  }

  if (now - lastPersistAt > 5000) {
    lastPersistAt = now;
    persistTimerState();
  }
}

function startTimer() {
  if (timerRunning) return;
  if (timerRemainingMs <= 0 || timerRemainingMs > timerDurationMs) {
    timerRemainingMs = timerDurationMs;
  }
  timerRunning = true;
  timerStartAt = Date.now();
  resetBellSchedule(Date.now());
  updateToggleLabel();
  persistTimerState();
  updateTimerLease();
  if (ownsTimerLease) {
    bgm.play();
    tickTimer();
  }
}

function pauseTimer() {
  if (!timerRunning) return;
  const now = Date.now();
  const remainingMs = Math.max(0, timerRemainingMs - (now - timerStartAt));
  timerRemainingMs = remainingMs;
  timerRunning = false;
  setTimerStatus('已暂停');
  updateToggleLabel();
  persistTimerState();
  bgm.pause();
  releaseTimerLease();
  clearTimerTicking();
}

function stopTimer() {
  timerRunning = false;
  timerRemainingMs = timerDurationMs;
  updateTimerUI(timerRemainingMs);
  setTimerStatus('已结束');
  updateToggleLabel();
  persistTimerState();
  bgm.stop();
  releaseTimerLease();
  clearTimerTicking();
}

function applyTimerMinutes(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    setTimerStatus('时长需为正整数');
    return;
  }
  timerDurationMs = Math.floor(parsed) * 60 * 1000;
  timerRemainingMs = timerDurationMs;
  timerRunning = false;
  updateTimerUI(timerRemainingMs);
  setTimerStatus('未开始');
  updateToggleLabel();
  persistTimerState();
  bgm.stop();
  releaseTimerLease();
  clearTimerTicking();
}

if (timerMinutesInput) {
  timerMinutesInput.addEventListener('change', () => applyTimerMinutes(timerMinutesInput.value));
  timerMinutesInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') applyTimerMinutes(timerMinutesInput.value);
  });
}

if (timerToggleBtn) {
  timerToggleBtn.addEventListener('click', () => {
    if (timerRunning) pauseTimer();
    else startTimer();
  });
}
if (timerStopBtn) timerStopBtn.addEventListener('click', stopTimer);

updateTimerUI(timerRemainingMs);
setTimerStatus('未开始');
if (timerVersionEl) timerVersionEl.textContent = `版本 ${APP_VERSION}`;
updateToggleLabel();
bgm.init();
ensureTimerLeaseLoop();
window.addEventListener('storage', event => {
  if (event.key !== TIMER_LEASE_KEY) return;
  updateTimerLease();
});
window.addEventListener('visibilitychange', () => {
  if (!document.hidden) updateTimerLease();
});
window.addEventListener('pagehide', () => {
  if (ownsTimerLease) releaseTimerLease();
});
if (bgmCurrentName) bgmCurrentName.textContent = bgmName;
if (bgmVolume) {
  bgm.setVolume(bgmVolume.value / 100);
  bgmVolume.addEventListener('input', () => {
    bgm.setVolume(bgmVolume.value / 100);
  });
}

if (alarmVolume) {
  setAlarmVolumePercent(alarmVolume.value);
  alarmVolume.addEventListener('input', () => {
    setAlarmVolumePercent(alarmVolume.value);
    setMeta('alarmVolume', Math.round(alarmVolumeRatio * 100));
  });
}

if (bgmFileInput) {
  bgmFileInput.addEventListener('change', () => {
    const file = bgmFileInput.files && bgmFileInput.files[0];
    if (file) bgm.setSource(file);
    if (file) {
      bgmName = file.name;
      if (bgmCurrentName) bgmCurrentName.textContent = bgmName;
    }
  });
}

function setSyncStatus(text) {
  if (!syncStatus) return;
  if (text.startsWith('Idle · last ')) {
    const iso = text.replace('Idle · last ', '');
    const date = new Date(iso);
    if (!Number.isNaN(date.getTime())) {
      const local = new Date(date.getTime() + 8 * 60 * 60 * 1000);
      const y = local.getUTCFullYear();
      const m = String(local.getUTCMonth() + 1).padStart(2, '0');
      const d = String(local.getUTCDate()).padStart(2, '0');
      const hh = String(local.getUTCHours()).padStart(2, '0');
      const mm = String(local.getUTCMinutes()).padStart(2, '0');
      const ss = String(local.getUTCSeconds()).padStart(2, '0');
      syncStatus.textContent = `上次同步 ${y}-${m}-${d} ${hh}:${mm}:${ss} (UTC+8)`;
      return;
    }
  }
  syncStatus.textContent = text;
}

const initPromise = initSync({
  onStatus: setSyncStatus,
  onUpdate: updatedDates => {
    if (updatedDates.has(selectedDate)) {
      loadForDate();
    }
  }
});
syncInitPromise = initPromise;

initPromise.then(result => {
  syncReady = true;
  currentUserId = result && result.userId ? result.userId : null;
  if (pendingChangeSync) {
    void flushChangeSync();
  } else {
    setTimeout(() => {
      syncNow();
    }, 1200);
  }
  setInterval(() => {
    if (syncReady) syncNow();
  }, 5 * 60 * 1000);
});

if (syncBtn) {
  syncBtn.addEventListener('click', () => {
    if (syncReady) syncNow();
  });
}

if (syncPullBtn) {
  syncPullBtn.addEventListener('click', () => {
    if (syncReady) pullNow();
  });
}

if (syncFullBtn) {
  syncFullBtn.addEventListener('click', () => {
    if (syncReady) syncAllLocalToCloud();
  });
}

window.addEventListener('online', () => {
  if (syncReady) syncNow();
});

if (bgmToggleBtn) {
  bgmToggleBtn.addEventListener('click', () => {
    if (bgmModal) bgmModal.classList.remove('hidden');
  });
}

if (bgmCloseBtn) {
  bgmCloseBtn.addEventListener('click', () => {
    if (bgmModal) bgmModal.classList.add('hidden');
  });
}

if (bgmModal) {
  bgmModal.addEventListener('click', event => {
    if (event.target === bgmModal) bgmModal.classList.add('hidden');
  });
}

function updateToggleLabel() {
  if (!timerToggleBtn) return;
  if (timerRunning) {
    timerToggleBtn.textContent = '暂停';
    return;
  }
  const isPaused = timerRemainingMs > 0 && timerRemainingMs < timerDurationMs;
  timerToggleBtn.textContent = isPaused ? '继续' : '开始';
}

async function persistTimerState() {
  const value = {
    durationMs: timerDurationMs,
    remainingMs: timerRunning
      ? Math.max(0, timerRemainingMs - (Date.now() - timerStartAt))
      : timerRemainingMs,
    running: timerRunning,
    startAt: timerRunning ? Date.now() : null,
    bellPhase,
    savedAt: Date.now()
  };
  await setMeta('timer', value);
}

async function restoreTimerState() {
  const record = await getMeta('timer');
  if (!record || !record.value) return;
  const value = record.value;
  if (!value.durationMs || !value.remainingMs) return;
  timerDurationMs = value.durationMs;
  timerRemainingMs = value.remainingMs;
  if (timerMinutesInput) timerMinutesInput.value = Math.floor(timerDurationMs / 60000);

  if (value.running && value.startAt) {
    const elapsed = Date.now() - value.startAt;
    timerRemainingMs = Math.max(0, timerRemainingMs - elapsed);
    if (timerRemainingMs <= 0) {
      timerRunning = false;
      setTimerStatus('倒计时结束');
    } else {
      timerRunning = true;
      timerStartAt = Date.now();
      resetBellSchedule(Date.now());
    }
  } else {
    timerRunning = false;
  }

  updateTimerUI(timerRemainingMs);
  updateToggleLabel();
  if (timerRunning) {
    updateTimerLease();
    if (ownsTimerLease) {
      bgm.play();
    }
  }
}

restoreTimerState();

async function restoreAlarmVolume() {
  const record = await getMeta('alarmVolume');
  if (!record) return;
  const percent = Number(record.value);
  if (!Number.isFinite(percent)) return;
  setAlarmVolumePercent(percent);
  if (alarmVolume) alarmVolume.value = String(Math.round(alarmVolumeRatio * 100));
}

restoreAlarmVolume();

// -------- Service Worker --------
if ('serviceWorker' in navigator) {
  let swRegistration = null;
  const promptForUpdate = () => {
    const confirmUpdate = window.confirm('发现新版本，是否刷新？');
    if (!confirmUpdate) return;
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return;
    }
    location.reload();
  };

  navigator.serviceWorker.register('./sw.js?v=20260314-task-status-chart', { updateViaCache: 'none' }).then(reg => {
    swRegistration = reg;
    reg.update();
    if (reg.waiting) promptForUpdate();
    reg.addEventListener('updatefound', () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          promptForUpdate();
        }
      });
    });
  });

  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'SW_UPDATE_READY') {
      promptForUpdate();
    }
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  });
}
