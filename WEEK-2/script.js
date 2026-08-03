const quiz = [
    {
        question: "Which language is used for web page interactivity?",
        options: ["HTML", "CSS", "JavaScript", "Python"],
        answer: "JavaScript"
    },
    {
        question: "Which tag creates a heading?",
        options: ["p", "h1", "img", "a"],
        answer: "h1"
    },
    {
        question: "what does html stand for",
        options: ["Hyper Trainer Marking Language","Hyper Text Markup Language","Hyper Text Marketing Language","High Text Markup Language"],
        answer: "Hyper Text Markup Language"
    },
    {
        question: "Which tag is used to link a website",
        options: ["src", "href", "img", "a"],
        answer: "href"
    },
    {
        question: "which html tag is used to break a line",
        options: ["break", "h1", "br", "src"],
        answer: "br"
    }
];

let index = 0;
let score = 0;
let time = 30;

const question = document.getElementById("question");
const options = document.getElementById("options");
const result = document.getElementById("result");

function loadQuestion() {
    question.innerHTML = quiz[index].question;
    options.innerHTML = "";

    quiz[index].options.forEach(option => {
        options.innerHTML +=
            `<input type="radio" name="ans" value="${option}"> ${option}<br>`;
    });
}

function nextQuestion() {
    const selected =
        document.querySelector('input[name="ans"]:checked');

    if (selected && selected.value === quiz[index].answer) {
        score++;
    }

    index++;

    if (index < quiz.length) {
        loadQuestion();
    } else {
        result.innerHTML =
            "Your Score: " + score + "/" + quiz.length;
        question.innerHTML = "";
        options.innerHTML = "";
    }
}

loadQuestion();

setInterval(function () {
    time--;
    document.getElementById("timer").innerHTML =
        "Time: " + time;

    if (time == 0) {
        result.innerHTML =
            "Time Over! Score: " + score + "/" + quiz.length;
        question.innerHTML = "";
        options.innerHTML = "";
    }
}, 1000);