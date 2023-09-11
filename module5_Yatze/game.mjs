//#region
import * as readlinePromises from "node:readline/promises";
const rl = readlinePromises.createInterface({
    input: process.stdin,
    output: process.stdout
});
//#endregion

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

const MAX_TERNING_VERDI = 7;
const MIN_TERNING_VERDI = 1;
const TOTALT_ANTALL_TERNINGER = 5;
const KAST_PER_RUNDE = 3;
const BONUS_GRENSE = 63;
const BONUS = 50;

let terninger = kastTerninger(TOTALT_ANTALL_TERNINGER) 
let beholdtTerninger = []; 


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
        trelike: { value: -1, behold: "3a" },
        firelike: { value: -1, behold: "4a" },
        litenstraight: { value: -1, behold: "1,2,3,4,5" },
        storstraight: { value: -1, behold: "2,3,4,5,6" },
        fulthus: { value: -1, behold: "3a2b" },
        sjangse: { value: -1, behold: "" },
        yatzee: { value: -1, behold: "5a" }
    }
};

while (true) {
    beholdtTerninger = []; 
    await spillRunde(); 
    await evaluerRunde(); 
    evaluereSlutt();

}
async function spillRunde() {
    let antallKast = KAST_PER_RUNDE
    terninger = kastTerninger(TOTALT_ANTALL_TERNINGER);
    while (antallKast > 0) {
        terninger = await spillerKasterTerning(terninger.length)
        console.clear();
        console.log("Du rullet : ");
        console.table(terninger);
        await taUtTerningerBasertPaaSpillerValg();
        console.log("Beholdt : ", beholdtTerninger);
        console.log("Frie terninger: ", terninger);

        antallKast--;

        if (antallKast > 0 && beholdtTerninger.length < 5) {
            let villFortsette = await rl.question("Vil du fortsette? (J/N) ");
            villFortsette = villFortsette.toLowerCase();
            if (villFortsette.charAt(0) === "n" || beholdtTerninger.length === 5) {
                antallKast = -1;
            }
        } else {
            antallKast = -1;
        }
    }
}

async function taUtTerningerBasertPaaSpillerValg() {

    // Asks the player which dices he wants to keep.
    let playerInput = await rl.question("Hvilke terninger ønsker du å beholde?");
    
    // Makes the player's answer an array. 
    playerInput = playerInput.trim().split(" ");

    //  Go through the array and take all the values the player wants to keep.
    // These are branded with -1 in the dice array, so we can filter them out afterwards. 
    for (let i = 0; i < playerInput.length; i++) {
        let terning = terninger[playerInput[i]];
        if (terning) {
            beholdtTerninger.push(terning);
            terninger[playerInput[i]] = -1; // marking of the things that's being taken out.  
        }
    }

    // Creates a temporary array to hold onto all the dices the player hasnt played. 
    let frieTerninger = [];
    for (let i = 0; i < terninger.length; i++) {
        // This seem like we earlier kept the value to -1 on the dices we want to take away. 
        if (terninger[i] > 0) {
            frieTerninger.push(terninger[i]);
        }
    }

    //  So we put the array to dices to contain only the ones that hasnt been held back by the player. 
    terninger = frieTerninger;
}

async function evaluerRunde() {
    let regelBeskrivelse = 
    await sporeSpillerOmBrukAvTerninger()
    let alleTerninger = [].concat(beholdtTerninger).concat(terninger);
    let sum = 0;
    let regel = yatzyArk.overeDel[regelBeskrivelse];
    if (regel) {
        for (let i = 0; i < alleTerninger.length; i++) {
            const terning = alleTerninger[i];
            if (terning === regel.behold) {
                sum += terning;
            }
        }
        if (kanBonusBeregnes()) {
            let sumOvre = kalkulerSumAvArk();
            if (sumOvre >= BONUS_GRENSE) {
                yatzyArk.bonus = BONUS;
            }
        }


    } else {

        if (regelBeskrivelse === "etpar") {
            alleTerninger = alleTerninger.sort((a,b) => b - a);
            let par = 0;
            while (par === 0 || alleTerninger.length > 1) {
                let terning = alleTerninger.shift(); 
                if (terning === alleTerninger[0]) { 
                    sum = terning * 2;
                    par++;
                }
            }
        }
        else if (regelBeskrivelse === "topar") {
            alleTerninger = alleTerninger.sort((a,b) => b - a);
            let toPar = 0;
            while (toPar < 2 && alleTerninger.length >= 2) {
                let terning = alleTerninger.shift();
                if (terning === alleTerninger[0]) {
                    sum+= terning * 2;
                    toPar++;
                }
            }


        } else if (regelBeskrivelse === "trelike") {
            let score = 0;
            for (let i = 0; i < alleTerninger.length - 2; i++) {
              if (alleTerninger[i] === alleTerninger[i + 1] && alleTerninger[i + 2]) {
                score = alleTerninger[i] * 3;
                sum = score;
              }
        }

        }else if (regelBeskrivelse === "firelike") {
            let score = 0;
            for (let i = 0; i < alleTerninger.length - 2; i++) {
              if (alleTerninger[i] === alleTerninger[i + 1] && alleTerninger[i + 2] && alleTerninger[i + 3]) {
                score = alleTerninger[i] * 4;
                sum = score;
              }
        }
            
        } else if (regelBeskrivelse === "litenstraight") {
            alleTerninger = alleTerninger.sort((a, b) => a - b);
            let temp = new Set(alleTerninger);
            if (Array.from(temp).join("") === "12345") {
              sum = 15;
            }
          }
        else if (regelBeskrivelse === "storstraight") {
            alleTerninger = alleTerninger.sort((a,b) => a - b);
            let temp = new Set(alleTerninger)
            if(Array.from(temp).join("") === "23456"){
                sum = 20;
            }
            
        }
        else if (regelBeskrivelse === "fulthus") {
            alleTerninger.sort((a, b) => a- b);
            let harPar = false;
            let harTreLike = false;
            for (let i = 0; i < alleTerninger.length - 1; i++) {
                if (alleTerninger[i] === alleTerninger[i + 1]) {
            harPar = true;
            alleTerninger.splice(i, 2);
                break;
            } else if (i < alleTerninger.length - 2 && alleTerninger[i] === alleTerninger[i + 1] && alleTerninger[i] === alleTerninger[i + 2]) {
                harTreLike = true;
                  alleTerninger.splice(i, 3);
                  break;
                }
              }
            }
        else if(regelBeskrivelse === "sjangse"){

            alleTerninger = alleTerninger.sort((a,b) => b - a);
            for (let sjangse = 0; sjangse < beholdtTerninger.length; sjangse++ ){
                sum+= beholdtTerninger[sjangse];
            }

        }
        else if (regelBeskrivelse === "yatzee"){

        alleTerninger = alleTerninger.sort((a,b) => b - a);
        let terning = alleTerninger.shift();
        if(terning === alleTerninger[0] && terning === alleTerninger[1] && terning === alleTerninger[2] && terning === alleTerninger[3] && terning === alleTerninger[4]){
        sum = 50;
        }

    }
}
    if (yatzyArk.overeDel[regelBeskrivelse]) {
        yatzyArk.overeDel[regelBeskrivelse].value = sum;
    } else {
        yatzyArk.nedreDel[regelBeskrivelse].value = sum;
    }
    console.clear();
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
    let sumOvere = 0;
    let sumNedre = 0;
    for (let regel of Object.keys(yatzyArk.overeDel)) {
        sumOvere += yatzyArk.overeDel[regel].value;
    } 
    for (let regel of Object.keys(yatzyArk.nedreDel)) {
        sumNedre += yatzyArk.nedreDel[regel].value;
    }
    let totalScore = sumOvere + sumNedre;
    console.log(`Sum Øvredel  : ${formaterResultat(sumOvere)}`);
    console.log(`Sum Nedredel  : ${formaterResultat(sumNedre)}`);
    return totalScore;
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
    console.log(`tre like  : ${formaterResultat(ark.nedreDel.trelike.value)}`);
    console.log(`fire like  : ${formaterResultat(ark.nedreDel.firelike.value)}`);
    console.log(`liten straight  : ${formaterResultat(ark.nedreDel.litenstraight.value)}`);
    console.log(`stor straight  : ${formaterResultat(ark.nedreDel.storstraight.value)}`);
    console.log(`Fult hus  : ${formaterResultat(ark.nedreDel.fulthus.value)}`);
    console.log(`Sjangse  : ${formaterResultat(ark.nedreDel.sjangse.value)}`);
    console.log(`Yatze  : ${formaterResultat(ark.nedreDel.yatzee.value)}`);
    kalkulerSumAvArk();
    console.log("---------------------");


}

function evaluereSlutt(){
    let SpillFerdig = true;
    for (const key in yatzyArk.overeDel) {
        if (yatzyArk.overeDel[key].value == -1) {
            SpillFerdig = false;
            break;
        }
    }
    for (const key in yatzyArk.nedreDel) {
        if (yatzyArk.nedreDel[key].value == -1) {
            SpillFerdig = false;
            break;
        }
    }
    if (SpillFerdig) {
        console.log(value);
    }
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