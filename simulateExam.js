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


// Supprime toutes les lignes qui commencent par "//"
function removeCommentLines(input) {
    const lines = input.split('\n');
    const filteredLines = lines.filter(line => !line.trim().startsWith('//'));
    return filteredLines.join('\n');
}

// Trouve toutes les réponses proposées
function getAllResponses(input) {
    // Utilise une expression régulière pour capturer tout ce qui est entre {}
    const matches = input.match(/\{([^}]*)\}/g);
    // Si des correspondances sont trouvées, on les joint en une seule chaîne
    if (matches) {
        return matches.join(''); // Joindre tous les éléments capturés entre les accolades
    } else {
        return ''; // Retourner une chaîne vide si aucune correspondance n'est trouvée
    }
}

// Trouve la ou les bonne(s) réponse(s)
function getCorrectAnswer(input) {
    let tableau = [];
    input = removeHtmlTags(input);

    // Vérifier et extraire les correspondances pour "="
    const regexEqual = /=\s*([^~}=]+)(?=\s*$|[~}=])/g;
    let match;
    while (((match = regexEqual.exec(input)) !== null)) {
        tableau.push(match[1].trim());
    }

    // Si tableau est vide, essayer de voir si c'est du vrai-faux
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
        // Si il y a des propositions, on regarde par quoi elles commencent pour connaître le type de question
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

// Liste les différentes questions du fichier
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

// Traite les questions pour qu'elles soient affichables
function parseQuestion(question) {    
    const match = question.match(titleRegex);

    // Si la question n'a pas de titre, elle est considéré comme "unknown"
    if (!match) {
        return {
            title: '',
            response: question.trim(),
            correctResponse: "unknown"
        };
    }

    // On enlève les espaces avant et après chaque titre de question, ainsi que les balises html
    // On fait de même pour les propositions
    const title = match[1].trim();
    const cleanedTitle = removeHtmlTags(title);
    let response = question.replace(titleRegex, '').trim();
    let allResponses = removeHtmlTags(response);
    allResponses = getAllResponses(allResponses);

    // On nettoie les propositions
    allResponses = allResponses.replace(/.*\{([^}]*)\}.*/g, "$1");
    allResponses = allResponses.replace(/~/g, " ~ ");
    allResponses = allResponses.replace(/=/g, "");

    // On fait de même avec les questions
    question = removeHtmlTags(question);
    question = question.replace(/::.*?::/g, "");
    question = question.replace(/\{([^}]*)\}/g, "...");
    
    // On trouve la ou les réponse(s) à la question, si elles existent
    let correctAnswers = getCorrectAnswer(response);
    let nbGoodAns = correctAnswers.length;
    if (isEmpty(correctAnswers)) {
        correctAnswers = "unknown";
    }
    
    return {
        title: cleanedTitle.trim() + ' ',
        response: allResponses,
        correctResponse: correctAnswers,
        question: question,
        nbCorrectAnswer: nbGoodAns
    };
}

// Simule un examen
async function simulateExam() {

    const rl = createReadlineInterface();
    rl.question('Entrez le chemin du fichier GIFT : ', async (filePath) => {

        // On récupère les questions du fichier gift et on initialise le reste
        const allQuestions = loadQuestionsFromOneFile(filePath);
        let allResponses = [];
        let allQuestion = [];
        let allTitles = [];
        let allCorrectResponses = [];
        let i = 0;
        const studentAnswers = [];
        let consigneCount = 0;
        let correctCount = 0;
        let unknowknCount = 0;
        console.log("\x1b[34m========== Exam Simulation Start ========== \x1b[0m");
        // Pour chaque question du fichier...
        for (const question of allQuestions) {
            const answer = parseQuestion(question);

            // ... on regarde s'il s'agit d'une consigne ou d'une vraie question
            if (question.includes('.0')) {
                let consigne = question.replace(titleRegex, '').trim();
                consigne = consigne.replace(/.*\{([^}]*)\}.*/g, "$1");
                consigne = removeHtmlTags(consigne);
                console.log('\n' + '\x1b[33m===== Instruction =====\x1b[0m');
                console.log(consigne + '\n');
                consigneCount++;
            } 
            // Si ce n'est pas un consigne...
            else {
                // On remplit les listes de propositions, bonnes réponses, questions et titres
                allResponses.push(answer.response);
                allQuestion.push(answer.question);
                allTitles.push(answer.title);
                allCorrectResponses.push(answer.correctResponse);

                // On affiche la question
                console.log(`\x1b[4mQuestion ${i + 1}:\x1b[0m \x1b[3m${answer.title}\x1b[0m \n${answer.question}`);

                // La question n'est pas traitée
                let processed = false;

                // S'il n'y a qu'une seule bonne réponse...
                if (answer.nbCorrectAnswer === 1) {

                    // ... et qu'elle commence par '~', c'est qu'il s'agit d'une QCM
                    if (answer.response[1] === '~') {
                        console.log(`\x1b[1mPropositions :\x1b[0m${answer.response}`);

                        const studentAnswer = await new Promise(resolve => rl.question("Enter your answer: ", resolve));
                        studentAnswers.push(studentAnswer.trim());

                        // Selon la éponse de l'utilisateur, on met à jour les compteurs et on affiche la solution
                        if (studentAnswer === answer.correctResponse[0]) {
                            correctCount++;
                            console.log("\x1b[32mCorrect answer ! \x1b[0m \n\n");
                        } else {
                            console.log(`\x1b[31mWrong answer ! \x1b[0mThe correct answer was : \x1b[1m${answer.correctResponse} \x1b[0m \n\n`);
                        }

                        processed = true; // Indiquer que cette question a été traitée
                    }

                    else {
                        let studentAnswer = await new Promise(resolve => rl.question("Enter your answer: ", resolve));
                        studentAnswers.push(studentAnswer.trim());
                        // Si la question est de type vrai-faux, on accepte vrai/v/faux/f/oui/o/non/n et leur équivalent anglais
                        if (String(studentAnswer) == "T" || String(studentAnswer) == "TRUE" || String(studentAnswer) == "t" || String(studentAnswer) == "yes" || String(studentAnswer) == "YES" || String(studentAnswer) == "y" || String(studentAnswer) == "Y" || String(studentAnswer) == "V" || String(studentAnswer) == "VRAI" || String(studentAnswer) == "v" || String(studentAnswer) == "vrai" || String(studentAnswer) == "O" || String(studentAnswer) == "OUI" || String(studentAnswer) == "o" || String(studentAnswer) == "oui") {
                            studentAnswer = "true";
                        } else if (String(studentAnswer) == "F" || String(studentAnswer) == "FALSE" || String(studentAnswer) == "f" || String(studentAnswer) == "no" || String(studentAnswer) == "NO" || String(studentAnswer) == "n" || String(studentAnswer) == "N" || String(studentAnswer) == "FAUX" || String(studentAnswer) == "faux" || String(studentAnswer) == "N" || String(studentAnswer) == "NON" || String(studentAnswer) == "n" || String(studentAnswer) == "non" || String(studentAnswer) == "nah bro") {
                            studentAnswer = "false";
                        }

                        // Selon la éponse de l'utilisateur, on met à jour les compteurs et on affiche la solution
                        if (studentAnswer === answer.correctResponse[0]) {
                            correctCount++; 
                            console.log("\x1b[32mCorrect answer! \x1b[0m \n\n");
                        } else {
                            console.log("\x1b[31mWrong answer. \x1b[0m ");
                            console.log(`Here is what you should have written : \x1b[1m${answer.correctResponse} \x1b[0m \n\n`);
                        }

                        processed = true; // Indiquer que cette question a été traitée
                        check = true;
                    }
                }

                // S'il n'y a plusieurs bonnes réponses, il s'agit d'un texte à trou
                if (answer.nbCorrectAnswer > 1) {
                    const studentAnswer = await new Promise(resolve => rl.question("Enter your answer: ", resolve));
                    studentAnswers.push(studentAnswer.trim());

                    let check = false;
                    
                    // Pour chaque solution possible, on regarde si elle correspond à ce qu'a écrit l'utilisateur
                    for (let i = 0; i < answer.nbCorrectAnswer; i++) {
                        // Si la réponse de l'étudiant correspond à une des réponses correctes, on met à jour le compteur et affiche le message corresspondant
                        if (studentAnswer === answer.correctResponse[i]) { 
                            correctCount++;
                            console.log("\x1b[32mCorrect answer ! \x1b[0m \n\n");
                            // Indiquer que cette question a été traitée
                            check = true;
                        }
                    }
                    // Si la question n'a pas été traité, c'est que la réponse de l'utilisateur ne correspond à aucune bonne réponse
                    // On affiche donc les réponses qu'il aurait pu écrire pour avoir le point
                    if (!check) {
                        console.log("\x1b[31mWrong answer! \x1b[0m ");
                        console.log("Here are the answers that would have been correct : ")
                        for (let i = 0; i < answer.nbCorrectAnswer; i++) {
                            console.log(`\x1b[1m- ${answer.correctResponse[i]}\x1b[0m`);
                        }
                        console.log("\n\n")
                    }
                }

                 // Si la réponse est "unknown", on prévient l'utilisateur et on met le compteur à jour
                else if (answer.correctResponse === "unknown") {
                    const studentAnswer = await new Promise(resolve => rl.question("Enter your answer (\x1b[3mthis type of questions can't be automaticaly corrected\x1b[0) : ", resolve));
                    studentAnswers.push(studentAnswer.trim());
                    unknowknCount++;
                    console.log("\x1b[90mThe answer needs to be corrected by the teacher. \x1b[0m \n\n");
                }
                i++;
            }
        }

         // A la fin du test, on affiche les résultats
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