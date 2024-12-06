const readline = require('readline'); // For command-line interaction
const fs = require('fs'); // File system module for loading GIFT files
const path = require('path'); // Path module for locating files

/**
 * Utility function: Load GIFT format question bank
 * @param {string} folderPath - Folder path where GIFT files are located
 * @returns {Array} - Array containing all questions
 */
function loadQuestions(folderPath) {
    try {
        const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.gift'));
        if (files.length === 0) {
            throw new Error('Failed to load question bank: No valid .gift files found in the folder');
        }
        let allQuestions = [];
        files.forEach(file => {
            const filePath = path.join(folderPath, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const questions = content.split(/\n\n+/).filter(q => q.startsWith('::'));
            allQuestions = allQuestions.concat(questions);
        });
        return allQuestions;
    } catch (error) {
        console.error("Failed to load question bank folder:", error.message);
        throw error; // Re-throw the error for testing to catch
    }
}

/**
 * Utility function: Parse GIFT format question
 * @param {string} question - String of a single GIFT question
 * @returns {Object} - Object containing the title and the correct answer
 */
function parseQuestion(question) {
    const titleRegex = /^::(.*?)::/;
    const match = question.match(titleRegex);

    if (!match) {
        return { title: "Untitled", response: question.trim() };
    }

    const title = match[1].trim();
    const response = question.replace(titleRegex, '').trim();
    return { title, response };
}

/**
 * Utility function: Create a command-line interface
 * @returns {Interface} - readline interface
 */
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * Function to simulate the exam
 * @param {Array} questions - Array of already loaded and parsed questions
 */
async function simulateExam(questions) {
    const rl = createReadlineInterface();
    console.log("=== Exam Simulation Starts ===");

    const studentAnswers = [];
    let correctCount = 0;

    for (let i = 0; i < questions.length; i++) {
        const parsedQuestion = parseQuestion(questions[i]);
        console.log(`Question ${i + 1}: ${parsedQuestion.title.trim()}`);
        const answer = await new Promise(resolve => rl.question("Enter your answer: ", resolve));
        studentAnswers.push(answer.trim());

        if (answer.trim().toLowerCase() === parsedQuestion.response.trim().toLowerCase()) {
            correctCount++;
            console.log("Correct answer!");
        } else {
            console.log("Wrong answer!");
        }
    }

    console.log("\n=== Exam Summary ===");
    console.log(`Correct answers: ${correctCount}`);
    console.log(`Wrong answers: ${questions.length - correctCount}`);

    console.log("\n=== Question Details ===");
    questions.forEach((question, index) => {
        const parsedQuestion = parseQuestion(question);
        console.log(`\nQuestion ${index + 1}:`);
        console.log(`Question: ${parsedQuestion.title}`);
        console.log(`Correct answer: ${parsedQuestion.response}`);
        console.log(`Your answer: ${studentAnswers[index]}`);
        console.log(studentAnswers[index].trim().toLowerCase() === parsedQuestion.response.trim().toLowerCase() ? "Correct" : "Wrong");
    });

    rl.close();
}

module.exports = {
    loadQuestions,
    parseQuestion,
    simulateExam,
};
