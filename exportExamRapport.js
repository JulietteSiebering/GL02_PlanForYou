/*
SPEC 9 : Creation d'un fichier text de rapport d'examen
*/
// Vérifie si une ligne correspond au début d'une question valide au format GIFT

const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Liste des types de questions possibles dans le format GIFT
const allQuestionTypes = [
    'Choix multiple',     // Multiple Choice
    'Vrai/Faux',          // True/False
    'Réponse courte',     // Short Answer
    'Réponse numérique',  // Numerical
    'Correspondance',     // Matching
    'Essai',              // Essay
    'Calculée',           // Calculated
    'Cloze',              // Cloze (Fill-in-the-blank)
    'Aléatoire'           // Random
];

// Vérifie si une question est valide au format GIFT
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

// Lit et classe les questions du fichier GIFT
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

            // Calcul du total des questions
            const totalQuestions = questions.length;

            // Calcul des pourcentages
            const typePercentages = {};
            for (const [type, count] of Object.entries(typeCounts)) {
                typePercentages[type] = ((count / totalQuestions) * 100).toFixed(2);  // Calcul du pourcentage
            }

            // Vérification des types manquants
            const missingTypes = allQuestionTypes.filter(type => !typeCounts[type]);

            resolve({ classifiedQuestions, typeCounts, typePercentages, missingTypes, totalQuestions });
        });

        rl.on('error', (err) => {
            reject(err);
        });
    });
}

// Fonction principale pour analyser et afficher l'histogramme des types de questions
function exportFile() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Entrez le chemin du fichier GIFT : ', (filePath) => {
        classifyGiftQuestions(filePath)
            .then(({ classifiedQuestions, typeCounts, typePercentages, missingTypes, totalQuestions }) => {
                let rapport = "\nClassification des questions :\n";
                classifiedQuestions.forEach((item, index) => {
                    rapport += `\nQuestion ${index + 1}:\n`;
                    rapport += `${item.question}\n`;
                    rapport += `Type : ${item.type}\n`;
                });

                // Construction de l'histogramme avec pourcentages
                rapport += "\nHistogramme des questions par type :\n";
                for (const [type, count] of Object.entries(typeCounts)) {
                    const percentage = typePercentages[type];
                    const bar = '|'.repeat(count); // Crée une barre en fonction du nombre de questions
                    rapport += `${type}: ${bar} (${percentage}%)\n`;
                }

                // Gestion des types manquants
                if (missingTypes.length > 0) {
                    rapport += "\nAlerte : Les types de questions suivants sont manquants dans le fichier GIFT :\n";
                    missingTypes.forEach((type) => {
                        rapport += `- ${type}\n`;
                    });
                } else {
                    rapport += "\nTous les types de questions sont présents.\n";
                }

                console.log(rapport); // Affiche le rapport dans la console

                // Option pour sauvegarder le rapport
                rl.question('\nVoulez-vous sauvegarder ce rapport dans un fichier texte ? (oui/non) : ', (saveAnswer) => {
                    if (saveAnswer.toLowerCase() === 'oui') {
                        rl.question('Entrez le dossier où vous souhaitez sauvegarder le fichier (par défaut : dossier courant) : ', (folderPath) => {
                            folderPath = folderPath.trim() || '.'; // Utilise le dossier courant si aucun n'est spécifié
                            rl.question('Entrez le nom du fichier (par défaut : rapport.txt) : ', (fileName) => {
                                fileName = fileName.trim() || 'rapport.txt'; // Utilise un nom par défaut si aucun n'est spécifié
                                const outputFilePath = path.join(folderPath, fileName);

                                fs.writeFile(outputFilePath, rapport, 'utf8', (err) => {
                                    if (err) {
                                        console.error("Erreur lors de la sauvegarde du fichier :", err.message);
                                    } else {
                                        console.log(`Rapport sauvegardé avec succès dans : ${outputFilePath}`);
                                    }
                                    rl.close();
                                });
                            });
                        });
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

// Exporte les fonctions pour réutilisation
module.exports = { exportFile };