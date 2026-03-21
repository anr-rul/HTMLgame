const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const actionBtn = document.getElementById("action-btn");
const liveScoreEl = document.getElementById("live-score");
const highScoreEl = document.getElementById("high-score");
const restartMenu = document.getElementById("restart-menu");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameState = "WAITING";
let score = 0;
let platforms = [];
let stick = { length: 0, angle: 0, originX: 0 };
let stickman = { x: 0, y: 0 };
let highScore = localStorage.getItem("stickHeroHighScore") || 0;
highScoreEl.innerText = `High Score: ${highScore}`;

const STICKMAN_FIXED_X = 100;

function init() {
  score = 0;
  liveScoreEl.innerText = score;
  const firstWidth = 70;
  platforms = [{ x: STICKMAN_FIXED_X + 10 - firstWidth, w: firstWidth }];

  for (let i = 0; i < 15; i++) {
    addPlatform();
  }

  stickman.x = STICKMAN_FIXED_X;
  stickman.y = 0;
  resetStick();

  gameState = "WAITING";
  restartMenu.classList.add("hidden");
}

function resetStick() {
  stick.length = 0;
  stick.angle = 0;
  stick.originX = platforms[0].x + platforms[0].w;
}

function getPlatformWidth(s) {
  return s < 50 ? Math.random() * 20 + 50 : 25;
}

function addPlatform() {
  const last = platforms[platforms.length - 1];
  const distance = Math.random() * (250 - 80) + 80;
  platforms.push({
    x: last.x + last.w + distance,
    w: getPlatformWidth(score),
  });
}

actionBtn.addEventListener("mousedown", (e) => {
  e.preventDefault();
  if (gameState === "WAITING") gameState = "STRETCHING";
});

window.addEventListener("mouseup", () => {
  if (gameState === "STRETCHING") gameState = "TURNING";
});

function update() {
  if (gameState === "STRETCHING") {
    stick.length += 3;
  }

  if (gameState === "TURNING") {
    const stickReach = stick.originX + stick.length;
    const target = platforms[1];
    const isSafe = stickReach >= target.x && stickReach <= target.x + target.w;

    // JIKA TIDAK SAMPAI: Target angle adalah PI (180 derajat / jatuh ke bawah)
    let targetAngle = isSafe ? Math.PI / 2 : Math.PI;

    stick.angle += 0.15;
    if (stick.angle >= targetAngle) {
      stick.angle = targetAngle;
      gameState = "WALKING";
    }
  }

  if (gameState === "WALKING") {
    const worldSpeed = 4;
    const stickReach = stick.originX + stick.length;
    const target = platforms[1];
    const isSafe = stickReach >= target.x && stickReach <= target.x + target.w;

    // Gerakkan dunia ke kiri
    platforms.forEach((p) => (p.x -= worldSpeed));
    stick.originX -= worldSpeed;

    // Kondisi berhenti berjalan:
    // Jika aman: berhenti saat kotak tujuan sampai di Stickman
    // Jika gagal: berhenti saat "ujung kotak tempat berdiri" melewati Stickman
    const stopCondition = isSafe
      ? target.x + target.w - 10 <= STICKMAN_FIXED_X
      : platforms[0].x + platforms[0].w <= STICKMAN_FIXED_X;

    if (stopCondition) {
      if (isSafe) {
        checkLanding();
      } else {
        gameState = "FALLING";
        updateHighScore();
      }
    }
  }

  if (gameState === "FALLING") {
    stickman.y += 12;
    if (stickman.y > canvas.height) {
      showEndMenu("GAME OVER");
      gameState = "GAMEOVER";
    }
  }

  draw();
  requestAnimationFrame(update);
}

function checkLanding() {
  const gap = platforms[1].x - (platforms[0].x + platforms[0].w);
  if (gap < 80) score += 2;
  else if (gap <= 150) score += 3;
  else score += 4;

  liveScoreEl.innerText = score;

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
  ctx.arc(x, baseY - 40, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, baseY - 35);
  ctx.lineTo(x, baseY - 15);
  ctx.stroke();

  const legMove = isWalking ? Math.sin(Date.now() / 50) * 10 : 0;
  ctx.beginPath();
  ctx.moveTo(x, baseY - 15);
  ctx.lineTo(x - 5 + legMove, baseY);
  ctx.moveTo(x, baseY - 15);
  ctx.lineTo(x + 5 - legMove, baseY);
  ctx.stroke();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Gambar Platforms
  ctx.fillStyle = "#333";
  platforms.forEach((p) => {
    if (p.x + p.w > -50 && p.x < canvas.width + 50) {
      ctx.fillRect(p.x, canvas.height - 200, p.w, 200);
    }
  });

  // 2. Gambar Tongkat
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

  // 3. Gambar Stickman
  drawStickman(stickman.x, stickman.y, gameState === "WALKING");
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
