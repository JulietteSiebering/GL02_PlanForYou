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

function loadQuestionsFromOneFile(filePath) {
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
    allResponses = allResponses.replace(/~/g, " ~ ");
    let correctAnswers = getCorrectAnswer(response);
    correctAnswers = correctAnswers.replace(/~/g, "");
    correctAnswers = correctAnswers.replace(/}/g, "");
    let nbGoodAns = (correctAnswers.match(/=/g) || []).length;
    //console.log(`Nb bonnes réponse : ${nbGoodAns}`);
    let goodAnswers = correctAnswers;
    if (nbGoodAns > 1) {
        correctAnswers = []
        for (let index = 0; index <nbGoodAns; index++) {
            let index1 = goodAnswers.lastIndexOf('=');

            let part1 = goodAnswers.slice(index1);
            goodAnswers = goodAnswers.slice(0,index1);
            part1 = part1.replace(/=/, '-');
            correctAnswers.push(part1)
        }
    }
    else {
        correctAnswers = correctAnswers.replace(/=/, '-')
    }
    if (correctAnswers === '') {
        correctAnswers = "unknown";
    }
    allResponses = allResponses.replace(/=/g, " ");
    question = question.replace(/::.*?::/g, "");
    question = question.replace(/{.*?}/g, "...");
    question = removeHtmlTags(question);
    return {
        title: cleanedTitle.trim() + ' ',
        response: allResponses,
        correctResponse: correctAnswers,
        question: question,
        nbCorrectAnswer: nbGoodAns
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

            let processed = false;

            if (answer.nbCorrectAnswer === 1) {
                if (answer.response[1] === '~') {
                    console.log(`Propositions : ${answer.response}`);

                    const studentAnswer = await new Promise(resolve => rl.question("Enter your answer: ", resolve));
                    studentAnswers.push(studentAnswer.trim());

                    let studAns = '-' + studentAnswer;
                    if (studAns === answer.correctResponse) {
                        correctCount++;
                        console.log("Correct answer! \n\n");
                    } else {
                        console.log(`Wrong answer! The Correct answer was : ${answer.correctResponse.replace(/-/,'')}\n\n`);
                    }

                    processed = true; // Indiquer que cette section a été traitée
                }

                else if (answer.correctResponse[0] === '-') {
                    const studentAnswer = await new Promise(resolve => rl.question("Enter your answer: ", resolve));
                    studentAnswers.push(studentAnswer.trim());
    
                    let studAns = '-' + studentAnswer;
                    if (studAns === answer.correctResponse) {
                        correctCount++;  // Si la réponse de l'étudiant correspond à une des réponses correctes
                        console.log("Correct answer!\n\n");
                    } else {
                        console.log("Wrong answer.");
                        console.log(`Here is what you should have written : ${answer.correctResponse.replace(/-/,'')}`);
                    }
    
                    processed = true;
                    check = true
                }
            }

            if (answer.nbCorrectAnswer>1) {
                const studentAnswer = await new Promise(resolve => rl.question("Enter your answer: ", resolve));
                studentAnswers.push(studentAnswer.trim());

                let check = false;
                for (let i = 0; i < answer.correctResponse.length; i++) {
                    let ans = answer.correctResponse[i].trim();
                    let studAns = '-' + studentAnswer;
                    if (studAns === ans) { // Si la réponse de l'étudiant correspond à une des réponses correctes
                        correctCount++;  
                        console.log("Correct answer!\n\n");
                        check = true;
                    }
                }
                if (!check){
                    console.log("Wrong answer!");
                    console.log("Here are the answers that would have been correct :")
                    for (let i = 0; i < answer.correctResponse.length; i++) {
                        console.log(`${answer.correctResponse[i]}`);
                    }
                }
            }

            else {
                if (answer.correctResponse === "unknown") {
                    unknowknCount++;
                    console.log("The answer needs to be corrected by the teacher! \n\n");
                }
            }
            i++;
        }
        console.log("\n\n");
        console.log("========== Exam Simulation Resume ==========");
        console.log(`Total number of questions : ${allQuestions.length}`);
        console.log(`Correct answers : ${correctCount}`);
        console.log(`Wrong answers : ${allQuestions.length - correctCount - unknowknCount}`);
        console.log(`Answers to be verified by a teacher : ${unknowknCount}`);
        let scoreMin = correctCount / allQuestions.length * 20;
        let scoreMax = (correctCount + unknowknCount) / allQuestions.length * 20;
        console.log(`Your score is between : ${scoreMin.toFixed(2)} / 20 (${correctCount} / ${allQuestions.length}) and ${scoreMax.toFixed(2)} / 20 (${correctCount + unknowknCount} / ${allQuestions.length})`);


        rl.close();
    });
}

module.exports = { simulateExam };