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
  updateRecurrenceRule,
  deleteRecurrenceRule,
  getTodosByRuleId,
  clearLocalDatabase
} from './db.js';
import * as bgm from './bgm.js?v=20260326-bgm-cache-storage';
import {
  initSync,
  syncNow,
  pushNow,
  pullNow,
  syncAllLocalToCloud,
  clearAllRemoteData,
  getUserId,
  fetchRemoteKv,
  fetchRemoteKvsByPrefix,
  upsertRemoteKv,
  insertRemoteKvIfAbsent
} from './sync.js';

const input = document.getElementById('todo-input');
const todoCategory = document.getElementById('todo-category');
const dueInput = document.getElementById('todo-due');
const addBtn = document.getElementById('add-btn');
const list = document.getElementById('todo-list');
const completedList = document.getElementById('completed-list');
const completedModule = document.getElementById('completed-module');
const status = document.getElementById('status');

const summaryInput = document.getElementById('summary-input');
const summaryStatus = document.getElementById('summary-status');
const yesterdayFocusCountEl = document.getElementById('yesterday-focus-count');
const summaryRating = document.getElementById('summary-rating');
const summaryModule = document.getElementById('summary-module');
const timerTimelineChart = document.getElementById('timer-timeline-chart');
const timerTimelineTitle = document.getElementById('timer-timeline-title');
const timerTimelineSummary = document.getElementById('timer-timeline-summary');
const contributionChart = document.getElementById('contribution-chart');
const contributionSummary = document.getElementById('contribution-summary');
const contributionTitle = document.getElementById('contribution-title');
const dailyFatigueCard = document.getElementById('daily-fatigue-card');
const fatigueYesBtn = document.getElementById('fatigue-yes-btn');
const fatigueNoBtn = document.getElementById('fatigue-no-btn');
const taskStatusChart = document.getElementById('task-status-chart');
const taskStatusSummary = document.getElementById('task-status-summary');
const taskStatusTitle = document.getElementById('task-status-title');
const timelineEditModal = document.getElementById('timeline-edit-modal');
const timelineEditCloseBtn = document.getElementById('timeline-edit-close');
const timelineEditTitle = document.getElementById('timeline-edit-title');
const timelineEditList = document.getElementById('timeline-edit-list');
const timelineEditAddBtn = document.getElementById('timeline-edit-add');
const timelineEditSaveBtn = document.getElementById('timeline-edit-save');
const promptModal = document.getElementById('prompt-modal');
const promptMessage = document.getElementById('prompt-message');
const promptCancelBtn = document.getElementById('prompt-cancel');
const promptConfirmBtn = document.getElementById('prompt-confirm');
const dailySettlementModal = document.getElementById('daily-settlement-modal');
const dailySettlementBody = document.getElementById('daily-settlement-body');
const dailySettlementCloseBtn = document.getElementById('daily-settlement-close');

const datePrevBtn = document.getElementById('date-prev');
const dateNextBtn = document.getElementById('date-next');
const dateResetBtn = document.getElementById('date-reset');
const datePicker = document.getElementById('date-picker');
const dateWeekday = document.getElementById('date-weekday');
const syncBtn = document.getElementById('sync-btn');
const syncPullBtn = document.getElementById('sync-pull-btn');
const syncFullBtn = document.getElementById('sync-full-btn');
const syncClearBtn = document.getElementById('sync-clear-btn');
const syncStatus = document.getElementById('sync-status');

const recurrenceOpenBtn = document.getElementById('recurrence-open');
const recurrenceModal = document.getElementById('recurrence-modal');
const recurrenceCloseBtn = document.getElementById('recurrence-close');
const recurrenceList = document.getElementById('recurrence-list');
const recurrenceCategory = document.getElementById('recurrence-category');
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
const recurrenceEditModal = document.getElementById('recurrence-edit-modal');
const recurrenceEditCloseBtn = document.getElementById('recurrence-edit-close');
const recurrenceEditCategory = document.getElementById('recurrence-edit-category');
const recurrenceEditText = document.getElementById('recurrence-edit-text');
const recurrenceEditType = document.getElementById('recurrence-edit-type');
const recurrenceEditCustom = document.getElementById('recurrence-edit-custom');
const recurrenceEditWeekly = document.getElementById('recurrence-edit-weekly');
const recurrenceEditMonthly = document.getElementById('recurrence-edit-monthly');
const recurrenceEditDay = document.getElementById('recurrence-edit-day');
const recurrenceEditYearly = document.getElementById('recurrence-edit-yearly');
const recurrenceEditMonth = document.getElementById('recurrence-edit-month');
const recurrenceEditYearDay = document.getElementById('recurrence-edit-year-day');
const recurrenceEditInterval = document.getElementById('recurrence-edit-interval');
const recurrenceEditUnit = document.getElementById('recurrence-edit-unit');
const recurrenceEditSaveBtn = document.getElementById('recurrence-edit-save');
const recurrenceEditCancelBtn = document.getElementById('recurrence-edit-cancel');
const timerRemainingEl = document.getElementById('timer-remaining');
const timerRingEl = document.getElementById('timer-ring');
const timerMinutesInput = document.getElementById('timer-minutes');
const timerStatusEl = document.getElementById('timer-status');
const timerInlinePromptEl = document.getElementById('timer-inline-prompt');
const timerInlinePromptTextEl = document.getElementById('timer-inline-prompt-text');
const timerInlinePromptConfirmBtn = document.getElementById('timer-inline-prompt-confirm');
const timerInlinePromptCancelBtn = document.getElementById('timer-inline-prompt-cancel');
const bgmStatusEl = document.getElementById('bgm-status');
const timerToggleBtn = document.getElementById('timer-toggle');
const timerStopBtn = document.getElementById('timer-stop');
const bgmFileInput = document.getElementById('bgm-file');
const bgmToggleBtn = document.getElementById('bgm-toggle');
const bgmModal = document.getElementById('bgm-modal');
const bgmCloseBtn = document.getElementById('bgm-close');
const bgmCurrentName = document.getElementById('bgm-current-name');
const bgmVolume = document.getElementById('bgm-volume');
const alarmVolume = document.getElementById('alarm-volume');
const bgmLogOutput = document.getElementById('bgm-log-output');
const bgmLogCopyBtn = document.getElementById('bgm-log-copy');
const regretCoinBalanceEl = document.getElementById('regret-coin-balance');
const regretCoinStatusEl = document.getElementById('regret-coin-status');
const regretCoinSpendInput = document.getElementById('regret-coin-spend-input');
const regretCoinSpendBtn = document.getElementById('regret-coin-spend-btn');
const RECURRENCE_SKIP_META_KEY = 'recurrenceSkips';
const TIMER_TIMELINE_META_KEY = 'timerTimelineByDate';
const TIMER_TIMELINE_ACTIVE_META_KEY = 'timerTimelineActive';
const TIMER_TIMELINE_UPDATED_AT_META_KEY = 'timerTimelineUpdatedAt';
const TIMER_TIMELINE_ACTIVE_UPDATED_AT_META_KEY = 'timerTimelineActiveUpdatedAt';
const TIMER_TIMELINE_MANUAL_OPS_KEY = 'timerTimelineManualOps';
const TIMER_STATE_LOCAL_KEY = 'jztodo.timer.state';
const TIMER_TIMELINE_LOCAL_KEY = 'jztodo.timer.timelineByDate';
const TIMER_TIMELINE_ACTIVE_LOCAL_KEY = 'jztodo.timer.timelineActive';
const TIMER_LEASE_KEY = 'jztodo.timer.lease';
const TIMER_LEASE_TTL_MS = 4000;

function applyForcedLightTheme() {
  const root = document.documentElement;
  const forcedVars = {
    '--bg': '#ffffff',
    '--card': '#eef9f2',
    '--border': '#f1d5c5',
    '--text': '#5b4747',
    '--muted': '#9b7f7f',
    '--timer-status': '#7a6262',
    '--input': '#fffaf6',
    '--btn': '#ffe8dc',
    '--ring': '#f4a261',
    '--ring-inner': '#fffaf6',
    '--todo': '#ffe3ea',
    '--todo-active': '#fff3b0',
    '--todo-active-border': '#ffb67f',
    '--todo-active-glow': 'rgba(255, 182, 127, 0.28)',
    '--todo-running': '#f08f7d',
    '--contrib-empty': '#e5e7eb',
    '--contrib-1': '#fff1df',
    '--contrib-2': '#ffe4c1',
    '--contrib-3': '#ffd5a2',
    '--contrib-4': '#ffc785',
    '--contrib-5': '#ffb86b',
    '--contrib-6': '#f4a261',
    '--contrib-7': '#ee9553',
    '--contrib-8': '#e38b6d',
    '--contrib-9': '#d97a43',
    '--contrib-10': '#c9652f'
  };
  Object.entries(forcedVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  document.body.style.background = '#ffffff';
  document.body.style.color = '#5b4747';
  const pageCard = document.querySelector('.page-card');
  if (pageCard) {
    pageCard.style.background = '#eef9f2';
    pageCard.style.borderColor = '#f1d5c5';
  }
}

applyForcedLightTheme();
const TIMER_LEASE_HEARTBEAT_MS = 2000;
const REGRET_COIN_LEDGER_META_KEY = 'regretCoinLedger';
const REGRET_COIN_LAST_SYNC_AT_META_KEY = 'regretCoinLedgerUpdatedAt';
const REGRET_COIN_LEDGER_REMOTE_KEY = 'regret_coin_ledger';
const DAILY_SETTLEMENT_REMOTE_PREFIX = 'daily_settlement:';
const NATURAL_DAY_META_KEY = 'lastKnownNaturalDate';
const DAILY_FATIGUE_META_KEY = 'dailyFatigueAnswers';
const DAILY_FATIGUE_UPDATED_AT_META_KEY = 'dailyFatigueAnswersUpdatedAt';
const DAILY_FATIGUE_REMOTE_KEY = 'daily_fatigue_answers';

let todos = [];
let draggedTodoId = null;
let suppressTodoClickUntil = 0;
let summaries = [];
let selectedDate = formatDateLocal(new Date());
let migrationDone = false;
let recurrenceRules = [];
let editingRecurrenceRuleId = null;
const MAX_IN_PROGRESS_TODOS = 2;
const IN_PROGRESS_LOCAL_KEY = 'jztodo.todo.inProgress';
let inProgressTodos = new Map();
let restoreInProgressPromise = null;
const runningTimeEls = new Map();
let runningTicker = null;
let contributionScores = new Map();
let taskCompletionStatusByDate = new Map();
let timerTimelineByDate = {};
let activeTimerSegment = null;
let regretCoinLedger = [];
let dailyFatigueAnswers = {};
let timelineEditingSegmentId = null;
let timelineEditingDate = '';
let timelineEditingDraft = [];
let timelineEditingInitialSnapshot = '';
let promptResolver = null;
let regretCoinStatusTimer = null;
let daySettlementTimer = null;
let contributionResizeRaf = 0;
let contributionMonthKey = '';
let contributionFollowCurrentMonth = true;
let contributionLastCurrentMonthKey = '';
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

function getDateStartMs(dateStr) {
  return parseDateLocal(dateStr).getTime();
}

function getDateEndMs(dateStr) {
  return getDateStartMs(dateStr) + 24 * 60 * 60 * 1000;
}

function formatClockTime(timestamp) {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDurationText(durationMs) {
  const totalMinutes = Math.max(1, Math.round(durationMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours}小时${minutes}分钟`;
  if (hours) return `${hours}小时`;
  return `${minutes}分钟`;
}

function padTimePart(value) {
  return String(value).padStart(2, '0');
}

function formatTimeInputValue(timestamp) {
  const date = new Date(timestamp);
  return `${padTimePart(date.getHours())}:${padTimePart(date.getMinutes())}`;
}

function parseTimeInputValue(dateStr, value) {
  const [hours, minutes] = String(value || '').split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const date = parseDateLocal(dateStr);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
}

function readLocalJson(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function writeLocalJson(key, value) {
  try {
    if (value == null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    // ignore local persistence failures
  }
}

function resolvePrompt(result) {
  if (!promptResolver) return;
  const resolver = promptResolver;
  promptResolver = null;
  if (promptModal) promptModal.classList.add('hidden');
  resolver(result);
}

function openPromptModal(message, options = {}) {
  if (!promptModal || !promptMessage || !promptConfirmBtn || !promptCancelBtn) {
    return Promise.resolve(window.confirm(message));
  }
  if (promptResolver) resolvePrompt(false);
  promptMessage.textContent = message;
  promptConfirmBtn.textContent = options.confirmText || '确定';
  promptCancelBtn.textContent = options.cancelText || '取消';
  promptCancelBtn.classList.toggle('hidden', options.showCancel === false);
  promptModal.classList.remove('hidden');
  return new Promise(resolve => {
    promptResolver = resolve;
  });
}

function getYesterdayDateStr(baseDateStr = formatDateLocal(new Date())) {
  return formatDateLocal(shiftDate(parseDateLocal(baseDateStr), -1));
}

function getDailySettlementKey(dateStr) {
  return `${DAILY_SETTLEMENT_REMOTE_PREFIX}${dateStr}`;
}

function normalizeTodoPromptText(text) {
  return String(text || '')
    .trim()
    .replace(/^[^:：]+[:：]\s*/, '')
    .trim();
}

function shouldPromptMorningWakeup(todo) {
  return normalizeTodoPromptText(todo && todo.text) === '刷牙2';
}

function getTodayFocusCount(dateStr) {
  return getTimerTimelineSegmentsForDate(dateStr)
    .filter(segment => !segment._active)
    .length;
}

function renderYesterdayFocusCount(baseDateStr = selectedDate) {
  if (!yesterdayFocusCountEl) return;
  const targetDate = getYesterdayDateStr(baseDateStr);
  const focusCount = targetDate ? getTodayFocusCount(targetDate) : 0;
  yesterdayFocusCountEl.textContent = `前日（${targetDate}）专注次数：${focusCount}`;
}

function getSettlementLevel(rating) {
  const normalized = Number.isFinite(rating) ? rating : 0;
  return Math.max(0, Math.min(10, Math.round(normalized * 2)));
}

function getSettlementAction(level) {
  return {
    type: 'neutral',
    coins: 0,
    text: '仅统计专注次数，不进行奖励或惩罚'
  };
}

function getSettlementEncouragement(level, actionType) {
  if (level >= 6) return '保持节奏，继续稳定专注。';
  return '今天先复盘，明天把专注次数再抬高一些。';
}

function normalizeRegretCoinLedger(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => item && typeof item.id === 'string')
    .map(item => ({
      id: item.id,
      type: item.type === 'spend' ? 'spend' : 'reward',
      amount: Math.max(0, Math.floor(Number(item.amount) || 0)),
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      sourceDate: typeof item.sourceDate === 'string' ? item.sourceDate : '',
      note: typeof item.note === 'string' ? item.note : ''
    }))
    .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
}

function mergeRegretCoinLedger(localLedger, remoteLedger) {
  const merged = new Map();
  for (const item of [...normalizeRegretCoinLedger(localLedger), ...normalizeRegretCoinLedger(remoteLedger)]) {
    const existing = merged.get(item.id);
    if (!existing || (item.createdAt || '') > (existing.createdAt || '')) {
      merged.set(item.id, item);
    }
  }
  return Array.from(merged.values()).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
}

function getRegretCoinBalance(ledger = regretCoinLedger) {
  return normalizeRegretCoinLedger(ledger).reduce((sum, item) => {
    if (item.type === 'reward') return sum + item.amount;
    if (item.type === 'spend') return sum - item.amount;
    return sum;
  }, 0);
}

async function persistRegretCoinLedger(updatedAt = new Date().toISOString()) {
  const normalized = normalizeRegretCoinLedger(regretCoinLedger);
  regretCoinLedger = normalized;
  await Promise.all([
    setMeta(REGRET_COIN_LEDGER_META_KEY, normalized),
    setMeta(REGRET_COIN_LAST_SYNC_AT_META_KEY, updatedAt)
  ]);
}

async function syncRegretCoinLedgerFromCloud() {
  const [localRecord, localUpdatedAtRecord, remoteRow] = await Promise.all([
    getMeta(REGRET_COIN_LEDGER_META_KEY),
    getMeta(REGRET_COIN_LAST_SYNC_AT_META_KEY),
    fetchRemoteKv(REGRET_COIN_LEDGER_REMOTE_KEY)
  ]);
  const localLedger = normalizeRegretCoinLedger(localRecord ? localRecord.value : []);
  const remoteLedger = normalizeRegretCoinLedger(remoteRow && remoteRow.value ? remoteRow.value.ops : []);
  const mergedLedger = mergeRegretCoinLedger(localLedger, remoteLedger);
  const remoteUpdatedAt = remoteRow && remoteRow.updated_at ? remoteRow.updated_at : '';
  const localUpdatedAt = localUpdatedAtRecord && typeof localUpdatedAtRecord.value === 'string'
    ? localUpdatedAtRecord.value
    : '';

  regretCoinLedger = mergedLedger;
  const remoteSnapshot = JSON.stringify(remoteLedger);
  const mergedSnapshot = JSON.stringify(mergedLedger);
  const mergedUpdatedAt = [remoteUpdatedAt, localUpdatedAt]
    .filter(Boolean)
    .sort()
    .slice(-1)[0] || new Date().toISOString();
  await persistRegretCoinLedger(mergedUpdatedAt);

  if (syncReady && (remoteUpdatedAt < mergedUpdatedAt || remoteSnapshot !== mergedSnapshot)) {
    await upsertRemoteKv(REGRET_COIN_LEDGER_REMOTE_KEY, { ops: mergedLedger }, mergedUpdatedAt);
  }
  renderRegretCoinSection();
}

async function reconcileSettlementRewardsFromCloud() {
  if (!syncReady) return;
  const rows = await fetchRemoteKvsByPrefix(DAILY_SETTLEMENT_REMOTE_PREFIX);
  if (!rows.length) return;
  const existingIds = new Set(normalizeRegretCoinLedger(regretCoinLedger).map(item => item.id));
  const missingRewards = [];

  rows.forEach(row => {
    const value = row && row.value && typeof row.value === 'object' ? row.value : null;
    if (!value || value.actionType !== 'reward' || !value.date || !value.regretCoinReward) return;
    const rewardId = `reward:${value.date}`;
    if (existingIds.has(rewardId)) return;
    missingRewards.push({
      id: rewardId,
      type: 'reward',
      amount: Math.max(0, Math.floor(Number(value.regretCoinReward) || 0)),
      createdAt: value.settledAt || row.updated_at || new Date().toISOString(),
      sourceDate: value.date,
      note: '每日结算奖励'
    });
  });

  if (!missingRewards.length) return;
  regretCoinLedger = mergeRegretCoinLedger(regretCoinLedger, missingRewards);
  const updatedAt = new Date().toISOString();
  await persistRegretCoinLedger(updatedAt);
  await upsertRemoteKv(REGRET_COIN_LEDGER_REMOTE_KEY, { ops: regretCoinLedger }, updatedAt);
  renderRegretCoinSection();
}

function renderRegretCoinSection() {
  if (regretCoinBalanceEl) {
    regretCoinBalanceEl.textContent = String(Math.max(0, getRegretCoinBalance()));
  }
}

function normalizeDailyFatigueAnswers(value) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(
    Object.entries(source)
      .filter(([dateStr, item]) => Boolean(dateStr) && item && typeof item === 'object')
      .map(([dateStr, item]) => {
        const answer = item.answer === 'yes' || item.answer === 'no' ? item.answer : null;
        const updatedAt = typeof item.updatedAt === 'string' && item.updatedAt
          ? item.updatedAt
          : '';
        return [dateStr, { answer, updatedAt }];
      })
      .filter(([, item]) => Boolean(item.answer))
  );
}

function getDailyFatigueAnswer(dateStr = selectedDate) {
  const record = dailyFatigueAnswers && typeof dailyFatigueAnswers === 'object'
    ? dailyFatigueAnswers[dateStr]
    : null;
  return record && (record.answer === 'yes' || record.answer === 'no')
    ? record.answer
    : null;
}

function shouldShowDailyFatigueQuestion(dateStr = selectedDate, now = new Date()) {
  return dateStr === formatDateLocal(now) && now.getHours() === 23;
}

function renderDailyFatigueQuestion() {
  // Feature removed: do not show daily fatigue question UI.
}

async function persistDailyFatigueAnswers(updatedAt = new Date().toISOString()) {
  dailyFatigueAnswers = normalizeDailyFatigueAnswers(dailyFatigueAnswers);
  await Promise.all([
    setMeta(DAILY_FATIGUE_META_KEY, dailyFatigueAnswers),
    setMeta(DAILY_FATIGUE_UPDATED_AT_META_KEY, updatedAt)
  ]);
}

function mergeDailyFatigueAnswers(localAnswers, remoteAnswers) {
  const merged = {};
  const allDates = new Set([
    ...Object.keys(localAnswers || {}),
    ...Object.keys(remoteAnswers || {})
  ]);
  allDates.forEach(dateStr => {
    const localRecord = localAnswers && localAnswers[dateStr] ? localAnswers[dateStr] : null;
    const remoteRecord = remoteAnswers && remoteAnswers[dateStr] ? remoteAnswers[dateStr] : null;
    if (!localRecord && remoteRecord) {
      merged[dateStr] = remoteRecord;
      return;
    }
    if (localRecord && !remoteRecord) {
      merged[dateStr] = localRecord;
      return;
    }
    if (!localRecord && !remoteRecord) return;
    merged[dateStr] = (remoteRecord.updatedAt || '') > (localRecord.updatedAt || '')
      ? remoteRecord
      : localRecord;
  });
  return normalizeDailyFatigueAnswers(merged);
}

async function syncDailyFatigueAnswersFromCloud() {
  const [localRecord, localUpdatedAtRecord, remoteRow] = await Promise.all([
    getMeta(DAILY_FATIGUE_META_KEY),
    getMeta(DAILY_FATIGUE_UPDATED_AT_META_KEY),
    fetchRemoteKv(DAILY_FATIGUE_REMOTE_KEY)
  ]);
  const localAnswers = normalizeDailyFatigueAnswers(localRecord ? localRecord.value : {});
  const remoteAnswers = normalizeDailyFatigueAnswers(remoteRow && remoteRow.value ? remoteRow.value.answers : {});
  const mergedAnswers = mergeDailyFatigueAnswers(localAnswers, remoteAnswers);
  const localUpdatedAt = localUpdatedAtRecord && typeof localUpdatedAtRecord.value === 'string'
    ? localUpdatedAtRecord.value
    : '';
  const remoteUpdatedAt = remoteRow && remoteRow.updated_at ? remoteRow.updated_at : '';
  const mergedUpdatedAt = [localUpdatedAt, remoteUpdatedAt]
    .filter(Boolean)
    .sort()
    .slice(-1)[0] || new Date().toISOString();

  dailyFatigueAnswers = mergedAnswers;
  await persistDailyFatigueAnswers(mergedUpdatedAt);

  const remoteSnapshot = JSON.stringify(remoteAnswers);
  const mergedSnapshot = JSON.stringify(mergedAnswers);
  if (syncReady && (remoteUpdatedAt < mergedUpdatedAt || remoteSnapshot !== mergedSnapshot)) {
    await upsertRemoteKv(DAILY_FATIGUE_REMOTE_KEY, { answers: mergedAnswers }, mergedUpdatedAt);
  }
  renderDailyFatigueQuestion();
}

async function restoreDailyFatigueAnswersLocal() {
  const record = await getMeta(DAILY_FATIGUE_META_KEY);
  dailyFatigueAnswers = normalizeDailyFatigueAnswers(record ? record.value : {});
  renderDailyFatigueQuestion();
}

async function setDailyFatigueAnswer(answer) {
  const nextAnswer = answer === 'yes' ? 'yes' : answer === 'no' ? 'no' : null;
  if (!nextAnswer) return;
  const currentAnswer = getDailyFatigueAnswer(selectedDate);
  const updatedAt = new Date().toISOString();
  if (currentAnswer === nextAnswer) {
    const nextAnswers = { ...dailyFatigueAnswers };
    delete nextAnswers[selectedDate];
    dailyFatigueAnswers = nextAnswers;
    await persistDailyFatigueAnswers(updatedAt);
    renderDailyFatigueQuestion();
    if (syncReady) {
      await upsertRemoteKv(DAILY_FATIGUE_REMOTE_KEY, { answers: dailyFatigueAnswers }, updatedAt);
    }
    return;
  }
  dailyFatigueAnswers = {
    ...dailyFatigueAnswers,
    [selectedDate]: {
      answer: nextAnswer,
      updatedAt
    }
  };
  await persistDailyFatigueAnswers(updatedAt);
  renderDailyFatigueQuestion();
  if (syncReady) {
    await upsertRemoteKv(DAILY_FATIGUE_REMOTE_KEY, { answers: dailyFatigueAnswers }, updatedAt);
  }
}

function setRegretCoinStatus(message) {
  if (!regretCoinStatusEl) return;
  regretCoinStatusEl.textContent = message;
  if (regretCoinStatusTimer) clearTimeout(regretCoinStatusTimer);
  if (!message) return;
  regretCoinStatusTimer = setTimeout(() => {
    if (regretCoinStatusEl.textContent === message) regretCoinStatusEl.textContent = '';
  }, 1800);
}

async function appendRegretCoinEntry(entry) {
  await syncRegretCoinLedgerFromCloud();
  regretCoinLedger = mergeRegretCoinLedger(regretCoinLedger, [entry]);
  const updatedAt = entry.createdAt || new Date().toISOString();
  await persistRegretCoinLedger(updatedAt);
  if (syncReady) {
    await upsertRemoteKv(REGRET_COIN_LEDGER_REMOTE_KEY, { ops: regretCoinLedger }, updatedAt);
  }
  renderRegretCoinSection();
}

async function consumeRegretCoins(amount) {
  await syncRegretCoinLedgerFromCloud();
  const balance = getRegretCoinBalance();
  if (amount > balance) return false;
  const createdAt = new Date().toISOString();
  await appendRegretCoinEntry({
    id: generateUUID(),
    type: 'spend',
    amount,
    createdAt,
    note: '手动消耗'
  });
  return true;
}

function buildDailySettlement(dateStr, rating, focusCount) {
  const level = getSettlementLevel(rating);
  const action = getSettlementAction(level);
  return {
    date: dateStr,
    rating: Number.isFinite(rating) ? rating : 0,
    level,
    focusCount,
    actionType: action.type,
    actionText: action.text,
    regretCoinReward: action.coins,
    encouragement: getSettlementEncouragement(level, action.type),
    settledAt: new Date().toISOString()
  };
}

function openDailySettlementModal(settlement, balance) {
  // Feature removed: do not show settlement popup.
}

function closeDailySettlementModal() {
  if (dailySettlementModal) dailySettlementModal.classList.add('hidden');
}

async function settlePreviousDayIfNeeded(options = {}) {
  const today = formatDateLocal(new Date());
  const inProgressRecord = readLocalJson(IN_PROGRESS_LOCAL_KEY);
  if (inProgressRecord && inProgressRecord.date && inProgressRecord.date !== today) {
    const cleared = await clearInProgressTodosForNewDay();
    if (cleared) renderTodos();
  }

  const localDayRecord = await getMeta(NATURAL_DAY_META_KEY);
  const lastKnownDay = localDayRecord && typeof localDayRecord.value === 'string'
    ? localDayRecord.value
    : '';

  if (!options.force && lastKnownDay === today) {
    renderYesterdayFocusCount(today);
    return;
  }
  await setMeta(NATURAL_DAY_META_KEY, today);

  const targetDate = getYesterdayDateStr(today);
  if (!targetDate) return;

  const targetSummaries = await getSummariesByDate(targetDate);
  const latestSummary = getLatestSummaryRecord(targetSummaries);
  const rating = latestSummary && typeof latestSummary.rating === 'number' ? latestSummary.rating : 0;
  const focusCount = getTodayFocusCount(targetDate);
  const settlement = buildDailySettlement(targetDate, rating, focusCount);
  renderYesterdayFocusCount(today);
}

function getContributionMonthPeriod(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return {
    year,
    month,
    key: `${year}-${String(month).padStart(2, '0')}`
  };
}

function formatContributionMonthLabel(period) {
  return `${period.year}年${period.month}月`;
}

function formatContributionMonthTitle(period) {
  return `${formatContributionMonthLabel(period)}热力图`;
}

function getContributionMonthRange(period) {
  return {
    startDate: new Date(period.year, period.month - 1, 1),
    endDate: new Date(period.year, period.month, 0)
  };
}

function buildContributionMonthPeriods(dateStrs, today = new Date()) {
  const current = getContributionMonthPeriod(today);
  const monthKeys = new Set([current.key]);
  dateStrs.forEach(dateStr => {
    if (!dateStr) return;
    const date = parseDateLocal(dateStr);
    monthKeys.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  });
  return [...monthKeys]
    .sort((a, b) => b.localeCompare(a))
    .map(key => {
      const [year, month] = key.split('-').map(Number);
      return { year, month, key };
    });
}

function getActiveContributionPeriod(periods, currentPeriod) {
  if (!periods.length) return null;
  if (
    contributionFollowCurrentMonth &&
    contributionLastCurrentMonthKey &&
    contributionLastCurrentMonthKey !== currentPeriod.key
  ) {
    contributionMonthKey = currentPeriod.key;
  }
  contributionLastCurrentMonthKey = currentPeriod.key;
  if (!contributionMonthKey || !periods.some(period => period.key === contributionMonthKey)) {
    contributionMonthKey = currentPeriod.key;
  }
  return periods.find(period => period.key === contributionMonthKey) || currentPeriod;
}

function updateContributionCellSize(wrapper) {
  if (!wrapper) return;
  wrapper.style.removeProperty('--contrib-cell-size');
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
  todos = await ensurePendingTodoSortOrders(todos);
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

async function moveTodoToTomorrow(todo) {
  if (!todo || todo.deletedAt) return false;
  const sourceDate = todo.date || selectedDate;
  const tomorrowDate = formatDateLocal(shiftDate(parseDateLocal(sourceDate), 1));
  const now = new Date().toISOString();

  await updateTodo({
    ...todo,
    date: tomorrowDate,
    completed: false,
    sortOrder: null,
    recurrenceRuleId: null,
    updatedAt: now
  });

  if (todo.recurrenceRuleId != null) {
    await addRecurrenceSkip(sourceDate, Number(todo.recurrenceRuleId));
  }

  await clearTodoInProgress(todo.uuid);
  triggerChangeSync();
  return true;
}

function renderTodos() {
  if (!list) return;
  list.innerHTML = '';
  if (completedList) completedList.innerHTML = '';
  runningTimeEls.clear();
  const visibleTodos = todos
    .filter(todo => !todo.deletedAt);
  const pendingTodos = visibleTodos
    .filter(todo => !todo.completed)
    .sort(comparePendingTodos);
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
    li.draggable = targetList === list;

    if (targetList === list) {
      li.ondragstart = event => {
        if (li.classList.contains('editing')) {
          event.preventDefault();
          return;
        }
        draggedTodoId = todo.id;
        li.classList.add('todo-dragging');
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', String(todo.id));
        }
      };
      li.ondragend = () => {
        draggedTodoId = null;
        li.classList.remove('todo-dragging');
        clearTodoDropIndicatorClasses();
      };
      li.ondragover = event => {
        if (draggedTodoId == null || draggedTodoId === todo.id) return;
        event.preventDefault();
        const insertAfter = shouldInsertAfter(event, li);
        li.classList.toggle('todo-drop-before', !insertAfter);
        li.classList.toggle('todo-drop-after', insertAfter);
      };
      li.ondragleave = () => {
        li.classList.remove('todo-drop-before', 'todo-drop-after');
      };
      li.ondrop = async event => {
        if (draggedTodoId == null || draggedTodoId === todo.id) return;
        event.preventDefault();
        const insertAfter = shouldInsertAfter(event, li);
        suppressTodoClickUntil = Date.now() + 300;
        clearTodoDropIndicatorClasses();
        await reorderPendingTodos(draggedTodoId, todo.id, insertAfter);
      };
    }

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

    const moveBtn = document.createElement('button');
    moveBtn.className = 'move-btn';
    moveBtn.type = 'button';
    moveBtn.textContent = '移至明天';
    moveBtn.onclick = async event => {
      event.stopPropagation();
      const changed = await moveTodoToTomorrow(todo);
      if (changed) loadTodos();
    };

    const actions = document.createElement('div');
    actions.className = 'todo-actions';
    actions.appendChild(moveBtn);
    actions.appendChild(progressBtn);
    actions.appendChild(del);
    li.appendChild(content);
    li.appendChild(actions);
    li.onclick = async event => {
      if (Date.now() < suppressTodoClickUntil) return;
      if (event.detail > 1) return;
      if (li.classList.contains('editing')) return;
      const nextCompleted = !todo.completed;
      const shouldAskMorningWakeup = nextCompleted && shouldPromptMorningWakeup(todo);
      await updateTodo({
        ...todo,
        completed: nextCompleted,
        updatedAt: new Date().toISOString()
      });
      if (nextCompleted) await clearTodoInProgress(todo.uuid);
      triggerChangeSync();
      loadTodos();
      if (shouldAskMorningWakeup) {
        void openPromptModal(
          '早安呀，今天也要元气满满。\n闹钟响了之后，你有马上起床，没有继续赖床吧？',
          {
            confirmText: '是',
            cancelText: '否'
          }
        );
      }
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

function getTodoSortTime(todo) {
  return Date.parse(todo.updatedAt || todo.createdAt || 0);
}

function comparePendingTodos(a, b) {
  const aOrder = Number.isFinite(a.sortOrder) ? a.sortOrder : null;
  const bOrder = Number.isFinite(b.sortOrder) ? b.sortOrder : null;
  if (aOrder != null && bOrder != null && aOrder !== bOrder) {
    return aOrder - bOrder;
  }
  if (aOrder != null) return -1;
  if (bOrder != null) return 1;
  return getTodoSortTime(b) - getTodoSortTime(a);
}

async function ensurePendingTodoSortOrders(items) {
  const pendingTodos = items.filter(todo => todo && !todo.deletedAt && !todo.completed);
  if (!pendingTodos.some(todo => !Number.isFinite(todo.sortOrder))) {
    return items;
  }

  const orderedTodos = [...pendingTodos].sort(comparePendingTodos);
  const updatedById = new Map();

  await Promise.all(
    orderedTodos.map(async (todo, index) => {
      if (todo.sortOrder === index) {
        updatedById.set(todo.id, todo);
        return;
      }
      const nextTodo = {
        ...todo,
        sortOrder: index
      };
      await updateTodo(nextTodo);
      updatedById.set(todo.id, nextTodo);
    })
  );

  return items.map(todo => updatedById.get(todo.id) || todo);
}

function shouldInsertAfter(event, element) {
  const rect = element.getBoundingClientRect();
  return event.clientY >= rect.top + rect.height / 2;
}

function clearTodoDropIndicatorClasses() {
  if (!list) return;
  list
    .querySelectorAll('.todo-drop-before, .todo-drop-after, .todo-dragging')
    .forEach(item => item.classList.remove('todo-drop-before', 'todo-drop-after', 'todo-dragging'));
}

async function reorderPendingTodos(draggedId, targetId, insertAfter) {
  const orderedPendingTodos = todos
    .filter(todo => todo && !todo.deletedAt && !todo.completed)
    .sort(comparePendingTodos);
  const draggedIndex = orderedPendingTodos.findIndex(todo => todo.id === draggedId);
  const targetIndex = orderedPendingTodos.findIndex(todo => todo.id === targetId);
  if (draggedIndex < 0 || targetIndex < 0) return;

  const reorderedTodos = [...orderedPendingTodos];
  const [draggedTodo] = reorderedTodos.splice(draggedIndex, 1);
  const adjustedTargetIndex = reorderedTodos.findIndex(todo => todo.id === targetId);
  const insertIndex = insertAfter ? adjustedTargetIndex + 1 : adjustedTargetIndex;
  reorderedTodos.splice(insertIndex, 0, draggedTodo);

  const updatedById = new Map();
  await Promise.all(
    reorderedTodos.map(async (todo, index) => {
      if (todo.sortOrder === index) {
        updatedById.set(todo.id, todo);
        return;
      }
      const nextTodo = {
        ...todo,
        sortOrder: index
      };
      await updateTodo(nextTodo);
      updatedById.set(todo.id, nextTodo);
    })
  );

  todos = todos.map(todo => updatedById.get(todo.id) || todo);
  renderTodos();
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
  writeLocalJson(IN_PROGRESS_LOCAL_KEY, {
    date: getTodayDateStr(),
    items: payload
  });
}

async function restoreInProgressTodos() {
  const localValue = readLocalJson(IN_PROGRESS_LOCAL_KEY);
  const today = getTodayDateStr();
  const value = localValue && localValue.date === today && Array.isArray(localValue.items)
    ? localValue.items
    : [];
  const next = new Map();
  const now = Date.now();
  for (const item of value) {
    if (!item || typeof item.uuid !== 'string') continue;
    if (next.size >= MAX_IN_PROGRESS_TODOS) break;
    const startAt = Number(item.startAt);
    next.set(item.uuid, Number.isFinite(startAt) && startAt > 0 ? startAt : now);
  }
  inProgressTodos = next;
  if (!localValue || localValue.date === today) return;
  writeLocalJson(IN_PROGRESS_LOCAL_KEY, null);
}

async function clearInProgressTodosForNewDay() {
  if (!inProgressTodos.size && !readLocalJson(IN_PROGRESS_LOCAL_KEY)) return false;
  inProgressTodos = new Map();
  writeLocalJson(IN_PROGRESS_LOCAL_KEY, null);
  return true;
}

async function pruneInProgressTodos() {
  if (!inProgressTodos.size) return;
  const today = getTodayDateStr();
  const all = await getAllTodos();
  const valid = new Set(
    all
      .filter(
        todo =>
          !todo.deletedAt &&
          !todo.completed &&
          todo.uuid &&
          todo.date === today
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
  if (todo.date !== getTodayDateStr()) {
    setStatus('只能将今天的任务设为进行中');
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

function getNextPendingSortOrder() {
  const pendingOrders = todos
    .filter(todo => todo && !todo.deletedAt && !todo.completed && Number.isFinite(todo.sortOrder))
    .map(todo => todo.sortOrder);
  if (!pendingOrders.length) return 0;
  return Math.min(...pendingOrders) - 1;
}

function formatTodoText(category, text) {
  const safeCategory = typeof category === 'string' && category.trim()
    ? category.trim()
    : 'Work';
  return `${safeCategory}:${text}`;
}

function parseCategorizedText(text) {
  const raw = typeof text === 'string' ? text.trim() : '';
  const match = raw.match(/^(Work|Life|Health|Social|Growth|Leisure|Plan):(.*)$/);
  if (!match) {
    return {
      category: 'Work',
      text: raw
    };
  }
  return {
    category: match[1],
    text: match[2].trim()
  };
}

if (addBtn && input) {
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
      text: formatTodoText(todoCategory ? todoCategory.value : 'Work', text),
      completed: false,
      sortOrder: getNextPendingSortOrder(),
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
}

if (dueInput) {
  dueInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && addBtn) addBtn.click();
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
  if (summaryInput) {
    summaryInput.value = latest ? latest.text : '';
  }
  summaryRatingValue = latest && typeof latest.rating === 'number' ? latest.rating : 0;
  renderSummaryRating();
  renderDailyFatigueQuestion();
  renderYesterdayFocusCount(selectedDate);
  autoResizeSummary();
  renderTimerTimeline();
  await renderContributionChart();
}

function getTimerTimelineSegmentsForDate(dateStr) {
  const stored = Array.isArray(timerTimelineByDate[dateStr]) ? timerTimelineByDate[dateStr] : [];
  const normalizeSegment = segment => {
    const slices = Array.isArray(segment.slices) && segment.slices.length
      ? segment.slices.map(slice => ({
        startAt: slice.startAt,
        endAt: slice.endAt
      }))
      : [{
        startAt: segment.startAt,
        endAt: segment.endAt
      }];
    const startAt = Math.min(...slices.map(slice => slice.startAt));
    const endAt = Math.max(...slices.map(slice => slice.endAt));
    return {
      ...segment,
      slices,
      startAt,
      endAt
    };
  };
  const segments = stored.map((segment, index) => ({
    ...normalizeSegment(segment),
    _order: index
  }));
  if (activeTimerSegment && activeTimerSegment.date === dateStr) {
    const now = Date.now();
    const liveSlices = (activeTimerSegment.slices || []).map((slice, index, allSlices) => ({
      startAt: slice.startAt,
      endAt: activeTimerSegment.state === 'running' && index === allSlices.length - 1
        ? now
        : slice.endAt
    }));
    segments.push({
      ...normalizeSegment({
        ...activeTimerSegment,
        slices: liveSlices
      }),
      _order: stored.length
    });
  }
  return segments.sort((a, b) => {
    const aSeq = Number.isFinite(a.sequence) ? a.sequence : Number.MAX_SAFE_INTEGER;
    const bSeq = Number.isFinite(b.sequence) ? b.sequence : Number.MAX_SAFE_INTEGER;
    if (aSeq !== bSeq) return aSeq - bSeq;
    return (a._order || 0) - (b._order || 0);
  });
}

function allocateTimelineLanes(segments) {
  return segments.map((segment, index) => ({
    ...segment,
    laneIndex: index,
    endAt: Math.max(segment.endAt || segment.startAt, segment.startAt + 60000)
  }));
}

function getTimelineStateLabel(state) {
  if (state === 'completed') return '自然完成';
  if (state === 'stopped') return '手动结束';
  if (state === 'paused') return '暂停中断';
  if (state === 'running') return '进行中';
  return '已记录';
}

function buildTimelineTooltip(segment) {
  const durationMs = (segment.slices || []).reduce(
    (sum, slice) => sum + Math.max(0, slice.endAt - slice.startAt),
    0
  );
  return [
    `${formatTooltipDate(segment.date)} · 第 ${segment.sequence} 段`,
    `开始：${formatClockTime(segment.startAt)}`,
    `结束：${formatClockTime(segment.endAt)}`,
    `时长：${formatDurationText(durationMs)}`,
    `片段：${(segment.slices || []).length} 段`,
    `状态：${getTimelineStateLabel(segment.state)}`
  ].join('\n');
}

function renderTimerTimeline() {
  if (!timerTimelineChart) return;
  const timelineDate = selectedDate;
  const segments = allocateTimelineLanes(getTimerTimelineSegmentsForDate(timelineDate));
  const dayStartMs = getDateStartMs(timelineDate);
  const dayEndMs = getDateEndMs(timelineDate);

  if (timerTimelineTitle) {
    timerTimelineTitle.textContent = `${formatTooltipDate(timelineDate)}工作时间段`;
  }

  if (!segments.length) {
    timerTimelineChart.replaceChildren(Object.assign(document.createElement('div'), {
      className: 'timeline-empty',
      textContent: timelineDate === getTodayDateStr()
        ? '今天还没有记录到倒计时时间段'
        : '这一天还没有记录到时间段'
    }));
    if (timerTimelineSummary) timerTimelineSummary.textContent = '';
    return;
  }

  const minStart = Math.max(dayStartMs, Math.min(...segments.map(segment => segment.startAt)));
  const maxEnd = Math.min(dayEndMs, Math.max(...segments.map(segment => segment.endAt)));
  const paddingMs = 15 * 60 * 1000;
  let axisStart = Math.max(dayStartMs, minStart - paddingMs);
  let axisEnd = Math.min(dayEndMs, maxEnd + paddingMs);
  if (axisEnd - axisStart < 60 * 60 * 1000) {
    const center = (axisStart + axisEnd) / 2;
    axisStart = Math.max(dayStartMs, center - 30 * 60 * 1000);
    axisEnd = Math.min(dayEndMs, center + 30 * 60 * 1000);
  }
  const axisDuration = Math.max(60 * 1000, axisEnd - axisStart);
  const tickCount = 5;

  const axis = document.createElement('div');
  axis.className = 'timeline-axis';
  axis.style.setProperty('--timeline-ticks', String(tickCount));
  for (let index = 0; index < tickCount; index += 1) {
    const label = document.createElement('span');
    const ratio = tickCount === 1 ? 0 : index / (tickCount - 1);
    label.textContent = formatClockTime(axisStart + axisDuration * ratio);
    axis.appendChild(label);
  }

  const body = document.createElement('div');
  body.className = 'timeline-body';

  const grid = document.createElement('div');
  grid.className = 'timeline-grid';
  grid.style.setProperty('--timeline-ticks', String(tickCount));
  for (let index = 0; index < tickCount; index += 1) {
    grid.appendChild(document.createElement('span'));
  }

  const lanes = document.createElement('div');
  lanes.className = 'timeline-lanes';
  const laneCount = Math.max(...segments.map(segment => segment.laneIndex)) + 1;
  const laneEls = Array.from({ length: laneCount }, () => {
    const lane = document.createElement('div');
    lane.className = 'timeline-lane';
    lanes.appendChild(lane);
    return lane;
  });

  const tooltip = document.createElement('div');
  tooltip.className = 'timeline-tooltip';
  tooltip.setAttribute('role', 'status');
  tooltip.setAttribute('aria-live', 'polite');

  const actionPopover = document.createElement('div');
  actionPopover.className = 'timeline-actions-popover';
  actionPopover.setAttribute('aria-hidden', 'true');

  const actionEditBtn = document.createElement('button');
  actionEditBtn.type = 'button';
  actionEditBtn.className = 'progress-btn timeline-popover-btn';
  actionEditBtn.textContent = '修改';

  const actionDeleteBtn = document.createElement('button');
  actionDeleteBtn.type = 'button';
  actionDeleteBtn.className = 'delete-btn timeline-popover-btn';
  actionDeleteBtn.textContent = '删除';

  actionPopover.append(actionEditBtn, actionDeleteBtn);

  let activePopoverSegment = null;
  let hidePopoverTimer = 0;

  const hideTooltip = () => {
    tooltip.classList.remove('is-visible');
  };

  const clearPopoverHideTimer = () => {
    if (hidePopoverTimer) {
      window.clearTimeout(hidePopoverTimer);
      hidePopoverTimer = 0;
    }
  };

  const hideActionPopover = () => {
    clearPopoverHideTimer();
    activePopoverSegment = null;
    actionPopover.classList.remove('is-visible');
    actionPopover.setAttribute('aria-hidden', 'true');
  };

  const scheduleHideActionPopover = () => {
    clearPopoverHideTimer();
    hidePopoverTimer = window.setTimeout(() => {
      hideActionPopover();
    }, 260);
  };

  const positionActionPopover = laneRect => {
    const chartRect = timerTimelineChart.getBoundingClientRect();
    const popoverHeight = actionPopover.offsetHeight;
    const belowTop = laneRect.bottom - chartRect.top + 10;
    const aboveTop = laneRect.top - chartRect.top - popoverHeight - 10;
    const maxTop = Math.max(4, chartRect.height - popoverHeight - 4);
    const top = belowTop <= maxTop ? belowTop : Math.max(4, aboveTop);
    actionPopover.style.left = 'auto';
    actionPopover.style.right = '12px';
    actionPopover.style.top = `${top}px`;
  };

  const showActionPopover = (lane, segment) => {
    if (!lane || !segment) return;
    clearPopoverHideTimer();
    activePopoverSegment = segment;
    const laneRect = lane.getBoundingClientRect();
    actionPopover.classList.add('is-visible');
    actionPopover.setAttribute('aria-hidden', 'false');
    positionActionPopover(laneRect);
  };

  actionEditBtn.addEventListener('click', event => {
    event.stopPropagation();
    if (!activePopoverSegment) return;
    const targetSegment = activePopoverSegment;
    hideTooltip();
    hideActionPopover();
    openTimelineEditModal(targetSegment);
  });

  actionDeleteBtn.addEventListener('click', event => {
    event.stopPropagation();
    if (!activePopoverSegment) return;
    hideTooltip();
    const { id } = activePopoverSegment;
    hideActionPopover();
    deleteTimerTimelineSegment(id);
  });

  actionPopover.addEventListener('pointerdown', clearPopoverHideTimer);
  actionPopover.addEventListener('mouseenter', clearPopoverHideTimer);
  actionPopover.addEventListener('mouseleave', scheduleHideActionPopover);
  actionPopover.addEventListener('focusin', clearPopoverHideTimer);
  actionPopover.addEventListener('focusout', () => {
    if (!actionPopover.contains(document.activeElement)) {
      scheduleHideActionPopover();
    }
  });

  const showTooltip = (button, text) => {
    const chartRect = timerTimelineChart.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    tooltip.textContent = text;
    tooltip.classList.add('is-visible');
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const maxLeft = Math.max(4, chartRect.width - tooltipWidth - 4);
    const left = Math.min(
      maxLeft,
      Math.max(4, buttonRect.left - chartRect.left + buttonRect.width / 2 - tooltipWidth / 2)
    );
    const belowTop = buttonRect.bottom - chartRect.top + 10;
    const aboveTop = buttonRect.top - chartRect.top - tooltipHeight - 10;
    const maxTop = Math.max(4, chartRect.height - tooltipHeight - 4);
    const top = belowTop <= maxTop ? belowTop : Math.max(4, aboveTop);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  segments.forEach(segment => {
    const lane = laneEls[segment.laneIndex];
    const tooltipText = buildTimelineTooltip(segment);
    lane.replaceChildren();

    if (segment.state !== 'running') {
      lane.addEventListener('mouseenter', () => {
        showActionPopover(lane, segment);
      });
      lane.addEventListener('mouseleave', () => {
        scheduleHideActionPopover();
      });
      lane.addEventListener('focusin', () => {
        showActionPopover(lane, segment);
      });
      lane.addEventListener('focusout', () => {
        if (!lane.contains(document.activeElement) && !actionPopover.contains(document.activeElement)) {
          scheduleHideActionPopover();
        }
      });
    }

    (segment.slices || []).forEach((slice, index, allSlices) => {
      const startRatio = Math.max(0, Math.min(1, (slice.startAt - axisStart) / axisDuration));
      const endRatio = Math.max(0, Math.min(1, (slice.endAt - axisStart) / axisDuration));
      const left = startRatio * 100;
      const width = Math.max(0, (endRatio - startRatio) * 100);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'timeline-segment';
      button.dataset.state = segment.state;
      button.style.left = `${left}%`;
      button.style.width = `${width}%`;
      button.style.backgroundColor = segment.color;
      if (segment.state === 'paused' && index < allSlices.length - 1) {
        button.classList.add('is-interrupted');
      }
      button.setAttribute('aria-label', tooltipText.replace(/\n/g, '，'));
      button.addEventListener('mouseenter', () => showTooltip(button, tooltipText));
      button.addEventListener('focus', () => showTooltip(button, tooltipText));
      button.addEventListener('mouseleave', hideTooltip);
      button.addEventListener('blur', hideTooltip);
      if (segment.state !== 'running') {
        button.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          hideTooltip();
          showActionPopover(lane, segment);
        });
      }
      lane.appendChild(button);
    });
  });

  body.appendChild(grid);
  body.appendChild(lanes);

  const totalDurationMs = segments.reduce(
    (sum, segment) => sum + (segment.slices || []).reduce(
      (sliceSum, slice) => sliceSum + Math.max(0, slice.endAt - slice.startAt),
      0
    ),
    0
  );
  timerTimelineChart.replaceChildren(axis, body, tooltip);
  timerTimelineChart.appendChild(actionPopover);
  if (timerTimelineSummary) timerTimelineSummary.textContent = '';
}

async function renderContributionChart() {
  if (!contributionChart && !taskStatusChart) return;
  const allTodos = await getAllTodos();
  const allSummaries = await getAllSummaries();
  const focusRatingByDate = new Map();
  const todoStatusByDate = new Map();

  allSummaries
    .filter(summary => !summary.deletedAt && summary.date)
    .forEach(summary => {
      const existing = focusRatingByDate.get(summary.date);
      const summaryTime = Date.parse(summary.updatedAt || summary.createdAt || 0);
      const existingTime = existing ? Date.parse(existing.updatedAt || existing.createdAt || 0) : -Infinity;
      if (!existing || summaryTime >= existingTime) {
        focusRatingByDate.set(summary.date, summary);
      }
    });

  allTodos
    .filter(todo => !todo.deletedAt && todo.date)
    .forEach(todo => {
      const current = todoStatusByDate.get(todo.date) || { total: 0, completed: 0 };
      current.total += 1;
      if (todo.completed) current.completed += 1;
      todoStatusByDate.set(todo.date, current);
    });

  contributionScores = new Map(
    [...focusRatingByDate.entries()].map(([date, summary]) => [
      date,
      Number.isFinite(summary.rating) ? summary.rating : 0
    ])
  );
  taskCompletionStatusByDate = new Map(
    [...todoStatusByDate.entries()].map(([date, status]) => [
      date,
      status.total > 0 && status.completed === status.total ? 'complete' : 'incomplete'
    ])
  );

  const periods = buildContributionMonthPeriods(
    [...new Set([...focusRatingByDate.keys(), ...todoStatusByDate.keys()])],
    new Date()
  );
  const currentPeriod = getContributionMonthPeriod(new Date());
  const todayDateStr = formatDateLocal(new Date());
  if (!periods.length) return;
  const activePeriod = getActiveContributionPeriod(periods, currentPeriod);
  if (!activePeriod) return;

  const { startDate: firstDate, endDate } = getContributionMonthRange(activePeriod);
  const firstWeekday = (firstDate.getDay() + 6) % 7;
  const totalDays = endDate.getDate();
  const rowCount = Math.ceil((firstWeekday + totalDays) / 7);

  const buildChart = ({ chartEl, getCellData, includePeriodNav = false }) => {
    if (!chartEl) return { countA: 0, countB: 0, countC: 0 };

    const layout = document.createElement('div');
    layout.className = 'contribution-layout';

    const wrapper = document.createElement('div');
    wrapper.className = 'contribution-grid';
    wrapper.style.setProperty('--rows', String(rowCount));

    const weekdays = document.createElement('div');
    weekdays.className = 'contribution-weekdays';
    ['一', '二', '三', '四', '五', '六', '日'].forEach(label => {
      const item = document.createElement('span');
      item.textContent = `周${label}`;
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

    for (let index = 0; index < rowCount * 7; index += 1) {
      const dayNumber = index - firstWeekday + 1;
      if (dayNumber < 1 || dayNumber > totalDays) {
        const spacer = document.createElement('span');
        spacer.className = 'contribution-cell is-outside';
        spacer.style.width = 'var(--contrib-cell-size)';
        spacer.style.height = 'var(--contrib-cell-size)';
        spacer.setAttribute('aria-hidden', 'true');
        cells.appendChild(spacer);
        continue;
      }

      const cellDate = new Date(activePeriod.year, activePeriod.month - 1, dayNumber);
      const dateStr = formatDateLocal(cellDate);
      const cell = getCellData(dateStr);
      countA += cell.countA || 0;
      countB += cell.countB || 0;
      countC += cell.countC || 0;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'contribution-cell';
      button.style.width = 'var(--contrib-cell-size)';
      button.style.height = 'var(--contrib-cell-size)';
      if (dateStr === selectedDate) button.classList.add('is-selected');
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
          button.textContent = formatContributionMonthLabel(period);
          button.setAttribute('aria-pressed', period.key === activePeriod.key ? 'true' : 'false');
          button.addEventListener('click', () => {
            if (contributionMonthKey === period.key) return;
            contributionMonthKey = period.key;
            contributionFollowCurrentMonth = period.key === currentPeriod.key;
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
      const rating = contributionScores.get(dateStr) ?? 0;
      const focusCount = Math.max(0, Math.min(10, Math.round(rating * 2)));
      const level = focusCount;
      return {
        level,
        tooltip: `${formatTooltipDate(dateStr)} · 专注 ${focusCount} 次`,
        countA: focusCount > 0 ? 1 : 0,
        countB: focusCount
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
        tooltip: `${formatTooltipDate(dateStr)} · ${tooltipText}`,
        countA: status === 'complete' ? 1 : 0,
        countB: status === 'incomplete' ? 1 : 0,
        countC: status === 'empty' ? 1 : 0
      };
    }
  });

  if (contributionTitle) {
    contributionTitle.textContent = formatContributionMonthTitle(activePeriod);
  }
  if (contributionChart) {
    contributionChart.setAttribute('aria-label', formatContributionMonthTitle(activePeriod));
  }
  if (contributionSummary) {
    contributionSummary.textContent = '';
  }
  if (taskStatusTitle) {
    taskStatusTitle.textContent = `${formatContributionMonthLabel(activePeriod)}\u4efb\u52a1\u5b8c\u6210\u56fe`;
  }
  if (taskStatusChart) {
    taskStatusChart.setAttribute('aria-label', `${formatContributionMonthLabel(activePeriod)}\u4efb\u52a1\u5b8c\u6210\u60c5\u51b5\u56fe`);
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

function resetRecurrenceForm() {
  if (recurrenceCategory) recurrenceCategory.value = 'Work';
  if (recurrenceText) recurrenceText.value = '';
  if (recurrenceType) recurrenceType.value = 'daily';
  if (recurrenceInterval) recurrenceInterval.value = '1';
  if (recurrenceUnit) recurrenceUnit.value = 'day';
  if (recurrenceDay) recurrenceDay.value = '1';
  if (recurrenceMonth) recurrenceMonth.value = '1';
  if (recurrenceYearDay) recurrenceYearDay.value = '1';
  if (recurrenceWeekly) {
    recurrenceWeekly.querySelectorAll('input[type="checkbox"]').forEach(el => {
      el.checked = false;
    });
  }
  toggleRecurrenceCustom();
}

function resetRecurrenceEditForm() {
  editingRecurrenceRuleId = null;
  if (recurrenceEditCategory) recurrenceEditCategory.value = 'Work';
  if (recurrenceEditText) recurrenceEditText.value = '';
  if (recurrenceEditType) recurrenceEditType.value = 'daily';
  if (recurrenceEditInterval) recurrenceEditInterval.value = '1';
  if (recurrenceEditUnit) recurrenceEditUnit.value = 'day';
  if (recurrenceEditDay) recurrenceEditDay.value = '1';
  if (recurrenceEditMonth) recurrenceEditMonth.value = '1';
  if (recurrenceEditYearDay) recurrenceEditYearDay.value = '1';
  if (recurrenceEditWeekly) {
    recurrenceEditWeekly.querySelectorAll('input[type="checkbox"]').forEach(el => {
      el.checked = false;
    });
  }
  toggleRecurrenceEditCustom();
}

function fillRecurrenceEditForm(rule) {
  if (!rule) return;
  editingRecurrenceRuleId = rule.id;
  const parsed = parseCategorizedText(rule.text);
  if (recurrenceEditCategory) recurrenceEditCategory.value = parsed.category;
  if (recurrenceEditText) recurrenceEditText.value = parsed.text;
  if (recurrenceEditType) recurrenceEditType.value = rule.type || 'daily';
  if (recurrenceEditInterval) recurrenceEditInterval.value = String(rule.interval || 1);
  if (recurrenceEditUnit) recurrenceEditUnit.value = rule.unit || 'day';
  if (recurrenceEditDay && Number.isFinite(Number(rule.day))) recurrenceEditDay.value = String(rule.day);
  if (recurrenceEditMonth && Number.isFinite(Number(rule.month))) recurrenceEditMonth.value = String(rule.month);
  if (recurrenceEditYearDay && Number.isFinite(Number(rule.day))) recurrenceEditYearDay.value = String(rule.day);
  if (recurrenceEditWeekly) {
    const selected = new Set(Array.isArray(rule.weekdays) ? rule.weekdays.map(Number) : []);
    recurrenceEditWeekly.querySelectorAll('input[type="checkbox"]').forEach(el => {
      el.checked = selected.has(Number(el.value));
    });
  }
  toggleRecurrenceEditCustom();
}

function openRecurrenceEditModal(rule) {
  if (!recurrenceEditModal || !rule) return;
  fillRecurrenceEditForm(rule);
  recurrenceEditModal.classList.remove('hidden');
}

function closeRecurrenceEditModal() {
  resetRecurrenceEditForm();
  if (recurrenceEditModal) recurrenceEditModal.classList.add('hidden');
}

async function syncFutureRecurringTodos(ruleId, nextText) {
  if (!Number.isFinite(Number(ruleId))) return;
  const today = getTodayDateStr();
  const related = await getTodosByRuleId(ruleId);
  const targets = related.filter(todo =>
    !todo.deletedAt &&
    !todo.completed &&
    todo.date >= today
  );
  if (!targets.length) return;
  const now = new Date().toISOString();
  await Promise.all(
    targets.map(todo =>
      updateTodo({
        ...todo,
        text: nextText,
        updatedAt: now
      })
    )
  );
}

function collectRecurrenceFormValue(fields) {
  const text = fields.text ? fields.text.value.trim() : '';
  if (!text) return null;
  const type = fields.type ? fields.type.value : 'daily';
  let weekdays = null;
  let day = null;
  let month = null;
  if (type === 'weekly' && fields.weekly) {
    const selected = Array.from(
      fields.weekly.querySelectorAll('input[type="checkbox"]:checked')
    ).map(el => Number(el.value));
    if (!selected.length) return null;
    weekdays = selected;
  }
  if (type === 'yearly' && fields.month && fields.yearDay) {
    month = Number(fields.month.value);
    day = Number(fields.yearDay.value);
  } else if (type === 'monthly' && fields.day) {
    day = Number(fields.day.value);
  }
  return {
    text: formatTodoText(fields.category ? fields.category.value : 'Work', text),
    type,
    weekdays,
    day,
    month,
    interval: type === 'custom' && fields.interval ? Number(fields.interval.value) : null,
    unit: type === 'custom' && fields.unit ? fields.unit.value : null
  };
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

    const edit = document.createElement('button');
    edit.className = 'edit-btn';
    edit.type = 'button';
    edit.textContent = '修改';
    edit.onclick = event => {
      event.stopPropagation();
      openRecurrenceEditModal(rule);
    };

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

    const actions = document.createElement('div');
    actions.className = 'recurrence-actions';
    actions.appendChild(edit);
    actions.appendChild(del);

    li.appendChild(text);
    li.appendChild(actions);
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
  if (dateStr !== today) return;
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

function toggleRecurrenceEditCustom() {
  const type = recurrenceEditType ? recurrenceEditType.value : '';
  if (recurrenceEditCustom) {
    recurrenceEditCustom.classList.toggle('hidden', type !== 'custom');
  }
  if (recurrenceEditWeekly) {
    recurrenceEditWeekly.classList.toggle('hidden', type !== 'weekly');
  }
  if (recurrenceEditMonthly) {
    recurrenceEditMonthly.classList.toggle('hidden', type !== 'monthly');
  }
  if (recurrenceEditYearly) {
    recurrenceEditYearly.classList.toggle('hidden', type !== 'yearly');
  }
}

if (recurrenceType) recurrenceType.addEventListener('change', toggleRecurrenceCustom);
if (recurrenceEditType) recurrenceEditType.addEventListener('change', toggleRecurrenceEditCustom);

if (recurrenceAddBtn) {
  recurrenceAddBtn.addEventListener('click', async () => {
    const now = new Date().toISOString();
    const rule = collectRecurrenceFormValue({
      category: recurrenceCategory,
      text: recurrenceText,
      type: recurrenceType,
      weekly: recurrenceWeekly,
      day: recurrenceDay,
      month: recurrenceMonth,
      yearDay: recurrenceYearDay,
      interval: recurrenceInterval,
      unit: recurrenceUnit
    });
    if (!rule) {
      setStatus('请完善重复规则内容');
      return;
    }
    await addRecurrenceRule({
      ...rule,
      updatedAt: now,
      deletedAt: null,
      createdAt: now,
      uuid: generateUUID()
    });
    triggerChangeSync();
    resetRecurrenceForm();
    await loadRecurrenceRules();
  });
}

if (recurrenceEditSaveBtn) {
  recurrenceEditSaveBtn.addEventListener('click', async () => {
    if (editingRecurrenceRuleId == null) {
      setStatus('未找到要修改的重复规则');
      return;
    }
    const current = recurrenceRules.find(item => item.id === editingRecurrenceRuleId);
    if (!current) {
      setStatus('重复规则已失效，请重新打开');
      return;
    }
    const now = new Date().toISOString();
    const rule = collectRecurrenceFormValue({
      category: recurrenceEditCategory,
      text: recurrenceEditText,
      type: recurrenceEditType,
      weekly: recurrenceEditWeekly,
      day: recurrenceEditDay,
      month: recurrenceEditMonth,
      yearDay: recurrenceEditYearDay,
      interval: recurrenceEditInterval,
      unit: recurrenceEditUnit
    });
    if (!rule) {
      setStatus('请完善重复规则内容');
      return;
    }
    await updateRecurrenceRule({
      ...current,
      ...rule,
      updatedAt: now,
      deletedAt: null,
      createdAt: current.createdAt || now
    });
    await syncFutureRecurringTodos(current.id, rule.text);
    triggerChangeSync();
    await loadRecurrenceRules();
    await loadForDate();
    closeRecurrenceEditModal();
  });
}

if (recurrenceOpenBtn) {
  recurrenceOpenBtn.addEventListener('click', () => {
    if (!recurrenceModal) return;
    recurrenceModal.classList.remove('hidden');
    resetRecurrenceForm();
    if (recurrenceList) recurrenceList.scrollTop = 0;
    void loadRecurrenceRules().then(() => {
      if (!recurrenceList) return;
      requestAnimationFrame(() => {
        recurrenceList.scrollTop = 0;
      });
    });
  });
}

if (recurrenceCloseBtn) {
  recurrenceCloseBtn.addEventListener('click', () => {
    resetRecurrenceForm();
    if (recurrenceModal) recurrenceModal.classList.add('hidden');
  });
}

if (recurrenceModal) {
  recurrenceModal.addEventListener('click', event => {
    if (event.target === recurrenceModal) {
      resetRecurrenceForm();
      recurrenceModal.classList.add('hidden');
    }
  });
}

if (recurrenceEditCloseBtn) {
  recurrenceEditCloseBtn.addEventListener('click', closeRecurrenceEditModal);
}

if (recurrenceEditCancelBtn) {
  recurrenceEditCancelBtn.addEventListener('click', closeRecurrenceEditModal);
}

if (recurrenceEditModal) {
  recurrenceEditModal.addEventListener('click', event => {
    if (event.target === recurrenceEditModal) closeRecurrenceEditModal();
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

if (recurrenceCustom) resetRecurrenceForm();
if (recurrenceEditCustom) resetRecurrenceEditForm();

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
    void saveSummaryNow();
  });
  summaryRating.addEventListener('dblclick', event => {
    const target = event.target.closest('.star');
    if (!target) return;
    const index = Number(target.dataset.star);
    summaryRatingValue = index;
    renderSummaryRating();
    void saveSummaryNow();
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
  if (recurrenceEditDay) {
    recurrenceEditDay.innerHTML = '';
    for (let i = 1; i <= 31; i += 1) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = String(i);
      recurrenceEditDay.appendChild(option);
    }
  }
  if (recurrenceEditMonth) {
    recurrenceEditMonth.innerHTML = '';
    for (let i = 1; i <= 12; i += 1) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = String(i);
      recurrenceEditMonth.appendChild(option);
    }
  }
  if (recurrenceEditYearDay) {
    recurrenceEditYearDay.innerHTML = '';
    for (let i = 1; i <= 31; i += 1) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = String(i);
      recurrenceEditYearDay.appendChild(option);
    }
  }
}

buildRecurrenceDateOptions();

let summarySaveTimer = null;
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

let latestBgmDebugSnapshot = null;
let currentBgmPlaybackState = 'stopped';

function renderBgmStatus(state) {
  if (!bgmStatusEl) return;
  currentBgmPlaybackState = state || 'stopped';
  const labels = {
    stopped: '未播放',
    paused: '已暂停',
    downloading: '下载中',
    loading: '准备播放中',
    playing: '播放中'
  };
  bgmStatusEl.textContent = `BGM：${labels[state] || '未播放'}`;
  updateToggleLabel();
}

function renderBgmDebug(snapshot) {
  latestBgmDebugSnapshot = snapshot;
  if (!bgmLogOutput) return;
  const lines = [];
  if (snapshot) {
    const sourceLabel = snapshot.source?.label || 'unknown';
    const sourceType = snapshot.source?.type || 'unknown';
    const configuredValue = snapshot.source?.value || '';
    const activeMediaUrl = snapshot.htmlAudio?.src || '';
    const htmlReadyState = Number.isFinite(snapshot.htmlAudio?.readyState) ? snapshot.htmlAudio.readyState : 'n/a';
    const htmlNetworkState = Number.isFinite(snapshot.htmlAudio?.networkState) ? snapshot.htmlAudio.networkState : 'n/a';
    const usingDefaultSource = sourceLabel === 'default';
    const resourceName = configuredValue
      ? configuredValue.split('/').pop().split('?')[0]
      : sourceType === 'file'
        ? '本地文件'
        : 'unknown';

    lines.push(`播放状态：${snapshot.playbackState || 'unknown'}`);
    lines.push(`播放模式：${snapshot.mode || 'unknown'}`);
    lines.push(`当前来源：${sourceLabel}`);
    lines.push(`资源类型：${sourceType === 'file' ? '本地文件' : '远程地址'}`);
    lines.push(`资源名称：${resourceName}`);
    lines.push(`默认资源：${usingDefaultSource ? '是' : '否'}`);
    lines.push(`本地缓存：${activeMediaUrl.startsWith('blob:') ? '是' : '否'}`);
    lines.push(`配置地址：${configuredValue || '无'}`);
    lines.push(`实际媒体地址：${activeMediaUrl || '无'}`);
    lines.push(`交互解锁：${snapshot.userInteracted ? '是' : '否'}`);
    lines.push(`音量：${Math.round((snapshot.volume || 0) * 100)}%`);
    lines.push(`HTMLAudio状态：readyState=${htmlReadyState} networkState=${htmlNetworkState}`);
    lines.push('');
    lines.push('日志：');
    const logs = Array.isArray(snapshot.logs) ? snapshot.logs : [];
    if (logs.length) {
      lines.push(...logs);
    } else {
      lines.push('暂无音频资源日志');
    }
  } else {
    lines.push('暂无音频资源日志');
  }
  bgmLogOutput.textContent = lines.join('\n');
  bgmLogOutput.scrollTop = bgmLogOutput.scrollHeight;
}

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

async function restoreRegretCoinLedgerLocal() {
  const record = await getMeta(REGRET_COIN_LEDGER_META_KEY);
  regretCoinLedger = normalizeRegretCoinLedger(record ? record.value : []);
  renderRegretCoinSection();
}

void restoreRegretCoinLedgerLocal();
void restoreDailyFatigueAnswersLocal();

function autoResizeSummary() {
  if (!summaryInput) return;
  summaryInput.style.height = 'auto';
  summaryInput.style.height = `${summaryInput.scrollHeight}px`;
}

function getLatestSummaryRecord(summaryList = summaries) {
  return summaryList
    .filter(summary => !summary.deletedAt)
    .sort((a, b) => {
      const aTime = Date.parse(a.updatedAt || a.createdAt || 0);
      const bTime = Date.parse(b.updatedAt || b.createdAt || 0);
      return bTime - aTime;
    })[0];
}

function scheduleSummarySave() {
  if (summarySaveTimer) clearTimeout(summarySaveTimer);
  summarySaveTimer = setTimeout(saveSummaryNow, 2000);
}

function addFocusRatingHalfStar() {
  summaryRatingValue = Math.max(0, Math.min(5, summaryRatingValue + 0.5));
  renderSummaryRating();
  scheduleSummarySave();
}

async function saveSummaryNow() {
  if (summarySaveTimer) {
    clearTimeout(summarySaveTimer);
    summarySaveTimer = null;
  }
  const text = summaryInput ? summaryInput.value.trim() : '';
  const now = new Date().toISOString();
  const existing = getLatestSummaryRecord();

  if (!text && summaryRatingValue === 0) {
    if (existing) {
      const nextSummary = {
        ...existing,
        deletedAt: now,
        updatedAt: now
      };
      await updateSummary(nextSummary);
      summaries = summaries.map(summary =>
        summary.id === nextSummary.id ? nextSummary : summary
      );
      triggerChangeSync();
      setSummaryStatus('');
      await renderContributionChart();
    }
    return;
  }

  if (existing) {
    const nextSummary = {
      ...existing,
      text,
      rating: summaryRatingValue,
      updatedAt: now,
      deletedAt: null
    };
    await updateSummary(nextSummary);
    summaries = summaries.map(summary =>
      summary.id === nextSummary.id ? nextSummary : summary
    );
    triggerChangeSync();
  } else {
    const initResult = syncInitPromise ? await syncInitPromise : null;
    const userId = currentUserId ||
      (initResult && initResult.userId ? initResult.userId : ensureUserId());
    const nextSummary = {
      date: selectedDate,
      text,
      rating: summaryRatingValue,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      uuid: generateUUID(),
      userId
    };
    const id = await addSummary(nextSummary);
    summaries = [...summaries, { ...nextSummary, id }];
    triggerChangeSync();
  }
  setSummaryStatus('');
  await renderContributionChart();
}


if (summaryInput) {
  summaryInput.addEventListener('input', () => {
    autoResizeSummary();
    scheduleSummarySave();
  });

  summaryInput.addEventListener('blur', () => {
    void saveSummaryNow();
  });
}

if (fatigueYesBtn) {
  fatigueYesBtn.addEventListener('click', () => {
    void setDailyFatigueAnswer('yes');
  });
}

if (fatigueNoBtn) {
  fatigueNoBtn.addEventListener('click', () => {
    void setDailyFatigueAnswer('no');
  });
}

window.setInterval(() => {
  renderDailyFatigueQuestion();
}, 60 * 1000);

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
const DEFAULT_REST_MINUTES = 20;
const TIMER_TIMELINE_COLORS = [
  '#0f766e',
  '#f97316',
  '#2563eb',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#65a30d',
  '#ea580c'
];
let timerDurationMs = DEFAULT_MINUTES * 60 * 1000;
let timerInterval = null;
let timerRunning = false;
let timerRemainingMs = timerDurationMs;
let timerStartAt = Date.now();
let timerMode = 'work';
let timerHasStartedWorkSession = false;
let bellPhase = {
  state: 'work',
  restEndsAt: 0,
  nextBellAt: 0
};
let alarmVolumeRatio = 0.15;
let timerInlinePromptAction = null;

let audioContext = null;
let lastPersistAt = 0;
let ownsTimerLease = false;
let timerLeaseInterval = null;

function getTimerTimelineSequence(dateStr) {
  const history = Array.isArray(timerTimelineByDate[dateStr]) ? timerTimelineByDate[dateStr] : [];
  const activeCount = activeTimerSegment && activeTimerSegment.date === dateStr ? 1 : 0;
  return history.length + activeCount + 1;
}

async function persistTimerTimelineHistory() {
  const updatedAt = new Date().toISOString();
  writeLocalJson(TIMER_TIMELINE_LOCAL_KEY, timerTimelineByDate);
  await Promise.all([
    setMeta(TIMER_TIMELINE_META_KEY, timerTimelineByDate),
    setMeta(TIMER_TIMELINE_UPDATED_AT_META_KEY, updatedAt)
  ]);
}

async function getTimerTimelineManualOps() {
  const record = await getMeta(TIMER_TIMELINE_MANUAL_OPS_KEY);
  const value = record && record.value && typeof record.value === 'object'
    ? record.value
    : {};
  return {
    editedIds: Array.isArray(value.editedIds) ? value.editedIds.filter(Boolean) : [],
    deletedIds: Array.isArray(value.deletedIds) ? value.deletedIds.filter(Boolean) : []
  };
}

async function markTimerTimelineManualEdit(segmentId) {
  if (!segmentId) return;
  const ops = await getTimerTimelineManualOps();
  const deletedIds = ops.deletedIds.filter(id => id !== segmentId);
  const editedIds = ops.editedIds.includes(segmentId)
    ? ops.editedIds
    : [...ops.editedIds, segmentId];
  await setMeta(TIMER_TIMELINE_MANUAL_OPS_KEY, { editedIds, deletedIds });
}

async function markTimerTimelineManualDelete(segmentId) {
  if (!segmentId) return;
  const ops = await getTimerTimelineManualOps();
  const editedIds = ops.editedIds.filter(id => id !== segmentId);
  const deletedIds = ops.deletedIds.includes(segmentId)
    ? ops.deletedIds
    : [...ops.deletedIds, segmentId];
  await setMeta(TIMER_TIMELINE_MANUAL_OPS_KEY, { editedIds, deletedIds });
}

async function persistActiveTimerSegment() {
  const updatedAt = new Date().toISOString();
  writeLocalJson(TIMER_TIMELINE_ACTIVE_LOCAL_KEY, activeTimerSegment);
  await Promise.all([
    setMeta(TIMER_TIMELINE_ACTIVE_META_KEY, activeTimerSegment),
    setMeta(TIMER_TIMELINE_ACTIVE_UPDATED_AT_META_KEY, updatedAt)
  ]);
}

async function restoreTimerTimeline() {
  const localHistory = readLocalJson(TIMER_TIMELINE_LOCAL_KEY);
  const localActive = readLocalJson(TIMER_TIMELINE_ACTIVE_LOCAL_KEY);
  if (localHistory && typeof localHistory === 'object') {
    timerTimelineByDate = localHistory;
  } else {
    const historyRecord = await getMeta(TIMER_TIMELINE_META_KEY);
    timerTimelineByDate = historyRecord && historyRecord.value && typeof historyRecord.value === 'object'
      ? historyRecord.value
      : {};
  }
  if (localActive !== null) {
    activeTimerSegment = localActive;
  } else {
    const activeRecord = await getMeta(TIMER_TIMELINE_ACTIVE_META_KEY);
    activeTimerSegment = activeRecord ? activeRecord.value : null;
  }
  renderTimerTimeline();
}

function startTimerTimelineSegment(now = Date.now()) {
  const dateStr = formatDateLocal(new Date(now));
  if (
    activeTimerSegment &&
    activeTimerSegment.date === dateStr &&
    activeTimerSegment.state === 'paused'
  ) {
    const slices = Array.isArray(activeTimerSegment.slices) ? activeTimerSegment.slices.slice() : [];
    slices.push({ startAt: now, endAt: now });
    activeTimerSegment = {
      ...activeTimerSegment,
      state: 'running',
      slices
    };
    void persistActiveTimerSegment();
    triggerChangeSync();
    renderTimerTimeline();
    return;
  }
  const sequence = getTimerTimelineSequence(dateStr);
  activeTimerSegment = {
    id: generateUUID(),
    date: dateStr,
    startAt: now,
    endAt: now,
    state: 'running',
    plannedDurationMs: timerRemainingMs,
    sequence,
    color: TIMER_TIMELINE_COLORS[(sequence - 1) % TIMER_TIMELINE_COLORS.length],
    slices: [{ startAt: now, endAt: now }]
  };
  void persistActiveTimerSegment();
  triggerChangeSync();
  renderTimerTimeline();
}

function pauseTimerTimelineSegment(endAt = Date.now()) {
  if (!activeTimerSegment || activeTimerSegment.state !== 'running') return;
  const slices = Array.isArray(activeTimerSegment.slices) ? activeTimerSegment.slices.slice() : [];
  if (!slices.length) {
    slices.push({ startAt: endAt, endAt });
  } else {
    const lastIndex = slices.length - 1;
    slices[lastIndex] = {
      ...slices[lastIndex],
      endAt: Math.max(endAt, slices[lastIndex].startAt + 1000)
    };
  }
  activeTimerSegment = {
    ...activeTimerSegment,
    state: 'paused',
    slices
  };
  void persistActiveTimerSegment();
  triggerChangeSync();
  renderTimerTimeline();
}

function finalizeTimerTimelineSegment(state, endAt = Date.now()) {
  if (!activeTimerSegment) return;
  const slices = Array.isArray(activeTimerSegment.slices) ? activeTimerSegment.slices.slice() : [];
  if (activeTimerSegment.state === 'running') {
    if (!slices.length) {
      slices.push({ startAt: endAt, endAt });
    } else {
      const lastIndex = slices.length - 1;
      slices[lastIndex] = {
        ...slices[lastIndex],
        endAt: Math.max(endAt, slices[lastIndex].startAt + 1000)
      };
    }
  }
  const startAt = Math.min(...slices.map(slice => slice.startAt));
  const finalEndAt = Math.max(...slices.map(slice => slice.endAt));
  const segment = {
    ...activeTimerSegment,
    startAt,
    endAt: finalEndAt,
    slices,
    state
  };
  const history = Array.isArray(timerTimelineByDate[segment.date]) ? timerTimelineByDate[segment.date] : [];
  timerTimelineByDate = {
    ...timerTimelineByDate,
    [segment.date]: [...history, segment]
  };
  activeTimerSegment = null;
  void Promise.all([persistTimerTimelineHistory(), persistActiveTimerSegment()]);
  triggerChangeSync();
  renderTimerTimeline();
}

function deleteTimerTimelineSegment(segmentId) {
  if (!segmentId) return;

  if (activeTimerSegment && activeTimerSegment.id === segmentId) {
    if (activeTimerSegment.state === 'running') {
      void openPromptModal('进行中的时间段请先暂停或结束后再删除。', {
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    activeTimerSegment = null;
    void persistActiveTimerSegment();
    triggerChangeSync();
    renderTimerTimeline();
    return;
  }

  let changed = false;
  const nextTimelineByDate = {};
  Object.entries(timerTimelineByDate).forEach(([dateStr, segments]) => {
    const source = Array.isArray(segments) ? segments : [];
    const remaining = source.filter(segment => segment.id !== segmentId);
    if (remaining.length !== source.length) changed = true;
    if (remaining.length) nextTimelineByDate[dateStr] = remaining;
  });

  if (!changed) return;
  timerTimelineByDate = nextTimelineByDate;
  void (async () => {
    await persistTimerTimelineHistory();
    await markTimerTimelineManualDelete(segmentId);
    triggerChangeSync();
    renderTimerTimeline();
  })();
}

function closeTimelineEditModal() {
  timelineEditingSegmentId = null;
  timelineEditingDate = '';
  timelineEditingDraft = [];
  timelineEditingInitialSnapshot = '';
  if (timelineEditModal) timelineEditModal.classList.add('hidden');
}

function getTimelineEditSnapshot() {
  return JSON.stringify(timelineEditingDraft);
}

function hasUnsavedTimelineEdits() {
  return timelineEditingInitialSnapshot && getTimelineEditSnapshot() !== timelineEditingInitialSnapshot;
}

function requestCloseTimelineEditModal() {
  if (hasUnsavedTimelineEdits()) {
    void openPromptModal('当前修改尚未保存，确定要关闭吗？').then(shouldDiscard => {
      if (!shouldDiscard) return;
      closeTimelineEditModal();
    });
    return;
  }
  closeTimelineEditModal();
}

function renderTimelineEditDraft() {
  if (!timelineEditList) return;
  timelineEditList.replaceChildren();

  timelineEditingDraft.forEach((slice, index) => {
    const row = document.createElement('div');
    row.className = 'timeline-edit-row';

    const label = document.createElement('span');
    label.textContent = `片段 ${index + 1}`;

    const startInput = document.createElement('input');
    startInput.type = 'time';
    startInput.step = '60';
    startInput.value = slice.start;
    startInput.addEventListener('input', () => {
      timelineEditingDraft[index].start = startInput.value;
    });

    const endInput = document.createElement('input');
    endInput.type = 'time';
    endInput.step = '60';
    endInput.value = slice.end;
    endInput.addEventListener('input', () => {
      timelineEditingDraft[index].end = endInput.value;
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '删除';
    deleteBtn.style.opacity = '1';
    deleteBtn.style.pointerEvents = 'auto';
    deleteBtn.addEventListener('click', () => {
      timelineEditingDraft.splice(index, 1);
      renderTimelineEditDraft();
    });

    row.append(label, startInput, endInput, deleteBtn);
    timelineEditList.appendChild(row);
  });
}

function openTimelineEditModal(segment) {
  if (!timelineEditModal || !segment) return;
  timelineEditingSegmentId = segment.id;
  timelineEditingDate = segment.date;
  timelineEditingDraft = (segment.slices || []).map(slice => ({
    start: formatTimeInputValue(slice.startAt),
    end: formatTimeInputValue(slice.endAt)
  }));
  timelineEditingInitialSnapshot = getTimelineEditSnapshot();
  if (timelineEditTitle) {
    timelineEditTitle.textContent = `${formatTooltipDate(segment.date)} · 第 ${segment.sequence} 段`;
  }
  renderTimelineEditDraft();
  timelineEditModal.classList.remove('hidden');
}

async function saveTimelineEditModal() {
  if (!timelineEditingSegmentId || !timelineEditingDate) return;
  if (!timelineEditingDraft.length) {
    await openPromptModal('至少保留一个时间片段。', { showCancel: false, confirmText: '知道了' });
    return;
  }

  const slices = timelineEditingDraft
    .map(item => ({
      startAt: parseTimeInputValue(timelineEditingDate, item.start),
      endAt: parseTimeInputValue(timelineEditingDate, item.end)
    }))
    .sort((a, b) => a.startAt - b.startAt);

  if (slices.some(slice => slice.startAt == null || slice.endAt == null || slice.endAt < slice.startAt)) {
    await openPromptModal('请检查时间片段，结束时间不能早于开始时间。', {
      showCancel: false,
      confirmText: '知道了'
    });
    return;
  }
  for (let index = 1; index < slices.length; index += 1) {
    if (slices[index].startAt < slices[index - 1].endAt) {
      await openPromptModal('时间片段不能重叠，请调整后再保存。', {
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
  }

  const updateSegment = segment => ({
    ...segment,
    slices,
    startAt: slices[0].startAt,
    endAt: slices[slices.length - 1].endAt
  });

  if (activeTimerSegment && activeTimerSegment.id === timelineEditingSegmentId) {
    activeTimerSegment = updateSegment(activeTimerSegment);
    await persistActiveTimerSegment();
    triggerChangeSync();
    renderTimerTimeline();
    closeTimelineEditModal();
    return;
  }

  let changed = false;
  timerTimelineByDate = Object.fromEntries(
    Object.entries(timerTimelineByDate).map(([dateStr, segments]) => [
      dateStr,
      (Array.isArray(segments) ? segments : []).map(segment => {
        if (segment.id !== timelineEditingSegmentId) return segment;
        changed = true;
        return updateSegment(segment);
      })
    ])
  );

  if (!changed) return;
  await persistTimerTimelineHistory();
  await markTimerTimelineManualEdit(timelineEditingSegmentId);
  triggerChangeSync();
  renderTimerTimeline();
  closeTimelineEditModal();
}

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
      if (timerMode === 'work') bgm.play();
      else bgm.stop();
      tickTimer();
    }
    return;
  }
  clearTimerTicking();
  bgm.stop();
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

function playToneWithFade(freq, startAt, durationMs, gainValue) {
  if (!audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(gainValue, startAt + 0.08);
  gain.gain.linearRampToValueAtTime(gainValue * 0.88, startAt + Math.max(0.16, durationMs / 1000 - 0.18));
  gain.gain.linearRampToValueAtTime(0.0001, startAt + durationMs / 1000);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(startAt);
  osc.stop(startAt + durationMs / 1000);
}

function playRestEndAlarm() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const gainValue = Math.max(0.02, Math.min(0.9, bgm.getVolume()));
    const startAt = audioContext.currentTime + 0.02;
    const notes = [
      { freq: 440, offset: 0, durationMs: 520 },
      { freq: 554.37, offset: 0.42, durationMs: 520 },
      { freq: 659.25, offset: 0.84, durationMs: 680 },
      { freq: 554.37, offset: 1.46, durationMs: 540 },
      { freq: 440, offset: 1.88, durationMs: 880 }
    ];
    notes.forEach(note => {
      playToneWithFade(note.freq, startAt + note.offset, note.durationMs, gainValue);
    });
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

function hideTimerInlinePrompt() {
  timerInlinePromptAction = null;
  if (timerInlinePromptEl) timerInlinePromptEl.classList.add('hidden');
}

function showTimerInlinePrompt(message, options = {}) {
  if (!timerInlinePromptEl || !timerInlinePromptTextEl || !timerInlinePromptConfirmBtn || !timerInlinePromptCancelBtn) {
    return;
  }
  timerInlinePromptTextEl.textContent = message;
  timerInlinePromptConfirmBtn.textContent = options.confirmText || '确定';
  timerInlinePromptCancelBtn.textContent = options.cancelText || '取消';
  timerInlinePromptCancelBtn.classList.toggle('hidden', options.showCancel === false);
  timerInlinePromptAction = typeof options.onConfirm === 'function' ? options.onConfirm : null;
  timerInlinePromptEl.classList.remove('hidden');
}

function resetBellSchedule(now) {
  bellPhase = {
    state: 'work',
    restEndsAt: 0,
    nextBellAt: now + randomBellSeconds() * 1000
  };
}

function setTimerMode(nextMode) {
  timerMode = nextMode === 'rest' ? 'rest' : 'work';
}

function getCurrentTimerPauseCount() {
  if (!activeTimerSegment) return 0;
  const slices = Array.isArray(activeTimerSegment.slices) ? activeTimerSegment.slices : [];
  return Math.max(0, slices.length - 1);
}

function prepareWorkTimer(minutes = DEFAULT_MINUTES) {
  timerDurationMs = minutes * 60 * 1000;
  timerRemainingMs = timerDurationMs;
  setTimerMode('work');
  if (timerMinutesInput) timerMinutesInput.value = minutes;
  updateTimerUI(timerRemainingMs);
}

function prepareRestTimer(minutes = DEFAULT_REST_MINUTES) {
  timerDurationMs = minutes * 60 * 1000;
  timerRemainingMs = timerDurationMs;
  setTimerMode('rest');
  if (timerMinutesInput) timerMinutesInput.value = minutes;
  updateTimerUI(timerRemainingMs);
}

function startRestTimer() {
  hideTimerInlinePrompt();
  const now = Date.now();
  prepareRestTimer(DEFAULT_REST_MINUTES);
  timerHasStartedWorkSession = true;
  timerRunning = true;
  timerStartAt = now;
  bellPhase = {
    state: 'rest',
    restEndsAt: 0,
    nextBellAt: 0
  };
  setTimerStatus('休息中');
  updateToggleLabel();
  persistTimerState();
  updateTimerLease();
  if (ownsTimerLease) {
    bgm.stop();
    tickTimer();
  }
}

function promptStartRest() {
  const pauseCount = getCurrentTimerPauseCount();
  showTimerInlinePrompt(`工作已结束，本次倒计时暂停了 ${pauseCount} 次，是否开始 20 分钟休息？`, {
    confirmText: '开始休息',
    cancelText: '取消',
    onConfirm: () => {
      startRestTimer();
    }
  });
}

function startDefaultWorkTimer() {
  hideTimerInlinePrompt();
  prepareWorkTimer(DEFAULT_MINUTES);
  startTimer();
}

function promptResumeWork() {
  showTimerInlinePrompt('休息已结束，是否继续工作？', {
    confirmText: '确定',
    cancelText: '取消',
    onConfirm: () => {
      startDefaultWorkTimer();
    }
  });
}

function tickTimer() {
  if (!timerRunning || !ownsTimerLease) return;
  const now = Date.now();
  const remainingMs = Math.max(0, timerRemainingMs - (now - timerStartAt));
  updateTimerUI(remainingMs);

  if (remainingMs <= 0) {
    timerRunning = false;
    const finishedMode = timerMode;
    prepareWorkTimer(DEFAULT_MINUTES);
    setTimerStatus(finishedMode === 'rest' ? '休息结束' : '倒计时结束');
    if (finishedMode === 'rest') {
      playRestEndAlarm();
      promptResumeWork();
    } else {
      playTone(600, 800);
      addFocusRatingHalfStar();
      promptStartRest();
      finalizeTimerTimelineSegment('completed', now);
      timerHasStartedWorkSession = false;
    }
    updateToggleLabel();
    persistTimerState();
    bgm.stop();
    releaseTimerLease();
    clearTimerTicking();
    return;
  }

  if (timerMode === 'rest') {
    setTimerStatus(`休息中，还剩 ${Math.ceil(remainingMs / 1000)} 秒`);
    if (now - lastPersistAt > 5000) {
      lastPersistAt = now;
      persistTimerState();
    }
    return;
  }

  if (bellPhase.state === 'rest') {
    const restLeft = Math.max(0, Math.ceil((bellPhase.restEndsAt - now) / 1000));
    setTimerStatus(`休息中（${restLeft}s）`);
    if (restLeft <= 0) {
      bellPhase.state = 'work';
      bellPhase.nextBellAt = now + randomBellSeconds() * 1000;
      playTone(900, 180);
      renderTimerTimeline();
    }
    return;
  }

  const nextBellIn = Math.max(0, Math.ceil((bellPhase.nextBellAt - now) / 1000));
  setTimerStatus(`距离下次休息还有 ${nextBellIn} 秒`);
  if (nextBellIn <= 0) {
    bellPhase.state = 'rest';
    bellPhase.restEndsAt = now + 10000;
    playTone(420, 180);
    renderTimerTimeline();
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
  const now = Date.now();
  hideTimerInlinePrompt();
  timerRunning = true;
  timerStartAt = now;
  if (timerMode === 'work') {
    timerHasStartedWorkSession = true;
    resetBellSchedule(now);
    startTimerTimelineSegment(now);
  } else {
    bellPhase = {
      state: 'rest',
      restEndsAt: 0,
      nextBellAt: 0
    };
  }
  updateToggleLabel();
  persistTimerState();
  updateTimerLease();
  if (ownsTimerLease) {
    if (timerMode === 'work') bgm.play();
    else bgm.stop();
    tickTimer();
  }
}

function pauseTimer() {
  if (!timerRunning) return;
  const now = Date.now();
  const remainingMs = Math.max(0, timerRemainingMs - (now - timerStartAt));
  timerRemainingMs = remainingMs;
  timerRunning = false;
  setTimerStatus(timerMode === 'rest' ? '休息已暂停' : '已暂停');
  updateToggleLabel();
  persistTimerState();
  if (timerMode === 'work') pauseTimerTimelineSegment(now);
  bgm.stop();
  releaseTimerLease();
  clearTimerTicking();
}

function stopTimer() {
  if (!timerHasStartedWorkSession) {
    setTimerStatus('还没有开始倒计时');
    return;
  }
  const now = Date.now();
  timerRunning = false;
  timerRemainingMs = timerDurationMs;
  updateTimerUI(timerRemainingMs);
  setTimerStatus(timerMode === 'rest' ? '休息已结束' : '已结束');
  updateToggleLabel();
  hideTimerInlinePrompt();
  if (timerMode === 'work') {
    addFocusRatingHalfStar();
    finalizeTimerTimelineSegment('stopped', now);
  }
  timerHasStartedWorkSession = false;
  prepareWorkTimer(DEFAULT_MINUTES);
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
  timerHasStartedWorkSession = false;
  setTimerMode('work');
  updateTimerUI(timerRemainingMs);
  setTimerStatus('未开始');
  updateToggleLabel();
  hideTimerInlinePrompt();
  persistTimerState();
  finalizeTimerTimelineSegment('stopped');
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
    if (currentBgmPlaybackState === 'downloading') return;
    if (timerRunning) pauseTimer();
    else startTimer();
  });
}
if (timerStopBtn) timerStopBtn.addEventListener('click', stopTimer);

if (timerInlinePromptConfirmBtn) {
  timerInlinePromptConfirmBtn.addEventListener('click', () => {
    const action = timerInlinePromptAction;
    hideTimerInlinePrompt();
    if (action) action();
  });
}

if (timerInlinePromptCancelBtn) {
  timerInlinePromptCancelBtn.addEventListener('click', () => {
    hideTimerInlinePrompt();
  });
}

updateTimerUI(timerRemainingMs);
setTimerStatus('未开始');
updateToggleLabel();
bgm.init();
renderBgmStatus(bgm.getPlaybackState());
bgm.subscribePlaybackState(renderBgmStatus);
ensureTimerLeaseLoop();
window.addEventListener('storage', event => {
  if (event.key !== TIMER_LEASE_KEY) return;
  updateTimerLease();
});
window.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    updateTimerLease();
    void settlePreviousDayIfNeeded();
    if (syncReady) {
      void syncDailyFatigueAnswersFromCloud();
    }
  }
});
window.addEventListener('pagehide', () => {
  if (ownsTimerLease) releaseTimerLease();
});
daySettlementTimer = window.setInterval(() => {
  void settlePreviousDayIfNeeded();
}, 60 * 1000);
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

function summarizeAppError(error) {
  const message = String(
    (error && error.message) ||
    (error && error.details) ||
    (error && error.hint) ||
    error ||
    ''
  ).trim();
  if (!message) return 'unknown';
  return message.replace(/\s+/g, ' ').slice(0, 160);
}

const initPromise = initSync({
  onStatus: setSyncStatus,
  onUpdate: updatedDates => {
    void restoreTimerTimeline();
    loadRecurrenceRules();
    void syncDailyFatigueAnswersFromCloud();
    if (updatedDates.has(selectedDate)) {
      loadForDate();
    }
  }
});
syncInitPromise = initPromise;

initPromise.then(result => {
  syncReady = true;
  currentUserId = result && result.userId ? result.userId : null;
  void settlePreviousDayIfNeeded();
  void syncDailyFatigueAnswersFromCloud();
  if (pendingChangeSync) {
    void flushChangeSync();
  } else {
    setTimeout(() => {
      syncNow();
      void syncDailyFatigueAnswersFromCloud();
    }, 1200);
  }
  setInterval(() => {
    if (syncReady) {
      syncNow();
      void syncDailyFatigueAnswersFromCloud();
      void settlePreviousDayIfNeeded({ force: true });
    }
  }, 5 * 60 * 1000);
});

if (syncBtn) {
  syncBtn.addEventListener('click', () => {
    if (syncReady) {
      syncNow();
      void syncDailyFatigueAnswersFromCloud();
      void settlePreviousDayIfNeeded({ force: true });
    }
  });
}

if (syncPullBtn) {
  syncPullBtn.addEventListener('click', () => {
    if (syncReady) {
      pullNow();
      void syncDailyFatigueAnswersFromCloud();
      void settlePreviousDayIfNeeded({ force: true });
    }
  });
}

if (syncFullBtn) {
  syncFullBtn.addEventListener('click', () => {
    if (syncReady) {
      syncAllLocalToCloud();
      void syncDailyFatigueAnswersFromCloud();
      void settlePreviousDayIfNeeded({ force: true });
    }
  });
}

if (syncClearBtn) {
  syncClearBtn.addEventListener('click', async () => {
    const confirmed = await openPromptModal(
      '危险操作：将清空本地和云端的全部数据。\n包括 todos、summaries、recurrence_rules、timer_timeline 以及本地缓存。\n此操作不可恢复，是否继续？',
      { confirmText: '确认清空', cancelText: '取消', showCancel: true }
    );
    if (!confirmed) return;

    try {
      setSyncStatus('正在清空数据...');
      if (syncReady) {
        const cleared = await clearAllRemoteData();
        if (!cleared) {
          setSyncStatus('清空失败：同步未初始化');
          return;
        }
      }

      await clearLocalDatabase();

      [
        TIMER_STATE_LOCAL_KEY,
        TIMER_TIMELINE_LOCAL_KEY,
        TIMER_TIMELINE_ACTIVE_LOCAL_KEY,
        TIMER_LEASE_KEY,
        IN_PROGRESS_LOCAL_KEY
      ].forEach(key => {
        try {
          window.localStorage.removeItem(key);
        } catch (_) {}
      });

      try {
        window.sessionStorage.removeItem('jztodo.sw.cleaned');
      } catch (_) {}

      setSyncStatus('数据已清空，正在刷新...');
      window.location.reload();
    } catch (err) {
      const detail = summarizeAppError(err);
      setSyncStatus(`清空失败：${detail}`);
      console.error('[sync] clear all data error', err);
    }
  });
}

window.addEventListener('online', () => {
  if (syncReady) {
    syncNow();
    void syncDailyFatigueAnswersFromCloud();
    void settlePreviousDayIfNeeded({ force: true });
  }
});

if (bgmToggleBtn) {
  bgmToggleBtn.addEventListener('click', () => {
    renderBgmDebug(latestBgmDebugSnapshot);
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

bgm.subscribeDebug(snapshot => {
  renderBgmDebug(snapshot);
});

if (bgmLogCopyBtn) {
  bgmLogCopyBtn.addEventListener('click', async () => {
    const text = bgmLogOutput ? bgmLogOutput.textContent || '' : '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setTimerStatus('音频资源日志已复制');
    } catch (error) {
      setTimerStatus(`复制失败：${summarizeAppError(error)}`);
    }
  });
}

if (timelineEditCloseBtn) {
  timelineEditCloseBtn.addEventListener('click', requestCloseTimelineEditModal);
}

if (timelineEditModal) {
  timelineEditModal.addEventListener('click', event => {
    if (event.target === timelineEditModal) requestCloseTimelineEditModal();
  });
}

if (promptCancelBtn) {
  promptCancelBtn.addEventListener('click', () => {
    resolvePrompt(false);
  });
}

if (promptConfirmBtn) {
  promptConfirmBtn.addEventListener('click', () => {
    resolvePrompt(true);
  });
}

if (promptModal) {
  promptModal.addEventListener('click', event => {
    if (event.target === promptModal) resolvePrompt(false);
  });
}

if (dailySettlementCloseBtn) {
  dailySettlementCloseBtn.addEventListener('click', closeDailySettlementModal);
}

if (dailySettlementModal) {
  dailySettlementModal.addEventListener('click', event => {
    if (event.target === dailySettlementModal) closeDailySettlementModal();
  });
}

if (regretCoinSpendBtn) {
  regretCoinSpendBtn.addEventListener('click', async () => {
    const amount = Math.floor(Number(regretCoinSpendInput ? regretCoinSpendInput.value : 0));
    if (!Number.isFinite(amount) || amount <= 0) {
      setRegretCoinStatus('请输入大于 0 的消耗数量');
      return;
    }
    const success = await consumeRegretCoins(amount);
    if (!success) {
      setRegretCoinStatus('后悔币不够');
      return;
    }
    if (regretCoinSpendInput) regretCoinSpendInput.value = '1';
    setRegretCoinStatus(`已消耗 ${amount} 个后悔币`);
  });
}

if (regretCoinSpendInput) {
  regretCoinSpendInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && regretCoinSpendBtn) regretCoinSpendBtn.click();
  });
}

if (timelineEditAddBtn) {
  timelineEditAddBtn.addEventListener('click', () => {
    const last = timelineEditingDraft[timelineEditingDraft.length - 1];
    timelineEditingDraft.push({
      start: last ? last.end : '09:00',
      end: last ? last.end : '09:30'
    });
    renderTimelineEditDraft();
  });
}

if (timelineEditSaveBtn) {
  timelineEditSaveBtn.addEventListener('click', () => {
    void saveTimelineEditModal();
  });
}

function updateToggleLabel() {
  if (!timerToggleBtn) return;
  const bgmDownloading = currentBgmPlaybackState === 'downloading';
  timerToggleBtn.disabled = bgmDownloading;
  timerToggleBtn.setAttribute('aria-disabled', bgmDownloading ? 'true' : 'false');
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
    mode: timerMode,
    bellPhase,
    savedAt: Date.now()
  };
  writeLocalJson(TIMER_STATE_LOCAL_KEY, value);
  await setMeta('timer', value);
}

async function restoreTimerState() {
  const localValue = readLocalJson(TIMER_STATE_LOCAL_KEY);
  const record = localValue ? null : await getMeta('timer');
  const value = localValue || (record ? record.value : null);
  if (!value) return;
  if (
    !Number.isFinite(value.durationMs) ||
    !Number.isFinite(value.remainingMs) ||
    value.durationMs < 0 ||
    value.remainingMs < 0
  ) return;
  timerDurationMs = value.durationMs;
  timerRemainingMs = value.remainingMs;
  timerRunning = false;
  timerHasStartedWorkSession = false;
  timerStartAt = Date.now();
  setTimerMode(value.mode);
  if (timerMinutesInput) timerMinutesInput.value = Math.floor(timerDurationMs / 60000);

  if (timerMode === 'work') {
    resetBellSchedule(Date.now());
    if (activeTimerSegment && activeTimerSegment.state === 'running') {
      pauseTimerTimelineSegment(Date.now());
    }
  } else {
    bellPhase = {
      state: 'rest',
      restEndsAt: 0,
      nextBellAt: 0
    };
  }

  if (
    value.running ||
    timerRemainingMs < timerDurationMs ||
    (activeTimerSegment && (activeTimerSegment.state === 'running' || activeTimerSegment.state === 'paused'))
  ) {
    timerHasStartedWorkSession = true;
  }

  if (timerHasStartedWorkSession) {
    setTimerStatus(value.mode === 'rest' ? '休息已暂停，可继续或结束' : '倒计时已暂停，可继续或结束');
  }

  updateTimerUI(timerRemainingMs);
  updateToggleLabel();
  renderTimerTimeline();
  bgm.stop();
  releaseTimerLease();
  clearTimerTicking();
  persistTimerState();
}
restoreTimerTimeline().then(restoreTimerState);

async function restoreAlarmVolume() {
  const record = await getMeta('alarmVolume');
  if (!record) return;
  const percent = Number(record.value);
  if (!Number.isFinite(percent)) return;
  setAlarmVolumePercent(percent);
  if (alarmVolume) alarmVolume.value = String(Math.round(alarmVolumeRatio * 100));
}

restoreAlarmVolume();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js?v=20260326-bgm-cache-storage').catch(err => {
      console.error('[sw] register failed', err);
    });
  });
}
