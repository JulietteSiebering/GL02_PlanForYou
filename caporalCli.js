const vCards = require('./generateVCards');
const { generateGiftExam } = require('./generateGiftExam');
const { handleFileImport } = require('./importGiftFile');
const { examProfil } = require('./createExamProfil.js');
const { compareGiftFiles } = require('./compareGiftFiles');
const { exportFile } = require('./exportExamProfil');
const { simulateExam } = require('./simulateExam');
const { analyseGift } = require('./analyseGiftExam');
const {  roles, users, checkPermission, promptUserForName } = require('./usermanager');
const cli = require("@caporal/core").default;


cli
    .version('vpf-parser-cli')
    .version('0.07')

    // SPEC 1 and 2: Generate GIFT exam
    .command('generateGIFT', 'Create Test')
    .action(async() => {
        // Check if the user has the permission to run this command
        const username = await promptUserForName();
        const hasPermission = checkPermission(username, users, roles.teacher);

        if (!hasPermission) {
           console.log("Access denied. This command is restricted to teachers.");
            return;
        }

        console.log("Access granted. You can now generate an exam :");
        generateGiftExam();
    })

    // SPEC 3: Generate vCards
    .command('vCardsGenerate', 'Generate Professor vCards')
    .action(async() => {
        // Check if the user has the permission to run this command
        const username = await promptUserForName();
        const hasPermission = checkPermission(username, users, roles.teacher);

        if (!hasPermission) {
           console.log("Access denied. This command is restricted to teachers.");
            return;
        }

        console.log("Access granted. You can now generate a VCard :");
        vCards();
    })

    // SPEC 4: Simulate exam test
    .command('simulateExam', 'Simulates Exam entry')
    .action(() => {
        simulateExam();
    })

    // SPEC 5: Analyze a GIFT file
    .command('analyzeExam', 'Analyzes a GIFT file')
    .action(() => {
        analyseGift();
    })

    // SPEC 6: Create an exam profil
    .command('examProfil', 'Examines a gift file and creates a profile')
    .action(async() => {
        // Check if the user has the permission to run this command
        const username = await promptUserForName();
        const hasPermission = checkPermission(username, users, roles.teacher);

        if (!hasPermission) {
           console.log("Access denied. This command is restricted to teachers.");
            return;
        }

        console.log("Access granted. You can now analyze an exam :");
        examProfil();
    })

    // SPEC 7 : Compare 2 exams
    .command('compareExamFiles', 'Compare 2 different files')
    .action(async () => {
        // Check if the user has the permission to run this command
        const username = await promptUserForName();
        const hasPermission = checkPermission(username, users, roles.teacher);

        if (!hasPermission) {
           console.log("Access denied. This command is restricted to teachers.");
            return;
        }

        console.log("Access granted. You can now compare the exams :");
        compareGiftFiles();
    })

    // SPEC 8: Import GIFT file and modify it
    .command('importGIFT', 'Imports a GIFT file')
    .action(async () => {
        // Check if the user has the permission to run this command
        const username = await promptUserForName();
        const hasPermission = checkPermission(username, users, roles.teacher);

        if (!hasPermission) {
           console.log("Access denied. This command is restricted to teachers.");
            return;
        }

        console.log("Access granted. You can now import an exam:");
        handleFileImport();
    })

    // SPEC 9: Export profil rapport of a GIFT file
    .command('exportProfil', 'Exports a profil of a GIFT file')
    .action(async() => {
        // Check if the user has the permission to run this command
        const username = await promptUserForName();
        const hasPermission = checkPermission(username, users, roles.teacher);

        if (!hasPermission) {
           console.log("Access denied. This command is restricted to teachers.");
            return;
        }

        console.log("Access granted. You can now export an exam :");
        exportFile();
    })




cli.run(process.argv.slice(2));
