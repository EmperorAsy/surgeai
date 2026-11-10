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

const game = document.body.dataset.game;
if (game === "tic-tac-toe") setupTicTacToe();
if (game === "memory-match") setupMemoryMatch();
if (game === "number-rush") setupNumberRush();
