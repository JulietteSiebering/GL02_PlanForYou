const fs = require('fs');
const path = require('path');
//const { promisify } = require('util');
const { loadQuestions, parseQuestion, removeHtmlTags } = require('../generateGiftExam');

describe("Exam Generator Tests", () => {
    // Mock des fichiers pour les tests
    const mockFiles = {
        './mock1.gift': "::Question 1::Ceci est une question ? {~Non~Oui}",
        './mock2.gift': "::Question 2::Une autre question ? {~Non~=Oui}",
    };

    // Stub de la fonction fs.readFileSync
    beforeAll(() => {
        spyOn(fs, 'readFileSync').and.callFake((filePath) => {
            if (mockFiles[filePath]) {
                return mockFiles[filePath];
            }
            throw new Error(`File not found: ${filePath}`);
        });
    });

    describe("loadQuestions", () => {
        it("should load questions from valid GIFT files", () => {
            const questions = loadQuestions(['./mock1.gift', './mock2.gift']);
            expect(questions.length).toBe(2);
            expect(questions[0]).toContain("::Question 1::");
            expect(questions[1]).toContain("::Question 2::");
        });

        it("should throw an error for invalid file paths", () => {
            expect(() => loadQuestions(['./invalid.gift'])).toThrowError("File not found: ./invalid.gift");
        });
    });

    describe("parseQuestion", () => {
        it("should correctly parse a GIFT formatted question", () => {
            const input = '::Question 1::Ceci est une question ? {~Non~Oui}';
            const expected = {
                title: 'Question 1 ',
                response: 'Ceci est une question ? {~Non~Oui}'
            };
            const result = parseQuestion(input);
            expect(result).toEqual(expected);
        });

        it("should handle empty or malformed input gracefully", () => {
            const question = "::Malformed::";
            const result = parseQuestion(question);
            expect(result.title).toBe("Malformed ");
            expect(result.response).toBe("");
        });
    });

    describe("removeHtmlTags", () => {
        it("should remove HTML tags from a string", () => {
            const text = "<p>Ceci est une question</p>";
            const result = removeHtmlTags(text);
            expect(result).toBe("Ceci est une question");
        });

        it("should handle strings without HTML tags", () => {
            const text = "Pas de balises HTML ici";
            const result = removeHtmlTags(text);
            expect(result).toBe("Pas de balises HTML ici");
        });

        it("should remove [html] tags from a string", () => {
            const text = "Ceci est une question [html]";
            const result = removeHtmlTags(text);
            expect(result).toBe("Ceci est une question ");
        });
    });
});
