//#region 
import * as readlinePromises from 'node:readline/promises';
import fs from "node:fs"
const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stdout });
//#endregion

import { HANGMAN_UI } from './graphics.mjs';

import { DICTIONARY } from './language.mjs';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';


const ALLE_ORD = fs.readFileSync("./ordstartup/ord.txt", "utf-8").split("\n");

const ord = trekkTilfeldigOrdFraListe(ALLE_ORD).toLowerCase();
const ordElementer = ord.split("");
const status = lagOrdVisningFraOrd(ord);


let feil = [];
let guessedLetters = [];


let isPlaying = true;

const ordliste = visListeMedOrd(ALLE_ORD);

const AVAILABLE_LANGUAGES = { "n": "no", "e": "en" };

let language = "no";

let dictionary = DICTIONARY[language];

language = await chooseLanguage(AVAILABLE_LANGUAGES, dictionary);

dictionary = DICTIONARY[language];

const mainMenu = (await rl.question(dictionary.AREYOUREADY));

while (isPlaying) {

    ShowStatus()
    const valgtBokstav = (await rl.question(dictionary.LETTER_CHOICE)).toLowerCase();
    vurderSvar(valgtBokstav);
    vurdereSpilletSlutt(guessedWord);
}



function ShowStatus() {
    log(dictionary.Hangman);
    if (feil.length > 0) {
        log(HANGMAN_UI[feil.length - 1]);
    }
    let summering = status.join(" ");
    log(summering);
    let alleFeilValg = feil.join(",");
    log(`${dictionary.WRONG_LETTER} ${RED} ${alleFeilValg} ${RESET}`);
}

function vurderSvar(svar) {
    if (guessedLetters.includes(svar)) {
        log(`${dictionary.ALREADY_GUESSED} ${RED} ${RESET}`);
        return;
    }
    guessedLetters.push(svar);
    if (ord.includes(svar)) {
        for (let i = 0; i < ord.length; i++) {
            if (ordElementer[i] === svar) {
                status[i] = `${GREEN}${svar}${RESET}`;
            }
        }
    } else {
        feil.push(svar);
    }
}


function vurdereSpilletSlutt(guessedWord) {

    if (feil.length === HANGMAN_UI.length) {
        log(dictionary.GAME_OVER);
    } else if (guessedWord === ord) {
        log(dictionary.GAME_WIN)
        console.clear();
    }

}

function visListeMedOrd(ALLE_ORD) {
    log(ALLE_ORD);
    return ALLE_ORD;
}

function lagOrdVisningFraOrd(ord) {
    return new Array(ord.length).fill("_");
}

function trekkTilfeldigOrdFraListe(liste) {
    const index = Math.floor(Math.random() * liste.length - 1) + 1;
    return liste[index];
}


function log(tekst, isError) {
    if (!isError) {
        console.log(tekst);
    } else {
        console.error(tekst);
    }
}

async function chooseLanguage(availableLanguage, dictionary) {
    let chosenLanguage = null;
    do {
        chosenLanguage = await rl.question(dictionary.LANGUAGE_CHOICE + " : ", AVAILABLE_LANGUAGES);
        chosenLanguage = chosenLanguage.toLowerCase();
        chosenLanguage = chosenLanguage.slice(0, 1);
    } while ((chosenLanguage in availableLanguage) === false);

    chosenLanguage = availableLanguage[chosenLanguage];
    dictionary = DICTIONARY[chosenLanguage];

    return chosenLanguage;
}
