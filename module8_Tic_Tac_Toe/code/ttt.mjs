//#region
import * as readlinePromises from "node:readline/promises";
const rl = readlinePromises.createInterface({
  input: process.stdin,
  output: process.stdout,
});
//#endregion

const brett = [
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
];

const spillerSymbolA = "X";
const spillerSymbolB = "O";

const spillerVerdiA = 1;
const spillerVerdiB = -1;

let fortsattSpill = true;
let aktivSpiller = spillerVerdiA;
const playerNameA = await getPlayerName("A");
console.log(`Velkommen ${playerNameA}!`);
const playerNameB = await getPlayerName("B");
console.log(`Velkommen ${playerNameB}!`);

while (fortsattSpill) {
  console.clear();
  visSpilleBrett(brett);
  let spillerSymbolA = "X";
  let spillerSymbolB = "O";
  console.log(
    `Det er ${
      aktivSpiller === spillerVerdiA ? playerNameA : playerNameB
    } sin tur med ${
      aktivSpiller === spillerVerdiA ? spillerSymbolA : spillerSymbolB
    }. Hvis du vil resette spillet, trykk 'r', eller trykk 'q' for å avslutte.`
  );

  const trekk = await sporeSpillerOmTrekk(brett);

  if (trekk.restart) {
    brett.forEach((rad, i) => rad.forEach((_, j) => (brett[i][j] = 0)));
    fortsattSpill = true;
    aktivSpiller = spillerVerdiA;
    continue;
  }

  if (trekk.quitGame) {
    fortsattSpill = false;
    console.clear();
    visSpilleBrett(brett);
    console.log("Spillet avsluttes...");
    break;
  }

  const rad = trekk[0];
  const kollonne = trekk[1];
  brett[rad][kollonne] = aktivSpiller;

  aktivSpiller = aktivSpiller * -1;
  let resultat = harNoenVunnet(brett);
  if (resultat !== 0) {
    fortsattSpill = false;
    console.clear();
    visSpilleBrett(brett);
    console.log("Spiller " + resultat + " vant ");
  }
}

function harNoenVunnet(brett) {
  for (let radPos = 0; radPos < brett.length; radPos++) {
    const rad = brett[radPos];
    let sum = 0;
    for (let kolonePos = 0; kolonePos < brett.length; kolonePos++) {
      sum = sum + rad[kolonePos];
    }

    if (sum === 3) {
      return spillerVerdiA;
    } else if (sum === -3) {
      return spillerVerdiB;
    }
  }

  for (let kolonePos = 0; kolonePos < brett.length; kolonePos++) {
    let sum = 0;
    for (let radPos = 0; radPos < brett.length; radPos++) {
      let rad = brett[radPos];
      sum = sum + rad[kolonePos];
    }

    if (sum === 3) {
      return spillerVerdiA;
    } else if (sum === -3) {
      return spillerVerdiB;
    }
  }

  let sum = 0;
  for (let i = 0; i < brett.length; i++) {
    sum = sum + brett[i][i];
  }
  if (sum === 3) {
    return spillerVerdiA;
  } else if (sum === -3) {
    return spillerVerdiB;
  }

  sum = 0;
  for (let i = 0; i < brett.length; i++) {
    sum = sum + brett[i][brett.length - 1 - i];
  }
  if (sum === 3) {
    return spillerVerdiA;
  } else if (sum === -3) {
    return spillerVerdiB;
  }

  return 0;
}

async function sporeSpillerOmTrekk(brett) {
  let trekk = [];

  do {
    let playerSelection = await rl.question("Hvor setter du merket ditt?");
    playerSelection = playerSelection.trim();
    trekk = playerSelection.split(" ");
    if (trekk.length !== 2) {
      trekk = playerSelection.split(",");
    }
    if (playerSelection.toLowerCase() === "r") {
      return { restart: true };
    } else if (playerSelection.toLowerCase() === "q") {
      return { quitGame: true };
    }
    trekk = trekk.map((num) => parseInt(num) - 1);
  } while (!erTrekkGyldig(trekk, brett));

  return trekk;
}

function erTrekkGyldig(trekk, brett) {
  if (trekk.length != 2) {
    return false;
  }

  const rad = trekk[0];
  const kollone = trekk[1];
  if (rad < 0 || rad > 2 || kollone < 0 || kollone > 2) {
    return false;
  }
  return brett[rad][kollone] === 0;
}

function visSpilleBrett(brett) {
  console.log("    1   2   3");
  console.log("  -------------");
  for (let radPos = 0; radPos < brett.length; radPos++) {
    const rad = brett[radPos];
    let radTegning = `${radPos + 1} | `;
    for (let kolonePos = 0; kolonePos < rad.length; kolonePos++) {
      if (rad[kolonePos] === spillerVerdiA) {
        radTegning += `\x1b[31m${spillerSymbolA}\x1b[0m | `;
      } else if (rad[kolonePos] === spillerVerdiB) {
        radTegning += `\x1b[32m${spillerSymbolB}\x1b[0m | `;
      } else {
        radTegning += "  | ";
      }
    }
    console.log(radTegning);
    console.log("  -------------");
  }
  console.log("\n");
}
async function getPlayerName() {
  const question = "Skriv navnet ditt ";
  const playerName = await rl.question(question);
  return playerName;
}
