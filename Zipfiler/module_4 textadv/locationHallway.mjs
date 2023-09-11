const id = "hallway";
const description = "You are inn a hallway, to the left there is utter darkness, to the right there is flickering lights and a monster coming towards you. Remember you can always go back to the start if you want to.";

const monster = {}
monster.status = "Idle";
monster.kickCount = 0;
monster.kick = {};
monster.kick.statusIdle = "The monster grunts";
monster.kick.statusProvoked = "you seem to have provoked the monster, think fast...";
monster.kick.statusDead = "The monster died, and you finally find the evil door.";
monster.kick.effect = (target, playerInput, location,player,changeLocation) => {
    target.kickCount += 1;
    target.status = "Provoked"
    if(target.kickCount >= 3){
        target.status = "Dead";
        player.hitPoints -= 1;
    }
}


const evilDoor = {
    id:"evilDoor",
    description:"The Door looks very evil, perhaps if you had a key that could open it up.",
    worksWith:"magicKey",
    status:"Closed",
    use:{
        statusClosed:"........",
        statusOpen:"As you push your key through the door opens up.",
        effect: (subject, playerInput, location,player,changeLocation) => { subject.status = "Open"}
    },
    go:{
        statusClosed:"......",
        statusOpen:"You leave the room",
        effect:  (subject, playerInput, location,player,changeLocation) => { 
            if(subject.status === "Open"){
                changeLocation("University");
            }
        }
    }

}

const startDoor = {
    status:"Closed",
    kick:{
        statusClosed:"The door is of poor quality and splinters as your foot impacts it.",
        statusOpen:"The door is open, trying to kick it made you fall on your face.",
        effect: (subject, playerInput, location,player,changeLocation) => { subject.status = "Open"}
    },
    go:{
        statusClosed:"You try going through the door, but it is closed so you bump your head.",
        statusOpen:"You leave the room",
        effect:  (subject, playerInput, location,player,changeLocation) => { 
            if(subject.status === "Open"){
                changeLocation("start");
            }
        }
    }

}
    


// Exporting the location (the structure is important)

export default {
    id,
    description,
    subjects:{
        monster,
        evilDoor,
        startDoor
        
    }
}