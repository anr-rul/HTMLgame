const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const actionBtn = document.getElementById("action-btn");
const liveScoreEl = document.getElementById("live-score");
const highScoreEl = document.getElementById("high-score");
const restartMenu = document.getElementById("restart-menu");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const STICKMAN_FIXED_X = 100;
const WORLD_SPEED = 5;
const STICK_GROW_SPEED = 3.5;
const GAME_SCALE = 0.6; // Skala untuk mobile

let gameState = "WAITING";
let score = 0;
let platforms = [];
let stick = { length: 0, angle: 0, originX: 0 };
let stickman = { x: STICKMAN_FIXED_X, y: 0 };
let highScore = localStorage.getItem("stickHeroHighScore") || 0;
highScoreEl.innerText = `High Score: ${highScore}`;

function init() {
  score = 0;
  liveScoreEl.innerText = score;
  const firstWidth = 80;
  platforms = [{ x: STICKMAN_FIXED_X - (firstWidth - 20), w: firstWidth }];
  for (let i = 0; i < 15; i++) {
    addPlatform();
  }
  stickman.y = 0;
  resetStick();
  gameState = "WAITING";
  restartMenu.classList.add("hidden");
}

function getScale() {
  return window.innerWidth < 500 ? GAME_SCALE : 1.0;
}

function resetStick() {
  stick.length = 0;
  stick.angle = 0;
  stick.originX = platforms[0].x + platforms[0].w;
}

function getDynamicPlatformWidth() {
  if (score < 10) return Math.random() * 30 + 50;
  if (score < 30) return Math.random() * 20 + 40;
  if (score < 50) return Math.random() * 15 + 30;
  return 25;
}

function addPlatform() {
  const last = platforms[platforms.length - 1];
  const distance = Math.random() * (250 - 30) + 30;
  const width = getDynamicPlatformWidth();
  platforms.push({ x: last.x + last.w + distance, w: width });
}

function startAction(e) {
  if (e && e.cancelable) e.preventDefault();
  if (gameState === "WAITING") {
    gameState = "STRETCHING";
  }
}

function endAction() {
  if (gameState === "STRETCHING") {
    gameState = "TURNING";
  }
}

actionBtn.addEventListener("pointerdown", startAction, { passive: false });
window.addEventListener("pointerup", endAction);
actionBtn.addEventListener("contextmenu", (e) => e.preventDefault());

function update() {
  if (gameState === "STRETCHING") {
    stick.length += STICK_GROW_SPEED;
  }
  if (gameState === "TURNING") {
    const stickReach = stick.originX + stick.length;
    const target = platforms[1];
    const isSafe = stickReach >= target.x && stickReach <= target.x + target.w;
    let targetAngle = isSafe ? Math.PI / 2 : Math.PI;
    stick.angle += 0.15;
    if (stick.angle >= targetAngle) {
      stick.angle = targetAngle;
      gameState = "WALKING";
    }
  }
  if (gameState === "WALKING") {
    const stickReach = stick.originX + stick.length;
    const target = platforms[1];
    const isSafe = stickReach >= target.x && stickReach <= target.x + target.w;
    platforms.forEach((p) => (p.x -= WORLD_SPEED));
    stick.originX -= WORLD_SPEED;
    const stopCondition = isSafe
      ? target.x + target.w - 20 <= STICKMAN_FIXED_X
      : platforms[0].x + platforms[0].w <= STICKMAN_FIXED_X;
    if (stopCondition) {
      if (isSafe) {
        checkLandingLogic();
      } else {
        gameState = "FALLING";
        updateHighScore();
      }
    }
  }
  if (gameState === "FALLING") {
    stickman.y += 15;
    if (stickman.y > canvas.height) {
      showEndMenu("GAME OVER");
      gameState = "GAMEOVER";
    }
  }
  draw();
  requestAnimationFrame(update);
}

function checkLandingLogic() {
  const gap = platforms[1].x - (platforms[0].x + platforms[0].w);
  if (gap < 100) score += 2;
  else if (gap <= 180) score += 3;
  else score += 4;

  liveScoreEl.innerText = score;

  // LOGIKA MENANG: Cek jika skor sudah mencapai 250
  if (score >= 250) {
    showEndMenu("ANDA MENANG!");
    gameState = "WIN";
  } else {
    platforms.shift();
    addPlatform();
    resetStick();
    gameState = "WAITING";
  }
}

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("stickHeroHighScore", highScore);
    highScoreEl.innerText = `High Score: ${highScore}`;
  }
}

function drawStickman(x, y, isWalking) {
  ctx.save();
  const baseY = canvas.height - 200 + y;
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, baseY - 40, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, baseY - 34);
  ctx.lineTo(x, baseY - 15);
  ctx.stroke();
  const legMove = isWalking ? Math.sin(Date.now() / 60) * 8 : 0;
  ctx.beginPath();
  ctx.moveTo(x, baseY - 15);
  ctx.lineTo(x - 5 + legMove, baseY);
  ctx.moveTo(x, baseY - 15);
  ctx.lineTo(x + 5 - legMove, baseY);
  ctx.stroke();
  ctx.restore();
}

function draw() {
  const currentScale = getScale();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  // Mengaktifkan kembali Scale untuk tampilan Mobile
  if (currentScale < 1) {
    ctx.translate(0, canvas.height * (1 - currentScale));
    ctx.scale(currentScale, currentScale);
  }

  ctx.fillStyle = "#333";
  platforms.forEach((p) => {
    if (p.x + p.w > -100) {
      ctx.fillRect(p.x, canvas.height - 200, p.w, 200);
    }
  });

  ctx.save();
  ctx.translate(stick.originX, canvas.height - 200);
  ctx.rotate(stick.angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -stick.length);
  ctx.strokeStyle = "#4d2600";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  drawStickman(stickman.x, stickman.y, gameState === "WALKING");
  ctx.restore();
}

function showEndMenu(text) {
  document.getElementById("status-text").innerText = text;
  document.getElementById("final-score").innerText = score;
  restartMenu.classList.remove("hidden");
}

function resetGame() {
  init();
}

init();
update();
