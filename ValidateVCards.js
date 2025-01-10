/*
SPEC 3 : Génération de fichier VCards - ETAPE DE VALIDATION 
*/
const validateName = (name) => /^[a-zA-Z\s\-]{2,30}$/.test(name);
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^\+?[0-9\s\-]{7,15}$/.test(phone);


module.exports = { validateName, validateEmail, validatePhone };