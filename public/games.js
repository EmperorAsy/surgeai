function shuffle(values) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

const recentScoresKey = "surgeai-recent-scores";
let resultPopupTimer = null;

function recordGameResult(game, title, outcome, score, scoreLabel) {
  const history = JSON.parse(localStorage.getItem(recentScoresKey) || "[]");
  if (!Array.isArray(history)) throw new Error("Recent game scores are invalid.");
  const previousBest = history
    .filter((entry) => entry.game === game && Number.isFinite(entry.score))
    .reduce((best, entry) => Math.max(best, entry.score), Number.NEGATIVE_INFINITY);
  const result = {
    game,
    title,
    outcome,
    score,
    scoreLabel,
    highScore: outcome !== "Draw" && score > Math.max(0, previousBest),
    playedAt: new Date().toISOString(),
  };
  history.unshift(result);
  localStorage.setItem(recentScoresKey, JSON.stringify(history.slice(0, 15)));
  window.dispatchEvent(new CustomEvent("surgeai:scores-updated"));
  return result;
}

function showResultPopup(outcome, title, message) {
  let popup = document.querySelector("#game-result");
  if (!popup) {
    popup = document.createElement("section");
    popup.className = "game-result";
    popup.id = "game-result";
    popup.setAttribute("role", "status");
    popup.setAttribute("aria-live", "assertive");
    popup.setAttribute("aria-atomic", "true");
    const heading = document.createElement("h2");
    const description = document.createElement("p");
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    close.setAttribute("aria-label", "Close game result");
    close.addEventListener("click", () => {
      window.clearTimeout(resultPopupTimer);
      popup.hidden = true;
      popup.classList.remove("is-visible");
    });
    popup.append(heading, description, close);
    document.body.append(popup);
  }
  window.clearTimeout(resultPopupTimer);
  popup.dataset.outcome = outcome;
  popup.querySelector("h2").textContent = title;
  popup.querySelector("p").textContent = message;
  popup.hidden = false;
  popup.classList.remove("is-visible");
  void popup.offsetWidth;
  popup.classList.add("is-visible");
  resultPopupTimer = window.setTimeout(() => {
    popup.hidden = true;
    popup.classList.remove("is-visible");
  }, 8000);
}

function animateGameElement(element, animationClass) {
  element.classList.remove(animationClass);
  void element.offsetWidth;
  element.classList.add(animationClass);
  element.addEventListener("animationend", () => {
    element.classList.remove(animationClass);
  }, { once: true });
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
      cell.classList.remove("mark-pop", "line-win");
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
      animateGameElement(cell, "mark-pop");
      cell.setAttribute("aria-label", `Square ${index + 1}, ${current}`);

      const winningLine = winningLines.find((line) => line.every((square) => marks[square] === current));
      if (winningLine) {
        finished = true;
        status.textContent = `${current} wins! Start a new game?`;
        for (const square of winningLine) cells[square].classList.add("line-win");
        for (const square of cells) square.disabled = true;
        const result = recordGameResult("tic-tac-toe", "Tic-Tac-Toe", "Win", 1, `${current} wins`);
        showResultPopup("win", `${current} wins!`, result.highScore ? "New high score in your recent games!" : "Three in a row! Start another round?");
      } else if (marks.every(Boolean)) {
        finished = true;
        status.textContent = "It's a draw! Start a new game?";
        const result = recordGameResult("tic-tac-toe", "Tic-Tac-Toe", "Draw", 0, "Draw");
        showResultPopup("draw", "It's a draw!", result.highScore ? "A new best result in your recent games." : "Nobody took the board this time.");
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
        animateGameElement(card, "flip-pop");
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
          first.classList.add("match-pop");
          card.classList.add("match-pop");
          first.disabled = true;
          card.disabled = true;
          first = null;
          pairs += 1;
          pairsLabel.textContent = `Pairs: ${pairs} / 6`;
          if (pairs === 6) {
            const score = Math.max(1, 100 - Math.max(0, moves - 6) * 8);
            status.textContent = `You found every pair in ${moves} moves!`;
            const result = recordGameResult("memory-match", "Memory Match", "Win", score, `${score} points · ${moves} moves`);
            showResultPopup("win", "All pairs found!", `${moves} moves · ${score} points${result.highScore ? " · New high score!" : ""}`);
          }
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

  function finish(message, outcome) {
    running = false;
    window.clearInterval(timer);
    timer = null;
    status.textContent = message;
    startButton.disabled = false;
    startButton.textContent = "Play again";
    const cleared = outcome === "win";
    const score = target - 1;
    const result = recordGameResult(
      "number-rush",
      "Number Rush",
      cleared ? "Win" : "Time up",
      score,
      `${score} numbers`,
    );
    showResultPopup(
      cleared ? "win" : "lose",
      cleared ? "Board cleared!" : "Time is up!",
      `${score} numbers in order${result.highScore ? " · New high score!" : ""}`,
    );
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
        animateGameElement(button, "wrong-pop");
        return;
      }
      button.disabled = true;
      button.classList.add("done");
      animateGameElement(button, "number-pop");
      target += 1;
      targetLabel.textContent = target <= 25 ? `Next: ${target}` : "Complete!";
      status.textContent = target <= 25 ? "Nice! Keep going." : "Amazing! You cleared the board!";
      if (target > 25) finish("Amazing! You cleared the board!", "win");
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
      if (seconds <= 0) finish(`Time's up! You reached ${target - 1}.`, "lose");
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
    const result = recordGameResult("meteor-dash", "Meteor Dash", "Flight over", score, `${score} energy`);
    showResultPopup("lose", "Flight over!", `${score} energy collected${result.highScore ? " · New high score!" : ""}`);
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
        canvas.classList.add("screen-shake");
        window.setTimeout(() => canvas.classList.remove("screen-shake"), 300);
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
        canvas.classList.add("collect-flash");
        window.setTimeout(() => canvas.classList.remove("collect-flash"), 240);
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
    const result = recordGameResult(
      "startup-studio",
      "Startup Studio",
      success ? "Win" : "Business closed",
      cash,
      `$${cash.toLocaleString()} cash`,
    );
    showResultPopup(
      success ? "win" : "lose",
      success ? "Launch success!" : "Business closed",
      `${message}${result.highScore ? " · New high score!" : ""}`,
    );
  }

  function takeAction(action) {
    if (ended) return;
    animateGameElement(actionButtons.find((button) => button.dataset.action === action), "feedback-pop");
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
    animateGameElement(cashLabel, "feedback-pop");
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

function setupBubblePop() {
  const arena = document.querySelector("#arena");
  const status = document.querySelector("#status");
  const scoreLabel = document.querySelector("#score");
  const timeLabel = document.querySelector("#time");
  const comboLabel = document.querySelector("#combo");
  const crystalsLabel = document.querySelector("#crystals");
  const startButton = document.querySelector("#start");
  const bestKey = "surgeai-bubble-pop-best";
  const crystalsKey = "surgeai-bubble-pop-crystals";
  let score = 0;
  let seconds = 30;
  let combo = 0;
  let lastPop = 0;
  let running = false;
  let timer = null;
  let spawner = null;

  function readBest() {
    return Math.max(0, Number(localStorage.getItem(bestKey)) || 0);
  }

  function readCrystals() {
    return Math.max(0, Number(localStorage.getItem(crystalsKey)) || 0);
  }

  function updateScore() {
    scoreLabel.textContent = `Score: ${score}`;
    comboLabel.textContent = `Combo: ${combo}`;
  }

  function spawnBubble() {
    if (!running) return;
    const bubbles = arena.querySelectorAll(".bubble");
    if (bubbles.length >= 14) bubbles[0].remove();

    const golden = Math.random() < .16;
    const bubble = document.createElement("button");
    bubble.type = "button";
    bubble.className = golden ? "bubble golden" : "bubble";
    bubble.style.left = `${5 + Math.random() * 70}%`;
    bubble.style.top = `${8 + Math.random() * 72}%`;
    bubble.style.setProperty("--float", `${24 + Math.random() * 48}px`);
    bubble.style.setProperty("--duration", `${3.2 + Math.random() * 2.8}s`);
    bubble.setAttribute("aria-label", golden ? "Pop golden bubble for 5 points" : "Pop bubble for 1 point");
    bubble.addEventListener("click", () => {
      if (!running) return;
      const now = performance.now();
      combo = now - lastPop < 1700 ? combo + 1 : 1;
      lastPop = now;
      score += golden ? 5 : 1;
      if (combo > 0 && combo % 5 === 0) {
        score += 3;
        status.textContent = `Amazing ${combo} bubble combo! Bonus +3 points.`;
      } else {
        status.textContent = golden ? "Golden bubble! +5 points." : "Nice pop!";
      }
      updateScore();
      const sparkle = document.createElement("span");
      sparkle.className = "sparkle";
      sparkle.textContent = golden ? "✦ +5" : "✦";
      sparkle.style.left = bubble.style.left;
      sparkle.style.top = bubble.style.top;
      arena.append(sparkle);
      window.setTimeout(() => sparkle.remove(), 800);
      bubble.remove();
    });
    arena.append(bubble);
  }

  function finish() {
    running = false;
    window.clearInterval(timer);
    window.clearInterval(spawner);
    timer = null;
    spawner = null;
    for (const bubble of arena.querySelectorAll(".bubble")) bubble.disabled = true;
    const crystals = Math.floor(score / 10);
    const totalCrystals = readCrystals() + crystals;
    localStorage.setItem(crystalsKey, String(totalCrystals));
    const best = Math.max(readBest(), score);
    localStorage.setItem(bestKey, String(best));
    crystalsLabel.textContent = `Crystals: ${totalCrystals}`;
    document.querySelector("#best").textContent = `Best: ${best}`;
    status.textContent = `Time! You earned ${crystals} crystals. Play again to beat your best!`;
    startButton.disabled = false;
    startButton.textContent = "Play again";
    const result = recordGameResult("bubble-pop", "Bubble Pop", "Round complete", score, `${score} points · ${crystals} crystals`);
    showResultPopup(
      "complete",
      "Round complete!",
      `${score} points · ${crystals} crystals${result.highScore ? " · New high score!" : ""}`,
    );
  }

  function startGame() {
    window.clearInterval(timer);
    window.clearInterval(spawner);
    arena.replaceChildren();
    score = 0;
    seconds = 30;
    combo = 0;
    lastPop = 0;
    running = true;
    updateScore();
    timeLabel.textContent = "Time: 30s";
    status.textContent = "Pop the bubbles! Golden bubbles are worth 5.";
    startButton.disabled = true;
    startButton.textContent = "Popping…";
    spawnBubble();
    spawner = window.setInterval(spawnBubble, 620);
    timer = window.setInterval(() => {
      seconds -= 1;
      timeLabel.textContent = `Time: ${seconds}s`;
      if (seconds <= 0) finish();
    }, 1000);
  }

  startButton.addEventListener("click", startGame);
  document.querySelector("#best").textContent = `Best: ${readBest()}`;
  crystalsLabel.textContent = `Crystals: ${readCrystals()}`;
}

function setupGardenGlow() {
  const plant = document.querySelector("#plant");
  const progress = document.querySelector("#progress");
  const progressLabel = document.querySelector("#progress-label");
  const status = document.querySelector("#status");
  const coinsLabel = document.querySelector("#coins");
  const waterButton = document.querySelector("#water");
  const harvestButton = document.querySelector("#harvest");
  const harvestsLabel = document.querySelector("#harvests");
  const coinKey = "surgeai-garden-glow-coins";
  const unlockedKey = "surgeai-garden-glow-seeds";
  const harvestKey = "surgeai-garden-glow-harvests";
  const flowers = [
    { id: "sunflower", name: "Sunflower", emoji: "🌻", cost: 0 },
    { id: "moonflower", name: "Moonflower", emoji: "🌸", cost: 20 },
    { id: "starflower", name: "Starflower", emoji: "🌟", cost: 35 },
  ];
  const flowerButtons = [...document.querySelectorAll("[data-seed]")];
  const unlocked = new Set(
    (localStorage.getItem(unlockedKey) || "sunflower").split(","),
  );
  let coins = Math.max(0, Number(localStorage.getItem(coinKey)) || 0);
  let growth = 0;
  let harvests = Math.max(0, Number(localStorage.getItem(harvestKey)) || 0);
  let selected = "sunflower";

  function update() {
    const flower = flowers.find((item) => item.id === selected);
    const stage = growth >= 100 ? 3 : Math.floor(growth / 25);
    const stageEmoji = stage === 0 ? "🌱" : stage === 1 ? "🌿" : stage === 2 ? "🪴" : flower.emoji;
    plant.textContent = stageEmoji;
    plant.dataset.stage = String(stage);
    plant.dataset.flower = selected;
    progress.value = growth;
    progressLabel.textContent = growth === 100 ? "Blooming!" : `${growth}% grown`;
    coinsLabel.textContent = `Petals: ${coins}`;
    harvestsLabel.textContent = `Blooms: ${harvests}`;
    waterButton.disabled = growth >= 100;
    harvestButton.disabled = growth < 100;

    for (const button of flowerButtons) {
      const seed = flowers.find((item) => item.id === button.dataset.seed);
      const isUnlocked = unlocked.has(seed.id);
      button.textContent = isUnlocked
        ? `${seed.emoji} ${seed.name}${selected === seed.id ? " · Selected" : ""}`
        : `${seed.emoji} Unlock ${seed.name} · ${seed.cost} petals`;
      button.setAttribute("aria-pressed", String(selected === seed.id));
      button.disabled = !isUnlocked && coins < seed.cost;
      button.classList.toggle("selected", selected === seed.id);
    }
  }

  for (const button of flowerButtons) {
    button.addEventListener("click", () => {
      const seed = flowers.find((item) => item.id === button.dataset.seed);
      if (!seed) return;
      if (!unlocked.has(seed.id)) {
        if (coins < seed.cost) return;
        coins -= seed.cost;
        unlocked.add(seed.id);
        localStorage.setItem(unlockedKey, [...unlocked].join(","));
      }
      selected = seed.id;
      status.textContent = `${seed.name} seed selected. Give it some water!`;
      update();
    });
  }

  waterButton.addEventListener("click", () => {
    if (growth >= 100) return;
    growth = Math.min(100, growth + 20);
    const drop = document.createElement("span");
    drop.className = "water-drop";
    drop.textContent = "💧";
    drop.style.left = `${34 + Math.random() * 32}%`;
    plant.parentElement.append(drop);
    window.setTimeout(() => drop.remove(), 900);
    status.textContent = growth >= 100
      ? "Your flower bloomed! Harvest it to earn 8 petals."
      : "A little water helps your garden grow.";
    update();
  });

  harvestButton.addEventListener("click", () => {
    if (growth < 100) return;
    harvests += 1;
    localStorage.setItem(harvestKey, String(harvests));
    const reward = harvests % 3 === 0 ? 18 : 8;
    coins += reward;
    localStorage.setItem(coinKey, String(coins));
    growth = 0;
    status.textContent = harvests % 3 === 0
      ? `Bloom bonus! You earned ${reward} petals. Pick a new seed or grow another flower.`
      : `Beautiful bloom! You earned ${reward} petals. Keep growing your garden.`;
    const result = recordGameResult("garden-glow", "Garden Glow", "Bloom harvested", reward, `${reward} petals`);
    showResultPopup("win", "A lovely bloom!", `${reward} petals earned${result.highScore ? " · New high score!" : ""}`);
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
if (game === "bubble-pop") setupBubblePop();
if (game === "garden-glow") setupGardenGlow();
