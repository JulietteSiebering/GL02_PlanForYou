/*
Basic functions that are used by multiple other functions
*/

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Fonction pour charger les questions depuis plusieurs fichiers GIFT
function loadQuestions(filePaths) {
    let allQuestions = [];
    filePaths.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const questions = content.split(/\n\n+/); // Sépare les questions
        allQuestions = allQuestions.concat(questions.filter(q => q.startsWith('::'))); // Filtre et ajoute les questions valides
    });
    return allQuestions;
}

// Fonction pour extraire la question et les réponses
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
            response: question.trim()
        };
    }

    const title = match[1].trim();

    const response = question.replace(titleRegex, '').trim();

    const cleanedTitle = removeHtmlTags(title);
    const cleanedResponse = removeHtmlTags(response);

    return {
        title: cleanedTitle.trim() + ' ',
        response: cleanedResponse
    };
}

// Interface pour les entrées utilisateur
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function askQuestion(rl, query) {
    return new Promise(resolve => rl.question(query, resolve));
}
const askYesNo = async (rl, question) => {
    let answer;
    do {
        answer = await askQuestion(rl, question); // Attend la réponse
        if (!answer.trim()) {
            // Si l'utilisateur appuie sur Entrée sans rien écrire
            return false; // Retourne "non" par défaut
        }
        if (typeof answer === 'string') {
            answer = answer.trim().toLowerCase(); // Nettoie la réponse
        } else {
            answer = ""; // Réinitialise si la réponse n'est pas une chaîne
        }
    } while (!/^(o|oui|n|non)$/.test(answer)); // Continue tant que la réponse n'est pas valide
    return answer.startsWith('o'); // Retourne true pour "oui", false pour "non"
};

function removeHtmlTags(text) {
    return text.replace(/<[^>]*>/g, '')  // Retirer les balises HTML
        .replace(/\[html\]/g, ''); // Retirer le texte [html]
}

module.exports = { removeHtmlTags, parseQuestion, loadQuestions, askQuestion, askYesNo, createReadlineInterface };