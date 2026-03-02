const DEFAULT_BGM_SRC = new URL('../assets/bgm/pinknoise.m4a', import.meta.url).href;

let audio = null;
let objectUrl = null;
let userInteracted = false;
let retryOnNextInteraction = false;
let volume = 0.6;

function ensureAudio() {
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = 'none';
    audio.volume = volume;
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

function unlockPlayback() {
  userInteracted = true;
  if (retryOnNextInteraction) {
    retryOnNextInteraction = false;
    safePlay();
  }
}

export function init() {
  ensureAudio();
  if (!audio.src) {
    audio.src = DEFAULT_BGM_SRC;
  }
  window.addEventListener('pointerdown', unlockPlayback, { passive: true });
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
}

export function setVolume(value) {
  const next = Math.max(0, Math.min(1, value));
  volume = next;
  if (audio) audio.volume = volume;
}

export function play() {
  ensureAudio();
  retryOnNextInteraction = true;
  if (!userInteracted) return;
  retryOnNextInteraction = false;
  safePlay();
}

export function pause() {
  if (audio) audio.pause();
}

export function stop() {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}
