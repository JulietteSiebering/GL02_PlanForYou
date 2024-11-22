const fs = require('fs');
const vCards = require('./vCardsGeneration'); 
const generateGIFT = require('./generateGIFT'); 

const cli = require("@caporal/core").default;

cli
	.version('vpf-parser-cli')
	.version('0.07')

	// SPEC 3 : Generate Vcards
	.command('vCardsGenerate', 'Generate Professor vCards')
	.action(() => {
		vCards();
    })

    // SPEC 1 et 2 
    .command('generateGIFT', 'Create Test')
    .action(() => {
        generateGIFT();
    })
		
cli.run(process.argv.slice(2));