// Common setup 
const id = "University";
const description = "You are in the principle's office, there's the principle, and Rune the Lightbringer. You have to defeat the principle to finally get your grades.";

// Creating "Things for the room " ----------------------------------------------------------------
const runeTheLightBringer = {}
runeTheLightBringer.status = "blissful";
runeTheLightBringer.kickCount = 0;
runeTheLightBringer.kick = {};
runeTheLightBringer.kick.statusIdle = "Getting kicked makes them very very angry";
runeTheLightBringer.kick.statusAngry = "Yeah you better run.";
runeTheLightBringer.kick.statusEnraged = "They charge after you!";
runeTheLightBringer.kick.effect = (target, playerInput, location,player,changeLocation) => {
    target.kickCount += 1;
    target.status = "Very Angry"
    if(target.kickCount >= 3){
        target.status = "Enraged";
        player.hitPoints -= 1;
    }
}

const key = {
    id:"magicKey",
    description:"A key that is made of a compund so dark it drains the light around it.",
    worksWith:"evilDoor",
    status:"OnFloor",
    take:{
        statusOnFloor:"You pick up the key and put it in your pocket",
        statusPocket:"You have allready taken the key",
        effect: (subject, playerInput, location,player,changeLocation) => { 
            subject.status = "Pocket"
            player.inventory.push({id:subject.id, description:subject.description, worksWith:subject.description.worksWith})
        }
    },
    use:{
        default:{
            description:"Some smart student needs to figure out how this is going to work 😉",
            effect: (subject, playerInput, location,player,changeLocation) => { }
        }
    }

}

const principleDoor = {
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
                changeLocation("hallway");
            }
        }
    }

}

const desk = {
    status:"Broken",
    default:{
        description:"There is a bit of borken glass and a suprizing amout of blood",
        effect: (subject, playerInput, location,player) => { }
    }
}

// Exporting the location (the structure is important)

export default { 
    id,
    description,
    subjects:{
        key,
        students,
        door,
        desk,
    }
}