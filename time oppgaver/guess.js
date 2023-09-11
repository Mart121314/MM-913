
let teacherName = "Christian Simonsen";
let teacherAge = 42;
let isTeacherAlive = true; // true eller false 1 (true) eller 0 (false)

console.log(teacherName);
console.log(teacherAge);
console.log(isTeacherAlive);

// dersom lærer er i live 
// Si god morgen ...
// ellers 
// kondolerer ...

if (isTeacherAlive === true){

    // dersom sant -> Si god morgen ...
    console.log("God morgen " + teacherName); 
} else {
    // dersom ikke i live.
    console.log("kondolerer " + teacherName);
}





isTeacherAlive = true;
