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
                { name: "View All Roles", value: "viewRoles" },
                { name: "Add Role", value: "addRole" },
                { name: "Remove Role", value: "removeRole" },
                { name: "View All Departments", value: "viewDepts" },
                { name: "Add Department", value: "addDept" },
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
    } else if (response.action == "viewRoles") {
        await viewRoles()
    } else if (response.action == "viewDepts") {
        await viewDepts()
    } else if (response.action == "addDept") {
        await addDept()
    } else if (response.action == "removeDept") {
        await removeDept()
    } else if (response.action == "addRole") {
        await addRole()
    } else if (response.action == "removeRole") {
        await removeRole()

    } else if (response.action == "exit") {
        await db.close()
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
        "SELECT emp.id, emp.first_name, emp.last_name, r.title, d.name, r.salary, CONCAT(m.first_name,' ',m.last_name) AS manager "+
        "FROM employee emp, role r, department d, employee m "+
        "WHERE emp.manager_id=m.id "+ 
        "AND d.id=r.department_id "+
        "AND emp.role_id=r.id "+
        "AND d.id=?", response.dept
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
    console.log(`${response.firstname} ${response.lastname} was added successfully to the database`);
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

async function updateEmpRole(){
    employee = []
    const dbEmployee = await db.query(
        "SELECT CONCAT(first_name,' ', last_name) as name, id FROM employee;"
    )
    dbEmployee.forEach(function (item) {
        employee.push({ name: item.name, value: item.id })
    })
    employeeResponse = await inquirer.prompt([
        {
            message: "Which employee do you want to update?",
            type: "list",
            name: "employee",
            choices: employee
        }
    ])
    // console.log(`[response.employee]: ${response.employee}`)
    // get roles not equal to the employee id
    role = []
    dbRoles = await db.query(
        "SELECT * from role WHERE id <> ?", employeeResponse.employee
    )
    dbRoles.forEach(function (item) {
        role.push({ name: item.title, value: item.id }) 
    })
    response = await inquirer.prompt([
        {
            message: "Which role do you want to assign?",
            type: "list",
            name: "role",
            choices: role
        }


    ])
    // console.log(`[response.role]: ${response.role}`)
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

async function addRole() {
    dept = []
    const dbDept = await db.query("SELECT * from department")
    dbDept.forEach(function (item) {
        dept.push({ name: item.name, value: item.id })
    })
    response = await inquirer.prompt([
        {
            message: "What is the title of the role you want to add?",
            type: "input",
            name: "role",
            validate: (input) => {
                if (input == "") {
                    return `Error: Please enter the ${chalk.red("Role")}`
                }
                if (!validateName(input)) {
                    return `Error: Please enter a valid ${chalk.red("Role")}`
                }
                return true
            }
        },
        {
            message: "What is the salary?",
            type: "input",
            name: "salary",
            validate: function (value) {
                if (isNaN(value) === false && value !== "") {
                    return true
                }
                return `Error: Please enter a valid ${chalk.red('Salary')}`
            }
        },
        {
            message: "Which department is the role for?",
            type: "list",
            name: "dept",
            choices: dept
        }
    ])
    insertResponse = await db.query(
        "INSERT INTO role SET ?", { title: response.role, salary: response.salary, department_id: response.dept }
    )
    if (insertResponse.err) {
        throw err
        process.exit
    }
    console.log(`Added role ${response.role} to the database`)
    start()
}

async function removeRole() {
    role = []
    const dbRole = await db.query(
        "SELECT * FROM role;"
    )
    dbRole.forEach(function (item) {
        role.push({ name: item.title, value: item.id })
    })
    response = await inquirer.prompt([
        {
            message: "Which role do you want to remove?",
            type: "list",
            name: "role",
            choices: role
        }
    ])
    // update employee table if role was used
    updateResponse = await db.query(
        "UPDATE employee SET role_id=null WHERE role_id=?", response.role
    )
    if (updateResponse.err) {
        throw err
        process.exit()
    }
    deleteResponse = await db.query(
        "DELETE FROM role WHERE id=?", response.role
    )
    if (deleteResponse.err) {
        throw err
        process.exit
    }
    console.log(`Removed role from the database`)
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
    // update role table if department_id is used
    updateResponse = await db.query(
        "UPDATE role SET department_id=null WHERE department_id=?", response.dept
    )
    if (updateResponse.err) {
        throw err
        process.exit()
    }
    deleteResponse = await db.query(
        "DELETE FROM department WHERE id=?", response.dept
    )
    if (deleteResponse.err) {
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