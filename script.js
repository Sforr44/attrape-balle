const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
  x: 50,
  y: 50,
  width: 30,
  height: 30,
  speed: 5,
  dx: 0,
  dy: 0,
};

const ball = {
  x: Math.random() * (canvas.width - 20) + 10,
  y: Math.random() * (canvas.height - 20) + 10,
  radius: 10,
};

let score = 0;

function drawPlayer() {
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawBall() {
  ctx.beginPath();
  ctx.fillStyle = 'red';
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
}

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function movePlayer() {
  player.x += player.dx;
  player.y += player.dy;

  if (player.x < 0) player.x = 0;
  if (player.y < 0) player.y = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
}

function detectCollision() {
  let distX = Math.abs(ball.x - (player.x + player.width / 2));
  let distY = Math.abs(ball.y - (player.y + player.height / 2));

  return distX <= player.width / 2 + ball.radius && distY <= player.height / 2 + ball.radius;
}

function resetBall() {
  ball.x = Math.random() * (canvas.width - 20) + 10;
  ball.y = Math.random() * (canvas.height - 20) + 10;
}

function updateScore() {
  score++;
  document.getElementById('score').textContent = score;
}

function gameLoop() {
  clear();
  drawPlayer();
  drawBall();
  movePlayer();

  if (detectCollision()) {
    updateScore();
    resetBall();
  }

  requestAnimationFrame(gameLoop);
}

// Contrôles clavier
function keyDownHandler(e) {
  if (e.key === 'ArrowRight') player.dx = player.speed;
  else if (e.key === 'ArrowLeft') player.dx = -player.speed;
  else if (e.key === 'ArrowUp') player.dy = -player.speed;
  else if (e.key === 'ArrowDown') player.dy = player.speed;
}

function keyUpHandler(e) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') player.dx = 0;
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') player.dy = 0;
}

// Contrôles tactiles
function handleTouchStart(direction) {
  if (direction === 'up') player.dy = -player.speed;
  if (direction === 'down') player.dy = player.speed;
  if (direction === 'left') player.dx = -player.speed;
  if (direction === 'right') player.dx = player.speed;
}

function handleTouchEnd() {
  player.dx = 0;
  player.dy = 0;
}

document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);

// Événements tactiles pour chaque bouton
document.getElementById('up').addEventListener('touchstart', () => handleTouchStart('up'));
document.getElementById('down').addEventListener('touchstart', () => handleTouchStart('down'));
document.getElementById('left').addEventListener('touchstart', () => handleTouchStart('left'));
document.getElementById('right').addEventListener('touchstart', () => handleTouchStart('right'));

document.getElementById('up').addEventListener('touchend', handleTouchEnd);
document.getElementById('down').addEventListener('touchend', handleTouchEnd);
document.getElementById('left').addEventListener('touchend', handleTouchEnd);
document.getElementById('right').addEventListener('touchend', handleTouchEnd);

gameLoop();
