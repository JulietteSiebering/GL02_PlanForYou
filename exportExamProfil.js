/*
SPEC 9 : Creation d'un fichier text de rapport d'examen
*/

const { createReadlineInterface, askQuestion} = require('./secondaryFunctions');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const allQuestionTypes = [
    'Choix multiple',     // Multiple Choice
    'Vrai/Faux',          // True/False
    'Réponse courte',     // Short Answer
    'Réponse numérique',  // Numerical
    'Correspondance',     // Matching
    'Essai',              // Essay
    'Calculée',           // Calculated
    'Aléatoire'           // Random
];

function isValidGiftQuestion(line) {
    return line.includes('::') || line.includes('{');
}

// Détecte le type de question à partir de son contenu
function detectQuestionType(question) {
    if (question.includes('{')) {
        const answers = question.match(/\{(.*?)\}/s);
        if (answers) {
            const answerContent = answers[1];
            if (answerContent.includes('~') || answerContent.includes('=')) {
                return 'Choix multiple';
            } else if (answerContent.includes('#')) {
                return 'Réponse numérique';
            } else {
                return 'Réponse courte';
            }
        }
    }
    return 'Inconnu';
}

function classifyGiftQuestions(filePath) {
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

            if (!trimmedLine) {
                if (currentQuestion) {
                    questions.push(currentQuestion.trim());
                    currentQuestion = '';
                    inQuestionBlock = false;
                }
                return;
            }

            if (isValidGiftQuestion(trimmedLine)) {
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

            const classifiedQuestions = questions.map((question) => {
                return {
                    question,
                    type: detectQuestionType(question)
                };
            });

            const typeCounts = classifiedQuestions.reduce((acc, item) => {
                acc[item.type] = (acc[item.type] || 0) + 1;
                return acc;
            }, {});

            const totalQuestions = questions.length;

            const typePercentages = {};
            for (const [type, count] of Object.entries(typeCounts)) {
                typePercentages[type] = ((count / totalQuestions) * 100).toFixed(2);  // Calcul du pourcentage
            }

            const missingTypes = allQuestionTypes.filter(type => !typeCounts[type]);

            resolve({ classifiedQuestions, typeCounts, typePercentages, missingTypes, totalQuestions });
        });

        rl.on('error', (err) => {
            reject(err);
        });
    });
}

function exportFile() {
    const rl = createReadlineInterface();

    rl.question('Entrez le chemin du fichier GIFT : ', (filePath) => {
        classifyGiftQuestions(filePath)
            .then(({ classifiedQuestions, typeCounts, typePercentages, missingTypes, totalQuestions }) => {
                let rapport = "\nClassification des questions :\n";
                classifiedQuestions.forEach((item, index) => {
                    rapport += `\nQuestion ${index + 1}:\n`;
                    rapport += `${item.question}\n`;
                    rapport += `Type : ${item.type}\n`;
                });

                rapport += "\nHistogramme des questions par type :\n";
                for (const [type, count] of Object.entries(typeCounts)) {
                    const bar = '|'.repeat(count);
                    const percentage = typePercentages[type];
                    rapport += `${bar}: ${type} (${percentage}%)\n`;
                }

                if (missingTypes.length > 0) {
                    rapport += "\nAlerte : Les types de questions suivants sont manquants dans le fichier GIFT :\n";
                    missingTypes.forEach((type) => {
                        rapport += `- ${type}\n`;
                    });
                } else {
                    rapport += "\nTous les types de questions sont présents.\n";
                }

                console.log(rapport);

                rl.question('\nVoulez-vous sauvegarder ce rapport dans un fichier texte ? (oui/non) : ', async (saveAnswer) => {
                    if (saveAnswer.toLowerCase() === 'oui') {
                        const outputFileName = await askQuestion(rl, "Entrez le nom du fichier (sans extension) : ");
                        const outputDir = await askQuestion(rl, "Entrez le répertoire de sortie : ");
                        const outputPath = path.join(outputDir, `${outputFileName}.txt`);

                        // Création du fichier GIFT
                        try {
                            if (!fs.existsSync(outputDir)) {
                                fs.mkdirSync(outputDir, {recursive: true});
                            }
                            fs.writeFileSync(outputPath, rapport);
                            console.log(`Fichier GIFT généré avec succès : ${outputPath}`);
                        } catch (err) {
                            console.error("Erreur lors de la création du fichier :", err.message);
                        }
                    } else {
                        rl.close();
                    }
                });
            })
            .catch((err) => {
                console.error("Erreur :", err.message);
                rl.close();
            });
    });
}

module.exports = { exportFile };