import { time } from 'node:console';
import * as readlinePromises from 'node:readline/promises';
const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stdout });

const MAX_NUMBER = 100;
const MIN_NUMBER = 1;
const randomNumber = Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER;
let tries = 0;

const LOVLIGE_SPRAAK = {"n":"no","e":"en"}
let valgtSpraak = "no";
let language = await velgSpraak(LOVLIGE_SPRAAK);
let spraak = OPPSLAGSVERK[language]
const OPPSLAGSVERK = {
    en: {
        welcometext: "Guess a number between 1 and 100",
        yourguess: "your guess ",
        rightGuess: "You guessed it! ",
        tooHigh: "Too high",
        tooLow: "Too low",
        whatLanguage: "Which language do you preffer?",
        yourLanguage: "You choosed ",
        playAgain: "Do you want to play again?",
        nothx: "No",
        yesPlease: "Yes"
    },
    no: {
        welcometext: "Gjett et tall mellom 1 og 100",
        yourguess: "Hva gjetter du ",
        rightGuess: "Du gjettet riktig! ",
        tooHigh: "For høyt",
        tooLow: "For lavt",
        whatLanguage: "Hvilke språk foretrekker du?",
        yourLanguage: "du valgte ",
        playAgain: "Vil du spille igjen?",
        nothx: "Nei",
        yesPlease: "Yes"

    }
};

do {
    valgtSpraak = await rl.question(spraak.valgtSpraak + " : ");
    valgtSpraak = valgtSpraak.toLowerCase();
    valgtSpraak = valgtSpraak.slice(0, 1);
} while (LOVLIGE_SPRAAK.includes(valgtSpraak) === false) {

if (valgtSpraak === "n") {
    valgtSpraak = "no";
} else {
    valgtSpraak = "en";
}
};
let isPlaying = true;

console.log('Guess a number between 1 and 100');

while (isPlaying) {
    const answer = await rl.question('Your guess: ');
    const number = parseInt(answer);

    if (number === randomNumber) {
        console.log('You guessed it!');
        isPlaying = false;
        const stats = getStats();
        console.log(stats);
    }
    else if (number < randomNumber) {
        console.log('Too low!');
    } else {
        console.log('Too high!');
    }
}

while (isPlaying) {
    const again = await rl.question(`Do you want to play again?`);
    if (again === "yes") {
        while (isPlaying) {
            const answer = await rl.question('Your guess: ');
            const number = parseInt(answer);

            if (number === randomNumber) {
                console.log('You guessed it!');
                isPlaying = false;
                const stats = getStats();
                console.log(stats);
            }
            else if (number < randomNumber) {
                console.log('Too low!');
            } else {
                console.log('Too high!');
            }
        }

    } else if (nothx === "No") {
        process.exit(0);

    }

}

process.exit(0);

async function velgSpraak(LOVLIGE_SPRAAK) {
    return await kvalitetsikreValg(valgtSpraak + " " + LOVLIGE_SPRAAK)
}


async function velgUtfall(lovligeUtfall) {

    return await kvalitetsikreValg(OPPSLAGSVERK.hvaVelgerDu + " " + lovligeUtfall)

}


async function kvalitetsikreValg(Sporsmaal, lovligeValg) {

    let valg = null;

    do {
        valg = await rl.question(Sporsmaal);
        valg = valg.toLowerCase();
        valg = valg.slice(0, 1);
    } while ((valg in lovligeValg) === false);

    valg = lovligeValg[valg];

    return valg;

}
