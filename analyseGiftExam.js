/*
SPEC 5 : Analyses a GIFT exam file if it respects SRYEM requirements
*/

const { createReadlineInterface } = require('./secondaryFunctions');
const fs = require('fs');
const path = require('path');


function analyseGift() {
    const rl = createReadlineInterface();
    rl.question('Entrez le chemin du fichier GIFT : ', (filePath) => {
        try {
            if (!fs.existsSync(filePath)) {
                return reject(new Error("Le fichier n'existe pas. Vérifiez le chemin."));
            }

            const extension = path.extname(filePath).toLowerCase();
            if (extension !== '.gift') {
                return reject(new Error("Le fichier n'est pas au format GIFT (.gift)."));
            }
            const fileStream = fs.createReadStream(filePath, 'utf8');
            let allQuestions = [];
            const content = fs.readFileSync(filePath, 'utf-8');
            const questions = content.split(/\n\n+/).filter(q => q.startsWith('::'));
            allQuestions = allQuestions.concat(questions);
            const validation = validateExam(allQuestions); // Validate questions
            if (!validation.success) {
                console.log("Validation failed with the following errors:");
                validation.errors.forEach(error => console.log(error)); // Output all error messages
            } else {
                console.log("Validation successful, you can now generate the exam file.");
            }
            rl.close();
        } catch (error) {
            console.error("Failed to load question bank folder:", error.message);
            throw error; // Re-throw the error for testing to catch
            rl.close();
        }
    });
}


function validateExam(questions) {
    const errors = [];

    // 1. Check for duplicate questions
    const uniqueQuestions = new Set(questions); // Use Set to remove duplicate questions
    if (uniqueQuestions.size !== questions.length) {
        errors.push("Duplicate questions found, please remove them.");
    }

    // 2. Check if the number of questions is between 15 and 20
    if (questions.length < 15 || questions.length > 20) {
        errors.push(`Invalid number of questions. Current number: ${questions.length}, it should be between 15 and 20.`);
    }

    return {
        success: errors.length === 0, // If there are no errors, return success
        errors, // Return the error messages
    };
}

module.exports = {analyseGift};
