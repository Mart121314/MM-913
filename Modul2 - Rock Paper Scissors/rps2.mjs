//#region
import * as readlinePromises from "node:readline/promises";
const rl = readlinePromises.createInterface({
  input: process.stdin,
  output: process.stdout
});
//#endregion

// ---- OPPSETT ----------------
const AVAILABLE_LANGUAGES = {"n":"no", "e":"en"};

const DICTIONARY = {
  no: {
    languageChoice: "Velg språk Norsk(n),Engelsk(e)",
    title: "Stein, Saks, Papir, Lizard, Spock",
    gameChoice: "Dine valge er R:Rock, P:Paper, S:Scissors L:Lizard SP:Spock",
    hvaVelgerDu:"Hva velger du?"
  },
  en: {
    languageChoice: "Select your language Norwegian(no)/English(en)",
    title: "Rock, Paper, Scissors, Lizard, Spock",
    gameChoice: "Your choices are R:Rock, P:Paper, S:Scissors L:Lizard SP:Spock",
    hvaVelgerDu:"What do you choose? "
  }
};

let language = "no" 
let dictionary = DICTIONARY[language];
language = await chooseLanguage(AVAILABLE_LANGUAGES, dictionary);
dictionary = DICTIONARY[language];


// 1.  Introduserer spillet.
log(dictionary.title);

log(dictionary.gameChoice);


// ----- Spilleren velger -----


let spillersValg = await velgeUtfall(POSIBLE_SELECTIONS);

// -------- AI velger ---------------

let npcValg = aiVelgerUtfall(POSIBLE_SELECTIONS);

log("NPC " +npcValg);

// ----------- Evaluering ---------------------

if(npcValg === spillersValg){
  log("Uavgjort");
  } else{

    spillersValg = "s"
    let hvaJegVinnerIMot = POSIBLE_SELECTIONS[spillersValg]
    const vantSpilleren = hvaJegVinnerIMot === npcValg; 

      if(vantSpilleren){
        log("Du jukset..... Ikke mulig at du har vunnet over meg");
      } else{
        log("Exterminate.... Exterminate !!!!");
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


function aiVelgerUtfall(lovligeUtfall){
    const keys = Object.keys(lovligeUtfall);
    const choiseIndex = Math.floor(Math.random() * keys.length-1)+1;
    return lovligeUtfall[keys[choiseIndex]];
}

async function chooseLanguage(AVAILABLE_LANGUAGES, dictionary){
  return await kvalitetsikreValg(dictionary.languageChoice + " ", AVAILABLE_LANGUAGES);
} 

async function velgeUtfall(lovligeUtfall){
  return await kvalitetsikreValg(oppslagsverk.hvaVelgerDu + " ", lovligeUtfall);
}

async function kvalitetsikreValg(sporsmaal, lovligeValg){

  let valg = null;

  do {
    valg = await rl.question(sporsmaal);
    valg = valg.toLowerCase();
    valg = valg.slice(0, 1);
  } while ((valg in lovligeValg)  === false);

  valg = lovligeValg[valg];

  return valg;

}



