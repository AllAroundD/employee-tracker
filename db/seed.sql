# Drops the CMS if it already exists --
DROP DATABASE IF EXISTS CMS;
# Creating a database
CREATE DATABASE CMS;
# Switching to the database
use CMS;
# Deleting a table
# DROP TABLE users;
# Creating a table

CREATE TABLE department (
	id INTEGER AUTO_INCREMENT PRIMARY KEY, 
    name VARCHAR(30)
);

CREATE TABLE role (
	id INTEGER AUTO_INCREMENT PRIMARY KEY, 
    title VARCHAR(30), 
    salary DECIMAL(8,2), 
    department_id INTEGER
);

CREATE TABLE employee (
	id INTEGER AUTO_INCREMENT PRIMARY KEY, 
    first_name VARCHAR(30), 
    last_name VARCHAR(30), 
    role_id INTEGER, 
    manager_id INTEGER
);

# Inserting data into tables
# department
INSERT INTO department VALUES( 1, "Sales" );
INSERT INTO department VALUES( 0, "Engineering" );
INSERT INTO department VALUES( 0, "Finance" );
INSERT INTO department VALUES( 0, "Legal" );

# role
INSERT INTO role VALUES( 1, "Sales Lead", 100000.00, 1 );
INSERT INTO role VALUES( 0, "Salesperson", 80000.00, 1 );
INSERT INTO role VALUES( 0, "Lead Engineer", 150000.00, 2 );
INSERT INTO role VALUES( 0, "Software Engineer", 120000.00, 2 );
INSERT INTO role VALUES( 0, "Accountant", 125000.00, 3 );
INSERT INTO role VALUES( 0, "Legal Team Lead", 80000.00, 4 );
INSERT INTO role VALUES( 0, "Lawyer", 190000.00, 4 );

# employee
INSERT INTO employee VALUES( 1, "John", "Doe", 1, null);
INSERT INTO employee VALUES( 0, "Mike", "Chan", 2, 1 );
INSERT INTO employee VALUES( 0, "Ashley", "Rodriguez", 3, null );
INSERT INTO employee VALUES( 0, "Kevin", "Tupik", 4, 4 );
INSERT INTO employee VALUES( 0, "Malia", "Brown", 5, null );
INSERT INTO employee VALUES( 0, "Sarah", "Lourd", 6, null );
INSERT INTO employee VALUES( 0, "Tom", "Allen", 7, 6 );
INSERT INTO employee VALUES( 0, "Christian", "Eckenrode", 3, 2 );
