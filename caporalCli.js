const fs = require('fs');
const vCards = require('./vCardsGeneration');
const { generateGiftExam } = require('./generateGIFT');
const { handleFileImport } = require('./importGIFT');
const { examProfil } = require('./examProfil');
const { compareGiftFiles } = require('./compareGiftFiles');
const { exportFile } = require('./exportExamRapport');
const { simulateExam } = require('./examSimulator');
const { validateExam } = require('./analyserGIFT');
const cli = require("@caporal/core").default;


cli
    .version('vpf-parser-cli')
    .version('0.07')

    // SPEC 1 and 2: Generate GIFT exam
    .command('generateGIFT', 'Create Test')
    .action(() => {
        generateGiftExam();
    })

    // SPEC 3: Generate vCards
    .command('vCardsGenerate', 'Generate Professor vCards')
    .action(() => {
        vCards();
    })

    // SPEC 4: Generate vCards
    .command('simulateExam', 'Simulates Exam entry')
    .action(() => {
        simulateExam();
    })

    // SPEC 5: Analyse GIFT file
    .command('analyseGift', 'Analyses Gift file')
    .action(() => {
        validateExam();
    })

    // SPEC 6: Create an exam profil
    .command('examProfil', 'Examines a gift file and creates a profile')
    .action(() => {
        examProfil();
    })

    // SPEC 7 : Compare 2 exams
    .command('compareExamFiles', 'Compare 2 different files')
    .action(() => {
        compareGiftFiles();
    })

    // SPEC 8: Import GIFT file and modify it
    .command('importGIFT', 'Imports a GIFT file')
    .action(() => {
        handleFileImport();
    })

    // SPEC 9: Export profil rapport of a GIFT file
    .command('exportProfil', 'Exports a profil of a GIFT file')
    .action(() => {
        exportFile();
    })




cli.run(process.argv.slice(2));

