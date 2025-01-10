const { validateEmail, validatePhone } = require('../vCardsValidation'); 

describe('vCardsGeneration', () => {

    it('should validate a correct phone number', () => {
        const validPhone = '+1234567890';
        const isValid = validatePhone(validPhone);
        expect(isValid).toBeTrue();
    });

    it('should invalidate an incorrect phone number', () => {
        const invalidPhone = '12345';
        const isValid = validatePhone(invalidPhone);
        expect(isValid).toBeFalse();
    });

    it('should validate a correct email address', () => {
        const validEmail = 'test@example.com';
        const isValid = validateEmail(validEmail);
        expect(isValid).toBeTrue();
    });

    it('should invalidate an incorrect email address', () => {
        const invalidEmail = 'invalid-email';
        const isValid = validateEmail(invalidEmail);
        expect(isValid).toBeFalse();
    });


    it('should validate a non-empty first name', () => {
        const firstName = 'Jean';
        const isValid = firstName.trim().length > 0;
        expect(isValid).toBeTrue();
    });

    it('should validate a non-empty last name', () => {
        const lastName = 'Dupont';
        const isValid = lastName.trim().length > 0;
        expect(isValid).toBeTrue();
    });

    it('should invalidate an empty first name', () => {
        const firstName = '';
        const isValid = firstName.trim().length > 0;
        expect(isValid).toBeFalse();
    });

    it('should invalidate an empty last name', () => {
        const lastName = '';
        const isValid = lastName.trim().length > 0;
        expect(isValid).toBeFalse();
    });

});

