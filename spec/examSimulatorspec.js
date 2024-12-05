const fs = require('fs');
const readline = require('readline');
const { loadQuestions, parseQuestion, simulateExam } = require('../examSimulator');

describe("Exam Simulator Tests", () => {
    const mockFolderPath = 'D:GL02_PlanForYou\\SujetB_data';

    beforeEach(() => {
        spyOn(fs, 'readdirSync').and.returnValue(['test1.gift', 'test2.gift']);
        spyOn(fs, 'readFileSync').and.callFake((filePath) => {
            if (filePath.includes('test1.gift')) {
                return "::Question 1::What is the capital of France? {=Paris}";
            } else if (filePath.includes('test2.gift')) {
                return "::Question 2::2 + 2 equals? {=4}";
            }
            throw new Error('File not found');
        });
    });

    afterEach(() => {
        fs.readdirSync.calls.reset();
        fs.readFileSync.calls.reset();
    });

    describe("loadQuestions", () => {
        it("should load questions from valid GIFT files", () => {
            const questions = loadQuestions(mockFolderPath);
            expect(questions.length).toBe(2);
            expect(questions[0]).toContain("::Question 1::");
            expect(questions[1]).toContain("::Question 2::");
        });

        it("should throw an error if no GIFT files are found", () => {
            fs.readdirSync.and.returnValue([]); // Simulate an empty folder

            expect(() => loadQuestions(mockFolderPath))
                .toThrowError("Failed to load question bank: No valid .gift files found in the folder");
        });
    });

    describe("parseQuestion", () => {
        it("should parse a correctly formatted GIFT question", () => {
            const result = parseQuestion("::Question 1::What is the capital of France? {=Paris}");
            expect(result.title).toBe("Question 1");
            expect(result.response).toBe("What is the capital of France? {=Paris}");
        });

        it("should handle malformed or empty questions gracefully", () => {
            const malformedQuestion = "::Malformed::";
            const result = parseQuestion(malformedQuestion);
            expect(result.title).toBe("Malformed");
            expect(result.response).toBe("");
        });
    });

    describe("simulateExam", () => {
        const mockQuestions = [
            "::Question 1::What is the capital of France? {=Paris}",
            "::Question 2::2 + 2 equals? {=4}",
        ];

        it("should interactively process questions and provide correct feedback", (done) => {
            const mockAnswers = ["Paris", "5"];
            let answerIndex = 0;

            spyOn(readline, 'createInterface').and.callFake(() => ({
                question: (query, callback) => callback(mockAnswers[answerIndex++]),
                close: jasmine.createSpy('close'),
            }));

            const consoleLogSpy = spyOn(console, 'log').and.callThrough();

            simulateExam(mockQuestions).then(() => {
                expect(consoleLogSpy).toHaveBeenCalledWith("Question 1: Question 1");
                expect(consoleLogSpy).toHaveBeenCalledWith("Wrong answer!");
                expect(consoleLogSpy).toHaveBeenCalledWith("Question 2: Question 2");
                expect(consoleLogSpy).toHaveBeenCalledWith("Wrong answer!");
                done();
            });
        });
    });
});
