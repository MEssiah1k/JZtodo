import {
  getMeta,
  setMeta,
  getAllTodos,
  getAllSummaries,
  getAllRecurrenceRules,
  getTodosUpdatedAfter,
  getSummariesUpdatedAfter,
  getRecurrenceRulesUpdatedAfter,
  getSummaryByUuid,
  getRecurrenceRuleByUuid,
  addTodo,
  updateTodo,
  addSummary,
  updateSummary,
  addRecurrenceRule,
  updateRecurrenceRule
} from './db.js';

const SUPABASE_URL = 'https://wjyqimuecbairlbdfetr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqeXFpbXVlY2JhaXJsYmRmZXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDU4MDcsImV4cCI6MjA4NjIyMTgwN30.il1pkrnEjHUnnvWR7PCh10VeSWrC18fv596vSCLQOpE';

let supabase = null;
let createClientFn = null;
let userId = null;
let lastSyncAt = '1970-01-01T00:00:00.000Z';
let statusHandler = () => {};
let updateHandler = () => {};
const DEBUG = true;

function generateUUID() {
  if (crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getUserId() {
  return userId;
}

function setStatus(state, detail = '') {
  statusHandler(`${state}${detail ? ` · ${detail}` : ''}`);
  if (DEBUG) console.log('[sync][status]', state, detail);
}

function mapTodoToRemote(todo) {
  return {
    uuid: todo.uuid,
    date: todo.date,
    text: todo.text,
    completed: todo.completed,
    created_at: todo.createdAt,
    updated_at: todo.updatedAt,
    deleted_at: todo.deletedAt
  };
}

function mapSummaryToRemote(summary) {
  return {
    uuid: summary.uuid,
    date: summary.date,
    text: summary.text,
    rating: summary.rating ?? 0,
    created_at: summary.createdAt,
    updated_at: summary.updatedAt,
    deleted_at: summary.deletedAt
  };
}

function mapTodoFromRemote(row) {
  return {
    uuid: row.uuid,
    date: row.date,
    text: row.text,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || null
  };
}

function mapRecurrenceRuleToRemote(rule) {
  return {
    uuid: rule.uuid,
    text: rule.text,
    type: rule.type,
    weekdays: rule.weekdays || null,
    day: rule.day ?? null,
    month: rule.month ?? null,
    interval: rule.interval ?? null,
    unit: rule.unit ?? null,
    created_at: rule.createdAt,
    updated_at: rule.updatedAt,
    deleted_at: rule.deletedAt ?? null
  };
}

function mapRecurrenceRuleFromRemote(row) {
  return {
    uuid: row.uuid,
    text: row.text,
    type: row.type,
    weekdays: row.weekdays || null,
    day: row.day ?? null,
    month: row.month ?? null,
    interval: row.interval ?? null,
    unit: row.unit ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || null
  };
}

function mapSummaryFromRemote(row) {
  return {
    uuid: row.uuid,
    date: row.date,
    text: row.text,
    rating: row.rating ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || null
  };
}

async function normalizeLocalData() {
  const now = new Date().toISOString();
  const todos = await getAllTodos();
  await Promise.all(
    todos.map(todo => {
      const next = {
        ...todo,
        uuid: todo.uuid || generateUUID(),
        updatedAt: todo.updatedAt || todo.createdAt || now,
        deletedAt: todo.deletedAt ?? null
      };
      if (
        next.uuid !== todo.uuid ||
        next.updatedAt !== todo.updatedAt ||
        next.deletedAt !== todo.deletedAt
      ) {
        return updateTodo(next);
      }
      return null;
    })
  );

  const summaries = await getAllSummaries();
  await Promise.all(
    summaries.map(summary => {
      const next = {
        ...summary,
        uuid: summary.uuid || generateUUID(),
        updatedAt: summary.updatedAt || summary.createdAt || now,
        deletedAt: summary.deletedAt ?? null
      };
      if (
        next.uuid !== summary.uuid ||
        next.updatedAt !== summary.updatedAt ||
        next.deletedAt !== summary.deletedAt
      ) {
        return updateSummary(next);
      }
      return null;
    })
  );

  const rules = await getAllRecurrenceRules();
  await Promise.all(
    rules.map(rule => {
      const next = {
        ...rule,
        uuid: rule.uuid || generateUUID(),
        updatedAt: rule.updatedAt || rule.createdAt || now,
        deletedAt: rule.deletedAt ?? null
      };
      if (
        next.uuid !== rule.uuid ||
        next.updatedAt !== rule.updatedAt ||
        next.deletedAt !== rule.deletedAt
      ) {
        return updateRecurrenceRule(next);
      }
      return null;
    })
  );
}

export async function initSync({ onStatus, onUpdate } = {}) {
  if (onStatus) statusHandler = onStatus;
  if (onUpdate) updateHandler = onUpdate;
  if (DEBUG) console.log('[sync] init start');

  const syncRecord = await getMeta('lastSyncAt');
  if (syncRecord && syncRecord.value) lastSyncAt = syncRecord.value;
  const initRecord = await getMeta('syncInitialized');
  if (!initRecord || !initRecord.value) {
    lastSyncAt = '1970-01-01T00:00:00.000Z';
    await setMeta('lastSyncAt', lastSyncAt);
    await setMeta('syncInitialized', 'true');
  }
  if (DEBUG) console.log('[sync] lastSyncAt', lastSyncAt);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    setStatus('Sync disabled', 'missing config');
    return { userId };
  }

  supabase = await getSupabase();
  if (!supabase) {
    setStatus('Sync disabled', 'sdk unavailable');
    return { userId };
  }
  await normalizeLocalData();
  if (DEBUG) console.log('[sync] init done');
  return { userId: null };
}

export async function syncNow() {
  if (!supabase) return;
  try {
    setStatus('Syncing');
    if (DEBUG) console.log('[sync] dedupe local todos before push');
    const dedupedBeforePush = await dedupeLocalTodosByNameAndStatus();
    if (DEBUG) console.log('[sync] push todos');
    await pushLocalTodos();
    if (DEBUG) console.log('[sync] push summaries');
    await pushLocalSummaries();
    if (DEBUG) console.log('[sync] overwrite recurrence rules (local -> cloud)');
    await overwriteRemoteRecurrenceRulesFromLocal();
    if (DEBUG) console.log('[sync] pull');
    const updatedDates = await pullRemoteChanges();
    if (DEBUG) console.log('[sync] dedupe local todos after pull');
    const dedupedAfterPull = await dedupeLocalTodosByNameAndStatus();
    if (dedupedAfterPull.size) {
      if (DEBUG) console.log('[sync] push deduped todos');
      await pushLocalTodos();
    }
    dedupedBeforePush.forEach(date => updatedDates.add(date));
    dedupedAfterPull.forEach(date => updatedDates.add(date));
    lastSyncAt = new Date().toISOString();
    await setMeta('lastSyncAt', lastSyncAt);
    setStatus('Idle', `last ${lastSyncAt}`);
    if (updatedDates.size) updateHandler(updatedDates);
  } catch (err) {
    if (DEBUG) console.log('[sync] error', err);
    setStatus('Error');
  }
}

export async function syncAllLocalToCloud() {
  if (!supabase) return;
  try {
    setStatus('Syncing', 'full push');
    await normalizeLocalData();
    if (DEBUG) console.log('[sync] dedupe local todos before full push');
    const dedupedBeforePush = await dedupeLocalTodosByNameAndStatus();

    const allTodos = await getAllTodos();
    const dedupedTodos = dedupeTodosForPush(allTodos);
    if (DEBUG) console.log('[sync] full todos to push', dedupedTodos.length);
    if (dedupedTodos.length) {
      const todoPayload = dedupedTodos.map(mapTodoToRemote);
      const { error: todoError } = await supabase
        .from('todos')
        .upsert(todoPayload, { onConflict: 'uuid' });
      if (todoError) throw todoError;
    }

    const allSummaries = await getAllSummaries();
    if (DEBUG) console.log('[sync] full summaries to push', allSummaries.length);
    if (allSummaries.length) {
      const summaryPayload = allSummaries.map(mapSummaryToRemote);
      const { error: summaryError } = await supabase
        .from('summaries')
        .upsert(summaryPayload, { onConflict: 'uuid' });
      if (summaryError) throw summaryError;
    }

    if (DEBUG) console.log('[sync] overwrite recurrence rules (local -> cloud)');
    await overwriteRemoteRecurrenceRulesFromLocal();

    lastSyncAt = new Date().toISOString();
    await setMeta('lastSyncAt', lastSyncAt);
    setStatus('Idle', `last ${lastSyncAt}`);
    if (dedupedBeforePush.size) updateHandler(dedupedBeforePush);
  } catch (err) {
    if (DEBUG) console.log('[sync] full push error', err);
    setStatus('Error');
  }
}

export async function pushLocalTodos() {
  const todos = await getTodosUpdatedAfter(lastSyncAt);
  if (DEBUG) console.log('[sync] todos to push', todos.length);
  if (!todos.length) return;
  const dedupedTodos = dedupeTodosForPush(todos);
  if (DEBUG) console.log('[sync] todos to push after uuid dedupe', dedupedTodos.length);
  if (!dedupedTodos.length) return;
  const payload = dedupedTodos.map(mapTodoToRemote);
  const { error } = await supabase.from('todos').upsert(payload, { onConflict: 'uuid' });
  if (error) throw error;
}

export async function pushLocalSummaries() {
  const summaries = await getSummariesUpdatedAfter(lastSyncAt);
  if (DEBUG) console.log('[sync] summaries to push', summaries.length);
  if (!summaries.length) return;
  if (summaries.length) {
    const payload = summaries.map(mapSummaryToRemote);
    const { error } = await supabase.from('summaries').upsert(payload, { onConflict: 'uuid' });
    if (error) throw error;
  }
}

export async function pushLocalRecurrenceRules() {
  const rules = await getRecurrenceRulesUpdatedAfter(lastSyncAt);
  if (DEBUG) console.log('[sync] recurrence rules to push', rules.length);
  if (!rules.length) return;
  const payload = rules.map(mapRecurrenceRuleToRemote);
  const { error } = await supabase
    .from('recurrence_rules')
    .upsert(payload, { onConflict: 'uuid' });
  if (error) {
    if (isMissingRecurrenceTable(error)) return;
    throw error;
  }
}

async function overwriteRemoteRecurrenceRulesFromLocal() {
  await normalizeLocalData();
  const localRules = await getAllRecurrenceRules();
  const localUuids = localRules
    .map(rule => rule && rule.uuid)
    .filter(Boolean);

  if (DEBUG) console.log('[sync] local recurrence rules', localRules.length);
  if (localRules.length) {
    const payload = localRules.map(mapRecurrenceRuleToRemote);
    const { error: upsertError } = await supabase
      .from('recurrence_rules')
      .upsert(payload, { onConflict: 'uuid' });
    if (upsertError) {
      if (isMissingRecurrenceTable(upsertError)) return;
      throw upsertError;
    }
  }

  const { data: remoteRows, error: remoteListError } = await supabase
    .from('recurrence_rules')
    .select('uuid');
  if (remoteListError) {
    if (isMissingRecurrenceTable(remoteListError)) return;
    throw remoteListError;
  }

  const localUuidSet = new Set(localUuids);
  const remoteOnlyUuids = (remoteRows || [])
    .map(row => row && row.uuid)
    .filter(uuid => uuid && !localUuidSet.has(uuid));

  if (!remoteOnlyUuids.length) return;
  if (DEBUG) console.log('[sync] delete remote-only recurrence rules', remoteOnlyUuids.length);

  const CHUNK_SIZE = 200;
  for (let i = 0; i < remoteOnlyUuids.length; i += CHUNK_SIZE) {
    const chunk = remoteOnlyUuids.slice(i, i + CHUNK_SIZE);
    const { error: deleteError } = await supabase
      .from('recurrence_rules')
      .delete()
      .in('uuid', chunk);
    if (deleteError) {
      if (isMissingRecurrenceTable(deleteError)) return;
      throw deleteError;
    }
  }
}

export async function pullRemoteChanges() {
  const updatedDates = new Set();
  const localTodos = await getAllTodos();
  const localByUuid = new Map();
  const localByFingerprint = new Map();

  for (const todo of localTodos) {
    if (todo && todo.uuid) {
      const existing = localByUuid.get(todo.uuid);
      if (!existing || (todo.updatedAt || '') > (existing.updatedAt || '')) {
        localByUuid.set(todo.uuid, todo);
      }
    }
    if (todo) {
      const key = getTodoFingerprint(todo);
      const existingByKey = localByFingerprint.get(key);
      if (!existingByKey || (todo.updatedAt || '') > (existingByKey.updatedAt || '')) {
        localByFingerprint.set(key, todo);
      }
    }
  }

  const { data: todoRows } = await supabase
    .from('todos')
    .select('*')
    .gt('updated_at', lastSyncAt);
  if (DEBUG) console.log('[sync] pull todos', todoRows ? todoRows.length : 0);
  if (Array.isArray(todoRows)) {
    for (const row of todoRows) {
      const remote = mapTodoFromRemote(row);
      const byUuid = remote.uuid ? localByUuid.get(remote.uuid) : null;
      const byFingerprint = localByFingerprint.get(getTodoFingerprint(remote)) || null;
      const local = byUuid || byFingerprint;

      if (!local) {
        await addTodo(remote);
        if (remote.uuid) localByUuid.set(remote.uuid, remote);
        localByFingerprint.set(getTodoFingerprint(remote), remote);
        updatedDates.add(remote.date);
        continue;
      }

      const merged = mergeTodoForPull(local, remote);
      if (shouldUpdateTodo(local, merged)) {
        await updateTodo({ ...local, ...merged, id: local.id });
        if (merged.uuid) localByUuid.set(merged.uuid, { ...local, ...merged });
        localByFingerprint.set(getTodoFingerprint(merged), { ...local, ...merged });
        updatedDates.add(remote.date);
      }
    }
  }

  const { data: summaryRows } = await supabase
    .from('summaries')
    .select('*')
    .gt('updated_at', lastSyncAt);
  if (DEBUG) console.log('[sync] pull summaries', summaryRows ? summaryRows.length : 0);
  if (Array.isArray(summaryRows)) {
    for (const row of summaryRows) {
      const remote = mapSummaryFromRemote(row);
      const local = await getSummaryByUuid(remote.uuid);
      if (!local) {
        await addSummary(remote);
        updatedDates.add(remote.date);
        continue;
      }
      if ((remote.updatedAt || '') > (local.updatedAt || '')) {
        await updateSummary({ ...local, ...remote, id: local.id });
        updatedDates.add(remote.date);
      }
    }
  }

  const { data: ruleRows, error: rulePullError } = await supabase
    .from('recurrence_rules')
    .select('*')
    .gt('updated_at', lastSyncAt);
  if (rulePullError) {
    if (!isMissingRecurrenceTable(rulePullError)) throw rulePullError;
  } else if (Array.isArray(ruleRows)) {
    if (DEBUG) console.log('[sync] pull recurrence rules', ruleRows.length);
    for (const row of ruleRows) {
      const remote = mapRecurrenceRuleFromRemote(row);
      const local = await getRecurrenceRuleByUuid(remote.uuid);
      if (!local) {
        await addRecurrenceRule(remote);
        continue;
      }
      if ((remote.updatedAt || '') > (local.updatedAt || '')) {
        await updateRecurrenceRule({ ...local, ...remote, id: local.id });
      }
    }
  }
  return updatedDates;
}

function getTodoFingerprint(todo) {
  const date = todo && todo.date ? todo.date : '';
  const text = todo && typeof todo.text === 'string' ? todo.text.trim() : '';
  const createdAt = todo && todo.createdAt ? todo.createdAt : '';
  return `${date}__${text}__${createdAt}`;
}

function mergeTodoForPull(local, remote) {
  const localUpdatedAt = local.updatedAt || '';
  const remoteUpdatedAt = remote.updatedAt || '';
  const remoteNewer = remoteUpdatedAt > localUpdatedAt;
  const winner = remoteNewer ? remote : local;
  const merged = {
    ...winner,
    id: local.id,
    uuid: local.uuid || remote.uuid
  };

  // 远端表当前不承载这些本地字段，拉取合并时保留本地值，避免被“覆盖为空”
  if (merged.recurrenceRuleId == null && local.recurrenceRuleId != null) {
    merged.recurrenceRuleId = local.recurrenceRuleId;
  }
  if (merged.dueMinutes == null && local.dueMinutes != null) {
    merged.dueMinutes = local.dueMinutes;
  }
  if (merged.carriedFrom == null && local.carriedFrom != null) {
    merged.carriedFrom = local.carriedFrom;
  }
  if (!merged.userId && local.userId) {
    merged.userId = local.userId;
  }

  // 冲突时“已完成”优先于“未完成”
  const completedMerged = Boolean(local.completed) || Boolean(remote.completed);
  if (merged.completed !== completedMerged) {
    merged.completed = completedMerged;
    merged.updatedAt = new Date().toISOString();
  }

  return merged;
}

function shouldUpdateTodo(local, next) {
  return (
    local.uuid !== next.uuid ||
    local.date !== next.date ||
    local.text !== next.text ||
    Boolean(local.completed) !== Boolean(next.completed) ||
    (local.recurrenceRuleId ?? null) !== (next.recurrenceRuleId ?? null) ||
    (local.dueMinutes ?? null) !== (next.dueMinutes ?? null) ||
    (local.carriedFrom ?? null) !== (next.carriedFrom ?? null) ||
    (local.userId ?? null) !== (next.userId ?? null) ||
    (local.createdAt || '') !== (next.createdAt || '') ||
    (local.updatedAt || '') !== (next.updatedAt || '') ||
    (local.deletedAt || null) !== (next.deletedAt || null)
  );
}

async function dedupeLocalTodosByNameAndStatus() {
  const todos = await getAllTodos();
  const groups = new Map();
  const updatedDates = new Set();
  const now = new Date().toISOString();

  for (const todo of todos) {
    if (!todo || todo.deletedAt) continue;
    const key = getDedupeKey(todo);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(todo);
  }

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort(compareTodoForDedupe);
    const duplicates = group.slice(1);
    for (const duplicate of duplicates) {
      await updateTodo({
        ...duplicate,
        deletedAt: now,
        updatedAt: now
      });
      if (duplicate.date) updatedDates.add(duplicate.date);
    }
  }

  return updatedDates;
}

function getDedupeKey(todo) {
  const date = todo && todo.date ? todo.date : '';
  const name = todo && typeof todo.text === 'string' ? todo.text.trim() : '';
  const completed = todo && todo.completed ? '1' : '0';
  return `${date}__${name}__${completed}`;
}

function compareTodoForDedupe(a, b) {
  const aUpdated = a.updatedAt || a.createdAt || '';
  const bUpdated = b.updatedAt || b.createdAt || '';
  if (aUpdated !== bUpdated) return bUpdated.localeCompare(aUpdated);
  const aCreated = a.createdAt || '';
  const bCreated = b.createdAt || '';
  if (aCreated !== bCreated) return bCreated.localeCompare(aCreated);
  return (b.id || 0) - (a.id || 0);
}

function dedupeTodosForPush(todos) {
  const byUuid = new Map();
  const withoutUuid = [];

  for (const todo of todos) {
    if (!todo || !todo.uuid) {
      if (todo) withoutUuid.push(todo);
      continue;
    }
    const existing = byUuid.get(todo.uuid);
    if (!existing || compareTodoForDedupe(todo, existing) < 0) {
      byUuid.set(todo.uuid, todo);
    }
  }

  return [...byUuid.values(), ...withoutUuid];
}

function isMissingRecurrenceTable(error) {
  const text = String(
    (error && error.message) ||
    (error && error.details) ||
    (error && error.hint) ||
    ''
  );
  return text.includes('recurrence_rules') && text.includes('does not exist');
}
async function getSupabase() {
  if (supabase) return supabase;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    if (!createClientFn) {
      const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      createClientFn = mod.createClient;
      if (DEBUG) console.log('[sync] sdk loaded');
    }
    supabase = createClientFn(SUPABASE_URL, SUPABASE_ANON_KEY);
    if (DEBUG) console.log('[sync] client created', SUPABASE_URL);
    return supabase;
  } catch (err) {
    if (DEBUG) console.log('[sync] sdk load failed', err);
    return null;
  }
}
