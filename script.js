/* ===================== CONFIG ===================== */
const PASSCODE = "2026";
const BIRTH_DATE = new Date(2007, 8, 25); // Aug 25, 2007 (month is 0-indexed)
const MEET_DATE = new Date(2018, 0, 0); // , 2018 — the day they met
const LETTER_TEXT = "You are the one who fills my life with love, laughter, and endless happiness. You make every day brighter, and I'm grateful for every moment we share.";
const LETTER_CLOSING = "Grow old along with me — the best is yet to be.";

const OPENING_LINES = [
  "The Year Was 2019",
  "At The Benuru Group of Schools…",
  "On what seemed like an ordinary day…",
  "Neither of them knew…",
  "their lives were about to change forever."
];
const ENDING_LINES = [
  "That day…",
  "became the beginning",
  "of two hearts",
  "choosing each other.",
  "A couple…",
  "learning this beautiful thing called life together."
];

/* ===================== SCREEN NAV ===================== */
const screens = Array.from(document.querySelectorAll('.screen'));
function goTo(id){
  screens.forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo(0,0);
}

/* ===================== STARFIELD ===================== */
const starCanvas = document.getElementById('stars');
const sctx = starCanvas.getContext('2d');
let stars = [];
function sizeCanvas(){
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
  const count = Math.floor((window.innerWidth * window.innerHeight) / 9000);
  stars = Array.from({length: count}, () => ({
    x: Math.random() * starCanvas.width,
    y: Math.random() * starCanvas.height * 0.75,
    r: Math.random() * 1.3 + 0.3,
    baseA: Math.random() * 0.5 + 0.3,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.015 + 0.005
  }));
}
function drawStars(t){
  sctx.clearRect(0,0,starCanvas.width, starCanvas.height);
  stars.forEach(s => {
    const a = s.baseA + Math.sin(t * s.speed + s.phase) * 0.3;
    sctx.beginPath();
    sctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    sctx.fillStyle = `rgba(246,241,251,${Math.max(0,a)})`;
    sctx.fill();
  });
  requestAnimationFrame(drawStars);
}
sizeCanvas();
requestAnimationFrame(drawStars);
window.addEventListener('resize', sizeCanvas);

/* ===================== PETALS ===================== */
const petalField = document.getElementById('petal-field');
function spawnPetal(){
  const p = document.createElement('div');
  p.className = 'petal';
  const startX = Math.random() * 100;
  const duration = 10 + Math.random() * 10;
  const driftX = (Math.random() - 0.5) * 200;
  const size = 6 + Math.random() * 8;
  p.style.left = startX + 'vw';
  p.style.width = size + 'px';
  p.style.height = size + 'px';
  p.style.setProperty('--drift-x', driftX + 'px');
  p.style.animationDuration = duration + 's';
  petalField.appendChild(p);
  setTimeout(() => p.remove(), duration * 1000 + 200);
}
setInterval(spawnPetal, 900);
for(let i=0;i<6;i++) setTimeout(spawnPetal, i*300);

/* ===================== DIAL TONE SYNTH ===================== */
let audioCtx = null;
function getCtx(){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if(audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
// classic DTMF frequency pairs per digit — real "touch dial" tones
const DTMF = {
  '1':[697,1209], '2':[697,1336], '3':[697,1477],
  '4':[770,1209], '5':[770,1336], '6':[770,1477],
  '7':[852,1209], '8':[852,1336], '9':[852,1477],
  '0':[941,1336]
};
function playTone(freqs, duration = 0.12, volume = 0.14){
  const ctx = getCtx();
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  gain.connect(ctx.destination);
  freqs.forEach(f => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  });
}
function playDialTone(digit){ playTone(DTMF[digit], 0.12, 0.13); }
function playBackTone(){ playTone([480], 0.09, 0.1); }
function playErrorTone(){ playTone([300, 220], 0.35, 0.12); }
function playSuccessTone(){
  playTone([660], 0.1, 0.13);
  setTimeout(() => playTone([880], 0.16, 0.13), 110);
}

/* ===================== LOCK SCREEN / DIAL PAD ===================== */
const sealBtn = document.getElementById('sealBtn');
const passForm = document.getElementById('passForm');
const passError = document.getElementById('passError');
const dialDots = Array.from(document.querySelectorAll('.dial-dot'));
const dialPad = document.getElementById('dialPad');
const dialBack = document.getElementById('dialBack');
let enteredDigits = '';

sealBtn.addEventListener('click', () => {
  getCtx(); // unlock audio context on first gesture
  passForm.classList.remove('hidden');
  sealBtn.style.transform = 'scale(0.9)';
  setTimeout(() => sealBtn.style.transform = '', 150);
});

function updateDots(){
  dialDots.forEach((d, i) => d.classList.toggle('filled', i < enteredDigits.length));
}

function resetDial(){
  enteredDigits = '';
  updateDots();
}

function checkPasscode(){
  if(enteredDigits === PASSCODE){
    passError.classList.remove('show');
    playSuccessTone();
    unlockMusic();
    setTimeout(() => {
      runCinematic();
    }, 350);
  } else {
    playErrorTone();
    passError.classList.add('show');
    passForm.classList.add('shake');
    setTimeout(() => {
      passForm.classList.remove('shake');
      resetDial();
    }, 400);
  }
}

dialPad.addEventListener('click', (e) => {
  const key = e.target.closest('.dial-key');
  if(!key) return;
  key.classList.add('pressed');
  setTimeout(() => key.classList.remove('pressed'), 130);

  if(key === dialBack){
    playBackTone();
    enteredDigits = enteredDigits.slice(0, -1);
    updateDots();
    return;
  }
  if(enteredDigits.length >= 4) return;
  const digit = key.dataset.digit;
  playDialTone(digit);
  enteredDigits += digit;
  updateDots();
  if(enteredDigits.length === 4){
    setTimeout(checkPasscode, 250);
  }
});

/* ===================== CINEMATIC INTRO ===================== */
let cinematicSkipped = false;

// wait() checks the skip flag every 100ms so any beat can be cut short instantly
function wait(ms){
  return new Promise((resolve) => {
    const start = Date.now();
    const t = setInterval(() => {
      if(cinematicSkipped || Date.now() - start >= ms){
        clearInterval(t);
        resolve();
      }
    }, 100);
  });
}

async function fadeIn(el){
  el.classList.remove('hidden');
  el.style.opacity = 0;
  void el.offsetWidth;
  requestAnimationFrame(() => { el.style.opacity = 1; });
  await wait(900);
}
async function fadeOut(el){
  el.style.opacity = 0;
  await wait(700);
  el.classList.add('hidden');
}

async function showLine(el, text, hold = 1400){
  if(cinematicSkipped) return;
  el.textContent = text;
  await fadeIn(el);
  if(cinematicSkipped) return;
  await wait(hold);
  await fadeOut(el);
}

function getMeetDuration(){
  const now = new Date();
  let months = (now.getFullYear() - MEET_DATE.getFullYear()) * 12 + (now.getMonth() - MEET_DATE.getMonth());
  let ref = new Date(MEET_DATE);
  ref.setMonth(ref.getMonth() + months);
  if(ref > now){
    months -= 1;
    ref = new Date(MEET_DATE);
    ref.setMonth(ref.getMonth() + months);
  }
  const remDays = Math.floor((now - ref) / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(remDays / 7);
  const days = remDays % 7;
  return { months, weeks, days };
}

function playStoryVideo(){
  return new Promise((resolve) => {
    const video = document.getElementById('storyVideo');
    let done = false;
    const finish = () => {
      if(done) return;
      done = true;
      video.pause();
      video.removeEventListener('ended', finish);
      video.removeEventListener('error', onError);
      clearInterval(skipWatcher);
      clearTimeout(safety);
      resolve();
    };
    const onError = () => setTimeout(finish, 300);

    video.currentTime = 0;
    video.play().catch(() => {}); // muted autoplay should always succeed
    video.addEventListener('ended', finish, { once: true });
    video.addEventListener('error', onError, { once: true });

    const safety = setTimeout(finish, 14000); // never hang more than ~14s
    const skipWatcher = setInterval(() => { if(cinematicSkipped) finish(); }, 150);
  });
}

async function runCinematic(){
  cinematicSkipped = false;
  goTo('screen-cinematic');

  const card = document.getElementById('cinemaCard');
  const line = document.getElementById('cinemaLine');
  const videoWrap = document.getElementById('cinemaVideoWrap');
  const counter = document.getElementById('cinemaCounter');
  const gold = document.getElementById('cinemaGold');

  [card, line, videoWrap, counter, gold].forEach(el => { el.classList.add('hidden'); el.style.opacity = 0; });

  // 1. Studio card
  await fadeIn(card);
  await wait(2200);
  await fadeOut(card);

  // 2. Opening narration
  for(const l of OPENING_LINES){
    if(cinematicSkipped) break;
    await showLine(line, l, 1500);
  }

  // 3. The video
  if(!cinematicSkipped){
    await fadeIn(videoWrap);
    await playStoryVideo();
    await fadeOut(videoWrap);
  }

  // 4. A breath of silence
  await wait(1200);

  // 5. Ending narration
  for(const l of ENDING_LINES){
    if(cinematicSkipped) break;
    await showLine(line, l, 1300);
  }

  // 6. Meeting duration counter
  if(!cinematicSkipped){
    await showLine(line, 'Today marks', 900);
    const { months, weeks, days } = getMeetDuration();
    await fadeIn(counter);
    animateNumber('meetMonths', months, 800);
    animateNumber('meetWeeks', weeks, 700);
    animateNumber('meetDays', days, 900);
    await wait(2200);
    await fadeOut(counter);
  }

  // 7. Gold finale line
  await fadeIn(gold);
  await wait(2400);
  await fadeOut(gold);

  goTo('screen-loading');
  runLoadingSequence();
}

document.getElementById('skipCinematicBtn').addEventListener('click', () => {
  cinematicSkipped = true;
});

document.getElementById('videoSoundToggle').addEventListener('click', (e) => {
  const video = document.getElementById('storyVideo');
  video.muted = !video.muted;
  e.currentTarget.textContent = video.muted ? '🔇' : '🔊';
});

/* ===================== LOADING SEQUENCE ===================== */
const loadingFill = document.getElementById('loadingFill');
const startBtn = document.getElementById('startBtn');
let loadingRan = false;
function runLoadingSequence(){
  if(loadingRan) return;
  loadingRan = true;
  requestAnimationFrame(() => { loadingFill.style.width = '100%'; });
  setTimeout(() => {
    startBtn.classList.remove('hidden');
  }, 2500);
}
startBtn.addEventListener('click', () => {
  goTo('screen-counter');
  runCounter();
});

/* ===================== AGE COUNTER ===================== */
let counterRan = false;
function runCounter(){
  if(counterRan) return;
  counterRan = true;

  const now = new Date();
  let years = now.getFullYear() - BIRTH_DATE.getFullYear();
  let months = now.getMonth() - BIRTH_DATE.getMonth();
  let days = now.getDate() - BIRTH_DATE.getDate();

  if(days < 0){
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if(months < 0){
    years -= 1;
    months += 12;
  }

  animateNumber('numYears', years, 1200);
  animateNumber('numMonths', months, 1000);
  animateNumber('numDays', days, 1400);
}
function animateNumber(id, target, duration){
  const el = document.getElementById(id);
  const start = performance.now();
  function tick(now){
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target);
    if(p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

document.getElementById('toMemoriesBtn').addEventListener('click', () => {
  goTo('screen-memories');
  refreshCarousel();
});

/* ===================== CAROUSEL ===================== */
const carousel = document.getElementById('carousel');
const track = document.getElementById('carouselTrack');
const cards = Array.from(track.querySelectorAll('.card'));
const dotsWrap = document.getElementById('dots');
cards.forEach((_, i) => {
  const d = document.createElement('span');
  d.className = 'dot' + (i === 0 ? ' active' : '');
  dotsWrap.appendChild(d);
});
const dots = Array.from(dotsWrap.children);

function refreshCarousel(){
  updateActiveCard();
}
function updateActiveCard(){
  const center = carousel.scrollLeft + carousel.clientWidth / 2;
  let closestIdx = 0, closestDist = Infinity;
  cards.forEach((c, i) => {
    const cCenter = c.offsetLeft + c.clientWidth / 2;
    const dist = Math.abs(cCenter - center);
    if(dist < closestDist){ closestDist = dist; closestIdx = i; }
    c.classList.toggle('in-view', dist < c.clientWidth * 0.5);
  });
  dots.forEach((d,i) => d.classList.toggle('active', i === closestIdx));
}
carousel.addEventListener('scroll', () => {
  requestAnimationFrame(updateActiveCard);
});
window.addEventListener('resize', updateActiveCard);

document.getElementById('toLetterBtn').addEventListener('click', () => {
  goTo('screen-teaser');
});

/* ===================== LETTER MODAL ===================== */
const letterModal = document.getElementById('letterModal');
const envelopeBtn = document.getElementById('envelopeBtn');
const modalClose = document.getElementById('modalClose');
const letterTextEl = document.getElementById('letterText');
letterTextEl.textContent = LETTER_TEXT;

const closingP = document.createElement('p');
closingP.style.marginTop = '1.1em';
closingP.style.fontWeight = '600';
closingP.style.color = 'var(--blush)';
closingP.textContent = LETTER_CLOSING;
letterTextEl.insertAdjacentElement('afterend', closingP);

envelopeBtn.addEventListener('click', () => {
  letterModal.classList.add('open');
});
modalClose.addEventListener('click', () => {
  letterModal.classList.remove('open');
});
letterModal.addEventListener('click', (e) => {
  if(e.target === letterModal) letterModal.classList.remove('open');
});

/* ===================== HIDDEN SURPRISE — FINAL SCENE ===================== */
const finalSceneModal = document.getElementById('finalSceneModal');
document.getElementById('oneLastThingBtn').addEventListener('click', () => {
  finalSceneModal.classList.add('open');
});
document.getElementById('finalSceneClose').addEventListener('click', () => {
  finalSceneModal.classList.remove('open');
});
finalSceneModal.addEventListener('click', (e) => {
  if(e.target === finalSceneModal) finalSceneModal.classList.remove('open');
});

/* ===================== CELEBRATE -> FINALE ===================== */
const bgm = document.getElementById('bgm');
const muteToggle = document.getElementById('muteToggle');
const iconSound = document.getElementById('iconSound');
const iconMute = document.getElementById('iconMute');
const flowerCanvas = document.getElementById('flowerCanvas');

/* Music starts right after the correct passcode is dialed in,
   and plays continuously (looping) through the rest of the experience. */
function unlockMusic(){
  bgm.currentTime = 0;
  bgm.volume = 0;
  muteToggle.classList.remove('hidden');
  bgm.play().catch(() => { /* if blocked, the mute/play button lets her start it manually */ });
  // gentle fade-in
  const target = 0.85;
  const step = 0.03;
  const fade = setInterval(() => {
    bgm.volume = Math.min(target, bgm.volume + step);
    if(bgm.volume >= target) clearInterval(fade);
  }, 60);
}

document.getElementById('celebrateBtn').addEventListener('click', () => {
  letterModal.classList.remove('open');
  goTo('screen-finale');
  startCelebration();
});

function startCelebration(){
  // music is already playing since unlock — just make sure it's going
  if(bgm.paused) bgm.play().catch(() => {});
  flowerCanvas.classList.add('on');
  startFlowerFall();
}

muteToggle.addEventListener('click', () => {
  if(bgm.paused){
    bgm.play();
    iconSound.style.display = '';
    iconMute.style.display = 'none';
  } else {
    bgm.pause();
    iconSound.style.display = 'none';
    iconMute.style.display = '';
  }
});

/* ===================== RESTART ===================== */
function restartAll(){
  bgm.pause();
  bgm.currentTime = 0;
  muteToggle.classList.add('hidden');
  flowerCanvas.classList.remove('on');
  loadingRan = false; counterRan = false;
  loadingFill.style.width = '0%';
  startBtn.classList.add('hidden');
  resetDial();
  passForm.classList.add('hidden');
  passError.classList.remove('show');
  cinematicSkipped = true; // stop any in-flight cinematic sequence
  const storyVideo = document.getElementById('storyVideo');
  storyVideo.pause();
  storyVideo.currentTime = 0;
  finalSceneModal.classList.remove('open');
  ['numYears','numMonths','numDays'].forEach(id => document.getElementById(id).textContent = '0');
  goTo('screen-lock');
}
document.getElementById('restartBtn').addEventListener('click', restartAll);
document.getElementById('restartBtn2').addEventListener('click', restartAll);

/* ===================== FLOWER FALL CANVAS ===================== */
const fctx = flowerCanvas.getContext('2d');
let flowers = [];
let flowerAnimId = null;

function sizeFlowerCanvas(){
  flowerCanvas.width = window.innerWidth;
  flowerCanvas.height = window.innerHeight;
}
sizeFlowerCanvas();
window.addEventListener('resize', sizeFlowerCanvas);

function makeFlower(){
  return {
    x: Math.random() * flowerCanvas.width,
    y: -20 - Math.random() * 200,
    r: 6 + Math.random() * 10,
    speed: 0.6 + Math.random() * 1.4,
    drift: (Math.random() - 0.5) * 1.2,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.04,
    hue: Math.random() > 0.5 ? '#e8b4f0' : '#f3cf94',
    sway: Math.random() * Math.PI * 2
  };
}

function drawFlower(f){
  fctx.save();
  fctx.translate(f.x, f.y);
  fctx.rotate(f.rot);
  fctx.fillStyle = f.hue;
  fctx.globalAlpha = 0.85;
  for(let i=0;i<5;i++){
    fctx.save();
    fctx.rotate((Math.PI*2/5) * i);
    fctx.beginPath();
    fctx.ellipse(0, -f.r*0.6, f.r*0.45, f.r*0.7, 0, 0, Math.PI*2);
    fctx.fill();
    fctx.restore();
  }
  fctx.beginPath();
  fctx.fillStyle = '#fff6da';
  fctx.arc(0,0, f.r*0.28, 0, Math.PI*2);
  fctx.fill();
  fctx.restore();
}

let celebrationActive = false;
function startFlowerFall(){
  celebrationActive = true;
  flowers = Array.from({length: 46}, makeFlower);
  let t = 0;
  function loop(){
    if(!celebrationActive) return;
    t += 1;
    fctx.clearRect(0,0,flowerCanvas.width, flowerCanvas.height);
    flowers.forEach(f => {
      f.y += f.speed;
      f.x += Math.sin(t*0.01 + f.sway) * 0.6 + f.drift * 0.2;
      f.rot += f.rotSpeed;
      if(f.y > flowerCanvas.height + 30){
        f.y = -20; f.x = Math.random() * flowerCanvas.width;
      }
      drawFlower(f);
    });
    flowerAnimId = requestAnimationFrame(loop);
  }
  loop();
}

/* ===================== PWA / INSTALLABLE APP ===================== */
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
