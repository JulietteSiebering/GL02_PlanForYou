/*
SPEC 6 : Creation d'un profil statistique d'examen
*/



const fs = require('fs');
const path = require('path');
const { createReadlineInterface } = require('./secondaryFunctions');
const readline = require("readline");
const { exec } = require('child_process');


const allQuestionTypes = [
    'Choix multiple',
    'Vrai/Faux',
    'Réponse courte',
    'Réponse numérique',
    'Correspondance',
    'Essai',
    'Calculée',
    'Cloze'
];

function isValidGiftQuestion(line) {
    return line.includes('::') || line.includes('{');
}


function detectQuestionType(question) {
    if (question.includes('{')) {
        const answers = question.match(/\{(.*?)\}/s);
        if (answers) {
            const answerContent = answers[1];
            if (answerContent.includes('1:SA:')) {
                return 'Cloze';
            } else if (answerContent.includes('~') || answerContent.includes('=')) {
                return 'Choix multiple';
            } else if (answerContent.includes('#')) {
                return 'Réponse numérique';
            } else if (answerContent.includes('->')) {
                return 'Correspondance';
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


function examProfil() {
    const vega = require('vega');
    const vl = require('vega-lite');
    const rl = createReadlineInterface();
    rl.question('Entrez le chemin du fichier GIFT : ', (filePath) => {
        classifyGiftQuestions(filePath)
            .then(({ classifiedQuestions, typeCounts, typePercentages, missingTypes, totalQuestions }) => {
                console.log("\nClassification des questions :");
                classifiedQuestions.forEach((item, index) => {
                    console.log(`\nQuestion ${index + 1}:`);
                    console.log(item.question);
                    console.log(`Type : ${item.type}`);
                });
                let spec = {
                    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
                    description: "Histogramme of an GIFT file exam",
                    data: {
                        values:[]
                    },
                    mark: "bar",
                    encoding: {
                        x: { field: "category", type: "nominal" },
                        y: { field: "value", type: "quantitative" }
                    }
                };
                for (const [category, value] of Object.entries(typeCounts)) {
                    spec.data.values.push({category, value});
                }
                const vegaSpec = vl.compile(spec).spec;
                const view = new vega.View(vega.parse(vegaSpec), { renderer: 'none' });
                view.toSVG().then(svg => {
                    fs.writeFileSync('examHistogramme.svg', svg);
                    console.log('SVG file created: examHistogramme.svg');
                });
                exec('examHistogramme.svg');

                if (missingTypes.length > 0) {
                    console.log("\nAlerte : Les types de questions suivants sont manquants dans le fichier GIFT :");
                    missingTypes.forEach((type) => {
                        console.log(`- ${type}`);
                    });
                } else {
                    console.log("\nTous les types de questions sont présents.");
                }

                rl.close();
            })
            .catch((err) => {
                console.error("Erreur :", err.message);
                rl.close();
            });
    });
}
module.exports = {examProfil};
