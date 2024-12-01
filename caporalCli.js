const fs = require('fs');
const vCards = require('./vCardsGeneration'); 
const {generateGiftExam}= require('./generateGIFT'); 

const { startExamSimulator } = require('./examSimulator'); // Import Exam Simulator
const { GIFTAnalyzer } = require('./GIFTAnalyzer'); // Import GIFTAnalyzer

const cli = require("@caporal/core").default;

cli
	.version('vpf-parser-cli')
	.version('0.07')

	// SPEC 3 : Generate Vcards
	.command('vCardsGenerate', 'Generate Professor vCards')
	.action(() => {
		vCards();
    })

    // SPEC 1 et 2 
    .command('generateGIFT', 'Create Test')
    .action(() => {
        generateGiftExam();
    })

    // SPEC 4 : Exam Simulator
    .command('startExam', 'Start the exam simulator')
    .option('-f, --file <path>', 'Path to the GIFT file(s)', { required: true })
    .action(({ options }) => {
        const filePaths = options.file.split(','); // Support multiple file paths
        startExamSimulator(filePaths); // Start the exam simulator
    })

    // SPEC 5 : Analyze GIFT Files
    .command('analyzeGIFT', 'Analyze GIFT files and generate a profile with histograms')
    .option('-f, --file <path>', 'Path to the GIFT file(s)', { required: true })
    .action(({ options }) => {
        const filePaths = options.file.split(','); // Support multiple file paths
        const analyzer = new GIFTAnalyzer();

        // Load and analyze questions
        const questions = analyzer.loadQuestions(filePaths); // Load and parse questions
        const questionTypeCounts = analyzer.analyzeQuestions(questions); // Analyze question types

        // Display histogram
        analyzer.displayHistogram(questionTypeCounts);

        // Compare profiles if multiple files are provided
        if (filePaths.length > 1) {
            const profiles = filePaths.map(filePath => {
                const fileQuestions = analyzer.loadQuestions([filePath]);
                return analyzer.analyzeQuestions(fileQuestions);
            });

            const averageProfile = analyzer.calculateAverageProfile(profiles); // Calculate average profile
            analyzer.compareProfiles(questionTypeCounts, averageProfile); // Compare profiles
        }
    })

    // SPEC 6 : Generate Exam Statistic
    .command('generateStats', 'Generate exam statistics and save to a file')
    .option('-f, --file <path>', 'Path to the GIFT file(s)', { required: true })
    .option('-o, --output <path>', 'Path to save the statistics file', { required: true })
    .action(({ options }) => {
        const filePaths = options.file.split(','); // Support multiple file paths
        const outputPath = options.output;

        const analyzer = new GIFTAnalyzer();

        // Load questions
        const questions = analyzer.loadQuestions(filePaths);

        // Generate and save statistics
        analyzer.generateExamStatistics(questions, outputPath);
    });
		
cli.run(process.argv.slice(2));