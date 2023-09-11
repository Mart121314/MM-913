//#region
import * as readlinePromises from "node:readline/promises";
const rl = readlinePromises.createInterface({
  input: process.stdin,
  output: process.stdout
});
//#endregion

// Importing locations  
import start from "./locationStart.mjs";
import hallway from "./locationHallway.mjs";
import {SPLASH_SCREEN } from "./splashscreen.mjs";
import University from "./The University.mjs";
// creating a list of locations (first item should always be the starting location of your game)
const game_locations = [
    start,
    hallway,
    University
];


// list of commands the user can use.


const COMMANDS = [
    "q",
    "kick",
    "talk",
    "take",
    "use",
    "go",
    "help",
    "inventory",
    "description",
]

// Holder rede på det som skal "sies" tilbake til spilleren hver runde 
let feedbackToPlayer;

// Hold rede på det spilleren har forsøkt å gjøre
let playerCommand;

// Hold rede på all informasjonen om spilleren. 
let player = {
    hitcount : 2,
    inventory:[]
}

let currentLocation = game_locations[0]; // Hvor befinner spilleren seg akkurat nå

let isPlaying = true; // Så lenge denne er true så vill spillet fortsette å kjøre.

async function updateGame(){

    // Vi tar ut standard beskrivelsen for lokasjonen vi finner oss på.
    feedbackToPlayer = currentLocation.description;

    // Har spilleren angitt en kommando?
    if(playerCommand){
        // Vi ser etter om spilleren har forsøkt å gjøre noe med "noe"
        const target = currentLocation.subjects[playerCommand.subject];
        // Nå må vi avgjøre 2 ting.
        // 1. Fantest den tingen spilleren prøvede å gjøre noe med "target"
        // 2. Kan man gjøre det spilleren ønsker med "target", dvs finnes det en kommando for det?
        if(target && target[playerCommand.command]){ 
            // Både 1 & 2 var sann så vi kan nå hente ut beskrivelsen for hva som skjer.
            // beskrivelsen ligger lagret i en variabel som altid starter med status og ender mes statusen som "target" har.
            // eks dersom target er door og status til door er "Closed" så blir statusId statusClosed
            const statusId = `status${target?.status}`
            feedbackToPlayer = target[playerCommand.command][statusId]; // her henter vi selve beskrivelsen 
            // En handling mot et "target" ønsker vi somregel at skal ha en effekt, det kan vi nå få til ved å kjøre
            // funksjonen "effect" på target. Vi sender samtidig med info som kan være nyttig å kjenne til i denne funksjonen.
            // effect er en funksjon som skal eksistere på dette nivået.
            target[playerCommand.command].effect(target,playerCommand,currentLocation,player,changeLocation);
        } 
        // Dersom target ikke lar seg påvirke av det spilleren prøvede å gjøre eks open, kick etc 
        // Så har vi muligheten til å se etter en standard respons fra target.
        else if (target && target.default) { 
            // target fantes og det har en standard respons. 
            // Vi forteller spilleren først at det de forsøkte på gjore ingen ting og så legger vi med responsen fra target.
            feedbackToPlayer = `${playerCommand.raw}. Does nothing\n${target.default.description}`;
            // default responsen kan også (valgfritt) føre til en endring.
            // Men fordi det ikke er påkrevd med en effect funksjon her, så må vi sjekke at den finnes før vi kjører den.
            if(target.default.effect){
                target.default.effect(target,playerCommand,currentLocation,player,changeLocation);
            }
        }
        // I alle andre tilfeller, altså at spillet vårt ikke skjønner hva spilleren har prøvd å si. 
        else {
            
            feedbackToPlayer = `${playerCommand.raw}. Does nothing`;
        }
    }
    
    // Skriv ut responsen fra spillet
    log(feedbackToPlayer);
    
    // Vent på ny respons.  

    playerCommand = await takeCommandFromUser();

    // retunerer en true/false verdi for å indikere om spillet fortsatt pågår.
    return playerCommand.command != "q";
}

async function takeCommandFromUser(){
    let playerInput = await rl.question("> ");
    playerInput = cleanUserInput(playerInput);
    let command = extractCommand(playerInput);
    let subject = extractSubject(playerInput, Object.keys(currentLocation.subjects));
    
    if (command === "help"){
        help();
    }
    if (command === "inventory"){
        myInventory();
    }

    return {command, subject, raw:playerInput};
}

function extractSubject(userInput, possibleTargets){
    let output = undefined;
    const sentance = userInput.split(" ");

    for(let word of sentance){
        for(let target of possibleTargets){
            if(word === target){
                output =  target;
                break;
            }
        }
    }

    return output;
}

function myInventory(){
    for (let i = 0; i < player.inventory.length; i++){
       console.log(player.inventory[i])
    }
   }

function help() {
    console.log("The available commands are:");
    for (let command of COMMANDS) {
        console.log(command);
    }
}

function extractCommand(userInput){
    let output = undefined;
    const sentance = userInput.split(" ");

    for(let word of sentance){
        for(let command of COMMANDS){
            if(word === command){
                output =  command;
                break;
            }
        }
    }

    return output;
}

function findLocation(locationID){
    return game_locations.find((location) => { return location.id === locationID})
}

function cleanUserInput(sourceInput){
    return sourceInput.trim().toLowerCase();
}

function changeLocation(locationID) {
    const newLocation = findLocation(locationID);
    if(newLocation){
        currentLocation = newLocation;
        feedbackToPlayer = `${feedbackToPlayer}\n${currentLocation.description}` ;
    } else{
        console.error("Error: no location with id " + locationID);
    }
}

log(SPLASH_SCREEN.join(""));

while(isPlaying){
    isPlaying = await updateGame();
}

process.exit();

function log(tekst, isError) {
    if (!isError) {
        console.log(tekst);
    } else {
        console.error(tekst);
    }
}


