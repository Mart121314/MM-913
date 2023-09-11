
const id = "University";
const description = "The passion for adventure often leads us onto the path of perils and hazards, and a few student members have bitten off a little more than they could chew... You finally arrive at the University; you approach some teachers.";


const teachers = {}
teachers.status = "Angry";
teachers.talkCount = 0;
teachers.talk = {};
teachers.talk.statusIdle = "Getting kicked makes them very very angry";
teachers.talk.statusAngry = "Yeah you better run.";
teachers.talk.statusEnraged = "They charge after you!";
teachers.talk.effect = (target, playerInput, location,player,changeLocation) => {
    target.kickCount += 1;
    target.status = "Very Angry"
    if(target.kickCount >= 3){
        target.status = "Enraged";
        player.hitPoints -= 1;
    }
}

const item = {
    id:"magicitem",
    description:"A item that is made of a compund so dark it drains the light around it.",
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
        item,
        teachers,
        window,
    }
}