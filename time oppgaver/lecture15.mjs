// 1 Variabler ...
let mmRegnIBergenILopetAvEnDag = 999999;

const TYNGDEKRAFT = 9.81;

const currentUser = "christian.sminsen@uia.no"

const isStudent = true;

// 2 Lister.

const studenter = ["Christian", "Tony"];
console.log(studenter[1]); Tony

studenter[99] = "B.K";
console.log(studenter)

const oppslag =  {
    godFrukt:"Epler",
}

console.log(oppslag["godFrukt"])

// 3 Conditionals
// dersom -> if

(sant = usant)

const mittNavn = "Christian"
const brukerNavn = "Tony"

    usant
     (2 ===3)
     if(mittNavn === brukerNavn){
        console.log("Hei Christian")
    }
    
if(true === false){
    console.log("Hei Christian")
} else if(brukerNavn === "Tony"){
    console.log("Hei Tony");
}
else if(brukerNavn === "Rune"){
    console.log("Yepp Rune, gått deg vill?");
}
else{
    console.log("Ha deg vekk ditt spøkelse");
}

// 4 Løkker

//const frukter = ["Epler", "Appelsiner", "Bananer"];

//for(let i = 0; i < frukter.length; i++){
   // console.log((i+1) + "." +frukter[1]);
//}

//for(const frukt of frukter){
 //   console.log(frukt);
//}
//for(const index in frukter){
  //  console.log(index +1  + "." + frukter[index]);
//}
// if løkke.
 //while(true){

// }
// let tall = "1";
// let tall2 = parseInt(tall) + 2; 
//let tall2 = tall * 1 +2;
// console.log(tall2); //

// Funksjoner 

//let hypotenus = math.sqrt(katet**2 + katet2**2);

//function avstandMellom(kat1,kat2){
  //  let tall =Math.random();
  //  return Math.sqrt(katet**2 + katet2**2); //
//}





const ORD = ["Eple", "Kanarifugl", "Syltetøy", "Båt", "Lastebil", "Student"];
// const spillOrd = Math.floor(Math.random() * ORD.length-1)+1; //
const ord = trekkTilfeldigFraListe(ORD).toLowerCase();
const bokstaver = ord.split("");
let alleBokstaver = ord.split();

const MAKS_FORSOK = 9;
let feil= [];
let isPlaying = true;

log("GANGMAN\n\n\n\r");
let output = [];
for(const b in bokstaver){
    output.push("_");
}

log("Hei, jeg har et ord på " + bokstaver.length);

while(isPlaying){
    const spillersGjetning = (await rawListeners.question("Gjett en bokstav :")).toLowerCase();
    vurderSvar(spillersGjetning);
    log(output.join( " "));
    log("Feil gjetninger " + feil.join("."));

    if(antallGjetningerGjennomført === MAKS_FORSOK){
        isPlaying = false;
        log("Game Over");
    } else if(output.join("") === ord){
        
    }

log(output.join( " "));
}


// Hjelpefunksjoner ---------------------------------

function log(msg){
    console.log(msg);
}

function vurderSvar(svar){
    if(ord.indexOf(svar) !== -1){

        for(const bokstavPlass in bokstaver){
            const bokstav = bokstaver[bokstavPlass].toLowerCase();
            if(bokstav === svar){
                output[bokstavPlass] = svar;
            }
        }
    log("YAAAAAAAY")

    } else{

        feil.push
    }  
}

function trekkTilfeldigFraListe(liste){
    const listeIndex = Math.floor(Math.random() * ORD.length-1)+1;
    return liste[listeIndex]
}



//----------------------------------------------//
function Startup() {
    while(isPlaying){
        const startUp = (await rl.question("Press 1 to play :)  "));
        } if (buttonPress === true){
            log("Hey let us play Rock, Paper, Scissors, Lizard, Spock");
            log(`Your choises are ${POSIBLE_SELECTIONS.R}(R), ${POSIBLE_SELECTIONS.P}(P), ${POSIBLE_SELECTIONS.S}(S), ${POSIBLE_SELECTIONS.L}(L), ${POSIBLE_SELECTIONS.SP}(SP)`);
        }

    spill()

}
startup()

function spill() {
  //Spill innhold her. 

 Kjør startup() innenfra spill() hvis du vil tilbake til Startup()
}