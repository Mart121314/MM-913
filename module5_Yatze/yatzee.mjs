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

const MAX_TERNING_VERDI = 6;
const MIN_TERNING_VERDI = 1;
const TOTALT_ANTALL_TERNINGER = 5;
const KAST_PER_RUNDE = 3;
const BONUS_GRENSE = 63;
const BONUS = 50;

// Variable to keep a hold of the dices. 
let terninger = kastTerninger(TOTALT_ANTALL_TERNINGER) // This variable is the dices that's being rolled.
let beholdtTerninger = []; // This variable holds the dices that the player has chosen to keep.

// The following is a representation of a yatzee page.
// -1 Means the player hasn't used the dices on that thing.
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


// Now the game starts.
while (true) {
    beholdtTerninger = []; // Before each round has passed we clear the array with kept dices.  
    await spillRunde(); // We let the player roll and keep the dices according to the rules.   
    await evaluerRunde(); // Evaluate the round with the player. 
        evaluereSlutt();
    /// TODO:
    // End the game if the player has finished the entire page.


    // If the game isn't over, wait for the player to be ready to keep playing.  


}

/// TODO: Write the sum of all the points.

//-------------------------------------------------------------------


async function spillRunde() {

    // We set how many rolls the player has this round (3 if no one changed it.) 
    let antallKast = KAST_PER_RUNDE
    // The player should have all the rolls.
    terninger = kastTerninger(TOTALT_ANTALL_TERNINGER);

    // As long as the player has not used all his rolls then the player gets to roll again.
    while (antallKast > 0) {

        // Dices are rolled.
        terninger = await spillerKasterTerning(terninger.length)

        // Result is being shown to the player. 
        console.clear();
        console.log("Du rullet : ");
        console.table(terninger);

        // The player chooses what to keep. 
        await taUtTerningerBasertPaaSpillerValg();

        // Shows the player what's being kept and what's being thrown again.
        console.log("Beholdt : ", beholdtTerninger);
        console.log("Frie terninger: ", terninger);

        // Player rolled a dice.
        antallKast--;

        ///TODO: It may happen that the player wants to keep all the dices. 
        /// If there are no dices left then we dont want to offer the player to re-roll them.

        // If the player still has more rolls then we let the player decide what to do.  
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

    // What rules does the player wish to use these dices for againt? 
    let regelBeskrivelse = await sporeSpillerOmBrukAvTerninger()
    // All dices are being counted not just the ones the player heldt back, so we add them to a new array
    let alleTerninger = [].concat(beholdtTerninger).concat(terninger);

    let sum = 0;
    let regel = yatzyArk.overeDel[regelBeskrivelse];
    // If there was a rule for "Ruledescription" in the upper part of the page. 
    if (regel) {
        // All rules on the upper part of the  page is about adding all of the same value, so we need a loop to hand all the other conveniences
        for (let i = 0; i < alleTerninger.length; i++) {
            const terning = alleTerninger[i];
            if (terning === regel.behold) {
                sum += terning;
            }
        }
        // Since we've done changes to the upper part of the page we can check if there's bonus available. 
        if (kanBonusBeregnes()) {
            let sumOvre = kalkulerSumAvArk();
            if (sumOvre >= BONUS_GRENSE) {
                yatzyArk.bonus = BONUS;
            }
        }


    } else {

        // code to handle the player's wish to use the dices for a pair. 
        if (regelBeskrivelse === "etpar") {
            // sorts the dices such as  [ 3, 2, 5, 2, 5, 1 ] becomes [ 5, 5, 3, 2, 2, 1 ]
            alleTerninger = alleTerninger.sort((a,b) => b - a);
            let par = 0;
            

            // As long as we've found a pair and we have enough dices left
            while (par === 0 || alleTerninger.length > 1) {
                let terning = alleTerninger.shift(); // takes away the first dice.
                if (terning === alleTerninger[0]) { // Check if the  dice we took away is the same as the next one in line.
                    sum = terning * 2; // if yes, then we've found 1 pair
                   
                    par++;
                }
            }
        }
        else if (regelBeskrivelse === "topar") {
            
            ///TODO: Write the code to see if the player has 2 pairs and the sum of it.
            alleTerninger = alleTerninger.sort((a,b) => b - a);
            let toPar = 0;
            while (toPar < 2 && alleTerninger.length >= 2) {
                let terning = alleTerninger.shift();
                if (terning === alleTerninger[0]) {
                    sum += terning * 2;
                    toPar++;
                }
            }


        }  else if (regelBeskrivelse === "trelike") {
            // sorts the dices such as  [ 3, 2, 5, 2, 5, 1 ] becomes [ 5, 5, 3, 2, 2, 1 ]
            alleTerninger = alleTerninger.sort((a,b) => b - a);
            // takes out the first dice
            let terning = alleTerninger.shift(); 
            // checks the dices to see if they're the same as the next two
            if(terning === alleTerninger[0] && terning === alleTerninger[1]){
                sum = terning * 3;
            }

        } 
        else if (regelBeskrivelse === "firelike") {
            alleTerninger = alleTerninger.sort((a,b) => b - a);
            let terning = alleTerninger.shift();
            if(terning === alleTerninger[0] && terning === alleTerninger[1]){
                sum = terning*4;
            }
            
        } else if(regelBeskrivelse === "litenstraight"){

            alleTerninger = alleTerninger.sort((a,b) => a - b);
            let temp = new Set(alleTerninger)
            if(temp.join() === "12345"){
                sum = 15;
            }
        }
        else if (regelBeskrivelse === "storstraight") {
            alleTerninger = alleTerninger.sort((a,b) => a - b);
            let temp = new Set(alleTerninger)
            if(temp.join() === "23456"){
                sum = 20;
            }
            
        }
        else if(regelBeskrivelse === "fulthus"){

            ///TODO: Write code to find out if the player has full house
            alleTerninger = alleTerninger.sort((a,b) => b - a);
            let Par = 0;
            while (Par === 0 || alleTerninger.length > 1) {
                let terning = alleTerninger.shift();
                if (terning === terning*3 && Par) {
                    sum += terning;
                }
            }
            // TIPS: If you've worked your way down here sequentially then you've seen what you need to do here
            // Fult hus er 3 like og 2 like.

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
            if(terning === alleTerninger[0] && terning === alleTerninger[1]){
                sum = terning*5;
            }
            
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
    totalArk();

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
    console.log("---------------------");


}

function totalArk() {


}


function evaluereSlutt(){
    let scorecardComplete = true;
    for (const key in yatzyArk.overeDel) {
        if (yatzyArk.overeDel[key].value == -1) {
            scorecardComplete = false;
            break;
        }
    }
    for (const key in yatzyArk.nedreDel) {
        if (yatzyArk.nedreDel[key].value == -1) {
            scorecardComplete = false;
            break;
        }
    }
    if (scorecardComplete) {
        console.log("Game Over!");
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

