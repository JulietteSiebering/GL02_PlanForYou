# GL02_PlanForYou
### README - Projet GL02 - PlanForYou

Description : Develop a command line tool that answers functional specifications provided by the group "Les Kirbies"

### Installation

Please ensure that npm is installed and updated. 

$ npm install

### Utilisation :

To use this tool, caporalCli.js file takes the role of the main file. The syntax to use a developed command is :

$ node caporalCli.js <command>

### Functions :

<command> : generateGIFT

This function generates a Gift exam file, by searching and choosing questions from a database that is in file named "SujetB_data"

<command> : vCardsGenerate

This function generates a Vcard file, based on information that the user enters

<command> : simulateExam

This function imports a Gift file, extracts the questions/answers and simulates an exam.

<command> : analyzeExam

This function import a Gift exam file, and checks if it answers SRYEM requirements

<command> : examProfil

This function imports a Gift file and creates a static analysis of the file.

<command> : compareExamFiles

This function imports 2 Gift exam files and compares them, showing similarities and differences

<command> : importGIFT

This function imports a Gift file and lets the user modify a question

<command> : exportProfil

Thus function imports a Gift file, creates a static analysis and exports the analysis in a .txt file

### Examples

A directory "test" with 2 files "test.gift" and "test2.gift" are provided with the command line tool. The 2 files can be used to test the developped functions.

### Version :

#### 1.5

- Needs Spec developpement


Git d'origine : https://github.com/Klim200/GL02_PlanForYou

### Liste des contributeurs originaux 
Camille Guth (camille.guth@utt.fr)

Xinyu Hu (xinyu.hu@utt.fr)

Klimentiy Mirek (klimentiy.mirek@utt.fr)

### Liste des contributeurs repreneurs 

Iris Gagniere (iris.gagniere@utt.fr)

Juliette Siebering (juliette.siebering@utt.fr)

Paul Fernandez (paul.fernandez@utt.fr)