//#region
import * as readlinePromises from "node:readline/promises";
import { userInfo } from "os";
const rl = readlinePromises.createInterface({
  input: process.stdin,
  output: process.stdout
});
//#endregion
//import {SPLASH_SCREEN } from "./splashscreen.mjs";


const ERR = -1; // BARE FEIL
const CORRECT = 7; // Helt riktig 
const PARTIAL = 0; // Delvis riktig

const colors = {
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7
};

let gameOver = false;
let tilgjengeligeForsøk = await askUserForamountOfAttempts();
let antallForsok = tilgjengeligeForsøk;
let allowDuplicates = await askUserForDuplicates();

const sequence = createSequence([1, 1, 2, 3, 4, 5, 6], 4, allowDuplicates);

let gameState = []
do{ 

  //console.clear();
  for(let i in gameState){
     log(`${colorize(gameState[i].evaluation)}  |  ${gameState[i].guess}`)
  }
  
 //askUserForamountOfAttempts(tilgjengeligeForsøk);  

 const guess = await askUserForGuess();// HEr skal ting komme fra spiller.
  

  const evaluation = evaluateGuess(sequence,guess)
  gameOver = isGameOver(evaluation);
  log(colorize( evaluation));
  antallForsok--;

  gameState.push({guess, evaluation});

}
while(!gameOver && antallForsok > 0)



log(`Du krukte ${tilgjengeligeForsøk-antallForsok}`);


const colorNames = Object.keys(colors);

const sequenceNames = sequence.map(num => colorNames[num]);

console.log(sequenceNames);
log(`Riktig svar var ${sequence}`);
log("◽️ means that you have not got the peg correct")
log("* means that you have got the peg correct")

let playagain = await askUserForPlayAgain();
if(playagain == true){

}

if(playagain == false){
  process.exit();
}
 
function colorize(source){
  let output = "";
  for(let i = 0; i < source.length; i++){
    const WHITE = 7;
    const RED = 1;
    const color = source[i] === CORRECT ? 1:7;
    const symbole = source[i] === CORRECT || source[i] === PARTIAL ? "*":"◽️";
    output += `\x1b[3${color}m ${symbole} \x1b[0m`;
  }
  return output;
}

async function askUserForamountOfAttempts() {
  while (true) {
    let answer = await rl.question('How many attempts would you like? ');
    let numAttempts = parseInt(answer);
    if (Number.isNaN(numAttempts) || numAttempts > 10) {
      console.log("Please enter a valid number which is 10 or less.");
      continue;
    }
    console.log(`Okay, so you have ${numAttempts} attempts.`);
    return numAttempts;
  }
}

async function askUserForDuplicates() {
  while (true) {
    let answer = await rl.question("Allow duplicates? (y/n) ");
    if (answer === "y") {
      return true;
    } else if (answer === "n") {
      return false;
    } else {
      console.log("Please enter 'y' or 'n'");
      continue;
    }
  }
}
async function askUserForPlayAgain() {
  while (true) {
    let answer = await rl.question("Would you like to play again? (y/n) ");
    if (answer === "y") {
      return true;
    } else if (answer === "n") {
      return false;
    } else {
      console.log("Please enter 'y' or 'n'");
      continue;
    }
  }
} 
async function askUserForGuess() {
  while (true) {
    log("Your sequence (using , to separate values, must contain exactly 4 values)");
    log("Colors: Black, Red, Green, Yellow, Blue, Magenta, Cyan, White");
    const input = await rl.question("> ");
    const values = input.split(",");
    if (values.length !== 4) {
      log("Input must contain exactly 4 values");
      continue;
    }
    const guess = [];
    let validInput = true;
    for (const value of values) {
      const colorNum = colors[value.toLowerCase()];
      if (colorNum !== undefined) {
        guess.push(colorNum);
      } else {
        const num = Number(value);
        if (!isNaN(num) && num >= 0 && num <= 7) {
          guess.push(num);
        } else {
          log(`Invalid value: ${value}`);
          validInput = false;
          break;
        }
      }
    }
    if (validInput) {
      return guess;
    }
  }
}
function isGameOver(evaluation){
  let sum = 0;
  for(const res of evaluation){
    sum += res;
  }

  return sum === 28;
}
function evaluateGuess(sourceSequence, guessSequence) {
  let correct = [ERR, ERR, ERR, ERR];
  let partial = [...correct];
  let guessesleft = tilgjengeligeForsøk;
  // Check for correct guesses
  for (let i = 0; i < sourceSequence.length; i++) {
    if (guessSequence[i] == sourceSequence[i]) {
      correct[i] = CORRECT;
    }
  }
  // Check for incorrect guesses
  for (let i = 0; i < sourceSequence.length; i++) {
    if (guessSequence[i] != sourceSequence[i] && sourceSequence.includes(guessSequence[i])) {
      let index = sourceSequence.indexOf(guessSequence[i]);
      if (correct[index] != CORRECT && partial[index] != PARTIAL) {
        partial[index] = PARTIAL;
      }
    }
  }

  let output = [];
  for (let i = 0; i < sourceSequence.length; i++) {
    if (correct[i] === CORRECT) {
      output[i] = CORRECT;
      
    } else if (partial[i] === PARTIAL) {
      output[i] = PARTIAL;
    } else {
      output[i] = ERR;
    }
  }
    return output;
  }


function createSequence(source,length = 4, duplicates){
  console.log(duplicates)
  let sequence = []

  while(sequence.length < length){
    const index = Math.floor(Math.random() * source.length)
    const colorPeg = source[index];

    if(duplicates == false){
      let colorsArray = [
        "BLACK", //black - 0
        "RED", // RED - 1
        "GREEN", // GREEN - 2
        "YELLOW", // Yellow - 3
        "BLUE", // BLUE - 4
        "MAGENTA", // MAGENTA - 5
        "CYAN", // CYAN - 6
        "WHITE" // WHITE - 7
      ];
      colorsArray.splice(index, 1); 
      if(sequence.indexOf(colorPeg) === -1){
      sequence.push(colorPeg);
    }
    } else{
      sequence.push(colorPeg);
    }
  }
  return sequence;
}


//log(SPLASH_SCREEN.join(""));

function log(tekst, isError) {
  if (!isError) {
      console.log(tekst);
  } else {
      console.error(tekst);
  }
}

//process.exit();
