/*
SPEC 3 : Génération de fichier VCards - ETAPE DE VALIDATION 
*/

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^\+?[0-9\s\-]{7,15}$/.test(phone);

module.exports = { validateEmail, validatePhone };