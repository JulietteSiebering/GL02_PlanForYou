/*
SPEC 7 : Comparaison de 2 fichiers GIFT
*/

const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Helper function: Reads a GIFT file and parses the questions
function parseGiftFile(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            return reject(new Error(`Le fichier ${filePath} n'existe pas.`));
        }

        const extension = path.extname(filePath).toLowerCase();
        if (extension !== '.gift') {
            return reject(new Error(`Le fichier ${filePath} n'est pas au format GIFT (.gift).`));
        }

        const fileStream = fs.createReadStream(filePath, 'utf8');
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let questions = [];
        let currentQuestion = '';
        let inQuestionBlock = false;

        rl.on('line', (line) => {
            const trimmedLine = line.trim();

            if (!trimmedLine) {
                if (currentQuestion) {
                    questions.push(currentQuestion.trim());
                    currentQuestion = '';
                    inQuestionBlock = false;
                }
                return;
            }

            if (trimmedLine.includes('::') || trimmedLine.includes('{')) {
                inQuestionBlock = true;
                currentQuestion += `${trimmedLine}\n`;
            } else if (inQuestionBlock) {
                currentQuestion += `${trimmedLine}\n`;
            }
        });

        rl.on('close', () => {
            if (currentQuestion) {
                questions.push(currentQuestion.trim());
            }
            resolve(questions);
        });

        rl.on('error', (err) => {
            reject(err);
        });
    });
}

// Main function: Compares two GIFT files
async function compareGiftFiles(file1, file2) {
    try {
        console.log("Comparaison des fichiers...");

        // Parse the two files
        const questionsFile1 = await parseGiftFile(file1);
        const questionsFile2 = await parseGiftFile(file2);

        // Identify unique and common questions
        const setFile1 = new Set(questionsFile1);
        const setFile2 = new Set(questionsFile2);

        const uniqueToFile1 = questionsFile1.filter(q => !setFile2.has(q));
        const uniqueToFile2 = questionsFile2.filter(q => !setFile1.has(q));
        const commonQuestions = questionsFile1.filter(q => setFile2.has(q));

        // Results summary
        console.log("\nRésumé de la comparaison :");
        console.log(`Fichier 1 : ${file1}`);
        console.log(`- Total des questions : ${questionsFile1.length}`);
        console.log(`Fichier 2 : ${file2}`);
        console.log(`- Total des questions : ${questionsFile2.length}`);
        console.log(`Questions communes : ${commonQuestions.length}`);
        console.log(`Questions uniques au fichier 1 : ${uniqueToFile1.length}`);
        console.log(`Questions uniques au fichier 2 : ${uniqueToFile2.length}`);

        // Details of differences
        if (uniqueToFile1.length > 0) {
            console.log("\nQuestions uniques au fichier 1 :");
            uniqueToFile1.forEach((q, i) => {
                console.log(`- Question ${i + 1} :`);
                console.log(q);
            });
        } else {
            console.log("\nAucune question unique au fichier 1.");
        }

        if (uniqueToFile2.length > 0) {
            console.log("\nQuestions uniques au fichier 2 :");
            uniqueToFile2.forEach((q, i) => {
                console.log(`- Question ${i + 1} :`);
                console.log(q);
            });
        } else {
            console.log("\nAucune question unique au fichier 2.");
        }
    } catch (err) {
        console.error("Erreur lors de la comparaison :", err.message);
    }
}

// Example usage
if (require.main === module) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Entrez le chemin du premier fichier GIFT : ', (file1) => {
        rl.question('Entrez le chemin du second fichier GIFT : ', (file2) => {
            compareGiftFiles(file1, file2).then(() => rl.close());
        });
    });
}

// Export for reuse in other modules
module.exports = { compareGiftFiles };
