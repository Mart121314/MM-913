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
    status:"Closed",
    workwith: "magicKey",
    use:{
        statusClosed:"........",
        statusOpen:"As you push your key through the door opens up.",
        effect: (subject, playerInput, location,player,changeLocation) => { 
           if (player.currentLocation.subjects[subject.worksWith].status === "Open"){
            log(evilDoor.statusOpen);
            } else(player.currentLocation.subjects[subject.worksWith].status  = "Closed")
           log(evilDoor.statusClosed)
        }
      
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


const window = {
    status: "Broken",
    default: {
        description: "There is a bit of borken glass and a suprizing amout of blood",
        effect: (subject, playerInput, location, player) => { }
    }
}


// Exporting the location (the structure is important)

export default {
    id,
    description,
    subjects:{
        monster,
        evilDoor,
        window
        
    }
}