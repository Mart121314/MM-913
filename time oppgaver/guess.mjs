import * as readlinePromises from 'node:readline/promises';
const rl = readlinePromises.createInterface({input: process.stdin,output: process.stdout});

const MAX_NUMBER = 100;
const MIN_NUMBER = 1;
const randomNumber = Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER;

let isPlaying = true;

console.log('Guess a number between 1 and 100');

while(isPlaying){
    const answer = await rl.question('Your guess: ');
    const number = parseInt(answer);

    if (number === randomNumber) {
        console.log('You guessed it!');
        isPlaying = false;
    }
    else if (number < randomNumber) {
        console.log('Too low!');
    }   else {  
        console.log('Too high!');
    }
} 


process.exit(0);