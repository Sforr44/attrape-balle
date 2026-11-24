const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');

const R = 20;        // rayon de Pacman
const BALL_R = 9;    // rayon de la balle
const SPEED = 3.2;

let score = 0;
const pac = { x: 200, y: 200, angle: 0 };  // angle = direction du regard
let ball = randomBall();
let mouthOpenUntil = 0;                     // la bouche reste ouverte jusqu'à ce moment
const keys = { up: false, down: false, left: false, right: false };

function randomBall() {
  return {
    x: BALL_R + 10 + Math.random() * (canvas.width - 2 * BALL_R - 20),
    y: BALL_R + 10 + Math.random() * (canvas.height - 2 * BALL_R - 20)
  };
}

/* ---------- Timer sauvegardé (temps de jeu total) ---------- */
const STORAGE_KEY = 'attrape-balle-temps-ms';
let totalMs = 0;

try {
  totalMs = parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0;
} catch (e) {
  totalMs = 0;
}

let lastTick = performance.now();

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? h + ':' + mm + ':' + ss : mm + ':' + ss;
}

function saveTime() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.floor(totalMs)));
  } catch (e) {
    // stockage indisponible : on ignore
  }
}

function updateTimer(now) {
  // le temps ne compte que quand l'onglet est visible
  if (!document.hidden) {
    totalMs += now - lastTick;
  }
  lastTick = now;
  timerEl.textContent = formatTime(totalMs);
}

setInterval(saveTime, 1000);
window.addEventListener('beforeunload', saveTime);
document.addEventListener('visibilitychange', () => {
  lastTick = performance.now();
  saveTime();
});

timerEl.textContent = formatTime(totalMs);

/* ---------- Son (généré en local avec Web Audio, aucun fichier) ---------- */
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function chompSound() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  // petit "waka" : deux bips courts
  [[440, 700, 0], [700, 400, 0.09]].forEach(([f1, f2, delay]) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(f1, t + delay);
    osc.frequency.linearRampToValueAtTime(f2, t + delay + 0.08);
    gain.gain.setValueAtTime(0.0001, t + delay);
    gain.gain.exponentialRampToValueAtTime(0.15, t + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.09);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t + delay);
    osc.stop(t + delay + 0.1);
  });
}

/* ---------- Contrôles ---------- */
const keyMap = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right'
};

window.addEventListener('keydown', e => {
  if (keyMap[e.key]) {
    e.preventDefault();
    initAudio();
    keys[keyMap[e.key]] = true;
  }
});

window.addEventListener('keyup', e => {
  if (keyMap[e.key]) keys[keyMap[e.key]] = false;
});

document.querySelectorAll('.pad button').forEach(btn => {
  const dir = btn.dataset.dir;
  const on = e => { e.preventDefault(); initAudio(); keys[dir] = true; };
  const off = e => { e.preventDefault(); keys[dir] = false; };
  btn.addEventListener('pointerdown', on);
  btn.addEventListener('pointerup', off);
  btn.addEventListener('pointerleave', off);
  btn.addEventListener('pointercancel', off);
});

/* ---------- Boucle de jeu ---------- */
function update() {
  const dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);

  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    pac.x += (dx / len) * SPEED;
    pac.y += (dy / len) * SPEED;
    pac.angle = Math.atan2(dy, dx);
  }

  pac.x = Math.max(R, Math.min(canvas.width - R, pac.x));
  pac.y = Math.max(R, Math.min(canvas.height - R, pac.y));

  if (Math.hypot(pac.x - ball.x, pac.y - ball.y) < R + BALL_R - 4) {
    score++;
    scoreEl.textContent = score;
    mouthOpenUntil = performance.now() + 350;
    chompSound();
    ball = randomBall();
  }
}

function drawPacman(now) {
  let mouth;
  if (now < mouthOpenUntil) {
    // bouche grande ouverte qui se referme doucement
    const k = (mouthOpenUntil - now) / 350;
    mouth = 0.15 + 0.6 * k;
  } else {
    mouth = 0.05; // presque fermée au repos
  }

  ctx.save();
  ctx.translate(pac.x, pac.y);
  ctx.rotate(pac.angle);

  ctx.fillStyle = '#ffd400';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, R, mouth * Math.PI, (2 - mouth) * Math.PI);
  ctx.closePath();
  ctx.fill();

  // œil
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(R * 0.1, -R * 0.55, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function draw(now) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#e53935';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();

  drawPacman(now);
}

function loop(now) {
  update();
  updateTimer(now);
  draw(now);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
