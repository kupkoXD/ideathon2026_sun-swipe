const sky = document.getElementById("sky");
const portrait = document.querySelector(".portrait");
const sun = document.getElementById("sun");
const hint = document.getElementById("hint");
const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const gameOverEl = document.getElementById("gameOver");
const finalTimeEl = document.getElementById("finalTime");
const finalScoreEl = document.getElementById("finalScore");
const restartBtn = document.getElementById("restart");
const inviteBtn = document.getElementById("invite");

const state = {
  sunY: 0,
  velocity: 0,
  lastTime: 0,
  pointerDown: false,
  lastPointerY: 0,
  lastPointerTime: 0,
  hideHintTimer: null,
  elapsed: 0,
  running: false,
  gameOver: false,
  score: 0,
  vacationHours: 0,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const updateSkyGradient = (progress) => {
  const topLight = 64 - 22 * progress;
  const midLight = 58 - 28 * progress;
  const bottomLight = 24 - 10 * progress;
  sky.style.background = `linear-gradient(180deg, hsl(30, 95%, ${topLight}%) 0%, hsl(335, 70%, ${midLight}%) 55%, hsl(210, 55%, ${bottomLight}%) 100%)`;
};

const updateSun = () => {
  sun.style.setProperty("--sun-offset", `${state.sunY}px`);
  const progress = clamp(state.sunY / (sky.clientHeight * 0.55), 0, 1);
  updateSkyGradient(progress);
};

const centerSun = () => {
  state.sunY = 0;
  state.velocity = 0;
  updateSun();
};

const formatVacation = (elapsedMs) => {
  const hoursTotal = Math.floor(elapsedMs / 1000);
  const days = Math.floor(hoursTotal / 8);
  const hours = hoursTotal % 8;
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
};

const updateHud = () => {
  const seconds = state.elapsed / 1000;
  timeEl.textContent = `${seconds.toFixed(1)}s`;
  scoreEl.textContent = formatVacation(state.elapsed);
};

const resetGame = () => {
  state.elapsed = 0;
  state.score = 0;
  state.vacationHours = 0;
  state.velocity = 0;
  state.gameOver = false;
  state.running = true;
  centerSun();
  hint.style.opacity = "1";
  hint.textContent = "Swipe up fast to keep the sun up";
  gameOverEl.classList.remove("modal--open");
  gameOverEl.setAttribute("aria-hidden", "true");
  updateHud();
};

const showGameOver = () => {
  finalTimeEl.textContent = `${(state.elapsed / 1000).toFixed(1)}s`;
  finalScoreEl.textContent = formatVacation(state.elapsed);
  gameOverEl.classList.add("modal--open");
  gameOverEl.setAttribute("aria-hidden", "false");
};

const tick = (time) => {
  const dt = Math.min(32, time - state.lastTime || 16);
  state.lastTime = time;
  if (state.running) {
    state.elapsed += dt;
  }

  if (state.running) {
    const difficulty = 1 + state.elapsed / 15000;
    const fallSpeed = 0.022 * dt * difficulty;
    state.velocity += fallSpeed;
    state.sunY += state.velocity * 0.5;
    state.vacationHours = Math.floor(state.elapsed / 2000);
    state.score = state.vacationHours;
  }

  const maxY = sky.clientHeight * 0.7;
  if (state.sunY > maxY) {
    state.sunY = maxY;
    state.velocity = 0;
    if (state.running) {
      state.running = false;
      state.gameOver = true;
      hint.style.opacity = "1";
      hint.textContent = "Sunset! Swipe up to restart";
      showGameOver();
    }
  }

  updateSun();
  updateHud();
  requestAnimationFrame(tick);
};

const hideHintSoon = () => {
  if (state.hideHintTimer) return;
  state.hideHintTimer = window.setTimeout(() => {
    hint.style.opacity = "0";
  }, 1200);
};

const onPointerDown = (event) => {
  if (state.gameOver) return;
  if (!state.running) {
    resetGame();
  }
  state.pointerDown = true;
  state.lastPointerY = event.clientY;
  state.lastPointerTime = performance.now();
  hideHintSoon();
};

const onPointerMove = (event) => {
  if (!state.pointerDown) return;
  const currentY = event.clientY;
  const deltaY = currentY - state.lastPointerY;
  const now = performance.now();
  const dt = Math.max(1, now - state.lastPointerTime);
  state.lastPointerY = currentY;
  state.lastPointerTime = now;

  if (deltaY < 0) {
    const speed = Math.abs(deltaY) / dt;
    const threshold = 0.5 + state.elapsed / 12000 * 0.4;
    if (speed < threshold) {
      const penalty = (1 - speed / threshold) * (2 + state.elapsed / 12000);
      state.velocity += penalty * 0.35;
      return;
    }
    const effort = clamp(speed / threshold, 0, 1);
    const liftBase = 0.9 / (1 + state.elapsed / 9000);
    const lift = liftBase * effort;
    state.sunY += deltaY * lift;
    state.velocity = Math.min(state.velocity, 0);
    state.sunY = clamp(state.sunY, -sky.clientHeight * 0.15, sky.clientHeight * 0.7);
    updateSun();
  }
};

const onPointerUp = () => {
  state.pointerDown = false;
};

portrait.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);

resetGame();
window.addEventListener("resize", centerSun);
requestAnimationFrame(tick);

restartBtn.addEventListener("click", () => {
  resetGame();
});

inviteBtn.addEventListener("click", async () => {
  const link = "https://kupkoXD.github.io/ideathon2026_sun-swipe";
  const earned = formatVacation(state.elapsed);
  const text = `I earned ${earned} vacation time in Sunset Swipe. Join the IG Metall affiliate program to play and beat my score: ${link}`;
  if (navigator.share) {
    try {
      await navigator.share({ text, url: link, title: "Sunset Swipe" });
      return;
    } catch {
      // fall back to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    inviteBtn.textContent = "Invite link copied!";
    window.setTimeout(() => {
      inviteBtn.textContent = "Invite friends";
    }, 1600);
  } catch {
    inviteBtn.textContent = text;
  }
});
