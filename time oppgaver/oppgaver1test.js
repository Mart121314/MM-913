/*
    Hei.
    Dette er et oppgave sett i MM-912.
    Meningen er å trene på et fåtall ting av gangen. 
    Du gjør dette ved å skrive inn ditt svar etter at en oppgave er gitt (se på eksempelet)
*/

/*
    Oppgave: Eksempel
    Lag en variabel som skal kunne endres. Variabelen skal representer din alder
*/

let myAge = 42;

/*
    Oppgave: A
    Lag en variabel som representerer ditt fornavn.
*/
let myName = "Martin";

/*
    Oppgave: B
    Lag en variabel for å lagre poeng score i et spill
*/
let highScore = 0;

/*
    Oppgave: C
    Øk verdien av variabelen din fra oppgave B med 5 (dvs dersom den var 0 så skal den bli 5)
    NB! Du skal øke verdien, ikke bare sette den til 5 (husk +)
*/
highScore = highScore+5;

/*
    Oppgave: D
    Ta variabelen din fra oppgave B og gjør den 10 ganger større. 
*/
highScore = highScore*10;

/*
    Oppgave: E
    Lag en variabel for å lagre et telefon nummer (bruk et fiktift nummer)
*/
let phoneNumber = 43245656;

/*
    Oppgave: F
    Lag en variabel som representerer hvorvidt du er en student eller ikke.
*/
let student = true;

/*
    Oppgave: G
    Skriv koden som skal til for at det skal stå noe alla "Hei spiller xxxx din score er xx"
    Her skal xxxx være hentet fra variabelen i oppgave A og xx fra variabelen i oppgave B
*/
console.log("Hei spiller", myName,"din score er", highScore);
/*
    Oppgave: H
    Lag en variabel som skal representere høyest oppnåd score i et spill.l
    Set verdien av denne nye variabelen til verdien av variabelen fra oppgave B
*/
let highestScore = highScore;