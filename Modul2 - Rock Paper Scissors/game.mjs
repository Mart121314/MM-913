//#region 
import * as readlinePromises from 'node:readline/promises';
import fs from "node:fs"
const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stdout });
//#endregion
const CONMANDS = [
    "north",
    "south",
    "east", 
    "west",
    "q",
    "kick"
];
let game_scenario = [
    {
        id: "Start",
        describe:"You are standing in a classroom there are students and a door and a window...",
        subjects:{
            students:{

            },
            door:{
                status:"Closed",
                kick:{
                    statusClosed:"The door is of poor quality, and it spliters as you kick it.",
                    statusOpen: "The door is open, trying to kick it made you fall over",
                }
            },
            window:{

            }
        } 

    }
];

let isPlaying = true; // så lenge denne er true så vil spillet fortsette å kjøre.
let playercommand = ;
let CurrentSceneIndex = 0;
let currentSceneID = "Start";




let currentScene = game_scenario[CurrentSceneIndex];




// Spill loop kjører igjen og igjen så lenge isPlaying er endret
while(isPlaying){

   isPlaying = await updateGame();


}

process.exit()

// -------------------------- SPILL STARTER HER ------------------------------------------------- //



async function updateGame(){

    // behandle player Command ...
    let output = currentScene.describe;

    if (playercommand && (playercommand.command !== underfined ||[playercommand.subject !==underfined])){
        if (playercommand.command !== underfined){
         const subject = currentScene.subjects[playercommand.subject];
        }
    } else{ 
       if(playercommand.subject !== undefined){
        output = `Doing that to`
    }
    }
    //Oppdatering?
    console.log(game_scenario[CurrentSceneIndex].describe)

    playercommand = await takeCommanFromUser();

    return playercommand!= "q";
}

async function takeCommanFromUser(){

    let playerInput = await rl.question("> ");
    playerInput = cleanUserInput(playerInput);

    // hva er kommandoen?
    // hva er subjektet?
    let command = extractCommand(playerInputer);
    let subject = extractSubject(playerInput,  Object.keys(currentScene.subjects));
    console.log("Command given", command)   
    return playerInput;

}

function extractCommand(userInput, possibleSubjects){

    const sentence = userInput.split(" ");
    for(let word of sentence){
        for(let command of COMMANDS){
            if(word === command){
                output = command;
                break;
            }
        }
    }
    return output;
}


function cleanUserInput(sourceInput){
    return sourceInput.trim().toLowerCase();
}