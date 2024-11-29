const fs = require('fs');
const vCards = require('./vCardsGeneration'); 
const generateGIFT = require('./generateGIFT'); 
const { startExamSimulator } = require('./examSimulator'); // Import Exam Simulator
const cli = require("@caporal/core").default;

cli
	.version('1.0.0')

	// SPEC 3 : Generate Vcards
	.command('vCardsGenerate', 'Generate Professor vCards')
	.action(() => {
		vCards();
    })

    // SPEC 1 et 2 
    .command('generateGIFT', 'Create Test')
    .action(() => {
        generateGIFT();
    })
    // SPEC4: Exam Simulator
    .command('startExam', 'Start the exam simulator')
    .option('-f, --file <path>', 'Path to the GIFT file(s)', { required: true })
    .action(({ options }) => {
        const filePaths = options.file.split(','); // Support multiple file paths
        startExamSimulator(filePaths); // Start the exam simulator
    });

cli.run(process.argv.slice(2));
