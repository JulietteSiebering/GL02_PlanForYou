//SPEC4
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

// Load questions from multiple GIFT format files
function loadQuestions(filePaths) {
    let allQuestions = [];
    filePaths.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const questions = content.split(/\n\n+/); // Split the content into questions
        allQuestions = allQuestions.concat(questions.filter(q => q.startsWith('::'))); // Filter valid questions
    });
    return allQuestions;
}

// Parse the question to extract title and response
function parseQuestion(question) {
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

    return {
        title: title,
        response: response
    };
}

// Function to ask the user a question
async function askQuestion(rl, query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// Calculate the correct and incorrect answers
function calculateResults(questions, answers) {
    let correct = 0;
    let incorrect = 0;

    questions.forEach((q, index) => {
        const parsed = parseQuestion(q);
        if (parsed.response.trim().toLowerCase() === answers[index].trim().toLowerCase()) {
            correct++;
        } else {
            incorrect++;
        }
    });

    return { correct, incorrect };
}

// Main function to simulate the exam
async function simulateExam() {
    const rl = createReadlineInterface();
    console.log("=== Exam Simulation Started ===");

    // Load questions from GIFT format files
    const filePaths = ['./examen.gift']; // You can specify multiple file paths here
    let questions = loadQuestions(filePaths);
    let studentAnswers = [];

    // Simulate the exam process
    for (let i = 0; i < questions.length; i++) {
        const parsed = parseQuestion(questions[i]);
        console.log(`Question ${i + 1}: ${parsed.title}`);
        
        // Get the student's answer
        let answer = await askQuestion(rl, "Your answer: ");
        studentAnswers.push(answer);
    }

    // Calculate and display the results
    const results = calculateResults(questions, studentAnswers);

    console.log("\n=== Exam Summary ===");
    console.log(`Correct Answers: ${results.correct}`);
    console.log(`Incorrect Answers: ${results.incorrect}`);

    rl.close();
}

// Start the exam simulation
simulateExam().catch(err => {
    console.error("Error:", err);
});
