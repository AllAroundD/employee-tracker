require('dotenv').config()      // loads confirmation information from the .env file
const mysql = require("mysql")
const inquirer = require("inquirer")
const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')
const cTable = require('console.table')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const regexName = /^[a-zA-Z-,]+(\s{0,1}[a-zA-Z-, ])*$/      // regular expression to validate input

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
})

const distinctEmployeeSQL = "SELECT CONCAT(first_name,' ', last_name) as name, id FROM employee;"
const distinctManagerSQL = "SELECT CONCAT(first_name,' ', last_name) as manager, id FROM employee " +
    "where id in (SELECT distinct manager_id from employee);"
const distinctRoleSQL = "SELECT DISTINCT title, id FROM role;"
const distinctDeptSQL = "SELECT distinct id, name FROM department;"


// function to validate name
function validateName(inputtxt) {
    return (!regexName.test(inputtxt)) ? false : true
}


// This is the main screen that gets called for the menu
async function start() {
    const command = process.argv[2]

    if (command == 'init') {
        // re-create database if init is passed as an argument
        const { stdout, stderr } = await exec(`mysql -uroot -p${process.env.DB_PWD} < db/seed.sql`);
        //   console.log('stdout:', stdout);
        //   console.log('stderr:', stderr);
    }
    response = await inquirer.prompt([
        {
            message: `${chalk.green("What would you like to do?")}`,
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
                { name: "View All Roles", value: "viewRoles" },
                { name: "Add Role", value: "addRole" },
                { name: "Remove Role", value: "removeRole" },
                { name: "View All Departments", value: "viewDepts" },
                { name: "Add Department", value: "addDept" },
                { name: "View Department Budget", value: "viewDeptBudget" },
                { name: "Remove Department", value: "removeDept" },
                { name: "Exit", value: "exit" },]
        }
    ])
    // console.log(response.action)
    if (response.action == "viewAll") {
        await viewAllEmployees()
    } else if (response.action == "viewAllbyDept") {
        await viewAllEmployeesbyDept()
    } else if (response.action == "viewAllbyManager") {
        await viewAllEmployeesbyManager()
    } else if (response.action == "addEmp") {
        await addEmployee()
    } else if (response.action == "removeEmp") {
        await removeEmployee()
    } else if (response.action == "updateEmpRole") {
        await updateEmpRole()
    } else if (response.action == "updateEmpManager") {
        await updateEmpManager()
    } else if (response.action == "viewRoles") {
        await viewRoles()
    } else if (response.action == "viewDepts") {
        await viewDepts()
    } else if (response.action == "addDept") {
        await addDept()
    } else if (response.action == "removeDept") {
        await removeDept()
    } else if (response.action == "viewDeptBudget") {
        await viewDeptBudget()
    } else if (response.action == "addRole") {
        await addRole()
    } else if (response.action == "removeRole") {
        await removeRole()
    } else if (response.action == "exit") {
        await db.close()
    }
}

// This is to view all employees
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

// This is to view all employees by a specific department
async function viewAllEmployeesbyDept() {
    dept = []
    const dbDept = await db.query("SELECT * from department")
    dbDept.forEach(function (item) { dept.push({ name: item.name, value: item.id }) })
    response = await inquirer.prompt([
        {
            message: `${chalk.green("Which department do you want to view?")}`,
            type: "list",
            name: "dept",
            choices: dept
        }
    ])
    console.log(response.dept)
    let employeeList = await db.query(
        "SELECT emp.id AS id, emp.first_name AS first_name, emp.last_name AS last_name, r.title AS title, " +
        "d.name AS department, r.salary AS salary, CONCAT(m.first_name,' ',m.last_name) AS manager " +
        "FROM employee AS emp " +
        "LEFT JOIN employee AS m ON (emp.manager_id=m.id) " +
        "LEFT JOIN role AS r ON (emp.role_id=r.id) " +
        "LEFT JOIN department AS d ON (r.department_id=d.id) " +
        "WHERE r.department_id=?", response.dept
    )
    console.table(employeeList)
    start()
}

// This is to view all employees by a specific manager
async function viewAllEmployeesbyManager() {
    manager = []
    const dbManager = await db.query(distinctManagerSQL)
    dbManager.forEach(function (item) { manager.push({ name: item.manager, value: item.id }) })
    response = await inquirer.prompt([
        {
            message: `${chalk.green("Which employee manager do you want to view?")}`,
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

// This is to add an employee to the employee table
async function addEmployee() {
    role = [], manager = []
    dbRole = await db.query(distinctRoleSQL)              // get distinct roles
    dbRole.forEach(function (item) { role.push({ name: item.title, value: item.id }) })
    const dbManager = await db.query(distinctManagerSQL)  // get distinct manager names
    manager.push({ name: "None", value: null })
    dbManager.forEach(function (item) { manager.push({ name: item.manager, value: item.id }) })
    response = await inquirer.prompt([
        {
            message: `${chalk.green("What is the employee's first name?")}`,
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
            message: `${chalk.green("What is the employee's last name?")}`,
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
            message: `${chalk.green("What is the employee's role?")}`,
            type: "list",
            name: "role",
            choices: role
        },
        {
            message: `${chalk.green("Who is the employee's manager?")}`,
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
    console.log(`${response.firstname} ${response.lastname} was added successfully to the database`);
    // re-prompt the user
    start()
}

// This is to remove an employee from the list
async function removeEmployee() {
    employee = []
    const dbEmployee = await db.query(distinctEmployeeSQL)
    dbEmployee.forEach(function (item) { employee.push({ name: item.name, value: item.id }) })
    response = await inquirer.prompt([
        {
            message: `${chalk.green("Which employee do you want to remove?")}`,
            type: "list",
            name: "employee",
            choices: employee
        },
        {
            message: `${chalk.green("Are you sure?")}`,
            type: "confirm",
            name: "confirm"
        }
    ])
    if (response.confirm) {
        deleteResponse = await db.query("DELETE FROM employee WHERE id=?", response.employee)
        if (deleteResponse.err) {
            throw err
            process.exit
        }
        console.log(`Removed employee from the database`)
    }
    // re-prompt the user
    start()

}

// This is to update the employee role for the employee that is prompted
async function updateEmpRole() {
    employee = []
    const dbEmployee = await db.query(distinctEmployeeSQL)
    dbEmployee.forEach(function (item) { employee.push({ name: item.name, value: item.id }) })
    employeeResponse = await inquirer.prompt([
        {
            message: `${chalk.green("Which employee do you want to update?")}`,
            type: "list",
            name: "employee",
            choices: employee
        }
    ])
    // get roles not equal to the employee id
    role = []
    dbRoles = await db.query("SELECT * from role WHERE id <> ?", employeeResponse.employee)
    dbRoles.forEach(function (item) { role.push({ name: item.title, value: item.id }) })
    response = await inquirer.prompt([
        {
            message: `${chalk.green("Which role do you want to assign?")}`,
            type: "list",
            name: "role",
            choices: role
        }
    ])
    updateResponse = await db.query(
        "UPDATE employee SET role_id = ? WHERE id = ?", [response.role, employeeResponse.employee]
    )
    if (updateResponse.err) {
        throw err
        process.exit
    }
    console.log(`Role was updated successfully`)
    start()
}

// This is to update the manager for specific employee that is prompted
async function updateEmpManager() {
    employee = []
    dbEmployee = await db.query(distinctEmployeeSQL)
    dbEmployee.forEach(function (item) { employee.push({ name: item.name, value: item.id }) })
    response = await inquirer.prompt(
        {
            message: `${chalk.green("Which employee's manager do you want to update?")}`,
            type: "list",
            name: "employee",
            choices: employee
        }
    )
    manager = []
    manager.push({ name: "None", value: null })
    employee.forEach(function (item) {
        if (item.value !== response.employee) manager.push({ name: item.name, value: item.value })
    })
    managerResponse = await inquirer.prompt(
        {
            message: `${chalk.green("Which employee do you want to set as Manager for the selected employee?")}`,
            type: "list",
            name: "manager",
            choices: manager
        }
    )
    updateResponse = await db.query("UPDATE employee SET ? WHERE ?", [{ manager_id: managerResponse.manager }, { id: response.employee }])
    if (updateResponse.err) {
        throw err
        process.exit
    }
    console.log(`Employee's Manager was updated successfully`)
    start()
}

// This is to display all of the employee roles
async function viewRoles() {
    roles = []
    dbRoles = await db.query(
        "SELECT r.id, r.title, r.salary, d.name as department " +
        "FROM role r, department d " +
        "WHERE r.department_id=d.id;"
    )
    console.table(dbRoles)
    start()
}

// This is to add the employee role.
async function addRole() {
    dept = []
    const dbDept = await db.query("SELECT * from department")
    dbDept.forEach(function (item) { dept.push({ name: item.name, value: item.id }) })
    response = await inquirer.prompt([
        {
            message: `${chalk.green("What is the title of the role you want to add?")}`,
            type: "input",
            name: "role",
            validate: (input) => {
                if (input == "") { return `Error: Please enter the ${chalk.red("Role")}` }
                if (!validateName(input)) { return `Error: Please enter a valid ${chalk.red("Role")}` }
                return true
            }
        },
        {
            message: `${chalk.green("What is the salary?")}`,
            type: "input",
            name: "salary",
            validate: function (value) {
                if (isNaN(value) === false && value !== "") { return true }
                return `Error: Please enter a valid ${chalk.red('Salary')}`
            }
        },
        {
            message: `${chalk.green("Which department is the role for?")}`,
            type: "list",
            name: "dept",
            choices: dept
        }
    ])
    insertResponse = await db.query("INSERT INTO role SET ?",
        { title: response.role, salary: response.salary, department_id: response.dept })
    if (insertResponse.err) {
        throw err
        process.exit
    }
    console.log(`Added role ${response.role} to the database`)
    start()
}

async function removeRole() {
    role = []
    const dbRole = await db.query("SELECT * FROM role;")
    dbRole.forEach(function (item) { role.push({ name: item.title, value: item.id }) })
    response = await inquirer.prompt([
        {
            message: `${chalk.green("Which role do you want to remove?")}`,
            type: "list",
            name: "role",
            choices: role
        },
        {
            message: `${chalk.green("Are you sure?")}`,
            type: "confirm",
            name: "confirm"
        }
    ])
    if (response.confirm) {
        // update employee table if role was used
        updateResponse = await db.query("UPDATE employee SET role_id=null WHERE role_id=?", response.role)
        if (updateResponse.err) {
            throw err
            process.exit()
        }
        deleteResponse = await db.query("DELETE FROM role WHERE id=?", response.role)
        if (deleteResponse.err) {
            throw err
            process.exit
        }
        console.log(`Removed role from the database`)
    }
    // re-prompt the user
    start()

}

async function viewDepts() {
    depts = []
    dbDepts = await db.query("SELECT * from department")
    console.table(dbDepts)
    start()
}

async function addDept() {
    response = await inquirer.prompt([
        {
            message: `${chalk.green("What is the name of the Department?")}`,
            type: "input",
            name: "deptName",
            validate: (input) => {
                if (input == "") { return `Error: Please enter the ${chalk.red("Department Name")}` }
                if (!validateName(input)) { return `Error: Please enter a valid ${chalk.red("Department Name")}` }
                return true
            }
        }
    ])
    insertResponse = await db.query("INSERT INTO department SET ?", { name: response.deptName })
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
    dbDept.forEach(function (item) { dept.push({ name: item.name, value: item.id }) })
    response = await inquirer.prompt([
        {
            message: `${chalk.green("Which department do you want to remove?")}`,
            type: "list",
            name: "dept",
            choices: dept
        },
        {
            message: `${chalk.green("Are you sure?")}`,
            type: "confirm",
            name: "confirm"
        }
    ])
    if (response.confirm) {
        // update role table if department_id is used
        updateResponse = await db.query("UPDATE role SET department_id=null WHERE department_id=?", response.dept)
        if (updateResponse.err) {
            throw err
            process.exit()
        }
        deleteResponse = await db.query("DELETE FROM department WHERE id=?", response.dept)
        if (deleteResponse.err) {
            throw err
            process.exit()
        }
        console.log("Removed the department from the database")
    }
    start()
}

// Function to view the total budget for a department
async function viewDeptBudget() {
    dept = []
    dbDept = await db.query(distinctDeptSQL)
    dbDept.forEach(function (item) { dept.push({ name: item.name, value: item.id }) })
    response = await inquirer.prompt(
        {
            message: "Which department do you want to see the budget for?",
            type: "list",
            name: "dept",
            choices: dept
        }
    )
    selectResponse = await db.query(
        "SELECT d.name dept, r.title, r.salary "+
        "FROM employee emp LEFT JOIN role r on emp.role_id = r.id "+
        "LEFT JOIN department d ON r.department_id = d.id "+
        "WHERE d.id = ? "+
        "UNION "+
        "SELECT 'Total', '-', SUM(r.salary) "+
        "FROM employee emp LEFT JOIN role r on emp.role_id = r.id "+
        "LEFT JOIN department d ON r.department_id = d.id "+
        "WHERE d.id = ?;", [response.dept, response.dept]
    )
    console.table(selectResponse)
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