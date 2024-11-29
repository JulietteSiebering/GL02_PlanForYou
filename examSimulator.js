//SPEC4
const fs = require('fs');
const readline = require('readline');
const { loadQuestions, parseGiftData } = require('./generateGIFT'); // Import existing functions

// Exam Simulator Class
class ExamSimulator {
    constructor(questions) {
        this.questions = questions; // List of questions
        this.currentIndex = 0; // Current question index
        this.answers = []; // Store user answers
    }

    // Display the current question
    displayQuestion() {
        const question = this.questions[this.currentIndex];
        console.log(`\nQuestion ${this.currentIndex + 1}: ${question.text}`);
        question.options.forEach((option, index) => {
            console.log(`  ${index + 1}. ${option}`);
        });
    }

    // Accept the user's answer
    async acceptAnswer(rl) {
        return new Promise((resolve) => {
            rl.question("Your answer (enter the option number): ", (input) => {
                const answer = parseInt(input.trim(), 10);
                if (answer >= 1 && answer <= this.questions[this.currentIndex].options.length) {
                    this.answers.push({
                        questionIndex: this.currentIndex,
                        selectedOption: answer - 1,
                    });
                    resolve();
                } else {
                    console.log("Invalid input. Please try again.");
                    resolve(this.acceptAnswer(rl));
                }
            });
        });
    }

    // Generate the exam report
    generateReport() {
        console.log("\n=== Exam Report ===");
        let correctCount = 0;

        this.questions.forEach((question, index) => {
            const studentAnswer = this.answers.find((ans) => ans.questionIndex === index);
            const isCorrect = studentAnswer?.selectedOption === question.correctIndex;

            console.log(`\nQuestion ${index + 1}: ${question.text}`);
            console.log(`  Your Answer: ${question.options[studentAnswer?.selectedOption] || "No answer"}`);
            console.log(`  Correct Answer: ${question.options[question.correctIndex]}`);
            console.log(`  Result: ${isCorrect ? "Correct" : "Incorrect"}`);

            if (isCorrect) correctCount++;
        });

        console.log(`\nYour Score: ${correctCount} / ${this.questions.length}`);
    }

    // Start the exam
    async startExam() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        console.log("=== Exam Started ===");
        while (this.currentIndex < this.questions.length) {
            this.displayQuestion();
            await this.acceptAnswer(rl);
            this.currentIndex++;
        }

        rl.close();
        this.generateReport();
    }
}

// Start the exam simulator
async function startExamSimulator(filePaths) {
    console.log("Loading questions...");
    const rawQuestions = loadQuestions(filePaths); // Load questions from files
    const parsedQuestions = parseGiftData(rawQuestions.join('\n\n')); // Parse questions

    if (parsedQuestions.length === 0) {
        console.log("No questions found. Exiting...");
        return;
    }

    console.log(`${parsedQuestions.length} questions loaded.`);
    const simulator = new ExamSimulator(parsedQuestions); // Initialize the exam simulator
    await simulator.startExam();
}

// Export the function for use in CLI
module.exports = { startExamSimulator };
