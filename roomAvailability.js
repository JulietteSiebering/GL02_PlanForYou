//SPEC4
const fs = require('fs');
const readline = require('readline');

// Exam Simulator Class
class ExamSimulator {
    constructor(questions) {
        this.questions = questions; // The question bank
        this.currentIndex = 0; // Current question index
        this.answers = []; // Array to store student answers
    }

    // Display the current question
    displayQuestion() {
        const question = this.questions[this.currentIndex];
        console.log(`\nQuestion ${this.currentIndex + 1}: ${question.text}`);
        question.options.forEach((option, index) => {
            console.log(`  ${index + 1}. ${option}`);
        });
    }

    // Accept the student's answer
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

// Function to parse GIFT data
function parseGiftData(giftData) {
    const questions = [];
    const rawQuestions = giftData.split(/\n\n+/); // Split questions by double newlines
    rawQuestions.forEach((rawQuestion) => {
        const match = rawQuestion.match(/^(.*?)\{(.*?)\}$/s); // Match question and answers
        if (match) {
            const text = match[1].trim();
            const options = match[2]
                .split("~")
                .map((opt) => opt.replace(/^[=]/, "").trim()); // Remove '=' from correct answers
            const correctIndex = match[2].split("~").findIndex((opt) => opt.startsWith("="));
            questions.push({ text, options, correctIndex });
        }
    });
    return questions;
}

// Example GIFT data
const giftData = `
What is the capital of France? {=Paris~London~Berlin~Madrid}
2 + 2 equals? {=4~3~5~6}
Who wrote "Hamlet"? {=Shakespeare~Dickens~Hemingway~Orwell}
`;

// Initialize the exam simulator
const questions = parseGiftData(giftData);
const simulator = new ExamSimulator(questions);

// Start the exam
simulator.startExam();
