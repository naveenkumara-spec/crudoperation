const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'crud_db',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
});

const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design'];
const rolesByDept = {
    'Engineering': ['Frontend', 'Backend', 'DevOps', 'QA', 'Mobile'],
    'Marketing': ['Content', 'SEO', 'Social Media', 'ADS'],
    'Sales': ['SDR', 'Account Executive', 'Sales Ops'],
    'HR': ['Recruiter', 'HRBP', 'Payroll'],
    'Finance': ['Analyst', 'Accountant', 'Controller'],
    'Operations': ['Logistics', 'Procurement', 'Safety'],
    'Design': ['UI/UX', 'Graphic', 'Brand']
};

const seed = async () => {
    try {
        console.log('🚀 Starting Data Seeding...');

        // 1. Seed Departments
        const deptIds = [];
        for (const name of departments) {
            const res = await pool.query('INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id', [name]);
            deptIds.push({ id: res.rows[0].id, name });
            console.log(`✅ Dept: ${name}`);
        }

        // 2. Seed 1000 Employees
        console.log('👷 Seeding 1000 Employees...');
        const employees = [];
        for (let i = 1; i <= 1000; i++) {
            const dept = deptIds[Math.floor(Math.random() * deptIds.length)];
            const roles = rolesByDept[dept.name];
            const role = roles[Math.floor(Math.random() * roles.length)];
            const name = `Employee_${i}`;
            const salary = Math.floor(Math.random() * 50000) + 30000;

            const res = await pool.query(
                'INSERT INTO employees (name, designation, salary, department_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, designation',
                [name, role, salary, dept.id, 'active']
            );
            employees.push({ id: res.rows[0].id, dept_id: dept.id, role: res.rows[0].designation });
        }

        // 3. Seed Attendance for today
        console.log('📅 Seeding Attendance for Today...');
        const today = new Date().toISOString().split('T')[0];
        const statusValues = ['present', 'present', 'present', 'absent']; // 75% present

        for (const emp of employees) {
            const status = statusValues[Math.floor(Math.random() * statusValues.length)];
            await pool.query(
                'INSERT INTO attendance (date, employee_id, department_id, role, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (date, employee_id) DO NOTHING',
                [today, emp.id, emp.dept_id, emp.role, status]
            );
        }

        console.log('✨ Data Seeding Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding Failed:', err);
        process.exit(1);
    }
};

seed();
