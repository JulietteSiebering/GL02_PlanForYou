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
    Grammaire: ['./SujetB_data/EM-U5-p34-Gra-Expressions_of_quantity.gift','./SujetB_data/EM-U5-p35-Gra-Subject_verb_agreement.gift', './SujetB_data/EM-U5-p38-Passive.gift', './SujetB_data/U1-p7-Adverbs.gift', './SujetB_data/U1-p10-Gra-Present_tenses_habits.gift', './SujetB_data/U2-p22-Gra-Ing_or_inf.gift', './SujetB_data/U3-p31-Gra-ed_adjectives_prepositions.gift', './SujetB_data/U3-p32-GR-Present_perfect_vs_past_simple.gift', './SujetB_data/U3-p32-Gra-Present_perfect_simple_vs_continuous.gift', './SujetB_data/U3-p33-Gra-As_like.gift', './SujetB_data/U5-p49-GR1-Expressions_of_quantity.gift', './SujetB_data/U5-p49-Subject_verb_agreement.gift', './SujetB_data/U5-p54-6-Passive.gift', './SujetB_data/U5-p54-GR4-Passive-reporting.gift', './SujetB_data/U6-p61-5-Future-forms.gift', './SujetB_data/U6-p61-GR-Future_forms.gift', './SujetB_data/U6-p64-Future-perfect-&-continuous.gift', './SujetB_data/U7-p76_77-So,such,too,enough.gift', './SujetB_data/U7-p76-Relative_clauses.gift', './SujetB_data/U7-p77-It is,there is.gift', './SujetB_data/U9-p95-Third_cond-4.gift'], // Fichiers Grammaire 
    Vocabulaire: ['./SujetB_data/EM-U5-p34-Voc.gift', 'SujetB_data/U6-p59-Vocabulary.gift', './SujetB_data/U6-p65-Voc-Expressions_with_get.gift', './SujetB_data/U8-p84-Voc-Linking_words.gift'],   // Fichiers de vocabulaire 
    Reading: ['./SujetB_data/EM-U5-p36_37-Reading.gift', './SujetB_data/U1-p8_9-Reading-Coachella.gift', './SujetB_data/U3-p30-Reading.gift', './SujetB_data/U4-p39-Reading-xmen.gift', './SujetB_data/U5-p52-Reading-The_death_of_cooking.gift', './SujetB_data/U6-p62_63-Reading.gift', './SujetB_data/U10-p106-Reading.gift'],                     // Fichiers Reading
    Listening: ['./SujetB_data/U4-p42_43-Listening.gift', './SujetB_data/U6-p60-Listening.gift', './SujetB_data/U9-p94-Listening.gift'],                  // Fichiers Listening
    Review: ['./SujetB_data/EM-U4-p32_33-Review.gift', './SujetB_data/EM-U6-p46_47-4.gift', './SujetB_data/EM-U42-Ultimate.gift', './SujetB_data/U3-p33-UoE-Hygge.gift', './SujetB_data/U4-p47-Review.gift', './SujetB_data/U5-p50-Use_of_English.gift', './SujetB_data/U5-p57-Review.gift', './SujetB_data/U6-p67-Review.gift', './SujetB_data/U6-p68_69-ProgressTest2.gift', './SujetB_data/U7-p77-6.gift', './SujetB_data/U7-p79-Review-3.gift', './SujetB_data/U11-p114-Mixed_conditionals.gift']
};



    let questions = [];
    let selectedQuestions = [];

    // Fonction pour appliquer les filtres
    const applyFilters = async () => {
        console.log("\nTypes de questions disponibles :");
        const fileKeys = Object.keys(fileTypes);
        fileKeys.forEach((type, index) => {
            console.log(`${index + 1}. ${type}`);
        });

        const fileTypeIndex = await askQuestion(rl, "\nEntrez les numéros des catégories à inclure (séparés par des espaces, ou appuyez sur Entrée pour annuler) : ");
        if (fileTypeIndex === "") {
            console.log("Aucune catégorie sélectionnée. Opération annulée.");
            return false;
        }

        const indexes = fileTypeIndex.split(' ').map(index => parseInt(index.trim(), 10) - 1);
        const invalidIndexes = indexes.filter(index => isNaN(index) || !fileKeys[index]);

        if (invalidIndexes.length > 0) {
            console.log("Certains numéros sont invalides. Veuillez réessayer.");
            return false;
        }

        const selectedFiles = [];
        indexes.forEach(index => {
            selectedFiles.push(...fileTypes[fileKeys[index]]);
        });

        questions = loadQuestions(selectedFiles);

        // Ajout du filtre par mot-clé
        const keyword = await askQuestion(rl, "Entrez un mot-clé pour filtrer les questions (ou appuyez sur Entrée pour tout afficher) : ");
        if (keyword) {
            questions = questions.filter(q => q.toLowerCase().includes(keyword.toLowerCase()));
        }

        console.log(`\nQuestions disponibles (${questions.length}) :`);
        questions.forEach((q, i) => {
            const parsed = parseQuestion(q);
            console.log(`\n${i + 1}. Question: ${parsed.title}`);
            console.log(`   Réponse(s):`);
            console.log(parsed.response);
        });

        return true;
    };

    // Fonction pour afficher et sélectionner les questions
    const selectQuestions = async () => {
        let selection;
        do {
            console.log(`\nQuestions sélectionnées : ${selectedQuestions.length}`);
            selection = await askQuestion(rl, "Entrez le numéro d'une question à ajouter ou à retirer (ou appuyez sur Entrée pour terminer) : ");
            
            if (selection === "") {
                // Si l'utilisateur appuie sur Entrée sans numéro, on demande s'il veut changer les filtres
                const changeFilters = await askQuestion(rl, "Souhaitez-vous modifier les filtres ? (oui/non) : ");
                if (changeFilters.toLowerCase().startsWith('o')) {
                    const filtersApplied = await applyFilters(); // Re-appliquer les filtres
                    if (!filtersApplied) {
                        rl.close();
                        return;
                    }
                    await selectQuestions(); // Appel récursif pour permettre la nouvelle sélection de questions
                    return;
                }
            } else if (!isNaN(selection) && questions[selection - 1]) {
                // Si l'utilisateur entre un numéro valide, on sélectionne ou désélectionne la question
                const selectedQuestion = questions[selection - 1];
                const index = selectedQuestions.indexOf(selectedQuestion);
                if (index !== -1) {
                    selectedQuestions.splice(index, 1); // Désélectionne si déjà sélectionnée
                    console.log("Question désélectionnée.");
                } else {
                    selectedQuestions.push(selectedQuestion); // Ajoute si non sélectionnée
                    console.log("Question sélectionnée.");
                }
            } else if (selection) {
                console.log("Numéro invalide, veuillez réessayer.");
            }

        } while (selection); // Tant que l'utilisateur n'appuie pas sur Entrée
    };

    // Applique les filtres et commence la sélection des questions
    const filtersApplied = await applyFilters();
    if (!filtersApplied) {
        rl.close();
        return;
    }

    await selectQuestions();

    // Vérification du nombre de questions sélectionnées
    const checkQuestionsCount = async () => {
        if (selectedQuestions.length < 15) {
            const addQuestions = await askQuestion(rl, `Vous avez sélectionné ${selectedQuestions.length} question(s). L'examen doit en contenir au moins 15. Souhaitez-vous ajouter des questions ? (oui/non) : `);
            if (addQuestions.toLowerCase().startsWith('o')) {
                console.log("Recommençons la sélection avec les questions déjà sélectionnées.");
                const filtersApplied = await applyFilters();
                if (!filtersApplied) {
                    rl.close();
                    return;
                }
                await selectQuestions(); // Relance le processus de sélection de questions
            } else {
                console.log("Opération annulée. L'examen ne sera pas créé.");
                rl.close();
                return;
            }
        } else if (selectedQuestions.length > 20) {
            const deselectQuestions = await askQuestion(rl, `Vous avez sélectionné ${selectedQuestions.length} question(s), mais l'examen ne doit en comporter que 20 au maximum. Souhaitez-vous désélectionner certaines questions ? (oui/non) : `);
            if (deselectQuestions.toLowerCase().startsWith('o')) {
                console.log("Voici les questions sélectionnées :");
                selectedQuestions.forEach((q, index) => {
                    const parsed = parseQuestion(q);
                    console.log(`${index + 1}. ${parsed.title}`);
                });

                let deselectSelection;
                do {
                    deselectSelection = await askQuestion(rl, "Entrez le numéro d'une question à désélectionner (ou appuyez sur Entrée pour terminer) : ");
                    if (deselectSelection && !isNaN(deselectSelection) && selectedQuestions[deselectSelection - 1]) {
                        const deselectedQuestion = selectedQuestions[deselectSelection - 1];
                        selectedQuestions = selectedQuestions.filter(q => q !== deselectedQuestion); // Désélectionne la question
                        console.log("Question désélectionnée.");
                    }
                } while (deselectSelection); // Tant que l'utilisateur n'appuie pas sur Entrée
            } else {
                console.log("Opération annulée. L'examen ne sera pas créé.");
                rl.close();
                return;
            }
        }

        // Si après la désélection, le nombre de questions est toujours inférieur à 15
        if (selectedQuestions.length < 15) {
            const addQuestions = await askQuestion(rl, `Il vous reste ${selectedQuestions.length} question(s), voulez-vous en ajouter plus ? (oui/non) : `);
            if (addQuestions.toLowerCase().startsWith('o')) {
                const filtersApplied = await applyFilters();
                if (!filtersApplied) {
                    rl.close();
                    return;
                }
                await selectQuestions(); // Relance le processus de sélection de questions
            } else {
                console.log("Opération annulée. L'examen ne sera pas créé.");
            }
        }
    };

    await checkQuestionsCount();

    if (selectedQuestions.length === 0) {
        console.log("Aucune question sélectionnée. Opération annulée.");
        rl.close();
        return;
    }

    // Vérification du nombre de questions (toujours entre 15 et 20)
    if (selectedQuestions.length < 15 || selectedQuestions.length > 20) {
        console.log("L'examen doit comporter entre 15 et 20 questions. Opération annulée.");
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
};


   
 



 




   
