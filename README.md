# employee-tracker

## Description:
  This is a command line application (CLI) to manage company's employees using node, inquirer, and MySQL.

## Table of Contents
  - [Installation](#Installation)
  - [Usage](#Usage)
  - [License](#License)
  - [Contributing](#Contributing)
  - [Tests](#Tests)
  - [Questions](#Questions)

## Installation
  There are a few npm modules that are required (dotenv, mysql, inquirer, chalk, clear, figlet, console.table). Once the repository is cloned, typing 'npm install' at the command prompt will install all of the required modules.
  This application requires 'MySql Workbench' to be installed.
  A '.env' file will need to be created in the main folder of the application after cloning, with the following info:
    DB_USER=<your user name (usually it is 'root'>)
    DB_NAME=<your database name>
    DB_PWD=<your password>
  Then typing 'npm start init' will initialize the database before the menu loads. Note: the 'init' only needs to be included in the command line when the database needs to be initialized or restored.
  Once the user runs the program by typing 'node start', a menu will be displayed to manage departments, roles, employees.

## Usage
    
  After the installation steps mentioned above, the user runs the program by typing 'npm start'. The application was designed as a solution to manage a company's employees so a variety of options will be displayed. Here is the list of actions:
    "View All Employees"
    "View All Employees by Department"
    "View All Employees by Manager"
    "Add Employee"
    "Remove Employee"
    "Update Employee Role"
    "Update Employee Manager"
    "View All Roles"
    "Add Role"
    "Remove Role"
    "View All Departments"
    "Add Department"
    "View Department Budget"
    "Remove Department"
    "Exit Application"  

Here is an example of the application in action:
![employee tracker demo](./assets/employeetracker-demo.gif)

## License
  

## Contributing
  

## Tests
  No formal tests documented. The usage demo gif above shows some of the tests that were performed.

## Questions
![GitHub Profile Image](https://avatars3.githubusercontent.com/u/64918107?s=460&u=4277fa2bf868713adec524f08700cee517941e82&v=4)

[GitHub Profile](https://github.com/AllAroundD/)

-If you have any questions, please contact me at [dougmoore@use.startmail.com](mailto:dougmoore@use.startmail.com?subject=[GitHub]%20Source%20Question).
