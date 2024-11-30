/*
SPEC 3 : Génération de fichier VCards 
*/

const readline = require('readline');
const vCardsJS = require('vcards-js');
const { validateEmail, validatePhone } = require('./vCardsValidation'); 

module.exports = function vCardsGeneration() {

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (question) => new Promise((resolve) => rl.question(question, resolve));

    const askUntilValid = async (question, validationFn, errorMessage) => {
        let input;
        do {
            input = await askQuestion(question);
            if (!validationFn(input)) {
                console.error(errorMessage);
            }
        } while (!validationFn(input));
        return input;
    };

    const start = async () => {
        console.log("=== Génération de fichier VCards ===");

        // Collect user inputs with validation 
        const firstName = await askUntilValid(
            "Prénom : ",
            (input) => input.trim().length > 0,
            "Erreur : Le prénom est obligatoire. Veuillez réessayer !"
        );

        const lastName = await askUntilValid(
            "Nom : ",
            (input) => input.trim().length > 0,
            "Erreur : Le nom est obligatoire. Veuillez réessayer !"
        );

        const email = await askUntilValid(
            "Email : ",
            (input) => input.trim().length > 0 && validateEmail(input),
            "Erreur : Email manquant ou invalide. Veuillez entrer un email valide !"
        );

        const cellPhone = await askUntilValid(
            "Téléphone : ",
            (input) => input.trim().length > 0 && validatePhone(input),
            "Erreur : Numéro de téléphone manquant ou invalide. Veuillez entrer un numéro valide !"
        );

        // Create and save the VCard
        const vCard = vCardsJS();
        vCard.firstName = firstName;
        vCard.lastName = lastName;
        vCard.email = email;
        vCard.cellPhone = cellPhone;

        const file = `${firstName}_${lastName}.vcf`;

        try {
            vCard.saveToFile(file);
            console.log(`VCard générée avec succès dans le fichier : ${file}`);
        } catch (error) {
            console.error("Erreur lors de la sauvegarde du fichier :", error);
        } finally {
            rl.close();
        }
    };

start();

};

