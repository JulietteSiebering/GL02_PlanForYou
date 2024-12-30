const readline = require("readline");
const fs = require("fs");
const usersFile = "./users.json"; // Chemin vers le fichier contenant les utilisateurs
const users = loadUsers(usersFile); // Charge les utilisateurs depuis le fichier JSON

// Définition des rôles
const roles = {
    admin: 0,
    teacher: 1,
    student: 2,
};

// Charge les utilisateurs depuis le fichier JSON
function loadUsers(filePath) {
    try {
        const data = fs.readFileSync(filePath, "utf8"); // Lit le fichier
        return JSON.parse(data); // Parse le contenu du fichier en JSON
    } catch (err) {
        console.error("Failed to load users:", err.message);
        return [];
    }
}

// Identifie un utilisateur par son nom
function identifyUser(userName) {
    const user = users.find(u => u.name === userName);
    if (user) {
        return roles[user.role];
    } else {
        return null;
    }
}

// Vérifie si un utilisateur a la permission d'exécuter une commande
function checkPermission(userName, users, requiredRole) {
    const userRole = identifyUser(userName, users);
    if (userRole === null) {
        return false;
    }
    return userRole <= requiredRole;
}

// Demande à l'utilisateur de saisir son nom
function promptUserForName() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question("This command is restricted \n Please enter your username: ", (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

module.exports = {
    roles,
    users,
    checkPermission,
    promptUserForName,
};