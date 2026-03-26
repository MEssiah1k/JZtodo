const DEFAULT_BGM_SRC = new URL('../assets/bgm/pinknoise_mobile.mp3', import.meta.url).href;
const DEBUG_LOG_LIMIT = 50;
const FETCH_TIMEOUT_MS = 10000;
const READ_BODY_TIMEOUT_MS = 12000;
const DECODE_TIMEOUT_MS = 8000;

let audioContext = null;
let currentSourceNode = null;
let currentGainNode = null;
let htmlAudio = null;
let userInteracted = false;
let shouldBePlaying = false;
let volume = 0.6;
let playbackState = 'stopped';
let sourceConfig = { type: 'url', value: DEFAULT_BGM_SRC, label: 'default' };
let activePlaybackToken = 0;
let inflightPlayPromise = null;
let forceHtmlAudioFallback = false;
let interactionLogCount = 0;
let preferHtmlAudio = false;

const stateListeners = new Set();
const debugListeners = new Set();
const debugLogs = [];
const decodedBufferCache = new Map();
const pendingDecodeCache = new Map();

function summarizeError(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error.message === 'string' && error.message) return error.message;
  return String(error);
}

function shouldFallbackToHtmlAudio(error) {
  const message = summarizeError(error).toLowerCase();
  return (
    message.includes('unable to decode audio data') ||
    message.includes('decode') ||
    message.includes('解码') ||
    message.includes('encoding') ||
    message.includes('media') ||
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('failed to fetch') ||
    message.includes('abort')
  );
}

function emitState() {
  stateListeners.forEach(listener => {
    try {
      listener(playbackState);
    } catch (err) {
      // ignore
    }
  });
}

function pushDebugLog(event, detail = '') {
  const time = new Date();
  const line = `[${time.toLocaleTimeString('zh-CN', { hour12: false })}] ${event}${detail ? ` | ${detail}` : ''}`;
  debugLogs.push(line);
  if (debugLogs.length > DEBUG_LOG_LIMIT) {
    debugLogs.splice(0, debugLogs.length - DEBUG_LOG_LIMIT);
  }
  emitDebug();
}

function setPlaybackState(nextState) {
  if (playbackState === nextState) return;
  playbackState = nextState;
  pushDebugLog('state', nextState);
  emitState();
}

function getDebugSnapshot() {
  return {
    playbackState,
    shouldBePlaying,
    userInteracted,
    volume,
    source: {
      type: sourceConfig.type,
      label: sourceConfig.label,
      value: sourceConfig.type === 'url' ? sourceConfig.value : sourceConfig.value?.name || ''
    },
    audio: audioContext
      ? {
          contextState: audioContext.state,
          sampleRate: audioContext.sampleRate,
          hasSourceNode: Boolean(currentSourceNode),
          hasGainNode: Boolean(currentGainNode)
        }
      : null,
    htmlAudio: htmlAudio
      ? {
          src: htmlAudio.currentSrc || htmlAudio.src || '',
          paused: htmlAudio.paused,
          ended: htmlAudio.ended,
          readyState: htmlAudio.readyState,
          networkState: htmlAudio.networkState
        }
      : null,
    mode: (forceHtmlAudioFallback || preferHtmlAudio) ? 'html-audio' : 'web-audio',
    logs: [...debugLogs]
  };
}

function emitDebug() {
  const snapshot = getDebugSnapshot();
  debugListeners.forEach(listener => {
    try {
      listener(snapshot);
    } catch (err) {
      // ignore
    }
  });
}

function ensureAudioContext() {
  if (audioContext) return audioContext;
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) {
    throw new Error('当前浏览器不支持 AudioContext');
  }
  audioContext = new Context();
  pushDebugLog('context.create', `state=${audioContext.state} sampleRate=${audioContext.sampleRate}`);
  emitDebug();
  return audioContext;
}

async function resumeAudioContext() {
  const context = ensureAudioContext();
  if (context.state === 'running') return context;
  pushDebugLog('context.resume.start', context.state);
  await context.resume();
  pushDebugLog('context.resume.done', context.state);
  emitDebug();
  return context;
}

function getSourceCacheKey() {
  if (sourceConfig.type === 'file') {
    const file = sourceConfig.value;
    if (!file) return 'file:unknown';
    return `file:${file.name}:${file.size}:${file.lastModified}`;
  }
  return `url:${sourceConfig.value}`;
}

async function readSourceArrayBuffer() {
  if (sourceConfig.type === 'file') {
    const file = sourceConfig.value;
    if (!file) throw new Error('未选择本地音频文件');
    pushDebugLog('source.file.read', `${file.name} ${file.size} bytes`);
    return file.arrayBuffer();
  }
  pushDebugLog('source.fetch.start', sourceConfig.value);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`音频请求超时（${FETCH_TIMEOUT_MS}ms）`));
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(sourceConfig.value, {
      cache: 'no-store',
      signal: controller.signal
    });
    pushDebugLog('source.fetch.done', `ok=${response.ok} status=${response.status}`);
    if (!response.ok) {
      throw new Error(`音频请求失败: ${response.status}`);
    }
    pushDebugLog('source.body.read.start');
    const arrayBuffer = await Promise.race([
      response.arrayBuffer(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`音频响应体读取超时（${READ_BODY_TIMEOUT_MS}ms）`));
        }, READ_BODY_TIMEOUT_MS);
      })
    ]);
    pushDebugLog('source.body.read.done', `${arrayBuffer.byteLength} bytes`);
    return arrayBuffer;
  } catch (error) {
    pushDebugLog('source.fetch.failed', summarizeError(error));
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function decodeCurrentSource(context) {
  const cacheKey = getSourceCacheKey();
  if (decodedBufferCache.has(cacheKey)) {
    pushDebugLog('decode.cache.hit', cacheKey);
    return decodedBufferCache.get(cacheKey);
  }
  if (pendingDecodeCache.has(cacheKey)) {
    pushDebugLog('decode.pending.hit', cacheKey);
    return pendingDecodeCache.get(cacheKey);
  }

  const pendingDecode = (async () => {
    pushDebugLog('decode.start', cacheKey);
    const arrayBuffer = await readSourceArrayBuffer();
    const audioBuffer = await decodeArrayBuffer(context, arrayBuffer);
    decodedBufferCache.set(cacheKey, audioBuffer);
    pushDebugLog('decode.done', `duration=${audioBuffer.duration.toFixed(2)}s channels=${audioBuffer.numberOfChannels}`);
    return audioBuffer;
  })();

  pendingDecodeCache.set(cacheKey, pendingDecode);
  try {
    return await pendingDecode;
  } finally {
    pendingDecodeCache.delete(cacheKey);
  }
}

function decodeArrayBuffer(context, arrayBuffer) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      pushDebugLog('decode.timeout', `${DECODE_TIMEOUT_MS}ms`);
      reject(new Error(`音频解码超时（${DECODE_TIMEOUT_MS}ms）`));
    }, DECODE_TIMEOUT_MS);

    const finishResolve = audioBuffer => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(audioBuffer);
    };

    const finishReject = error => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      reject(error);
    };

    try {
      // 回调式 decodeAudioData 在部分移动浏览器上比 Promise 版稳定。
      const maybePromise = context.decodeAudioData(
        arrayBuffer.slice(0),
        audioBuffer => {
          pushDebugLog('decode.callback.resolve');
          finishResolve(audioBuffer);
        },
        error => {
          pushDebugLog('decode.callback.reject', summarizeError(error));
          finishReject(error || new Error('音频解码失败'));
        }
      );

      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.then(audioBuffer => {
          pushDebugLog('decode.promise.resolve');
          finishResolve(audioBuffer);
        }).catch(error => {
          pushDebugLog('decode.promise.reject', summarizeError(error));
          finishReject(error);
        });
      }
    } catch (error) {
      pushDebugLog('decode.throw', summarizeError(error));
      finishReject(error);
    }
  });
}

function stopCurrentPlayback() {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
    } catch (err) {
      // ignore repeated stop
    }
    currentSourceNode.disconnect();
    currentSourceNode = null;
  }
  if (currentGainNode) {
    currentGainNode.disconnect();
    currentGainNode = null;
  }
  if (htmlAudio) {
    htmlAudio.pause();
    try {
      htmlAudio.currentTime = 0;
    } catch (err) {
      // ignore
    }
  }
  emitDebug();
}

function ensureHtmlAudio() {
  if (htmlAudio) return htmlAudio;
  htmlAudio = new Audio();
  htmlAudio.loop = true;
  htmlAudio.preload = 'auto';
  htmlAudio.volume = volume;
  htmlAudio.playsInline = true;
  htmlAudio.crossOrigin = 'anonymous';
  htmlAudio.addEventListener('loadedmetadata', () => {
    pushDebugLog('html.loadedmetadata', `duration=${Number.isFinite(htmlAudio.duration) ? htmlAudio.duration.toFixed(2) : 'unknown'}`);
    emitDebug();
  });
  htmlAudio.addEventListener('loadeddata', () => {
    pushDebugLog('html.loadeddata', `readyState=${htmlAudio.readyState}`);
    emitDebug();
  });
  htmlAudio.addEventListener('canplay', () => {
    pushDebugLog('html.canplay', `readyState=${htmlAudio.readyState}`);
    emitDebug();
  });
  htmlAudio.addEventListener('canplaythrough', () => {
    pushDebugLog('html.canplaythrough', `readyState=${htmlAudio.readyState}`);
    emitDebug();
  });
  htmlAudio.addEventListener('progress', () => {
    pushDebugLog('html.progress', `readyState=${htmlAudio.readyState} networkState=${htmlAudio.networkState}`);
    emitDebug();
  });
  htmlAudio.addEventListener('stalled', () => {
    pushDebugLog('html.stalled', `readyState=${htmlAudio.readyState} networkState=${htmlAudio.networkState}`);
    emitDebug();
  });
  htmlAudio.addEventListener('suspend', () => {
    pushDebugLog('html.suspend', `readyState=${htmlAudio.readyState} networkState=${htmlAudio.networkState}`);
    emitDebug();
  });
  htmlAudio.addEventListener('playing', () => {
    pushDebugLog('html.playing');
    setPlaybackState('playing');
    emitDebug();
  });
  htmlAudio.addEventListener('pause', () => {
    pushDebugLog('html.pause');
    if (!shouldBePlaying) {
      setPlaybackState('paused');
    }
    emitDebug();
  });
  htmlAudio.addEventListener('waiting', () => {
    pushDebugLog('html.waiting');
    if (shouldBePlaying) setPlaybackState('loading');
    emitDebug();
  });
  htmlAudio.addEventListener('error', () => {
    pushDebugLog('html.error');
    if (shouldBePlaying) setPlaybackState('paused');
    emitDebug();
  });
  return htmlAudio;
}

function resolveSourceUrl() {
  if (sourceConfig.type === 'file') {
    const file = sourceConfig.value;
    if (!file) throw new Error('未选择本地音频文件');
    return URL.createObjectURL(file);
  }
  return sourceConfig.value;
}

async function playViaHtmlAudio() {
  const audio = ensureHtmlAudio();
  const nextSrc = resolveSourceUrl();
  if (audio.src !== nextSrc) {
    audio.src = nextSrc;
    pushDebugLog('html.src.set', nextSrc);
    audio.load();
    pushDebugLog('html.load.call');
  }
  audio.volume = volume;
  pushDebugLog('html.play.call');
  await audio.play();
  pushDebugLog('html.play.started');
  setPlaybackState('playing');
  emitDebug();
}

function unlockPlayback() {
  userInteracted = true;
  interactionLogCount += 1;
  if (interactionLogCount === 1) {
    pushDebugLog('user.interaction', 'first');
  }
  if (shouldBePlaying && playbackState === 'paused') {
    void play();
  }
}

function detectMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|Mobile|HarmonyOS|Windows Phone/i.test(ua);
}

export function init() {
  pushDebugLog('init', DEFAULT_BGM_SRC);
  interactionLogCount = 0;
  preferHtmlAudio = detectMobileDevice();
  if (preferHtmlAudio) {
    pushDebugLog('playback.strategy', 'mobile-html-audio');
  }
  emitState();
  if (window.__jzTodoBgmInitBound) return;
  window.__jzTodoBgmInitBound = true;
  window.addEventListener('pointerdown', unlockPlayback, { passive: true });
  window.addEventListener('touchend', unlockPlayback, { passive: true });
  window.addEventListener('click', unlockPlayback, { passive: true });
  window.addEventListener('keydown', unlockPlayback);
}

export function setSource(source) {
  if (source instanceof File) {
    sourceConfig = {
      type: 'file',
      value: source,
      label: source.name || 'local-file'
    };
    pushDebugLog('source.set.file', sourceConfig.label);
  } else if (typeof source === 'string' && source) {
    sourceConfig = {
      type: 'url',
      value: source,
      label: source
    };
    pushDebugLog('source.set.url', source);
  }
  stopCurrentPlayback();
  if (shouldBePlaying) {
    void play();
  } else {
    emitDebug();
  }
}

export function setVolume(value) {
  volume = Math.max(0, Math.min(1, value));
  if (currentGainNode && audioContext) {
    currentGainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  }
  if (htmlAudio) {
    htmlAudio.volume = volume;
  }
  pushDebugLog('volume.set', String(volume));
  emitDebug();
}

export function getVolume() {
  return volume;
}

export async function play() {
  if (inflightPlayPromise) {
    pushDebugLog('play.skip.inflight');
    return inflightPlayPromise;
  }

  shouldBePlaying = true;
  setPlaybackState('loading');
  const playbackToken = ++activePlaybackToken;
  pushDebugLog('play.call', `token=${playbackToken} interacted=${userInteracted}`);
  inflightPlayPromise = (async () => {
    try {
      if (forceHtmlAudioFallback || preferHtmlAudio) {
        if (preferHtmlAudio && !forceHtmlAudioFallback) {
          pushDebugLog('play.strategy.use', 'html-audio');
        }
        await playViaHtmlAudio();
        return;
      }
      const context = await resumeAudioContext();
      const audioBuffer = await decodeCurrentSource(context);

      if (!shouldBePlaying || playbackToken !== activePlaybackToken) {
        pushDebugLog('play.cancelled', `token=${playbackToken}`);
        return;
      }

      stopCurrentPlayback();

      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(volume, context.currentTime);
      gainNode.connect(context.destination);

      const sourceNode = context.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.loop = true;
      sourceNode.connect(gainNode);
      sourceNode.onended = () => {
        if (currentSourceNode !== sourceNode) return;
        pushDebugLog('source.ended');
        currentSourceNode = null;
        currentGainNode = null;
        if (!shouldBePlaying) {
          setPlaybackState('paused');
        }
        emitDebug();
      };

      currentSourceNode = sourceNode;
      currentGainNode = gainNode;
      sourceNode.start(0);
      pushDebugLog('play.started', `token=${playbackToken}`);
      setPlaybackState('playing');
      emitDebug();
    } catch (error) {
      pushDebugLog('play.failed', summarizeError(error));
      if (!forceHtmlAudioFallback && shouldFallbackToHtmlAudio(error)) {
        forceHtmlAudioFallback = true;
        pushDebugLog('fallback.enable', 'html-audio');
        try {
          await playViaHtmlAudio();
          return;
        } catch (fallbackError) {
          pushDebugLog('fallback.failed', summarizeError(fallbackError));
        }
      }
      setPlaybackState(userInteracted ? 'paused' : 'loading');
      emitDebug();
    } finally {
      inflightPlayPromise = null;
    }
  })();

  return inflightPlayPromise;
}

export function pause() {
  shouldBePlaying = false;
  activePlaybackToken += 1;
  pushDebugLog('pause.call');
  stopCurrentPlayback();
  setPlaybackState('paused');
  inflightPlayPromise = null;
}

export function stop() {
  shouldBePlaying = false;
  activePlaybackToken += 1;
  pushDebugLog('stop.call');
  stopCurrentPlayback();
  setPlaybackState('stopped');
  inflightPlayPromise = null;
}

export function getPlaybackState() {
  return playbackState;
}

export function subscribePlaybackState(listener) {
  stateListeners.add(listener);
  listener(playbackState);
  return () => {
    stateListeners.delete(listener);
  };
}

export function subscribeDebug(listener) {
  debugListeners.add(listener);
  listener(getDebugSnapshot());
  return () => {
    debugListeners.delete(listener);
  };
}
