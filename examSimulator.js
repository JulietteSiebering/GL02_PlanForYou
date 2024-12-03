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
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const questions = content.split(/\n\n+/); // Split the content into questions
            allQuestions = allQuestions.concat(questions.filter(q => q.startsWith('::'))); // Filter valid questions
        } catch (error) {
            console.error(`Error loading file ${filePath}: ${error.message}`);
            process.exit(1); // Exit the program if the file can't be loaded
        }
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
async function askQuestion(rl, query, validateFn) {
    let answer;
    do {
        answer = await new Promise(resolve => rl.question(query, resolve));
        if (validateFn && !validateFn(answer)) {
            console.log("Invalid answer format. Please try again.");
        }
    } while (validateFn && !validateFn(answer));
    return answer;
}

// Validate answer (e.g., non-empty)
function validateAnswer(answer) {
    return answer.trim() !== '';
}

// Calculate the correct and incorrect answers
function calculateResults(questions, answers) {
    let correct = 0;
    let incorrect = 0;
    let details = [];

    questions.forEach((q, index) => {
        const parsed = parseQuestion(q);
        const isCorrect = parsed.response.trim().toLowerCase() === answers[index].trim().toLowerCase();
        if (isCorrect) {
            correct++;
        } else {
            incorrect++;
        }
        details.push({
            question: parsed.title,
            correctAnswer: parsed.response,
            studentAnswer: answers[index],
            isCorrect: isCorrect
        });
    });

    return { correct, incorrect, details };
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
        
        // Get the student's answer with validation
        let answer = await askQuestion(rl, "Your answer: ", validateAnswer);
        studentAnswers.push(answer);
    }

    // Calculate and display the results
    const results = calculateResults(questions, studentAnswers);

    console.log("\n=== Exam Summary ===");
    console.log(`Correct Answers: ${results.correct}`);
    console.log(`Incorrect Answers: ${results.incorrect}`);

    // Display details for each question
    console.log("\n=== Question Details ===");
    results.details.forEach((detail, index) => {
        console.log(`\nQuestion ${index + 1}:`);
        console.log(`   Question: ${detail.question}`);
        console.log(`   Correct Answer: ${detail.correctAnswer}`);
        console.log(`   Your Answer: ${detail.studentAnswer}`);
        console.log(`   ${detail.isCorrect ? 'Correct' : 'Incorrect'}`);
    });

    rl.close();
}

// Start the exam simulation
simulateExam().catch(err => {
    console.error("Error:", err);
});
