const sky = document.getElementById("sky");
const portrait = document.querySelector(".portrait");
const sun = document.getElementById("sun");
const hint = document.getElementById("hint");
const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const gameOverEl = document.getElementById("gameOver");
const finalTimeEl = document.getElementById("finalTime");
const finalScoreEl = document.getElementById("finalScore");
const gameOverTitle = document.getElementById("gameOverTitle");
const restartBtn = document.getElementById("restart");
const inviteBtn = document.getElementById("invite");
const learnMoreBtn = document.getElementById("learnMore");
const labelTime = document.getElementById("labelTime");
const labelVacation = document.getElementById("labelVacation");
const labelFinalTime = document.getElementById("labelFinalTime");
const labelFinalScore = document.getElementById("labelFinalScore");
const campaignLine1 = document.getElementById("campaignLine1");
const campaignLine2 = document.getElementById("campaignLine2");

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

const isGerman = (navigator.language || "").toLowerCase().startsWith("de");
const locale = isGerman ? "de" : "en";

const strings = {
  en: {
    hint: "Swipe up fast to keep the sun up",
    gameOverTitle: "Sunset!",
    gameOverHint: "Sunset! Swipe up to restart",
    restart: "Restart",
    invite: "Invite friends",
    learnMore: "Learn more",
    labelTime: "Time",
    labelVacation: "Vacation",
    labelFinalTime: "Time",
    labelFinalScore: "Vacation earned",
    campaignLine1: "<strong>Brauchst du echten Urlaub?</strong>",
    campaignLine2: "Sieh, wie <strong>IG Metall</strong> für dich kämpft, wenn das Spiel endet.",
    shareUnavailable: "Share not available",
    shareCopied: "Invite link copied!",
    shareText: (earned, link) =>
      `I earned ${earned} vacation time in Sunset Swipe. Try beating my score: ${link}`,
    units: { day: "d", hour: "h" },
  },
  de: {
    hint: "Wische schnell nach oben, um die Sonne oben zu halten",
    gameOverTitle: "Sonnenuntergang!",
    gameOverHint: "Sonnenuntergang! Wische nach oben, um neu zu starten",
    restart: "Neu starten",
    invite: "Freunde einladen",
    learnMore: "Mehr erfahren",
    labelTime: "Zeit",
    labelVacation: "Urlaub",
    labelFinalTime: "Zeit",
    labelFinalScore: "Urlaub gesammelt",
    campaignLine1: "<strong>Brauchst du echten Urlaub?</strong>",
    campaignLine2: "Sieh, wie <strong>IG Metall</strong> für dich kämpft, wenn das Spiel endet.",
    shareUnavailable: "Teilen nicht verfügbar",
    shareCopied: "Einladungslink kopiert!",
    shareText: (earned, link) =>
      `Ich habe ${earned} Urlaub in Sunset Swipe gesammelt. Schaffst du mehr? ${link}`,
    units: { day: "T", hour: "Std" },
  },
};


//campaignLine1: "<strong>Need vacation for real?</strong>",
//campaignLine2: "See how <strong>IG Metall</strong> is fighting for you when you finish the game.",

const t = strings[locale];

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
    return `${days}${t.units.day} ${hours}${t.units.hour}`;
  }
  return `${hours}${t.units.hour}`;
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
  hint.textContent = t.hint;
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

const getSharePayload = () => {
  const link = "https://kupkoXD.github.io/ideathon2026_sun-swipe/";
  const earned = formatVacation(state.elapsed);
  const text = t.shareText(earned, link);
  return { link, text };
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
      hint.textContent = t.gameOverHint;
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

learnMoreBtn.addEventListener("click", () => {
  window.location.href = "https://www.igmetall.de";
});

inviteBtn.addEventListener("click", async () => {
  const { link, text } = getSharePayload();
  if (navigator.share) {
    try {
      await navigator.share({ title: "Sunset Swipe", text, url: link });
      return;
    } catch {
      // fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    inviteBtn.textContent = t.shareCopied;
    window.setTimeout(() => {
      inviteBtn.textContent = t.invite;
    }, 1600);
  } catch {
    inviteBtn.textContent = t.shareUnavailable;
    window.setTimeout(() => {
      inviteBtn.textContent = t.invite;
    }, 1600);
  }
});

const applyLocalization = () => {
  labelTime.textContent = t.labelTime;
  labelVacation.textContent = t.labelVacation;
  labelFinalTime.textContent = t.labelFinalTime;
  labelFinalScore.textContent = t.labelFinalScore;
  campaignLine1.innerHTML = t.campaignLine1;
  campaignLine2.innerHTML = t.campaignLine2;
  gameOverTitle.textContent = t.gameOverTitle;
  restartBtn.textContent = t.restart;
  inviteBtn.textContent = t.invite;
  learnMoreBtn.textContent = t.learnMore;
  hint.textContent = t.hint;
};

applyLocalization();
