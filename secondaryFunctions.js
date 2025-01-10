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

function removeHtmlTags(text) {
    return text.replace(/<[^>]*>/g, '')  // Retirer les balises HTML
        .replace(/\[html\]/g, ''); // Retirer le texte [html]
}

module.exports = { removeHtmlTags, parseQuestion, loadQuestions, askQuestion, createReadlineInterface };