/*
SPEC 1 : Génération de fichiers d'examen au format GIFT
SPEC 2 : Recherche et sélection de questions 
*/

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Fonction pour charger les questions depuis plusieurs fichiers GIFT
function loadQuestions(filePaths) {
    let allQuestions = [];
    filePaths.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const questions = content.split(/\n\n+/); // Sépare les questions
        allQuestions = allQuestions.concat(questions.filter(q => q.startsWith('::'))); // Filtre et ajoute les questions valides
    });
    return allQuestions;
}

// Fonction pour extraire la question et les réponses
function parseQuestion(question) {
    const lines = question.split('\n');
    const title = lines[0]; // Titre ou description de la question
    const response = lines.slice(1).join('\n'); // Réponses ou contenu suivant
    return {
        title: title.replace(/::/g, '').trim(), // Supprime les "::" autour du titre
        response: response.trim()
    };
}

// Interface pour les entrées utilisateur
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function askQuestion(rl, query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// Fonction principale exportable
module.exports = async function generateGiftExam() {
    const rl = createReadlineInterface();
    console.log("=== Génération de fichiers d'examen GIFT ===");

    // Chargement des fichiers de questions avec leurs types
    const fileTypes = {
        Grammaire: ['./SujetB_data/EM-U4-p32_33-Review.gift', './SujetB_data/U7-p77-6.gift'], // Fichiers Grammaire 
        Vocabulaire: ['./SujetB_data/U9-p94-Listening.gift'],   // Fichiers de vocabulaire 
        Reading: ['./reading1.gift'],                     // Fichiers Reading
        Listening: ['./listening1.gift']                  // Fichiers Listening
    };

    // Choix du type de fichiers
    console.log("\nTypes de questions disponibles :");
    const fileKeys = Object.keys(fileTypes);
    fileKeys.forEach((type, index) => {
        console.log(`${index + 1}. ${type}`);
    });

    const selectedFiles = [];
    let fileTypeIndex;

    console.log("\nVous pouvez sélectionner plusieurs catégories en entrant leurs numéros séparés par des espaces (par ex. : `1 3 4`).");
    do {
        fileTypeIndex = await askQuestion(rl, "Entrez les numéros des catégories à inclure (ou appuyez sur Entrée pour annuler) : ");
        if (fileTypeIndex === "") {
            console.log("Aucune catégorie sélectionnée. Opération annulée.");
            rl.close();
            return;
        }

        const indexes = fileTypeIndex.split(' ').map(index => parseInt(index.trim(), 10) - 1);
        const invalidIndexes = indexes.filter(index => isNaN(index) || !fileKeys[index]);

        if (invalidIndexes.length > 0) {
            console.log("Certains numéros sont invalides. Veuillez réessayer.");
        } else {
            indexes.forEach(index => {
                selectedFiles.push(...fileTypes[fileKeys[index]]);
            });
        }
    } while (selectedFiles.length === 0);

    const questions = loadQuestions(selectedFiles);

    console.log(`\nQuestions disponibles :`);
    questions.forEach((q, i) => {
        const parsed = parseQuestion(q);
        console.log(`\n${i + 1}. Question: ${parsed.title}`);
        console.log(`   Réponse(s):`);
        console.log(parsed.response);
    });

    // Sélection des questions
    const selectedQuestions = [];
    let selection;
    do {
        selection = await askQuestion(rl, "Entrez le numéro d'une question à ajouter (ou appuyez sur Entrée pour terminer) : ");
        if (selection && !isNaN(selection) && questions[selection - 1]) {
            selectedQuestions.push(questions[selection - 1]);
            console.log("Question ajoutée.");
        } else if (selection) {
            console.log("Numéro invalide, veuillez réessayer.");
        }
    } while (selection);

    if (selectedQuestions.length === 0) {
        console.log("Aucune question sélectionnée. Opération annulée.");
        rl.close();
        return;
    }

    // Nom du fichier et répertoire de sortie
    const outputFileName = await askQuestion(rl, "Entrez le nom du fichier (sans extension) : ");
    const outputDir = await askQuestion(rl, "Entrez le répertoire de sortie : ");
    const outputPath = path.join(outputDir, `${outputFileName}.gift`);

    // Création du fichier GIFT
    try {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, selectedQuestions.join('\n\n'));
        console.log(`Fichier GIFT généré avec succès : ${outputPath}`);
    } catch (err) {
        console.error("Erreur lors de la création du fichier :", err.message);
    }

    rl.close();
}


