const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'crud_db',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
});

const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design', 'Customer Success', 'Research', 'Product'];
const rolesByDept = {
    'Engineering': ['Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'QA Tester', 'Mobile Developer', 'Full Stack', 'Security Engineer'],
    'Marketing': ['Content Strategist', 'SEO Specialist', 'Social Media Manager', 'ADS Analyst', 'Copywriter'],
    'Sales': ['SDR', 'Account Executive', 'Sales Operations', 'Partnership Manager'],
    'HR': ['Recruiter', 'HR Business Partner', 'Payroll Specialist', 'Talent Acquisition'],
    'Finance': ['Financial Analyst', 'Accountant', 'Controller', 'Treasury Manager'],
    'Operations': ['Logistics Coordinator', 'Procurement Officer', 'Safety Inspector', 'Supply Chain Manager'],
    'Design': ['UI/UX Designer', 'Graphic Designer', 'Brand Designer', 'Product Designer'],
    'Customer Success': ['Support Specialist', 'Account Manager', 'Implementation Lead'],
    'Research': ['Data Scientist', 'ML Research', 'UX Researcher'],
    'Product': ['Product Manager', 'Product Owner', 'Scrum Master']
};

const genders = ['Male', 'Female', 'Other'];
const statuses = ['active', 'inactive'];

const seed = async () => {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting Mega Seeding (1000 records)...');
        await client.query('BEGIN');

        // Cleanup
        console.log('🧹 Clearing existing data...');
        await client.query('TRUNCATE users, employees, departments, roles, attendance RESTART IDENTITY CASCADE');

        // 1. Seed Departments
        console.log('🏢 Seeding 50 Departments...');
        const deptIds = [];
        const baseDepts = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design', 'Customer Success', 'Research', 'Product', 'Legal', 'Security', 'Strategy', 'Innovation', 'Logistics', 'Quality', 'Training', 'Events', 'Public Relations', 'Business Dev'];

        for (let i = 1; i <= 50; i++) {
            const baseName = baseDepts[(i - 1) % baseDepts.length];
            const name = `${baseName} ${Math.ceil(i / baseDepts.length)}`;
            const res = await client.query('INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING id', [name, `${name} department operations and management`]);
            deptIds.push({ id: res.rows[0].id, name, baseName });
        }

        // 2. Seed Roles
        console.log('🎭 Seeding Roles for 50 Departments...');
        const roleIds = [];
        for (const dept of deptIds) {
            const roles = rolesByDept[dept.baseName] || ['Associate', 'Specialist', 'Manager', 'Lead', 'Director'];
            for (const roleName of roles) {
                const res = await client.query('INSERT INTO roles (name, description, department_id) VALUES ($1, $2, $3) RETURNING id', [`${dept.name} ${roleName}`, `Expert ${roleName} in ${dept.name}`, dept.id]);
                roleIds.push({ id: res.rows[0].id, name: `${dept.name} ${roleName}`, department_id: dept.id });
            }
        }

        // 3. Seed Users & Employees (1000)
        console.log('👥 Generating 1000 Users and Employees...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        const today = new Date().toISOString().split('T')[0];

        for (let i = 1; i <= 1000; i++) {
            const firstName = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'Richard', 'Barbara', 'Joseph', 'Susan', 'Thomas', 'Jessica', 'Charles', 'Sarah', 'Christopher', 'Karen'][Math.floor(Math.random() * 20)];
            const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'][Math.floor(Math.random() * 20)];
            const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}`;
            const email = `employee${i}@ems-pro.com`;
            const gender = genders[Math.floor(Math.random() * genders.length)];
            const dept = deptIds[Math.floor(Math.random() * deptIds.length)];
            const deptRoles = roleIds.filter(r => r.department_id === dept.id);
            const role = deptRoles[Math.floor(Math.random() * deptRoles.length)];
            const salary = Math.floor(Math.random() * 80000) + 40000;
            const age = Math.floor(Math.random() * 40) + 20;

            // Insert User
            const userRes = await client.query(
                `INSERT INTO users (username, email, password, role, age, dob, gender, salary, department, location, address, bio) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
                [
                    username,
                    email,
                    hashedPassword,
                    'employee',
                    age,
                    `19${Math.floor(Math.random() * 20) + 70}-01-01`,
                    gender,
                    salary,
                    dept.name,
                    'Main Office',
                    `${Math.floor(Math.random() * 999)} Tech Street`,
                    'Passionate employee from the EMS system.'
                ]
            );

            // Insert Employee
            const empRes = await client.query(
                `INSERT INTO employees (name, designation, salary, department_id, status, role_id) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [`${firstName} ${lastName}`, role.name, salary, dept.id, statuses[Math.floor(Math.random() * statuses.length)], role.id]
            );

            // 4. Seed Attendance (Random Date between 2020 and 2026)
            const start = new Date('2020-01-01').getTime();
            const end = new Date('2026-12-31').getTime();
            const randomDate = new Date(start + Math.random() * (end - start)).toISOString().split('T')[0];

            const attendanceStatus = Math.random() > 0.1 ? 'present' : 'absent';
            await client.query(
                `INSERT INTO attendance (date, employee_id, department_id, role, status) 
                 VALUES ($1, $2, $3, $4, $5) ON CONFLICT (date, employee_id) DO NOTHING`,
                [randomDate, empRes.rows[0].id, dept.id, role.name, attendanceStatus]
            );

            if (i % 100 === 0) console.log(`⏩ Processed ${i}/1000 records...`);
        }

        // Add 1 Admin
        await client.query(
            `INSERT INTO users (username, email, password, role) 
             VALUES ($1, $2, $3, $4)`,
            ['admin', 'admin@ems-pro.com', hashedPassword, 'admin']
        );

        // Add Specific User
        const gowthamPass = await bcrypt.hash('Gowtham@165', 10);
        await client.query(
            `INSERT INTO users (username, email, password, role) 
             VALUES ($1, $2, $3, $4)`,
            ['naveenkumar', 'naveenkumararunachalam97@gmail.com', gowthamPass, 'admin']
        );

        await client.query('COMMIT');
        console.log('✨ Mega Seeding Complete! 1000 records added to all tables.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding Failed:', err);
    } finally {
        client.release();
        process.exit();
    }
};

seed();
