const id = "start";
const description = "You are standing in a room there is a key on the floor, a door, a window and some students";


const students = {}
students.status = "Idle";
students.kickCount = 0;
students.kick = {};
students.kick.statusIdle = "Getting kicked does not make them happy";
students.kick.statusAngry = "Yeah this is looking bad";
students.kick.statusEnraged = "They get up and kick your ass";
students.kick.effect = (target, playerInput, location,player,changeLocation) => {
    target.kickCount += 1;
    target.status = "Angry"
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
            player.inventory.push({id:subject.id, description:subject.description, worksWith:subject.worksWith})
        }
    },
    use:{
        default:{
            description:"Some smart student needs to figure out how this is going to work 😉",
            effect: (subject, playerInput, location, player, changeLocation) => { 
                subject.status = "Pocket";
                player.inventory.use(magicKey);
                if(player.currentLocation.subjects[subject.worksWith].status === "Open"){
                    changeLocation("University");
                } else (player.currentLocation.subjects[subject.worksWith].status  = "Closed")
                log(evilDoor.statusClosed)
            }
        }
    }

}

const door = {
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

const window = {
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
        window
    }
}