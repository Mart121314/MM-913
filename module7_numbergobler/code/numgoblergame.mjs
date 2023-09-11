//#region
import { log } from "console";
import * as readlinePromises from "node:readline/promises";
import { createRequire } from "module";
const rl = readlinePromises.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const HIGH_SCORE_FILE = "high_scores.txt";
const require = createRequire(import.meta.url);
const fs = require(`fs`);
const readline = require(`readline`);
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const MOVE_LEFT = "a";
const MOVE_RIGHT = "d";
const MOVE_UP = "w";
const MOVE_DOWN = "s";
const GAME_WIDTH = 20;
const GAME_HEIGHT = 20;
const EMPTY = " ";
const PLAYER = "@";
let playerPos = pickStartPos(GAME_HEIGHT, GAME_WIDTH);
let level = makeLevel(GAME_HEIGHT, GAME_WIDTH);
let isPlaying = true;
let score = 0;

while (isPlaying) {
  console.clear();
  draw(level, playerPos, PLAYER);
  console.log(
    `Score: ${score} (${prosentPerCelle()}%)`,
    "Move: w/a/s/d  restart: r quit: q "
  );

  const move = await getMove();

  if (move.restart) {
    playerPos = pickStartPos(GAME_HEIGHT, GAME_WIDTH);
    level = makeLevel(GAME_HEIGHT, GAME_WIDTH);
    isPlaying = true;
    continue;
  }
  if (move.quitGame) {
    isPlaying = false;
    continue;
  }
  isPlaying = update(level, playerPos, move);
  if (!isPlaying) {
    saveHighScore(score);
  }
}

let highScores = getHighScores();
log("  High Scores:");
for (let i = 0; i < highScores.length; i++) {
  log(i + 1, ": ", highScores[i]);
}

process.exit();

function update(level, playerPos, move) {
  let nRow = playerPos.row + move.v;
  let nCol = playerPos.col + move.h;
  let value = level[nRow][nCol];
  let canMove = false;

  if (value === EMPTY) {
    return false;
  }

  if (move.v != 0) {
    let bounds;
    let isInBounds = false;

    if (move.v < 0) {
      if (nRow - value >= 0) {
        isInBounds = true;
        bounds = nRow - value;
      }
    } else if (move.v > 0) {
      if (nRow + value < level.length) {
        isInBounds = true;
        bounds = nRow + value;
      }
    }
    if (isInBounds) {
      let cells = [];
      for (let row = nRow; row != bounds; row += move.v) {
        cells.push(level[row][nCol]);
      }
      if (cells.indexOf(EMPTY) === -1) {
        canMove = true;
      }
    }
  } else if (move.h != 0) {
    let bounds;
    let isInBounds = false;
    if (move.h > 0) {
      if (nCol + value < level[nRow].length) {
        isInBounds = true;
        bounds = nCol + value;
      }
    } else if (move.h < 0) {
      if (nCol - value >= 0) {
        isInBounds = true;
        bounds = nCol - value;
      }
    }
    if (isInBounds) {
      let cells = [];
      for (let col = nCol; col != bounds; col += move.h) {
        cells.push(level[nRow][col]);
      }
      if (cells.indexOf(EMPTY) === -1) {
        canMove = true;
      }
    }
  } else {
    console.error("Move was not a correct value");
  }

  if (canMove) {
    do {
      level[playerPos.row][playerPos.col] = EMPTY;
      if (move.v != 0) {
        playerPos.row += move.v;
      } else {
        playerPos.col += move.h;
      }
      score++;
      value--;
    } while (value > 0);
  }
  return canMove;
}

async function getMove() {
  return new Promise((resolve) => {
    process.stdin.once("keypress", (str, key) => {
      let move = { h: 0, v: 0 };
      const input = key.name;
      if (input === MOVE_LEFT) {
        move.h = -1;
      } else if (input === MOVE_RIGHT) {
        move.h = 1;
      } else if (input === MOVE_UP) {
        move.v = -1;
      } else if (input === MOVE_DOWN) {
        move.v = 1;
      } else if (input === "r") {
        return resolve({ restart: true });
      } else if (input === "q") {
        return resolve({ quitGame: true });
      }
      return resolve(move);
    });
  });
}

function pickStartPos(rows, columns) {
  const row = Math.round(Math.random() * (rows - 1));
  const col = Math.round(Math.random() * (columns - 1));
  return { row, col };
}

function draw(level, playerPos, playerSymbole) {
  let drawing = "";
  for (let row = 0; row < level.length; row++) {
    const rowData = level[row];
    let rowDrawing = "";

    for (let column = 0; column < rowData.length; column++) {
      if (row == playerPos.row && column == playerPos.col) {
        rowDrawing = rowDrawing + colorBackground(playerSymbole, 2);
      } else {
        rowDrawing = rowDrawing + colorize(rowData[column]);
      }
    }

    drawing = drawing + rowDrawing + "\n";
  }

  log(drawing);
}

function colorBackground(symbole, color) {
  return `\x1b[4${color}m${symbole}\x1b[0m`;
}

function colorize(num) {
  return `\x1b[3${num}m${num}\x1b[0m`;
}

function makeLevel(height, width) {
  const level = [];
  const rows = height;
  const columns = width;

  for (let i = 0; i < rows; i++) {
    level.push(makeRow(columns));
  }

  return level;
}

function makeRow(columns) {
  let row = [];
  for (let i = 0; i < columns; i++) {
    row.push(newLevelNumber());
  }
  return row;
}

function newLevelNumber() {
  return Math.ceil(Math.random() * 9);
}

function prosentPerCelle() {
  return ((score / (GAME_HEIGHT * GAME_WIDTH)) * 100).toFixed(2);
}

function getHighScores() {
  let scores = [];

  if (fs.existsSync(HIGH_SCORE_FILE)) {
    let data = fs.readFileSync(HIGH_SCORE_FILE, `utf8`);
    scores = data.split(`\n`).filter(Boolean).map(Number);
    scores.sort((a, b) => b - a);
  }
  return scores;
}

function saveHighScore(score) {
  fs.appendFileSync(HIGH_SCORE_FILE, `${score}\n`);
}
