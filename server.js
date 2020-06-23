require('dotenv').config()      // loads confirmation information from the .env file
const mysql = require("mysql")
const inquirer = require("inquirer")
const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')
const cTable = require('console.table')
// regular expressions to validate input
const regexName = /^[a-zA-Z-,]+(\s{0,1}[a-zA-Z-, ])*$/

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

const distinctManagerSQL = "SELECT CONCAT(first_name,' ', last_name) as manager, id FROM employee " +
    "where id in (SELECT distinct manager_id from employee);"
const distinctRoleSQL = "SELECT DISTINCT title, id FROM role;"


// function to validate name
function validateName(inputtxt) {
    return (!regexName.test(inputtxt)) ? false : true
}


async function start() {

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
                { name: "View All Employees by Department", value: "viewAllbyDept" },
                { name: "View All Employees by Manager", value: "viewAllbyManager" },
                { name: "Add Employee", value: "addEmp" },
                { name: "Remove Employee", value: "removeEmp" },
                { name: "Update Employee Role", value: "updateEmpRole" },
                { name: "Update Employee Manager", value: "updateEmpManager" },
                { name: "View All Roles", value: "viewRole" },
                { name: "Add Role", value: "addRole" },
                { name: "Remove Role", value: "removeRole" },
                { name: "View All Departments", value: "viewDepts" },
                { name: "Add Department", value: "addDept" },
                { name: "Remove Department", value: "removeDept" },
                { name: "Exit", value: "exit" },]
        }
    ])
    console.log(response.action)
    if (response.action == "viewAll") {
        viewAllEmployees()
    } else if (response.action == "viewAllbyDept") {
        viewAllEmployeesbyDept()
    } else if (response.action == "viewAllbyManager") {
        viewAllEmployeesbyManager()
    } else if (response.action == "addEmp") {
        addEmployee()
    } else if (response.action == "removeEmp") {
        removeEmployee()
    } else if (response.action == "viewDepts") {
        viewDepts()
    } else if (response.action == "addDept") {
        addDept()
    } else if (response.action == "removeDept") {
        removeDept()

    } else if (response.action == "exit") {
        db.close()
    }
}

async function viewAllEmployees() {
    let employeeList = await db.query(
        "SELECT emp.id AS id, emp.first_name AS first_name, emp.last_name AS last_name, r.title AS title, " +
        "d.name AS department, r.salary AS salary, CONCAT(m.first_name,' ',m.last_name) AS manager " +
        "FROM employee AS emp " +
        "LEFT JOIN employee AS m ON (emp.manager_id=m.id) " +
        "LEFT JOIN role AS r ON (emp.role_id=r.id) " +
        "LEFT JOIN department AS d ON (r.department_id=d.id)"
    )
    console.table(employeeList)
    start()
}

async function viewAllEmployeesbyDept() {
    dept = []
    const dbDept = await db.query("SELECT * from department")
    dbDept.forEach(function (item) {
        dept.push({ name: item.name, value: item.id })
    })
    response = await inquirer.prompt([
        {
            message: "Which department do you want to view?",
            type: "list",
            name: "dept",
            choices: dept
        }
    ])
    let employeeList = await db.query(
        "SELECT emp.id AS id, emp.first_name AS first_name, emp.last_name AS last_name, r.title AS title, " +
        "d.name AS department, r.salary AS salary, CONCAT(m.first_name,' ',m.last_name) AS manager " +
        "FROM employee AS emp " +
        "LEFT JOIN employee AS m ON (emp.manager_id=m.id) " +
        "LEFT JOIN role AS r ON (emp.role_id=r.id) " +
        "LEFT JOIN department AS d ON (r.department_id=?)", response.dept
    )
    console.table(employeeList)
    start()
}

async function viewAllEmployeesbyManager() {
    manager = []
    const dbManager = await db.query(distinctManagerSQL)
    dbManager.forEach(function (item) {
        manager.push({ name: item.manager, value: item.id })
    })
    response = await inquirer.prompt([
        {
            message: "Which employee manager do you want to view?",
            type: "list",
            name: "manager",
            choices: manager
        }
    ])
    let employeeList = await db.query(
        "SELECT emp.id AS id, emp.first_name AS first_name, emp.last_name AS last_name, r.title AS title, " +
        "d.name AS department, r.salary AS salary, CONCAT(m.first_name,' ',m.last_name) AS manager " +
        "FROM employee AS emp, role AS r, department as d, employee AS m " +
        "WHERE emp.manager_id=? " +
        "AND emp.role_id=r.id " +
        "AND r.department_id=d.id " +
        "AND emp.manager_id=m.id", response.manager
    )
    console.table(employeeList)
    start()
}

async function addEmployee() {
    role = [], manager = []
    dbRole = await db.query(distinctRoleSQL)              // get distinct roles
    dbRole.forEach(function (item) {
        role.push({ name: item.title, value: item.id })
    })
    const dbManager = await db.query(distinctManagerSQL)  // get distinct manager names
    dbManager.forEach(function (item) {
        manager.push({ name: item.manager, value: item.id })
    })
    response = await inquirer.prompt([
        {
            message: "What is the employee's first name?",
            type: "input",
            name: "firstname",
            validate: (input) => {
                if (input == "") {
                    return `Error: Please enter the ${chalk.red("Employee's First Name")}`
                }
                if (!validateName(input)) {
                    return `Error: Please enter a valid ${chalk.red("Employee's First Name")}`
                }
                return true
            }
        },
        {
            message: "What is the employee's last name?",
            type: "input",
            name: "lastname",
            validate: (input) => {
                if (input == "") {
                    return `Error: Please enter the ${chalk.red("Employee's Last Name")}`
                }
                if (!validateName(input)) {
                    return `Error: Please enter a valid ${chalk.red("Employee's Last Name")}`
                }
                return true
            }
        },
        {
            message: "What is the employee's role?",
            type: "list",
            name: "role",
            choices: role
        },
        {
            message: "Who is the employee's manager?",
            type: "list",
            name: "manager",
            choices: manager
        }
    ])
    insertResponse = await db.query(
        "INSERT INTO employee SET ?",
        {
            first_name: response.firstname,
            last_name: response.lastname,
            role_id: response.role,
            manager_id: response.manager
        })
    if (insertResponse.err) {
        throw err
        process.exit
    }
    console.log(`${response.first_name} ${last_name} was added successfully to the database`);
    // re-prompt the user
    start()
}

async function removeEmployee() {
    employee = []
    const dbEmployee = await db.query(
        "SELECT CONCAT(first_name,' ', last_name) as name, id FROM employee;"
    )
    dbEmployee.forEach(function (item) {
        employee.push({ name: item.name, value: item.id })
    })
    response = await inquirer.prompt([
        {
            message: "Which employee do you want to remove?",
            type: "list",
            name: "employee",
            choices: employee
        }
    ])
    console.log(`id: ${response.employee}`)
    deleteResponse = await db.query(
        "DELETE FROM employee WHERE id=?", response.employee
    )
    if (deleteResponse.err) {
        throw err
        process.exit
    }
    console.log(`Removed employee from the database`)
    // re-prompt the user
    start()

}

async function viewDepts() {
    depts = []
    dbDepts = await db.query(
        "SELECT * from department"
    )
    console.table(dbDepts)
    start()
}

async function addDept() {
    response = await inquirer.prompt([
        {
            message: "What is the name of the Department?",
            type: "input",
            name: "deptName",
            validate: (input) => {
                if (input == "") {
                    return `Error: Please enter the ${chalk.red("Department Name")}`
                }
                if (!validateName(input)) {
                    return `Error: Please enter a valid ${chalk.red("Department Name")}`
                }
                return true
            }
        }
    ])
    let dept = response.deptName
    insertResponse = await db.query(
        "INSERT INTO department SET ?", { name: response.deptName })
    if (insertResponse.err) {
        throw err
        process.exit
    }
    console.log(`Added department ${response.deptName} to the database`)
    start()
}

async function removeDept() {
    dept = []
    const dbDept = await db.query("SELECT * from department")
    dbDept.forEach(function (item) {
        dept.push({ name: item.name, value: item.id })
    })
    response = await inquirer.prompt([
    {
        message: "Which department do you want to remove?",
        type: "list",
        name: "dept",
        choices: dept
    }])
    console.log(response.dept)
    // update role table if department_id is used
    updateResponse = await db.query(
        "UPDATE role SET department_id=null WHERE department_id=?", response.dept
    )
    if (updateResponse.err){
        throw err
        process.exit()
    }
    deleteResponse = await db.query(
        "DELETE FROM department WHERE id=?", response.dept
    )
    if (deleteResponse.err){
        throw err
        process.exit()
    }
    console.log("Removed the department from the database")
    start()
}

clear();
// display banner
console.log(
    chalk.yellow(
        figlet.textSync('Employee Tracker', { horizontalLayout: 'full' })
    )
)
// call to start menu
start()