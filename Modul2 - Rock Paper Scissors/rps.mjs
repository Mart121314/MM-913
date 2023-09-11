//#region 
import * as readlinePromises from 'node:readline/promises';
import fs from "node:fs"
const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stdout });
//#endregion



const POSIBLE_SELECTIONS = { R:"Rock", P: "Paper", S: "Scissors", L: "Lizard", SP: "Spock"};

const EVALUATION_MATRIX = { R:"S" || "L", P:"R" || "SP", S:"P" || "L", L:"SP" || "P", SP:"S" || "R" };

let isPlaying = true;

const buttonPress = "";

// Vi velger språk.

const AVAILABLE_LANGUAGES = {"n":"no", "e":"en"};

const DICTIONARY = {
  no: {
    languageChoice: "Velg språk Norsk(n),Engelsk(e)",
    title: "Stein, Saks, Papir, Lizard, Spock",
    gameChoice: "Dine valg er R:Stein, S:Saks, P:Papir, L:Lizard, SP:Spock",
    whatDoYouChoose:"Hva velger du? ",
    pressButton: "Tast hvilken som helst tast for å starte spillet :) ",
    heyLetsPlay: "Hei la oss spille Stein, Saks, Papir, Lizard",
    youLooked: "ÅÅå, din luring! Du må ha sett hånden min",
    iLost: "Neeeei, jeg tapte. Umulig....",
    worldDominance: "Mohahaha verdens herredømme her kommer jeg! ",
    iPicked: "Jeg valgte ",
    youPicked: "Du valgte"
  },
  en: {
    languageChoice: "Select your language Norwegian(no)/English(en)",
    title: "Rock, Paper, Scissors, Lizard, Spock",
    gameChoice: "Your choices are R:Rock, P:Paper, S:Scissors, L:Lizard, SP:Spock",
    whatDoYouChoose:"What do you choose? ",
    pressButton: "Press any button to play :) ",
    heyLetsPlay: "Hey let us play Rock, Paper, Scissors, Lizard, Spock",
    yourSelectionWas: "Your selection was",
    youLooked: "Argghh, you sneeaky cat. you must have peeked",
    iLost: "Noooooo, I lost. Imposible....",
    worldDominance: "Mohahaha world dominance will be mine! ",
    iPicked: "I choose ",
    youPicked: "You Choose "
  }
};

let language = "no"

let dictionary = DICTIONARY[language];

language = await chooseLanguage(AVAILABLE_LANGUAGES, dictionary);

dictionary = DICTIONARY[language];


log(dictionary.title);
log(dictionary.gameChoice);

while(isPlaying){

    const mainMenu = (await rl.question(dictionary.pressButton));
        
    let playersSelection = "";
    while ((playersSelection in POSIBLE_SELECTIONS) === false){
        playersSelection = await rl.question(dictionary.whatDoYouChoose);
        playersSelection = playersSelection.toUpperCase();
    }

        const fullDesecriptionOfSelection = POSIBLE_SELECTIONS[playersSelection];
        log(`${dictionary.youPicked} ${fullDesecriptionOfSelection}`);

        const npcSelection = doAISelection(POSIBLE_SELECTIONS);
        const fullDesecriptionOfAISelection = POSIBLE_SELECTIONS[npcSelection];
        log(`${dictionary.iPicked} ${fullDesecriptionOfAISelection}`);

if(npcSelection === playersSelection){
    console.log(dictionary.youLooked);
    }else{
        const isPlayerWinner = EVALUATION_MATRIX[playersSelection] === npcSelection;
        if(isPlayerWinner){
            console.log(dictionary.iLost)
        }else{
            console.log(dictionary.worldDominance);
        }
    }
}
    // -------- Hjelpe funksjoner -----------------
function log(tekst, isError) {
    if (!isError) {
      console.log(tekst);
    } else {
        console.error(tekst);
    }
}


function doAISelection(options) {
    const selectionOptions = Object.keys(options); 
    const selectionIndex = Math.floor(Math.random() * selectionOptions.length - 1) + 1;
    return selectionOptions[selectionIndex];
}


async function chooseLanguage(availableLanguage, dictionary){

    let chosenLanguage = null;

    do {
        chosenLanguage = await rl.question(dictionary.languageChoice + " : ", AVAILABLE_LANGUAGES);
        chosenLanguage = chosenLanguage.toLowerCase();
        chosenLanguage = chosenLanguage.slice(0, 1);
    } while ((chosenLanguage in availableLanguage) === false);

    chosenLanguage = availableLanguage[chosenLanguage];
    
    return chosenLanguage;
}
