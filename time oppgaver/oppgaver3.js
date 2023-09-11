/*
    Hei.
    Dette er et oppgave sett i MM-912.
    Meningen er å trene på et fåtall ting av gangen. 
    Du gjør dette ved å skrive inn ditt svar etter at en oppgave er gitt (se på eksempelet)

    IKKE endre på kode som er gitt, med mindre oppgaven spesefikt sier at du skal det
*/

/*
    Oppgave: Eksempel
    Skriv koden for å skrive ut alle navnene i listen, et navn per linje
*/
console.log("Oppgave: Eksempel");
const people = ["Tony","Christian","Håkon"]

for(let index = 0; index < people.length; index++){
    let person = people[index];
    console.log(person);
}

/*
    Oppgave: A
    Lag variabler for:
    * Timer i døgnet
    * Minutter i en time
    * Sekunder i et minutt
    * forholdet mellom vann og saft når man blander saft.
    * dager til din bursdag
    * mmilimeter regn som faller 
*/
console.log("Oppgave: A");
const timerIDøgnet = 24;
const minutterIEnTime = 60;
const sekunderIEtMinutt = 60;
let vannVsSaft = 50/50;
let dagerTilBursdag = 125;
let millimeterRegnFall = 23;


/*
    Oppgave: B
    Bruk variablene dine fra oppgave A og kalkuler:
    * Hvor Mange sekunder er det i 2.5 timer?
    * Hvor mange minutter er det i 123 dager?
    Husk å sette svarene til sine egne variabler
    Eks:
    // Hvor mange dl er 4.5 coups?
    const dlInCoups = 2.36588;
    const antallDL = dlInCoups * 4.5;
*/
console.log("Oppgave: B");
let svar = sekunderITimer();

function sekunderITimer() {
    return minutterIEnTime * sekunderIEtMinutt * 2.5;
  }
console.log(svar);

let svar2 = minutterIDager();

function minutterIDager() {
    return minutterIEnTime * timerIDøgnet * 123;
}
console.log(svar2);


/*
    Oppgave: C
    Bruk en løkke (for) til å skrive ut tallene fra 1 til 10 
*/
console.log("Oppgave: C");
for (let index = 0; index < 10; index++) {
    console.log(index+1);
}


/*
    Oppgave: D
    Bruk en løkke (for) til å skrive ut tallene fra 10 til 1
*/
console.log("Oppgave: D");
for (let index = 10; index > 0; index--) {
    console.log(index);
}

/*
    Oppgave: E
    Denne er litt vanskligere, men du klarer den ;)
    Bruk en løkke (for) til å skrive ut partallene mellom 1 og 100
*/
console.log("Oppgave: E");
for(let index = 0; index = 100; index++)
    console.log(index++)

/*
    Oppgave: F
    Fyll inn koden som skal til for å få følgende kode til å skrive ut det som er forventet.
*/
console.log("Oppgave: F");

const DICTIONARY = {
    hello:"Hei på deg",
    howAreYou:"hvordan står det til?",
    goodQuestionsLatly:"Fått noen gode spørsmål i det siste?"

}

console.log(`${DICTIONARY.hello} Christian ${DICTIONARY.howAreYou}`); //-> Hei på deg Christian, hvordan står det til?
console.log(`${DICTIONARY.goodQuestionsLatly}`); //-> Fått noen gode spørsmål i det siste?


/*
    Oppgave: G
    Fyll inn koden som skal til for å få følgende kode til å skrive ut det som er forventet.
*/
console.log("Oppgave: G");

const DICTIONARY_ML = {
    no:{
        hello:"Hei på deg",
        howAreYou:"hvordan står det til?",
        goodQuestionsLatly:"Fått noen gode spørsmål i det siste?",
    },
    en:{
        hello:"Hey",
        howAreYou:"How are you doing?",
        goodQuestionsLatly:"Have you got any good questions lately?"
    }
}
let language = "en"
const dict = DICTIONARY_ML[language];

console.log(`${DICTIONARY_ML.en.hello} Christian ${DICTIONARY_ML.en.howAreYou}`);
console.log(`${DICTIONARY_ML.en.goodQuestionsLatly}`); 
console.log(`${DICTIONARY_ML.no.hello} Christian ${DICTIONARY_ML.no.howAreYou}`);
console.log(`${DICTIONARY_ML.no.goodQuestionsLatly}`)