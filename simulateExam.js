/*
SPEC 4 : imports a GIFT file and simulates an exam
*/

const { createReadlineInterface } = require('./secondaryFunctions');
const { removeHtmlTags } = require('./secondaryFunctions');
const fs = require('fs');
const readline = require('readline');

const titleRegex = /^::(.*?)::/;

function removeCommentLines(input) {
    const lines = input.split('\n');
    const filteredLines = lines.filter(line => !line.trim().startsWith('//'));
    return filteredLines.join('\n');
}

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
    let tableau = [];

    input = removeHtmlTags(input);

    // Vérifier et extraire les correspondances pour "~="
    const regexTildeEqual = /~=\s*([^~}=]+)(?=\s*$|[~}=])/g;
    let match;
    while ((match = regexTildeEqual.exec(input)) !== null) {
        tableau.push(match[1].trim());
    }

    // Vérifier et extraire les correspondances pour "="
    const regexEqual = /=\s*([^~}=]+)(?=\s*$|[~}=])/g;
    while ((match = regexEqual.exec(input)) !== null) {
        tableau.push(match[1].trim());
    }

    return tableau;
}

function loadQuestionsFromOneFile(filePath) {
    let allQuestions = [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\uFEFF|\u200B/g, ''); // Normaliser les sauts de ligne et nettoyer les caractères invisibles
    let questions = removeCommentLines(normalizedContent);
    questions = questions.split(/\n\n+/); // Sépare les questions
    const cleanedQuestions = questions.map(q => q.trim());
    allQuestions = allQuestions.concat(cleanedQuestions.filter(q => q.startsWith('::'))); // Filtre et ajoute les questions valides
    return allQuestions;
}

function parseQuestion(question) {
    const match = question.match(titleRegex);
    if (!match) {
        return {
            title: '',
            response: question.trim(),
            correctResponse: "unknown"
        };
    }

    var title = match[1].trim();
    const cleanedTitle = removeHtmlTags(title);
    let response;
    let allResponses;

    response = question.replace(titleRegex, '').trim();
    allResponses = removeHtmlTags(response);
    allResponses = getAllResponses(allResponses);
    allResponses = allResponses.replace(/.*\{([^}]*)\}.*/g, "$1");
    allResponses = allResponses.replace(/~/g, "").replace(/=/g, "");

    let correct = getCorrectAnswer(response);
    correct = correct.map(item => item.replace(/~/g, "").replace(/=/g, ""));
    if (correct == '') {
        correct = "unknown";
    }

    question = removeHtmlTags(question);
    question = question.replace(/::.*?::/g, "");
    question = question.replace(/\{([^}]*)\}/g, "...");

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
        console.log('\n' + '\x1b[34m========== Exam Simulation Start ==========\x1b[0m');
        let i = 0;
        const studentAnswers = [];
        let correctCount = 0;
        let unknowknCount = 0;
        for (const question of allQuestions) {
            const answer = parseQuestion(question);
            if (question.includes('.0')) {
                let consigne = question.replace(titleRegex, '').trim();
                consigne = consigne.replace(/.*\{([^}]*)\}.*/g, "$1");
                consigne = removeHtmlTags(consigne);
                console.log('\n' + '\x1b[33m===== Instruction =====\x1b[0m');
                console.log(consigne + '\n');
            } else {
                allResponses.push(answer.response);
                allQuestion.push(answer.question);
                allTitles.push(answer.title);
                allCorrectResponses.push(answer.correctResponse);
                console.log(`\x1b[4mQuestion ${i + 1}:\x1b[0m \x1b[3m${answer.title}\x1b[0m\n${answer.question} ${answer.response}`);
                if (answer.response[0] == '~') {
                    console.log(`\x1b[4mPropositions :\x1b[0m ${answer.response}`);
                }
                const studentAnswer = await new Promise(resolve => rl.question("Enter your answer: \x1b[0m", resolve));
                studentAnswers.push(studentAnswer.trim());
                if (studentAnswer == answer.correctResponse) {
                    correctCount++;
                    console.log("\x1b[32mCorrect answer!\x1b[0m \n\n");
                } else if (answer.correctResponse == "unknown") {
                    unknowknCount++;
                    console.log("\x1b[90mThe answer needs to be corrected by the teacher!\x1b[0m \n\n");
                } else {
                    console.log(`\x1b[31mWrong answer!\x1b[0m The Correct answer was : \x1b[1m${answer.correctResponse}\x1b[0m\n\n`);
                }
                i++;
            }
        }
        console.log("\n\n");
        console.log("========== Exam Simulation Resume ==========");
        console.log(`Total number of questions : ${allQuestions.length}`);
        console.log(`Correct answers : ${correctCount}`);
        console.log(`Wrong answers : ${allQuestions.length - correctCount}`);
        console.log(`Answers to be verified by a teacher : ${unknowknCount}`);
        console.log(`Your score is at least : ${correctCount / allQuestions.length * 20} / 20`);


        rl.close();
    });
}

module.exports = { simulateExam };