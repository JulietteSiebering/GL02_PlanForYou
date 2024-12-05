const fs = require('fs');
const vCards = require('./vCardsGeneration'); 
const { generateGiftExam } = require('./generateGIFT'); 
const { simulateExam } = require('./examSimulator'); // Ensure the simulateExam function is exported
const { validateExam, displayExamStatistics } = require('./GIFTAnalyzer'); // Import new features
const cli = require("@caporal/core").default;

cli
    .version('vpf-parser-cli')
    .version('0.07')

    // SPEC 3: Generate vCards
    .command('vCardsGenerate', 'Generate Professor vCards')
    .action(() => {
        vCards();
    })

    // SPEC 1 and 2: Generate GIFT exam
    .command('generateGIFT', 'Create Test')
    .action(() => {
        generateGiftExam();
    })

    // SPEC 4: Simulate Exam
    .command('simulateExam', 'Simulate a GIFT exam')
    .argument('<folderPath>', 'Path to folder containing GIFT questions', { validator: cli.STRING })
    .action(({ args }) => {
        try {
            const folderPath = args.folderPath;
            const { loadQuestions } = require('./examSimulator'); // Import the function to load questions
            const questions = loadQuestions(folderPath); // Load GIFT questions
            
            if (questions.length === 0) {
                console.error("No questions found in the specified folder.");
                return;
            }

            console.log(`Loaded ${questions.length} questions. Starting the exam simulation...`);
            simulateExam(questions).then(() => {
                console.log("Exam simulation completed.");
            }).catch(err => {
                console.error("Error during exam simulation:", err);
            });
        } catch (error) {
            console.error("Error loading questions or starting the exam:", error);
        }
    })

cli.run(process.argv.slice(2));
