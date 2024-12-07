/*
SPEC 8 : Importation des fichiers GIFT
*/
// Vérifie si une ligne correspond au début d'une question valide au format GIFT

const fs = require('fs');
const readline = require('readline');
const path = require('path');

function isValidGiftQuestion(line) {
    return (
        line.includes('::') || // Identifiant optionnel de question
        line.includes('{')     // Début des réponses possibles
    );
}

// Extrait les questions au format GIFT depuis un fichier
function parseGiftQuestions(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            return reject(new Error("Le fichier n'existe pas. Vérifiez le chemin."));
        }

        const extension = path.extname(filePath).toLowerCase();
        if (extension !== '.gift') {
            return reject(new Error("Le fichier n'est pas au format GIFT (.gift)."));
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

            // Si la ligne est vide, fin d'une question
            if (!trimmedLine) {
                if (currentQuestion) {
                    questions.push(currentQuestion.trim());
                    currentQuestion = '';
                    inQuestionBlock = false;
                }
                return;
            }

            // Si la ligne commence une question ou contient des réponses
            if (isValidGiftQuestion(trimmedLine)) {
                inQuestionBlock = true;
                currentQuestion += `${trimmedLine}\n`;
            } else if (inQuestionBlock) {
                // Si c'est une continuation de la question
                currentQuestion += `${trimmedLine}\n`;
            }
        });

        rl.on('close', () => {
            // Ajoute la dernière question si elle existe
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

// Fonction pour modifier une question
function editQuestion(questions) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log("\nQuestions trouvées dans le fichier :");
        questions.forEach((question, index) => {
            console.log(`\nQuestion ${index + 1}:\n${question}`);
        });

        rl.question("\nEntrez le numéro de la question à modifier : ", (number) => {
            const questionIndex = parseInt(number, 10) - 1;

            if (isNaN(questionIndex) || questionIndex < 0 || questionIndex >= questions.length) {
                console.log("Numéro de question invalide.");
                rl.close();
                resolve(null);
                return;
            }

            console.log(`\nQuestion sélectionnée :\n${questions[questionIndex]}`);
            rl.question("\nEntrez la nouvelle version de la question : ", (newQuestion) => {
                questions[questionIndex] = newQuestion.trim();
                console.log("La question a été mise à jour !");
                rl.close();
                resolve(questions);
            });
        });
    });
}

// Sauvegarde les questions modifiées dans le fichier
function saveQuestionsToFile(filePath, questions) {
    return new Promise((resolve, reject) => {
        const data = questions.join('\n\n'); // Sépare les questions par deux lignes vides
        fs.writeFile(filePath, data, 'utf8', (err) => {
            if (err) {
                return reject(err);
            }
            resolve("Les questions ont été sauvegardées avec succès !");
        });
    });
}

// Appelle la fonction principale
function handleFileImport() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Entrez le chemin du fichier GIFT : ', (filePath) => {
        parseGiftQuestions(filePath)
            .then((questions) => {
                if (questions.length === 0) {
                    console.log("Aucune question valide trouvée dans le fichier.");
                    rl.close();
                    return;
                }

                editQuestion(questions)
                    .then((updatedQuestions) => {
                        if (updatedQuestions) {
                            return saveQuestionsToFile(filePath, updatedQuestions);
                        }
                        return null;
                    })
                    .then((message) => {
                        if (message) {
                            console.log(message);
                        }
                        rl.close();
                    })
                    .catch((err) => {
                        console.error("Erreur :", err.message);
                        rl.close();
                    });
            })
            .catch((err) => {
                console.error("Erreur :", err.message);
                rl.close();
            });
    });
}
module.exports = { handleFileImport };