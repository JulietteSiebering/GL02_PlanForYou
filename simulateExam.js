/*
SPEC 4 : imports a GIFT file and simulates an exam
*/

const { createReadlineInterface } = require('./secondaryFunctions');
const { removeHtmlTags } = require('./secondaryFunctions');
const fs = require('fs');
const readline = require('readline');

function getAllResponses(input) {
    // Utilise une expression régulière pour capturer tout ce qui est entre {}
    const matches = input.match(/\{([^}]*)\}/g);
    const matches2 = input.match(/<b>.*?<\/b>/g);
    // Si des correspondances sont trouvées, on les rejoint en une seule chaîne
    if (matches2) {
        return matches2.join(''); // Joindre tous les éléments capturés entre les accolades
    } else if (matches) {
        return matches.join('');
    } else {
        return ''; // Retourner une chaîne vide si aucune correspondance n'est trouvée
    }
}

function getCorrectAnswer(input) {
    const matches = input.match(/~=(.*?)(~|$|})/g);
    const matches2 = input.match(/=(.*?)(~|$|})/g);
    if (matches) {
        return matches.join('');
    } else if (matches2) {
        return matches2.join('');
    } else {
        return '';
    }
}

function loadQuestionsFromOneFile(filePath){
    let allQuestions = [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const questions = content.split(/\n\n+/); // Sépare les questions
    allQuestions = allQuestions.concat(questions.filter(q => q.startsWith('::'))); // Filtre et ajoute les questions valides
    return allQuestions;
}

function parseQuestion(question) {
    function removeCommentLines(input) {
        const lines = input.split('\n');
        const filteredLines = lines.filter(line => !line.trim().startsWith('//'));
        return filteredLines.join('\n');
    }
    question = removeCommentLines(question);
    const titleRegex = /^::(.*?)::/;
    const match = question.match(titleRegex);
    if (!match) {
        return {
            title: '',
            response: question.trim(),
            correctResponse: "unknown"
        };
    }
    const title = match[1].trim();
    const response = question.replace(titleRegex, '').trim();
    const cleanedTitle = removeHtmlTags(title);
    let allResponses = getAllResponses(response);
    allResponses = removeHtmlTags(allResponses);
    allResponses = allResponses.replace(/.*\{([^}]*)\}.*/g, "$1");
    let correct = getCorrectAnswer(response);
    correct = correct.replace(/~/g, "");
    correct = correct.replace(/=/g, "");
    correct = correct.replace(/}/g, "");
    if (correct == ''){
        correct = "unknown";
    }
    allResponses = allResponses.replace(/=/g, "");
    question = question.replace(/::.*?::/g, "");
    question = question.replace(/{.*?}/g, "...");
    question = removeHtmlTags(question);
    return {
        title: cleanedTitle.trim() + ' ',
        response: allResponses,
        correctResponse: correct,
        question: question
    };
}

async function simulateExam() {

    const rl = createReadlineInterface();
    rl.question('Entrez le chemin du fichier GIFT : ', async (filePath) => {
        const allQuestions = loadQuestionsFromOneFile(filePath);
        let allResponses = [];
        let allQuestion = [];
        let allTitles = [];
        let allCorrectResponses = [];
        console.log("========== Exam Simulation Start ==========");
        let i = 0;
        const studentAnswers = [];
        let correctCount = 0;
        let unknowknCount = 0;
        for (const question of allQuestions) {
            const answer = parseQuestion(question);
            allResponses.push(answer.response);
            allQuestion.push(answer.question);
            allTitles.push(answer.title);
            allCorrectResponses.push(answer.correctResponse);
            console.log(`Question ${i + 1}: ${answer.title}, ${answer.question}`);
            if (answer.response[0] == '~'){
                console.log(`Propositions : ${answer.response}`);
            }
            const studentAnswer = await new Promise(resolve => rl.question("Enter your answer: ", resolve));
            studentAnswers.push(studentAnswer.trim());
            if (studentAnswer == answer.correctResponse) {
                correctCount++;
                console.log("Correct answer! \n\n");
            } else if (answer.correctResponse == "unknown") {
                unknowknCount++;
                console.log("The answer needs to be corrected by the teacher! \n\n");
            } else {
                console.log(`Wrong answer! The Correct answer was : ${answer.correctResponse}\n\n`);
            }
            i++;
        }
        console.log("\n\n");
        console.log("========== Exam Simulation Resume ==========");
        console.log(`Total number of questions : ${allQuestions.length}`);
        console.log(`Correct answers : ${correctCount}`);
        console.log(`Wrong answers : ${allQuestions.length - correctCount}`);
        console.log(`Answers to be verified by a teacher : ${unknowknCount}`);
        console.log(`Your score is at least : ${correctCount/allQuestions.length * 20} / 20`);


        rl.close();
    });
}

module.exports = {simulateExam};