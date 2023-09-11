/*
    Hei.
    Dette er et oppgave sett i MM-912.
    Meningen er å trene på et fåtall ting av gangen. 
    Du gjør dette ved å skrive inn ditt svar etter at en oppgave er gitt (se på eksempelet)

    I dette oppgave settet fokuserer vi spesielt på lister, løkker(for) og funksjoner

    IKKE endre på kode som er gitt, med mindre oppgaven spesefikt sier at du skal det
*/

/* -----------------------------------------------------------------------------
    Oppgave: Eksempel
    Skriv koden for å skrive ut alle navnene i listen, et navn per linje
*/
console.log("Oppgave: Eksempel");
const people = ["Tony","Christian","Håkon"]

for(let index = 0; index < people.length; index++){
    let person = people[index+1];
    console.log(person);
}








/* -----------------------------------------------------------------------------
    Oppgave: A
    Du er gitt en listen (Array) med navnet tall.
    Skriv koden som skal til for at variabelen totalt skal inneholde summen av alle tallene i listen (altså tal1 + tall2 + tall3 + tall4 + ..... osv)
*/
console.log("Oppgave: A");

const tall = [1, 2, 3, 4, 5];{
  const sum = 0;
  
  for (let i = 0; i < tall.length; i++) {
    sum += parseInt(tall[i]);
    console.log(sum + sum);
  }
}





/* -----------------------------------------------------------------------------
    Oppgave: B
    Under er en funksjon summer, den er ikke ferdig, den skal retunere summen av tall den får i en liste.
    Din oppgave er å fullføre funksjonen slik at den gjør det.    
*/
console.log("Oppgave: B");

function summer(liste){

    const sum = 0;
  
    for (let i = 0; i < tall.length; i++) {
      sum += parseInt(tall[i]);
      console.log(sum + sum);
      return liste
    }
  }


const summen = summer(tall);

if(summen === 15){
    console.log("🎉 Oppgave B er mest sansynlig riktig");
} else {
    console.log("😱 Oppgave B har noe krøll i seg, men det fikser du 👍");
}







/* -----------------------------------------------------------------------------
    Oppgave: C
    Du er gitt en listen (Array) med navnet andreTall.
    Skriv koden som skal til for at variabelen differans skal inneholde differansen av alle tallene i listen (altså tal1 - tall2 - tall3 - tall4 - ..... osv)
*/
console.log("Oppgave: C");

const andreTall = [6,7,8,9]










/* -----------------------------------------------------------------------------
    Oppgave: D
    Under er en funksjon differansier, den er ikke ferdig, den skal retunere diferansen av tall den får i en liste.
    Din oppgave er å fullføre funksjonen slik at den gjør det.    
*/
console.log("Oppgave: D");


function differansier(liste){

       /* Hva skal stå her ?? */
}


const diff = differansier(andreTall);

if(diff === -18){
    console.log("🎉 Oppgave D er mest sansynlig riktig");
} else {
    console.log("😱 Oppgave D har noe krøll i seg, men det fikser du 👍");
}







/* -----------------------------------------------------------------------------
    Oppgave: E
    Lag en funksjon med navn multipliser, denne funksjonen skal ta imot (ha som parameter) en liste med tall.
    Funksjonen skal retunere produktet av tallene (altså tall1 * tall2 * tall3 * ..... osv)
*/