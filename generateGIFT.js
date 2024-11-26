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


// Fonction pour charger et trier les questions par catégories
function loadAndFilterQuestions(fileTypes, selectedCategories) {
    let filteredQuestions = [];
    selectedCategories.forEach(category => {
        const files = fileTypes[category];
        if (files) {
            filteredQuestions = filteredQuestions.concat(loadQuestions(files));
        }
    });
    return filteredQuestions;
}

// Ajout de la recherche par mot-clé
function filterQuestionsByKeyword(questions, keyword) {
    return questions.filter(q => q.toLowerCase().includes(keyword.toLowerCase()));
}

// Fonction principale exportable
module.exports = async function generateGiftExam() {
    const rl = createReadlineInterface();
    console.log("=== Génération de fichiers d'examen GIFT ===");

    // Chargement des fichiers de questions avec leurs types
    const fileTypes = {
        Grammaire: ['./SujetB_data/EM-U5-p34-Gra-Expressions_of_quantity.gift','./SujetB_data/EM-U5-p35-Gra-Subject_verb_agreement.gift', './SujetB_data/EM-U5-p38-Passive.gift', './SujetB_data/U1-p7-Adverbs.gift', './SujetB_data/U1-p10-Gra-Present_tenses_habits.gift', './SujetB_data/U2-p22-Gra-Ing_or_inf.gift', './SujetB_data/U3-p31-Gra-ed_adjectives_prepositions.gift', './SujetB_data/U3-p32-GR-Present_perfect_vs_past_simple.gift', './SujetB_data/U3-p32-Gra-Present_perfect_simple_vs_continuous.gift', './SujetB_data/U3-p33-Gra-As_like.gift', './SujetB_data/U5-p49-GR1-Expressions_of_quantity.gift', './SujetB_data/U5-p49-Subject_verb_agreement.gift', './SujetB_data/U5-p54-6-Passive.gift', './SujetB_data/U5-p54-GR4-Passive-reporting.gift', './SujetB_data/U6-p61-5-Future-forms.gift', './SujetB_data/U6-p61-GR-Future_forms.gift', './SujetB_data/U6-p64-Future-perfect-&-continuous.gift', './SujetB_data/U7-p76_77-So,such,too,enough.gift', './SujetB_data/U7-p76-Relative_clauses.gift', './SujetB_data/U7-p77-It is,there is.gift', './SujetB_data/U9-p95-Third_cond-4.gift'], // Fichiers Grammaire 
        Vocabulaire: ['./SujetB_data/EM-U5-p34-Voc.gift', 'SujetB_data/U6-p59-Vocabulary.gift', './SujetB_data/U6-p65-Voc-Expressions_with_get.gift', './SujetB_data/U8-p84-Voc-Linking_words.gift'],   // Fichiers de vocabulaire 
        Reading: ['./SujetB_data/EM-U5-p36_37-Reading.gift', './SujetB_data/U1-p8_9-Reading-Coachella.gift', './SujetB_data/U3-p30-Reading.gift', './SujetB_data/U4-p39-Reading-xmen.gift', './SujetB_data/U5-p52-Reading-The_death_of_cooking.gift', './SujetB_data/U6-p62_63-Reading.gift', './SujetB_data/U10-p106-Reading.gift'],                     // Fichiers Reading
        Listening: ['./SujetB_data/U4-p42_43-Listening.gift', './SujetB_data/U6-p60-Listening.gift', './SujetB_data/U9-p94-Listening.gift'],                  // Fichiers Listening
        Review: ['./SujetB_data/EM-U4-p32_33-Review.gift', './SujetB_data/EM-U6-p46_47-4.gift', './SujetB_data/EM-U42-Ultimate.gift', './SujetB_data/U3-p33-UoE-Hygge.gift', './SujetB_data/U4-p47-Review.gift', './SujetB_data/U5-p50-Use_of_English.gift', './SujetB_data/U5-p57-Review.gift', './SujetB_data/U6-p67-Review.gift', './SujetB_data/U6-p68_69-ProgressTest2.gift', './SujetB_data/U7-p77-6.gift', './SujetB_data/U7-p79-Review-3.gift', './SujetB_data/U11-p114-Mixed_conditionals.gift']
    };

    // Choix du type de fichiers
    console.log("\nTypes de questions disponibles :");
    const fileKeys = Object.keys(fileTypes);
    fileKeys.forEach((type, index) => {
        console.log(`${index + 1}. ${type}`);
    });

    const selectedFiles = [];
    let fileTypeIndex;

    console.log("\nVous pouvez sélectionner plusieurs catégories en entrant leurs numéros séparés par des espaces (par ex. : 1 3 4).");
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

    let questions = loadQuestions(selectedFiles);

        // Étape 2 : Filtrage par mot-clé
        const searchKeyword = await askQuestion(rl, "Entrez un mot-clé pour filtrer les questions (ou appuyez sur Entrée pour ignorer) : ");
        if (searchKeyword) {
            questions = filterQuestionsByKeyword(questions, searchKeyword);
        }
    
        // Afficher les questions uniquement après tous les filtres
        if (questions.length === 0) {
            console.log("Aucune question trouvée après application des filtres. Opération annulée.");
            rl.close();
            return;
        }
    
        console.log(`\nQuestions disponibles après filtres (${questions.length} trouvées) :`);
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
        selection = await askQuestion(rl, "Entrez le numéro d'une question à ajouter ou retirer (ou appuyez sur Entrée pour terminer) : ");
        
        // Vérification de la validité de l'entrée
        if (selection && !isNaN(selection) && questions[selection - 1]) {
            const questionIndex = parseInt(selection, 10) - 1; // Index de la question sélectionnée
            const selectedQuestion = questions[questionIndex];
    
            // Si la question est déjà sélectionnée, on la retire
            const alreadySelectedIndex = selectedQuestions.indexOf(selectedQuestion);
            if (alreadySelectedIndex !== -1) {
                selectedQuestions.splice(alreadySelectedIndex, 1); // Retirer la question
                console.log(`Question ${selection} désélectionnée.`);
            } else {
                // Sinon, on l'ajoute
                selectedQuestions.push(selectedQuestion);
                console.log(`Question ${selection} sélectionnée.`);
            }
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


