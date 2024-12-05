const fs = require('fs');
const path = require('path');

/**
 * Validate the exam question list
 * @param {Array} questions - The selected list of questions
 * @returns {Object} - Returns validation result, including success and error messages
 */
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

/**
 * Load all GIFT format questions from a specified folder
 * @param {string} folderPath - The path to the folder where GIFT files are located
 * @returns {Array} - An array containing all the questions
 */
function loadQuestions(folderPath) {
    try {
        const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.gift')); // Get all .gift files
        if (files.length === 0) {
            throw new Error('Failed to load question bank: No valid .gift files found in the folder');
        }
        let allQuestions = [];
        files.forEach(file => {
            const filePath = path.join(folderPath, file); // Get the full path of the file
            const content = fs.readFileSync(filePath, 'utf-8'); // Read the content of the file
            const questions = content.split(/\n\n+/).filter(q => q.startsWith('::')); // Split by empty lines and filter valid questions
            allQuestions = allQuestions.concat(questions); // Add questions to the array
        });
        return allQuestions; // Return all loaded questions
    } catch (error) {
        console.error("Failed to load question bank folder:", error.message); // Error handling
        throw error; // Re-throw the error for testing to catch
    }
}

// Use absolute path to load the folder path
const folderPath = path.join('D:', 'GL02_PlanForYou', 'SujetB_data'); // Adjust this to the actual path
const questions = loadQuestions(folderPath); // Load questions
const validation = validateExam(questions); // Validate questions

if (!validation.success) {
    console.log("Validation failed with the following errors:");
    validation.errors.forEach(error => console.log(error)); // Output all error messages
} else {
    console.log("Validation successful, you can now generate the exam file.");
}

module.exports = {
    validateExam, // Export the validation function
    loadQuestions, // Export the loadQuestions function
};
