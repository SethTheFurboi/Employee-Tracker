const inquirer = require('inquirer');
const mysql = require('mysql2');

// Connect to database
const db = mysql.createConnection(
  {
    host: 'localhost',
    // MySQL username,
    user: 'root',
    // TODO: Add MySQL password here
    password: 'Wwoy6trwrt',
    database: 'employee_db'
  },
  console.log(`Connected to the employee_db database.`)
);

function SQLDisconnect() {

    db.end((error) => {

        if (error) {
          console.error('Error closing MySQL connection:', error);
          return;
        }
    
    });

}

// Grab the initial databases, probably not the most efficent way to do it but hey, it works

let employees
let roles
let departments

function UpdateDB() {

    db.query(
        `
            SELECT
            employee.id AS id,
            employee.first_name AS first_name,
            employee.last_name AS last_name,
            role.title AS title,
            department.name AS department,
            role.salary AS salary,
            CONCAT(manager_data.first_name, ' ', manager_data.last_name) AS manager
            
            FROM employee
            
            JOIN role
            ON employee.role_id = role.id
            JOIN department
            ON role.department_id = department.id
            LEFT JOIN employee 
            AS manager_data ON employee.manager_id = manager_data.id
            ORDER BY employee.id;
    
        `
        , (err, rows) => {
        if (err) {
            console.log(`ERROR WHILE GRABBING EMPLOYEES: ${err.message}`)
            SQLDisconnect()
           return;
        }
        employees = rows
    });
    
    db.query(
        `
        SELECT
            role.id as id,
            role.title as title,
            department.name AS department,
            role.salary as salary
        FROM role
    
        LEFT JOIN department
        ON role.department_id = department.id
        ORDER BY role.id
        `
        , (err, rows) => {
        if (err) {
            console.log(`ERROR WHILE GRABBING ROLES: ${err.message}`)
            SQLDisconnect()
           return;
        }
        roles = rows
    });
    
    db.query(
        `
        SELECT * FROM department
        ORDER BY department.id
        `
        , (err, rows) => {
        if (err) {
            console.log(`ERROR WHILE GRABBING DEPARTMENTS: ${err.message}`)
            SQLDisconnect()
           return;
        }
        departments = rows
    });

}
UpdateDB()

// All the menu functions, to AT THE VERY LEAST not have a bunch of if statements ~~my god it's still a fucking mess though I am so sorry whoever is reviewing this~~

const actions = {

    "View All Employees": function() {
        
        console.log("Here are all the employees:")
        console.table(employees)
        main()

    },

    "Add Employee": function() {




    },

    "Update Employee Role": function() {

    },

    "View All Roles": function() {

        console.log("Here are all the roles:")
        console.table(roles)
        main()

    },

    "Add Role": function() {

    },

    "View All Departments": function() {

        console.log("Here are all the departments:")
        console.table(departments)
        main()

    },

    "Add Department": function() {

    },

    "Quit": function() {

        SQLDisconnect()
        console.log("Goodbye!")

    },
}

const main = function() {

    inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
             choices: ['View All Employees', 'Add Employee', 'Update Employee Role','View All Roles','Add Role','View All Departments','Add Department','Quit'],
        },
    ])
    .then(({ action }) => {

        if (actions[action]) {
            actions[action]()
        } else {
            console.log("how the fuck did you select a nonexistent action?")
        }

        return

    })

}

main()