//#region
import * as readlinePromises from "node:readline/promises";
const rl = readlinePromises.createInterface({
    input: process.stdin,
    output: process.stdout
});
//#endregion

// Regler https://en.wikipedia.org/wiki/Yatzy

const COLORS = {
    RESET : '\x1b[0m',
    GREEN : '\x1b[32m',
    RED : '\x1b[31m',
    YELLOW : '\x1b[33m',
    BLUE : '\x1b[34m',
    BACK_GREEN : '\x1b[42m',
}

const CORNERS = ["╔", "╗","╝","╚"]
const VERICAL = "║";
const HORIZONTAL = "═";

const MAX_TERNING_VERDI = 6;
const MIN_TERNING_VERDI = 1;
const TOTALT_ANTALL_TERNINGER = 5;
const KAST_PER_RUNDE = 3;
const BONUS_GRENSE = 63;
const BONUS = 50;

// Variabler for å holde styr på terninger.
let terninger = kastTerninger(TOTALT_ANTALL_TERNINGER) // denne variabelen er de terningene som kan kastes 
let beholdtTerninger = []; // denne variabelen holder på de terningen spilleren har valgt å beholde.

// Følgende er en representasjon av et Yatzy ark.
// -1 betyr at spilleren enda ikke har brukt terninger på den tingen. 
const yatzyArk = {
    overeDel: {
        enere: { value: -1, behold: 1 },
        toere: { value: -1, behold: 2 },
        trere: { value: -1, behold: 3 },
        firere: { value: -1, behold: 4 },
        femere: { value: -1, behold: 5 },
        seksere: { value: -1, behold: 6 },
    },
    bonus: -1,
    nedreDel: {
        etpar: { value: -1, behold: "2a" },
        topar: { value: -1, behold: "2aa" },
        treelike: { value: -1, behold: "3a" },
        firelike: { value: -1, behold: "4a" },
        litenstraight: { value: -1, behold: "1,2,3,4,5" },
        storstraight: { value: -1, behold: "2,3,4,5,6" },
        fulthus: { value: -1, behold: "3a2b" },
        sjangse: { value: -1, behold: "" },
        yatzee: { value: -1, behold: "5a" }
    }
};


// Nå starter vi selve spillet.
while (true) {
    beholdtTerninger = []; // Før hver runde passer vi på å tømme listen med beholdte terninger
    await spillRunde(); // Så lar vi spilleren kaste og beholde terninger i henhold til de reglene som styrer det.
    await evaluerRunde(); // Så evaluerer vi runden sammen med spilleren 

    /// TODO:
    // Avslutt spillet dersom spilleren har fullført alle feltene på arket
    // Dersom spillet ikke er over, vent til spilleren er klar til å spille videre. 

}

/// TODO: Skriv ut summen av alle poengene.


//-------------------------------------------------------------------


async function spillRunde() {

    // Vi setter hvor mange kast spilleren har denne runden (3 dersom ingen har endret på det)
    let antallKast = KAST_PER_RUNDE
    // Silleren skal ha alle terningene. 
    terninger = kastTerninger(TOTALT_ANTALL_TERNINGER);

    // Så lenge ikke alle kastene er brukt opp så får spilleren kaste igjen
    while (antallKast > 0) {

        // Terningene kastes 
        terninger = await spillerKasterTerning(terninger.length)

        // Resultatet vises til spilleren 
        console.clear();
        console.log("Du rullet : ");
        console.table(terninger);

        // Spilleren velger hva som skal beholdes
        await taUtTerningerBasertPaaSpillerValg();

        // Viser spilleren hva som er beholdt og hva som kan kastes på nytt.
        console.log("Beholdt : ", beholdtTerninger);
        console.log("Frie terninger: ", terninger);

        // Spilleren har nå brukt et kast.
        antallKast--;

        ///TODO: Det kan hende at spilren har tatt vare på alle terningene
        /// dvs at det ikke er noen terninger i gjen i terninger. I dette tilfellet skal vi ikke tilby spilleren å trille i gjenn. 

        // Dersom spilleren fortsatt har flere kast å ta, så får spilleren avgjøre om vedkommende ønsker å gjøre det.
        if (antallKast > 0) {
            let villFortsette = await rl.question("Vil du fortsette ? (J/N)")
            villFortsette = villFortsette.toLowerCase();
            if (villFortsette.charAt(0) === "n") {
                antallKast = -1;
            }
        }
    }
}

async function taUtTerningerBasertPaaSpillerValg() {

    // Spør spilleren om hvilke terninger de ønskr å beholde.
    let playerInput = await rl.question("Hvilke terninger ønsker du å beholde?");
    
    // Gjør spillerens svar om til en liste 
    playerInput = playerInput.trim().split(" ");

    // Går gjenom listen og tar vare på de verdiene som spilleren har ønsket og beholde.
    // Disse merkes med en -1 i ternings listen, slik at vi kan filtrere dem ut etterpå
    for (let i = 0; i < playerInput.length; i++) {
        let terning = terninger[playerInput[i]];
        if (terning) {
            beholdtTerninger.push(terning);
            terninger[playerInput[i]] = -1; // markering av ting som skal tas ut 
        }
    }

    // Oppretter en midlertidig liste for å holde på alle terninger spilleren ikke har trukket ut
    let frieTerninger = [];
    for (let i = 0; i < terninger.length; i++) {
        // Dette virker fordi vi tidligere har satt verdien til -1 på de terningene vi skal ta bort.
        if (terninger[i] > 0) {
            frieTerninger.push(terninger[i]);
        }
    }

    // Så setter vi listen til terninger til å inneholde kunn de som ikke er holdt tilbake av spilleren, 
    terninger = frieTerninger;
}

async function evaluerRunde() {

    // Hvilke regel ønsker spilleren å bruke disse terningene i mot?
    let regelBeskrivelse = await sporeSpillerOmBrukAvTerninger()
    // Alle terningene skal medberegnes ikke bare de som spilleren holdt tilbake, så vi slår dem sammen til en ny liste 
    let alleTerninger = [].concat(beholdtTerninger).concat(terninger);

    let sum = 0;
    let regel = yatzyArk.overeDel[regelBeskrivelse];
    // Dersom det fantes en regel for "regelBeskrivelse" i øvre del av arket.
    if (regel) {
        // Alle regler på øvre del av arket dreier seg om å summere alle av samme verdi, så vi trenger bare en 
        // for løkke til å håndtere alle de tilfellene
        for (let i = 0; i < alleTerninger.length; i++) {
            const terning = alleTerninger[i];
            if (terning === regel.behold) {
                sum += terning;
            }
        }

        // Siden vi har gjort en endring på øvre del av arket så kan vi sjekke om bonus er tilgjengelig.
        if (kanBonusBeregnes()) {
            let sumOvre = kalkulerSumAvArk();
            if (sumOvre >= BONUS_GRENSE) {
                yatzyArk.bonus = BONUS;
            }
        }


    } else {

        // Kode for å håndtere at spilleren ønsker å bruke terningene for et par
        if (regelBeskrivelse === "etpar") {
            // sortere terningene slik at eks [ 3, 2, 5, 2, 5, 1 ] blir [ 5, 5, 3, 2, 2, 1 ]
            alleTerninger = alleTerninger.sort(function (a, b) { return b - a });
            let par = 0;
            // Så lenge vi ikke har funnet et par og vi har nok terninger igjen.
            while (par === 0 || alleTerninger.length > 1) {
                let terning = alleTerninger.shift(); // Ta bort den første terningen 
                if (terning === alleTerninger[0]) { // Sjekk om den terningen vi tok bort er lik den neste i listen 
                    sum = terning * 2; // dersom ja, da har vi funnet et par
                    par++;
                }
            }
        }
        else if (regelBeskrivelse === "topar") {
            
            ///TODO: Skriv Kode for å finne ut om spilleren har to par og hva summen blir
            // TIPS: Koden for dette er VELDIG lik til koden for et par.

        } else if (regelBeskrivelse === "trelike") {
            // sortere terningene slik at eks [ 3, 2, 5, 2, 5, 1 ] blir [ 5, 5, 3, 2, 2, 1 ]
            alleTerninger = alleTerninger.sort((a,b) => b - a);
            // tar ut den første terningen 
            let terning = alleTerninger.shift(); 
            // Sjekker at den første terningen er lik de to neste terningene.
            if(terning === alleTerninger[0] && terning === alleTerninger[1]){
                sum = terning*3;
            }

        }else if (regelBeskrivelse === "firelike") {

            ///TODO: Skriv Kode for å finne ut om spilleren har to firelike og hva summen blir
            // TIPS: Koden for dette er VELDIG lik til koden for tre like.
            
        } else if(regelBeskrivelse === "litenstraight"){
            
            // Sortere terningen slik at [ 1, 2, 4, 3, 5, 3 ] blir [ 1, 2, 3, 3, 4, 5 ]
            alleTerninger = alleTerninger.sort((a,b) => a - b);
            // Fjerner duplikater [ 1, 2, 3, 3, 4, 5 ] -> [ 1, 2, 3, 4, 5 ] (set er en liste som ikke beholder mer en 1 av hver verdi)
            let temp = new Set(alleTerninger)
            // Sjekker om vi har fått 12345
            if(temp.join() === "12345"){
                sum = 15;
            }
        }
        else if (regelBeskrivelse === "storstraight") {

            ///TODO: Skriv Kode for å finne ut om spilleren har storstraight
            // TIPS: Koden for dette er VELDIG lik til koden for litenstraight.
            
        }
        else if(regelBeskrivelse === "fulthus"){

            ///TODO: Skriv Kode for å finne ut om spilleren har fult hus
            // TIPS: Dersom du har jobbet deg sekvensilet ned til denne plassen så har du sett alt du trenger for å løse dette
            // Fult hus er 3 like og 2 like.

        }
        else if(regelBeskrivelse === "sjangse"){

            ///TODO: Skrive koden for å håndtere sjangse. 
        }
        else if (regelBeskrivelse === "yatzee"){

            ///TODO: Skriv Kode for å finne ut om spilleren har yatzee
            // TIPS: Dette er det samme som 5 like
            
        }

    }

    // Setter summen oppnåd for den valgte regelen. 
    if (yatzyArk.overeDel[regelBeskrivelse]) {
        yatzyArk.overeDel[regelBeskrivelse].value = sum;
    } else {
        yatzyArk.nedreDel[regelBeskrivelse].value = sum;
    }
    console.clear();

    // Viser status. 
    printArk(yatzyArk);
}

function kanBonusBeregnes() {
    for (let regel of Object.keys(yatzyArk.overeDel)) {
        if (regel.value === -1) {
            return false;
        }
    }
    return true;
}

function kalkulerSumAvArk() {
    let sum = 0;
    for (let regel of Object.keys(yatzyArk.overeDel)) {
        sum += regel.value
    }
    return sum;
}


async function sporeSpillerOmBrukAvTerninger() {
    console.clear();
    console.log("Hvor vil du bruke terningene dine?");
    let slutTerninger = beholdtTerninger.concat(terninger);
    console.log(slutTerninger);
    printArk(yatzyArk);

    let verdi = " "
    let gyldigeValg = (Object.keys(yatzyArk.overeDel)).concat(Object.keys(yatzyArk.nedreDel))
    while (gyldigeValg.indexOf(verdi) === -1) {
        verdi = await rl.question("> ");
        verdi = verdi.toLowerCase().trim();
    }
    return verdi;
}

function printArk(ark) {

    console.log("---------------------");
    console.log(`Enere  : ${formaterResultat(ark.overeDel.enere.value)}`);
    console.log(`Toere  : ${formaterResultat(ark.overeDel.toere.value)}`);
    console.log(`Trere  : ${formaterResultat(ark.overeDel.trere.value)}`);
    console.log(`Firere : ${formaterResultat(ark.overeDel.firere.value)}`);
    console.log(`Femere : ${formaterResultat(ark.overeDel.femere.value)}`);
    console.log(`Seksere: ${formaterResultat(ark.overeDel.seksere.value)}`);
    console.log("---------------------");
    console.log(`Bonus: ${formaterResultat(ark.bonus)}`)
    console.log("---------------------");
    console.log(`et par  : ${formaterResultat(ark.nedreDel.etpar.value)}`);
    console.log(`to par  : ${formaterResultat(ark.nedreDel.topar.value)}`);
    console.log(`tre like  : ${formaterResultat(ark.nedreDel.treelike.value)}`);
    console.log(`fire like  : ${formaterResultat(ark.nedreDel.firelike.value)}`);
    console.log(`liten straight  : ${formaterResultat(ark.nedreDel.litenstraight.value)}`);
    console.log(`stor straight  : ${formaterResultat(ark.nedreDel.storstraight.value)}`);
    console.log(`Fult hus  : ${formaterResultat(ark.nedreDel.fulthus.value)}`);
    console.log(`Sjangse  : ${formaterResultat(ark.nedreDel.sjangse.value)}`);
    console.log(`Yatze  : ${formaterResultat(ark.nedreDel.yatzee.value)}`);
    console.log("---------------------");


}

function formaterResultat(res) {
    let output = res;
    if (res < 0) {
        output = "";
    }
    return output;
}

async function spillerKasterTerning(antall) {

    await rl.question("Trykk Enter for å kaste terninger");
    return kastTerninger(antall)
}

function kastTerninger(antall) {
    let terninger = [];
    for (let i = 0; i < antall; i++) {
        terninger[i] = (Math.floor(Math.random() * (MAX_TERNING_VERDI - MIN_TERNING_VERDI)) + MIN_TERNING_VERDI);
    }
    return terninger;
}

process.exit();