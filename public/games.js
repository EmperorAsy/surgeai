function shuffle(values) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function setupTicTacToe() {
  const board = document.querySelector("#board");
  const status = document.querySelector("#status");
  const cells = [...board.querySelectorAll("[data-cell]")];
  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  let marks;
  let current;
  let finished;

  function reset() {
    marks = Array(9).fill("");
    current = "X";
    finished = false;
    status.textContent = "X goes first";
    for (const cell of cells) {
      cell.textContent = "";
      cell.disabled = false;
      cell.setAttribute("aria-label", `Square ${Number(cell.dataset.cell) + 1}, empty`);
    }
  }

  for (const cell of cells) {
    cell.addEventListener("click", () => {
      const index = Number(cell.dataset.cell);
      if (finished || marks[index]) return;

      marks[index] = current;
      cell.textContent = current;
      cell.setAttribute("aria-label", `Square ${index + 1}, ${current}`);

      if (winningLines.some((line) => line.every((square) => marks[square] === current))) {
        finished = true;
        status.textContent = `${current} wins! Start a new game?`;
        for (const square of cells) square.disabled = true;
      } else if (marks.every(Boolean)) {
        finished = true;
        status.textContent = "It's a draw! Start a new game?";
      } else {
        current = current === "X" ? "O" : "X";
        status.textContent = `${current}'s turn`;
      }
    });
  }

  document.querySelector("#reset").addEventListener("click", reset);
  reset();
}

function setupMemoryMatch() {
  const board = document.querySelector("#board");
  const status = document.querySelector("#status");
  const movesLabel = document.querySelector("#moves");
  const pairsLabel = document.querySelector("#pairs");
  const symbols = ["🚀", "🪐", "👾", "🎮", "⭐", "🛸"];
  let first = null;
  let locked = false;
  let moves = 0;
  let pairs = 0;
  let round = 0;

  function startRound() {
    round += 1;
    first = null;
    locked = false;
    moves = 0;
    pairs = 0;
    movesLabel.textContent = "Moves: 0";
    pairsLabel.textContent = "Pairs: 0 / 6";
    status.textContent = "Find your first pair.";
    board.replaceChildren();

    for (const symbol of shuffle([...symbols, ...symbols])) {
      const card = document.createElement("button");
      card.className = "card";
      card.type = "button";
      card.textContent = "?";
      card.dataset.symbol = symbol;
      card.dataset.revealed = "false";
      card.setAttribute("aria-label", "Hidden card");
      card.setAttribute("aria-pressed", "false");
      card.addEventListener("click", () => {
        if (locked || card.dataset.revealed === "true") return;
        card.textContent = symbol;
        card.dataset.revealed = "true";
        card.setAttribute("aria-label", `Card ${symbol}`);
        card.setAttribute("aria-pressed", "true");

        if (!first) {
          first = card;
          return;
        }

        moves += 1;
        movesLabel.textContent = `Moves: ${moves}`;
        if (first.dataset.symbol === card.dataset.symbol) {
          first.classList.add("matched");
          card.classList.add("matched");
          first.disabled = true;
          card.disabled = true;
          first = null;
          pairs += 1;
          pairsLabel.textContent = `Pairs: ${pairs} / 6`;
          if (pairs === 6) status.textContent = `You found every pair in ${moves} moves!`;
        } else {
          locked = true;
          const previous = first;
          first = null;
          const activeRound = round;
          window.setTimeout(() => {
            if (activeRound !== round) return;
            for (const hidden of [previous, card]) {
              hidden.textContent = "?";
              hidden.dataset.revealed = "false";
              hidden.setAttribute("aria-label", "Hidden card");
              hidden.setAttribute("aria-pressed", "false");
            }
            locked = false;
          }, 750);
        }
      });
      board.append(card);
    }
  }

  document.querySelector("#reset").addEventListener("click", startRound);
  startRound();
}

function setupNumberRush() {
  const board = document.querySelector("#board");
  const status = document.querySelector("#status");
  const targetLabel = document.querySelector("#target");
  const timerLabel = document.querySelector("#timer");
  const startButton = document.querySelector("#start");
  const numbers = shuffle(Array.from({ length: 25 }, (_, index) => index + 1));
  let target = 1;
  let seconds = 30;
  let running = false;
  let timer = null;

  function finish(message) {
    running = false;
    window.clearInterval(timer);
    timer = null;
    status.textContent = message;
    startButton.disabled = false;
    startButton.textContent = "Play again";
  }

  for (const number of numbers) {
    const button = document.createElement("button");
    button.className = "number";
    button.type = "button";
    button.textContent = String(number);
    button.setAttribute("aria-label", `Number ${number}`);
    button.addEventListener("click", () => {
      if (!running) return;
      if (number !== target) {
        status.textContent = `Find ${target} next.`;
        return;
      }
      button.disabled = true;
      button.classList.add("done");
      target += 1;
      targetLabel.textContent = target <= 25 ? `Next: ${target}` : "Complete!";
      status.textContent = target <= 25 ? "Nice! Keep going." : "Amazing! You cleared the board!";
      if (target > 25) finish("Amazing! You cleared the board!");
    });
    board.append(button);
  }

  startButton.addEventListener("click", () => {
    if (running) return;
    target = 1;
    seconds = 30;
    running = true;
    targetLabel.textContent = "Next: 1";
    timerLabel.textContent = "Time: 30s";
    status.textContent = "Go! Tap the numbers in order.";
    startButton.disabled = true;
    startButton.textContent = "Playing…";
    for (const button of board.querySelectorAll("button")) {
      button.disabled = false;
      button.classList.remove("done");
    }
    timer = window.setInterval(() => {
      seconds -= 1;
      timerLabel.textContent = `Time: ${seconds}s`;
      if (seconds <= 0) finish(`Time's up! You reached ${target - 1}.`);
    }, 1000);
  });
}

function setupMeteorDash() {
  const canvas = document.querySelector("#game");
  const context = canvas.getContext("2d");
  const status = document.querySelector("#status");
  const scoreLabel = document.querySelector("#score");
  const bestLabel = document.querySelector("#best");
  const startButton = document.querySelector("#start");
  const keys = new Set();
  const bestKey = "surgeai-meteor-dash-best";
  let width = 0;
  let height = 0;
  let player;
  let meteors = [];
  let energy = [];
  let score = 0;
  let elapsed = 0;
  let spawnTimer = 0;
  let running = false;
  let paused = false;
  let animation = 0;
  let previousFrame = 0;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (player) {
      player.x = Math.min(width - player.radius, Math.max(player.radius, player.x));
      player.y = Math.min(height - player.radius, Math.max(player.radius, player.y));
    }
    draw();
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#090b12";
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < 48; index += 1) {
      const x = (index * 127.7) % width;
      const y = (index * 83.3 + elapsed * (8 + index % 8)) % height;
      context.fillStyle = index % 5 === 0 ? "#9a8cff99" : "#b9c3e566";
      context.fillRect(x, y, index % 6 === 0 ? 2 : 1, index % 6 === 0 ? 2 : 1);
    }

    for (const orb of energy) {
      context.beginPath();
      context.fillStyle = "#67f6d5";
      context.shadowBlur = 16;
      context.shadowColor = "#67f6d5";
      context.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    }

    for (const meteor of meteors) {
      context.beginPath();
      context.fillStyle = "#ff886e";
      context.shadowBlur = 12;
      context.shadowColor = "#ff654e99";
      context.arc(meteor.x, meteor.y, meteor.radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.beginPath();
      context.strokeStyle = "#ffd1a6";
      context.lineWidth = 2;
      context.arc(meteor.x - 2, meteor.y - 2, meteor.radius * .57, -.8, 1.6);
      context.stroke();
    }

    if (!player) return;
    context.save();
    context.translate(player.x, player.y);
    context.fillStyle = "#9a8cff";
    context.shadowBlur = 20;
    context.shadowColor = "#9a8cff";
    context.beginPath();
    context.moveTo(0, -player.radius - 6);
    context.lineTo(player.radius, player.radius);
    context.lineTo(0, player.radius * .45);
    context.lineTo(-player.radius, player.radius);
    context.closePath();
    context.fill();
    context.restore();
  }

  function endGame(message) {
    running = false;
    paused = false;
    window.cancelAnimationFrame(animation);
    const best = Math.max(score, Number(localStorage.getItem(bestKey)) || 0);
    localStorage.setItem(bestKey, String(best));
    bestLabel.textContent = `Best: ${best}`;
    status.textContent = message;
    startButton.disabled = false;
    startButton.textContent = "Fly again";
    draw();
  }

  function frame(timestamp) {
    if (!running) return;
    const delta = Math.min((timestamp - previousFrame) / 1000 || 0, .04);
    previousFrame = timestamp;
    elapsed += delta;
    spawnTimer += delta;

    const speed = 250;
    let moveX = Number(keys.has("ArrowRight") || keys.has("d")) -
      Number(keys.has("ArrowLeft") || keys.has("a"));
    let moveY = Number(keys.has("ArrowDown") || keys.has("s")) -
      Number(keys.has("ArrowUp") || keys.has("w"));
    const magnitude = Math.hypot(moveX, moveY) || 1;
    player.x = Math.min(width - player.radius, Math.max(player.radius, player.x + moveX / magnitude * speed * delta));
    player.y = Math.min(height - player.radius, Math.max(player.radius, player.y + moveY / magnitude * speed * delta));

    const difficulty = 1 + Math.min(elapsed / 42, .8);
    if (spawnTimer > Math.max(.28, .82 - elapsed * .008)) {
      spawnTimer = 0;
      meteors.push({
        x: Math.random() * Math.max(1, width - 36) + 18,
        y: -20,
        radius: 9 + Math.random() * 10,
        speed: (125 + Math.random() * 90) * difficulty,
        drift: (Math.random() - .5) * 70,
      });
      if (Math.random() < .72) {
        energy.push({
          x: Math.random() * Math.max(1, width - 32) + 16,
          y: -10,
          radius: 7,
          speed: 110 + Math.random() * 55,
        });
      }
    }

    for (const meteor of meteors) {
      meteor.x += meteor.drift * delta;
      meteor.y += meteor.speed * delta;
      if (Math.hypot(meteor.x - player.x, meteor.y - player.y) < meteor.radius + player.radius * .68) {
        endGame(`Meteor hit! Final score: ${score}`);
        return;
      }
    }
    meteors = meteors.filter((meteor) => meteor.y < height + 24);

    for (const orb of energy) {
      orb.y += orb.speed * delta;
      if (!orb.collected && Math.hypot(orb.x - player.x, orb.y - player.y) < orb.radius + player.radius) {
        orb.collected = true;
        score += 10;
        scoreLabel.textContent = `Energy: ${score}`;
      }
    }
    energy = energy.filter((orb) => !orb.collected && orb.y < height + 16);
    draw();
    animation = window.requestAnimationFrame(frame);
  }

  function startGame() {
    window.cancelAnimationFrame(animation);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    player = { x: width / 2, y: height - 48, radius: 13 };
    meteors = [];
    energy = [];
    score = 0;
    elapsed = 0;
    spawnTimer = 0;
    previousFrame = 0;
    paused = false;
    keys.clear();
    scoreLabel.textContent = "Energy: 0";
    status.textContent = "Collect the teal energy. Dodge the orange meteors!";
    startButton.disabled = true;
    startButton.textContent = "Flying…";
    running = true;
    animation = window.requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault();
    keys.add(event.key.toLowerCase());
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener("blur", () => keys.clear());
  canvas.addEventListener("pointermove", (event) => {
    if (!running) return;
    const bounds = canvas.getBoundingClientRect();
    player.x = Math.min(width - player.radius, Math.max(player.radius, event.clientX - bounds.left));
    player.y = Math.min(height - player.radius, Math.max(player.radius, event.clientY - bounds.top));
  });
  canvas.addEventListener("pointerdown", (event) => {
    if (!running) return;
    canvas.setPointerCapture(event.pointerId);
    const bounds = canvas.getBoundingClientRect();
    player.x = event.clientX - bounds.left;
    player.y = event.clientY - bounds.top;
  });
  startButton.addEventListener("click", () => {
    if (!paused) return startGame();
    paused = false;
    running = true;
    previousFrame = 0;
    status.textContent = "Flight resumed. Keep collecting energy and dodging meteors!";
    startButton.disabled = true;
    startButton.textContent = "Flying…";
    animation = window.requestAnimationFrame(frame);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running) {
      running = false;
      paused = true;
      window.cancelAnimationFrame(animation);
      status.textContent = "Paused while this tab is hidden.";
      startButton.disabled = false;
      startButton.textContent = "Resume flight";
    }
  });
  bestLabel.textContent = `Best: ${Number(localStorage.getItem(bestKey)) || 0}`;
  resize();
}

function setupStartupStudio() {
  const cashLabel = document.querySelector("#cash");
  const weekLabel = document.querySelector("#week");
  const stats = document.querySelector("#stats");
  const status = document.querySelector("#status");
  const actions = document.querySelector("#actions");
  const actionButtons = [...actions.querySelectorAll("[data-action]")];
  const demandLabel = document.querySelector("#demand");
  const startCash = 10000;
  let cash = startCash;
  let quality = 25;
  let audience = 12;
  let insight = 16;
  let week = 1;
  let price = 100;
  let ended = false;

  function update() {
    cashLabel.textContent = `$${Math.max(0, cash).toLocaleString()}`;
    weekLabel.textContent = ended
      ? `Week ${week - 1} / 8`
      : `Week ${Math.min(week, 8)} / 8`;
    stats.querySelector('[data-stat="quality"]').textContent = `${quality}%`;
    stats.querySelector('[data-stat="audience"]').textContent = `${audience}%`;
    stats.querySelector('[data-stat="insight"]').textContent = `${insight}%`;
  }

  function finish(message, success) {
    ended = true;
    status.textContent = message;
    status.classList.toggle("success", success);
    for (const button of actionButtons) button.disabled = true;
  }

  function takeAction(action) {
    if (ended) return;
    let cost = 0;
    let report = "";

    if (action === "build") {
      cost = 1900;
      quality = Math.min(100, quality + 15);
      report = "The product team shipped a useful improvement.";
    } else if (action === "market") {
      cost = 1500;
      audience = Math.min(100, audience + 17);
      report = "A focused campaign brought new people to the launch page.";
    } else if (action === "research") {
      cost = 850;
      insight = Math.min(100, insight + 17);
      quality = Math.min(100, quality + 3);
      report = "Customer interviews revealed what to build next.";
    } else if (action === "price") {
      if (price >= 160) {
        cost = 250;
        price = 70;
        audience = Math.min(100, audience + 6);
        report = "A lower price attracted a wider group of customers.";
      } else {
        cost = 250;
        price += 30;
        quality = Math.max(0, quality - 2);
        report = "A premium price improved revenue per sale but narrowed demand.";
      }
    }

    if (cash < cost + 450) {
      status.textContent = "Not enough cash for that move and this week's operating costs.";
      return;
    }

    cash -= cost + 450;
    const marketMood = .82 + Math.random() * .36;
    const demand = Math.max(1, Math.floor(
      (quality * .35 + audience * .4 + insight * .25) * marketMood,
    ));
    const sales = Math.floor(demand * (price / 100));
    const revenue = sales * price;
    cash += revenue;
    demandLabel.textContent = `Market pulse: ${marketMood > 1.04 ? "strong" : marketMood < .92 ? "quiet" : "steady"}`;
    update();
    week += 1;
    status.textContent = `${report} Week ${week - 1}: ${sales} sales brought in $${revenue.toLocaleString()}.`;

    if (cash <= 0) {
      cash = 0;
      update();
      finish("The runway ran out. Reset and try a different strategy.", false);
      return;
    }

    if (week > 8) {
      const success = cash >= 12000 && quality >= 55 && audience >= 45;
      finish(
        success
          ? `Great launch! You finished with $${cash.toLocaleString()} and built a business customers want.`
          : `Eight weeks are up. You finished with $${cash.toLocaleString()}. Try a new mix of product, marketing, and research.`,
        success,
      );
      return;
    }

    if (cash < 2300) {
      status.textContent += " Cash is getting tight—consider a lower-cost research move.";
    }
  }

  for (const button of actionButtons) {
    button.addEventListener("click", () => takeAction(button.dataset.action));
  }

  document.querySelector("#reset").addEventListener("click", () => {
    cash = startCash;
    quality = 25;
    audience = 12;
    insight = 16;
    week = 1;
    price = 100;
    ended = false;
    demandLabel.textContent = "Choose a move to begin.";
    status.textContent = "You have $10,000 and eight weeks. Make every move count.";
    status.classList.remove("success");
    for (const button of actionButtons) button.disabled = false;
    update();
  });

  update();
}

const game = document.body.dataset.game;
if (game === "tic-tac-toe") setupTicTacToe();
if (game === "memory-match") setupMemoryMatch();
if (game === "number-rush") setupNumberRush();
if (game === "meteor-dash") setupMeteorDash();
if (game === "startup-studio") setupStartupStudio();
