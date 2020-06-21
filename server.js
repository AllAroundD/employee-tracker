// loads confirmation information from the .env file
require('dotenv').config()

const mysql = require("mysql");
const inquirer = require("inquirer");
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');

class Database {
    constructor(config) {
        this.connection = mysql.createConnection(config);
    }
    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if (err)
                    return reject(err);
                resolve(rows);
            });
        });
    }
    close() {
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
}

const db = new Database({
    host: "localhost",
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_NAME,
    insecureAuth: true
});

async function start() {
    clear();
    console.log(
        chalk.yellow(
            figlet.textSync('Employee Tracker', { horizontalLayout: 'full' })
        )
    )
    // const dbroles = await db.query("SELECT * from role")
    // roles = []
    // dbroles.forEach(function (item) {
    //     roles.push({ name: item.title, value: item.id })
    // })
    // console.log(`roles: `, roles)

    response = await inquirer.prompt([
        {
            message: "What would you like to do?",
            type: "list",
            name: "action",
            choices: [
                { name: "View All Employees", value: "viewAll" },
                { name: "View All Employees by Department", value: "viewAllDept" },
                { name: "View All Employees by Manager", value: "viewAllManager" },
                { name: "Add Employee", value: "addEmp" },
                { name: "Remove Employee", value: "removeEmp" },
                { name: "Update Employee Role", value: "updateEmpRole" },
                { name: "Update Employee Manager", value: "updateEmpManager" },
            ]
        }
    ])
    console.log( response.action )
    if ( response.action == "viewAll" ){
        let employeeList = await db.query( 
            "SELECT emp.id AS id, emp.first_name AS first_name, emp.last_name AS last_name, r.title AS title, "+
            "d.name AS department, r.salary AS salary, CONCAT(m.first_name,' ',m.last_name) AS manager "+
            "FROM employee AS emp "+
            "LEFT JOIN employee AS m ON (emp.manager_id=m.id) "+
            "LEFT JOIN role AS r ON (emp.role_id=r.id) "+
            "LEFT JOIN department AS d ON (r.department_id=d.id)" 
        )
        console.table( employeeList )
    }
}

start()