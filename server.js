const inquirer = require('inquirer');
const mysql = require('mysql2');

// Connect to database
const db = mysql.createConnection(
  {
    host: 'localhost',
    // MySQL username,
    user: 'root',
    // TODO: Add MySQL password here
    password: '',
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
        console.log(employees.length)
        console.table(employees)
        main()

    },

    "Add Employee": function() {

        const roleNames = []
        const managerNames = ["None"]

        for (let i = 0; i < roles.length; i++) {
            roleNames.push(roles[i].title)
        } 

        for (let i = 0; i < employees.length; i++) {
            managerNames.push(`${employees[i].first_name} ${employees[i].last_name}`)
        } 

        inquirer.prompt([
            {
                type: 'input',
                name: 'firstName',
                message: `What is the employee's first name?`,
            },
            {
                type: 'input',
                name: 'lastName',
                message: `What is the employee's last name?`,
            },
            {
                type: 'list',
                name: 'roleName',
                message: `What is the employee's role?`,
                choices: roleNames
            },
            {
                type: 'list',
                name: 'managerName',
                message: `Who is the employee's manager?`,
                choices: managerNames
            },
        ])
        .then(({ firstName, lastName, roleName, managerName }) => {

            console.log(`First Name: ${firstName} \nLast Name: ${lastName} \nRole: ${roleName} \nManager: ${managerName}`)

            var roleID
            var managerID = null

            for (let i = 0; i < roles.length; i++) {
                if (roles[i].title == roleName) {
                    roleID = roles[i].id
                }
            }

            for (let i = 0; i < employees.length; i++) {
                if (employees[i].firstName == firstName) {
                    managerID = employees[i].id
                }
            }

            db.query(
                `
                INSERT INTO employee(first_name, last_name, role_id, manager_id)
                VALUES (${firstName},${lastName},${roleID},${roleID});
                `
                , (err, rows) => {
                if (err) {
                    console.log(`ERROR WHILE INSERTING EMPLOYEE: ${err.message}`)
                   return;
                }
            });
            console.log(`Added ${firstName} ${lastName} to the database!`)
            main()
    
        })

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

        UpdateDB()

        if (actions[action]) {
            actions[action]()
        } else {
            console.log("Action selected has no function!")
        }

        return

    })

}

main()