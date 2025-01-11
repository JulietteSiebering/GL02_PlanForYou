/*
SPEC 4 : imports a GIFT file and simulates an exam
*/

const { isEmpty } = require('vega-lite');
const { createReadlineInterface } = require('./secondaryFunctions');
const { removeHtmlTags } = require('./secondaryFunctions');
const fs = require('fs');
const readline = require('readline');
const { table } = require('console');

const titleRegex = /^::(.*?)::/;

function removeCommentLines(input) {
    const lines = input.split('\n');
    const filteredLines = lines.filter(line => !line.trim().startsWith('//'));
    return filteredLines.join('\n');
}

function getAllResponses(input) {
    // Utilise une expression régulière pour capturer tout ce qui est entre {}
    const matches = input.match(/\{([^}]*)\}/g);
    // Si des correspondances sont trouvées, on les rejoint en une seule chaîne
    if (matches) {
        return matches.join(''); // Joindre tous les éléments capturés entre les accolades
    } else {
        return ''; // Retourner une chaîne vide si aucune correspondance n'est trouvée
    }
}

function getCorrectAnswer(input) {
    let tableau = [];
    input = removeHtmlTags(input);

    // Vérifier et extraire les correspondances pour "="
    const regexEqual = /=\s*([^~}=]+)(?=\s*$|[~}=])/g;
    let match;
    while (((match = regexEqual.exec(input)) !== null)) {
        tableau.push(match[1].trim());
    }

    // si tableau vide, essayer de voir si c'est du vrai-faux
    const regexTF = /\{([^}]*)\}/g;
    if (isEmpty(tableau)) {
        input = String(input);
        while ((match = regexTF.exec(input)) !== null) {
            if ((match == "{T},T" || match == "{TRUE},TRUE")) {
                tableau.push("true");
            } else if ((match == "{F},F" || match == "{FALSE},FALSE")) {
                tableau.push("false");
            }
        }
    }
    return tableau;
}

// Détecte le type de question à partir de son contenu
function detectQuestionType(question) {
    if (question.includes('{')) {
        let allResponses = removeHtmlTags(question);
        allResponses = getAllResponses(allResponses);
        if (allResponses) {
            if (allResponses.includes('#')) {
                return 'Réponse numérique';
            } else if (allResponses.includes('->')) {
                return 'Appariement'
            } else if (allResponses.includes('~')) {
                if (question.match(/}\s*(\S+)/)) {
                    return 'Mot manquant';
                } else {
                    return 'Choix multiple';
                }
            } else if (allResponses.includes('T') || allResponses.includes('F') || allResponses.includes('TRUE') || allResponses.includes('FALSE')) {
                return 'Vrai-faux';
            } else if (allResponses.includes('=')) {
                return 'Réponse courte';
            } else {
                return 'Composition';
            }
        }
    }
    return 'Inconnu';
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
    const title = match[1].trim();
    const cleanedTitle = removeHtmlTags(title);
    let response = question.replace(titleRegex, '').trim();
    let allResponses = removeHtmlTags(response);
    allResponses = getAllResponses(allResponses);

    allResponses = allResponses.replace(/.*\{([^}]*)\}.*/g, "$1");
    allResponses = allResponses.replace(/~/g, " ~ ");
    allResponses = allResponses.replace(/=/g, "");
    
    let correctAnswers = getCorrectAnswer(response);
    let nbGoodAns = correctAnswers.length;
    if (isEmpty(correctAnswers)) {
        correctAnswers = "unknown";
    }
    question = removeHtmlTags(question);
    question = question.replace(/::.*?::/g, "");
    question = question.replace(/\{([^}]*)\}/g, "...");
    
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
        console.log("\x1b[34m========== Exam Simulation Start ========== \x1b[0m");
        let i = 0;
        const studentAnswers = [];
        let consigneCount = 0;
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
                consigneCount++;
            } else {
                allResponses.push(answer.response);
                allQuestion.push(answer.question);
                allTitles.push(answer.title);
                allCorrectResponses.push(answer.correctResponse);
                console.log(`\x1b[4mQuestion ${i + 1}:\x1b[0m \x1b[3m${answer.title}\x1b[0m \n${answer.question}`);

                let processed = false;

                if (answer.nbCorrectAnswer === 1) {
                    if (answer.response[1] === '~') {
                        console.log(`\x1b[1mPropositions :\x1b[0m${answer.response}`);

                        const studentAnswer = await new Promise(resolve => rl.question("Enter your answer: ", resolve));
                        studentAnswers.push(studentAnswer.trim());

                        if (studentAnswer === answer.correctResponse[0]) {
                            correctCount++;
                            console.log("\x1b[32mCorrect answer ! \x1b[0m \n\n");
                        } else {
                            console.log(`\x1b[31mWrong answer ! \x1b[0mThe Correct answer was : ${answer.correctResponse} \x1b[0m \n\n`);
                        }

                        processed = true; // Indiquer que cette section a été traitée
                    }

                    else {
                        let studentAnswer = await new Promise(resolve => rl.question("Enter your answer: ", resolve));
                        studentAnswers.push(studentAnswer.trim());
                        // Pour les vrai-faux
                        if (String(studentAnswer) == "T" || String(studentAnswer) == "TRUE" || String(studentAnswer) == "t" || String(studentAnswer) == "yes" || String(studentAnswer) == "YES" || String(studentAnswer) == "y" || String(studentAnswer) == "Y" || String(studentAnswer) == "V" || String(studentAnswer) == "VRAI" || String(studentAnswer) == "v" || String(studentAnswer) == "vrai" || String(studentAnswer) == "O" || String(studentAnswer) == "OUI" || String(studentAnswer) == "o" || String(studentAnswer) == "oui") {
                            studentAnswer = "true";
                        } else if (String(studentAnswer) == "F" || String(studentAnswer) == "FALSE" || String(studentAnswer) == "f" || String(studentAnswer) == "no" || String(studentAnswer) == "NO" || String(studentAnswer) == "n" || String(studentAnswer) == "N" || String(studentAnswer) == "FAUX" || String(studentAnswer) == "faux" || String(studentAnswer) == "N" || String(studentAnswer) == "NON" || String(studentAnswer) == "n" || String(studentAnswer) == "non" || String(studentAnswer) == "nah bro") {
                            studentAnswer = "false";
                        }

                        if (studentAnswer === answer.correctResponse[0]) {
                            correctCount++;  // Si la réponse de l'étudiant correspond à une des réponses correctes
                            console.log("\x1b[32mCorrect answer! \x1b[0m \n\n");
                        } else {
                            console.log("\x1b[31mWrong answer. \x1b[0m ");
                            console.log(`Here is what you should have written : \x1b[1m${answer.correctResponse} \x1b[0m \n\n`);
                        }

                        processed = true;
                        check = true
                    }
                }

                if (answer.nbCorrectAnswer > 1) {
                    const studentAnswer = await new Promise(resolve => rl.question("Enter your answer: ", resolve));
                    studentAnswers.push(studentAnswer.trim());

                    let check = false;
                    for (let i = 0; i < answer.nbCorrectAnswer; i++) {
                        if (studentAnswer === answer.correctResponse[i]) { // Si la réponse de l'étudiant correspond à une des réponses correctes
                            correctCount++;
                            console.log("\x1b[32mCorrect answer ! \x1b[0m \n\n");
                            check = true;
                        }
                    }
                    if (!check) {
                        console.log("\x1b[31mWrong answer! \x1b[0m ");
                        console.log("Here are the answers that would have been correct : ")
                        for (let i = 0; i < answer.nbCorrectAnswer; i++) {
                            console.log(`\x1b[1m- ${answer.correctResponse[i]}\x1b[0m`);
                        }
                        console.log("\n\n")
                    }
                }

                else if (answer.correctResponse === "unknown") {
                    const studentAnswer = await new Promise(resolve => rl.question("Enter your answer (\x1b[3mthis type of questions can't be automaticaly corrected\x1b[0) : ", resolve));
                    studentAnswers.push(studentAnswer.trim());
                    unknowknCount++;
                    console.log("\x1b[90mThe answer needs to be corrected by the teacher. \x1b[0m \n\n");
                }
                i++;
            }
        }
        console.log("\n\n");
        console.log("\x1b[34m========== Exam Simulation Resume ==========\x1b[0m");
        console.log(`Total number of questions : ${allQuestions.length - consigneCount}`);
        console.log(`\x1b[32mCorrect answers : ${correctCount}`);
        console.log(`\x1b[31mWrong answers : ${allQuestions.length - correctCount - consigneCount - unknowknCount}`);
        console.log(`\x1b[33mAnswers to be verified by a teacher : ${unknowknCount}\x1b[0m`);
        let scoreMin = correctCount / allQuestions.length * 20;
        let scoreMax = (correctCount + unknowknCount) / allQuestions.length * 20;
        console.log(`Your score is between : ${scoreMin.toFixed(2)} / 20 (${correctCount} / ${allQuestions.length}) and ${scoreMax.toFixed(2)} / 20 (${correctCount + unknowknCount} / ${allQuestions.length})`);


        rl.close();
    });
}

module.exports = { simulateExam };