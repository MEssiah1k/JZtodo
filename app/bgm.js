const DEFAULT_BGM_SRC = new URL('../assets/bgm/pinknoise.m4a', import.meta.url).href;

let audio = null;
let objectUrl = null;
let userInteracted = false;
let retryOnNextInteraction = false;
let volume = 0.6;
let reloadBeforeNextPlay = false;
let shouldBePlaying = false;
let recoveryTimer = null;
let unlockBound = false;
let waitingForCanPlay = false;

function clearRecoveryTimer() {
  if (!recoveryTimer) return;
  clearTimeout(recoveryTimer);
  recoveryTimer = null;
}

function scheduleRecovery() {
  if (!audio || !shouldBePlaying || recoveryTimer) return;
  recoveryTimer = setTimeout(() => {
    recoveryTimer = null;
    if (!audio || !shouldBePlaying) return;
    reloadBeforeNextPlay = true;
    play();
  }, 200);
}

function ensureAudio() {
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volume;
    audio.addEventListener('ended', () => {
      if (!shouldBePlaying) return;
      scheduleRecovery();
    });
    audio.addEventListener('pause', () => {
      if (!shouldBePlaying) return;
      scheduleRecovery();
    });
    audio.addEventListener('stalled', scheduleRecovery);
    audio.addEventListener('error', scheduleRecovery);
    audio.addEventListener('emptied', scheduleRecovery);
  }
}

function safePlay() {
  if (!audio) return;
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      retryOnNextInteraction = true;
    });
  }
}

function schedulePlayWhenReady() {
  if (!audio || waitingForCanPlay) return;
  waitingForCanPlay = true;
  audio.addEventListener('canplay', () => {
    waitingForCanPlay = false;
    if (!audio || !shouldBePlaying) return;
    safePlay();
  }, { once: true });
}

function unlockPlayback() {
  userInteracted = true;
  if (retryOnNextInteraction && shouldBePlaying) {
    retryOnNextInteraction = false;
    play();
  }
}

export function init() {
  ensureAudio();
  if (!audio.src) {
    audio.src = DEFAULT_BGM_SRC;
  }
  audio.load();
  if (unlockBound) return;
  unlockBound = true;
  window.addEventListener('pointerdown', unlockPlayback, { passive: true });
  window.addEventListener('touchend', unlockPlayback, { passive: true });
  window.addEventListener('click', unlockPlayback, { passive: true });
  window.addEventListener('keydown', unlockPlayback);
}

export function setSource(source) {
  ensureAudio();
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
  if (source instanceof File) {
    objectUrl = URL.createObjectURL(source);
    audio.src = objectUrl;
  } else if (typeof source === 'string') {
    audio.src = source;
  }
  reloadBeforeNextPlay = true;
}

export function setVolume(value) {
  const next = Math.max(0, Math.min(1, value));
  volume = next;
  if (audio) audio.volume = volume;
}

export function play() {
  ensureAudio();
  if (!audio.src) {
    audio.src = DEFAULT_BGM_SRC;
  }
  shouldBePlaying = true;
  retryOnNextInteraction = true;
  if (reloadBeforeNextPlay || audio.ended || Boolean(audio.error)) {
    // Ensure the source is decodable again after stop/end transitions.
    audio.load();
    reloadBeforeNextPlay = false;
    if (audio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      schedulePlayWhenReady();
      return;
    }
  }
  clearRecoveryTimer();
  if (!userInteracted) {
    // Some mobile/PWA environments do not fire pointerdown as expected,
    // but a direct play attempt inside the click handler can still succeed.
    safePlay();
    return;
  }
  retryOnNextInteraction = false;
  safePlay();
}

export function pause() {
  shouldBePlaying = false;
  clearRecoveryTimer();
  if (audio) audio.pause();
}

export function stop() {
  if (!audio) return;
  shouldBePlaying = false;
  clearRecoveryTimer();
  waitingForCanPlay = false;
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch (err) {
    // Some browsers can reject seeking before metadata is ready.
  }
}
