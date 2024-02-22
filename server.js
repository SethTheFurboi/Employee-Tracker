const inquirer = require('inquirer');
const mysql = require('mysql2');

// Connect to database
const db = mysql.createConnection(
  {
    host: 'localhost',
    user: 'root',
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
                VALUES ("${firstName}","${lastName}",${roleID},${managerID});
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

        const roleNames = []
        const employeesLocalTable = []

        for (let i = 0; i < roles.length; i++) {
            roleNames.push(roles[i].title)
        } 

        for (let i = 0; i < employees.length; i++) {
            employeesLocalTable.push(`${employees[i].first_name} ${employees[i].last_name}`)
        } 

        inquirer.prompt([
            {
                type: 'list',
                name: 'employeeName',
                message: `Who is the employee?`,
                choices: employeesLocalTable
            },
            {
                type: 'list',
                name: 'roleName',
                message: `What is the new role?`,
                choices: roleNames
            },
        ])
        .then(({ employeeName, roleName,}) => {

            var roleID
            var employeeID

            console.log(employeeName)

            for (let i = 0; i < employees.length; i++) {
                const currEmployee = employees[i]
                if (employeeName == `${currEmployee.first_name} ${currEmployee.last_name}`) {
                    employeeID = employees[i].id
                }
            }

            for (let i = 0; i < roles.length; i++) {
                if (roles[i].title == roleName) {
                    roleID = roles[i].id
                }
            }

            db.query(
                `
                UPDATE employee
                SET role_id = ${roleID}
                WHERE id = ${employeeID}
                `
                , (err, rows) => {
                if (err) {
                    console.log(`ERROR WHILE UPDATING EMPLOYEE: ${err.message}`)
                   return;
                }
            });
            console.log(`Updated ${employeeName}'s role!`)
            main()
    
        })

    },

    "View All Roles": function() {

        console.log("Here are all the roles:")
        console.table(roles)
        main()

    },

    "Add Role": function() {

        const departmentNames = []

        for (let i = 0; i < departments.length; i++) {
            departmentNames.push(departments[i].name)
        }

        inquirer.prompt([
            {
                type: 'input',
                name: 'roleName',
                message: `What is the role's name?`,
            },
            {
                type: 'list',
                name: 'roleDepartment',
                message: `What department is it in??`,
                choices: departmentNames
            },
            {
                type: 'input',
                name: 'roleSalary',
                message: `What is the role's salary?`,
            },
        ])
        .then(({ roleName, roleDepartment, roleSalary}) => {

            var departmentID

            for (let i = 0; i < departments.length; i++) {
                if (departments[i].name == roleDepartment) {
                    departmentID = departments[i].id
                }
            }

            if (Number(roleSalary)) {

                db.query(
                    `
                    INSERT INTO role(title, salary, department_id)
                    VALUES ("${roleName}",${Number(roleSalary)},${departmentID});
                    `
                    , (err, rows) => {
                    if (err) {
                        console.log(`ERROR WHILE ADDING ROLE: ${err.message}`)
                       return;
                    }
                });
                console.log(`Added the role ${roleName}!`)

            } else {
                console.log("Please input a number for the salary.")
            }

            main()
    
        })


    },

    "View All Departments": function() {

        console.log("Here are all the departments:")
        console.table(departments)
        main()

    },

    "Add Department": function() {

        inquirer.prompt([
            {
                type: 'input',
                name: 'departmentName',
                message: `What is the department's name?`,
            },
        ])
        .then(({ departmentName}) => {

            db.query(
                `
                INSERT INTO department (name)
                VALUES ("${departmentName}");
                `
                , (err, rows) => {
                if (err) {
                    console.log(`ERROR WHILE ADDING DEPARTMENT: ${err.message}`)
                   return;
                }
            });
            console.log(`Added the department ${departmentName}!`)

            main()
    
        })

    },

    "Quit": function() {

        SQLDisconnect()
        console.log("Goodbye!")

    },
}

// The actual menu

const main = function() {

    UpdateDB()

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
            console.log("Action selected has no function!")
        }

        return

    })

}

main()