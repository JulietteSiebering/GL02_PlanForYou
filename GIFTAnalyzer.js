//SPEC5 et SPEC6
const fs = require('fs');

class GIFTAnalyzer {
    constructor() {
        this.questionTypeCounts = {
            'Multiple Choice': 0,
            'True/False': 0,
            'Matching': 0,
            'Missing Word': 0,
            'Numeric': 0,
            'Open Question': 0,
        };
    }

    // Parse GIFT file data into structured questions
    parseGiftData(giftData) {
        const questions = [];
        const rawQuestions = giftData.split(/\n\n+/); // Split by double newlines
        rawQuestions.forEach(rawQuestion => {
            const match = rawQuestion.match(/^(.*?)\{(.*?)\}$/s); // Match question text and answers
            if (match) {
                const text = match[1].trim();
                const options = match[2].split("~").map(opt => opt.replace(/^[=]/, "").trim());
                const correctIndex = match[2].split("~").findIndex(opt => opt.startsWith("="));
                questions.push({ text, options, correctIndex });
            }
        });
        return questions;
    }

    // Load questions from file paths
    loadQuestions(filePaths) {
        let allQuestions = [];
        filePaths.forEach(filePath => {
            try {
                if (!fs.existsSync(filePath)) {
                    throw new Error(`File not found: ${filePath}`);
                }
                const content = fs.readFileSync(filePath, 'utf-8'); // Read file content
                const questions = this.parseGiftData(content); // Parse content into structured questions
                allQuestions = allQuestions.concat(questions); // Merge all questions
            } catch (error) {
                console.error(`Error loading file ${filePath}: ${error.message}`);
            }
        });
        return allQuestions;
    }

    // Identify the type of a question
    getQuestionType(question) {
        const content = question.text + question.options.join(' ');
        if (content.includes('~') && content.includes('=')) return 'Multiple Choice';
        if (content.includes('TRUE') || content.includes('FALSE')) return 'True/False';
        if (content.includes('->')) return 'Matching';
        if (content.includes('[...]')) return 'Missing Word';
        if (content.includes('#')) return 'Numeric';
        return 'Open Question';
    }

    // Analyze the distribution of question types
    analyzeQuestions(questions) {
        // Reset counts for each question type
        this.questionTypeCounts = {
            'Multiple Choice': 0,
            'True/False': 0,
            'Matching': 0,
            'Missing Word': 0,
            'Numeric': 0,
            'Open Question': 0,
        };

        questions.forEach(question => {
            const type = this.getQuestionType(question); // Determine the question type
            this.questionTypeCounts[type]++;
        });
        return this.questionTypeCounts;
    }

    // Calculate the average profile from multiple files
    calculateAverageProfile(profiles) {
        const totalFiles = profiles.length;
        const aggregatedProfile = {
            'Multiple Choice': 0,
            'True/False': 0,
            'Matching': 0,
            'Missing Word': 0,
            'Numeric': 0,
            'Open Question': 0,
        };

        // Aggregate counts from all profiles
        profiles.forEach(profile => {
            Object.keys(profile).forEach(type => {
                aggregatedProfile[type] += profile[type];
            });
        });

        // Compute the average for each question type
        const averageProfile = {};
        Object.keys(aggregatedProfile).forEach(type => {
            averageProfile[type] = Math.round(aggregatedProfile[type] / totalFiles);
        });

        return averageProfile;
    }

    // Display a histogram for question type distribution
    displayHistogram(questionTypeCounts) {
        console.log('\n=== Question Type Distribution ===');
        Object.entries(questionTypeCounts).forEach(([type, count]) => {
            console.log(`${type.padEnd(20)}: ${'■'.repeat(count)} (${count})`);
        });
    }

    // Compare a specific file profile with the average profile
    compareProfiles(fileProfile, averageProfile) {
        console.log('\n=== Profile Comparison ===');
        console.log('Type                | Specific File | Average Profile');
        console.log('--------------------|---------------|----------------');
        Object.keys(fileProfile).forEach(type => {
            const specificCount = fileProfile[type] || 0;
            const averageCount = averageProfile[type] || 0;
            console.log(`${type.padEnd(20)} | ${specificCount.toString().padStart(13)} | ${averageCount.toString().padStart(15)}`);
        });
    }

    // Generate exam statistics and save to a file
    generateExamStatistics(questions, outputPath) {
        const totalQuestions = questions.length;
        if (totalQuestions === 0) {
            console.error('No questions provided for statistics generation.');
            return;
        }

        // Count question types
        const questionTypeCounts = this.analyzeQuestions(questions);

        // Calculate percentages
        const questionTypePercentages = {};
        Object.keys(questionTypeCounts).forEach(type => {
            questionTypePercentages[type] = ((questionTypeCounts[type] / totalQuestions) * 100).toFixed(2);
        });

        // Generate statistics
        const statistics = {
            totalQuestions,
            typeCounts: questionTypeCounts,
            typePercentages: questionTypePercentages,
        };

        console.log('\n=== Exam Statistics ===');
        console.log(`Total Questions: ${statistics.totalQuestions}`);
        console.log('Question Types Distribution:');
        Object.keys(statistics.typeCounts).forEach(type => {
            console.log(`${type.padEnd(20)}: ${statistics.typeCounts[type]} (${statistics.typePercentages[type]}%)`);
        });

        // Save to file
        try {
            fs.writeFileSync(outputPath, JSON.stringify(statistics, null, 2));
            console.log(`\nStatistics saved to ${outputPath}`);
        } catch (error) {
            console.error('Error saving statistics:', error.message);
        }
    }
}

module.exports = { GIFTAnalyzer };
