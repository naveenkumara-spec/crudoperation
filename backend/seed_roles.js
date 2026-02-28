/**
 * Seeds the roles table with a full set of job roles per department,
 * then links each employee's designation to the matching role record.
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'crud_db',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
});

const ROLES_BY_DEPT = {
    'Engineering': [
        { name: 'Frontend', description: 'Builds user interfaces with React/Vue/Angular' },
        { name: 'Backend', description: 'Develops server-side APIs and business logic' },
        { name: 'DevOps', description: 'Manages infrastructure, CI/CD, and deployments' },
        { name: 'QA', description: 'Ensures software quality via testing' },
        { name: 'Mobile', description: 'Develops iOS and Android applications' },
    ],
    'Marketing': [
        { name: 'Content', description: 'Creates blog posts, articles, and copy' },
        { name: 'SEO', description: 'Optimizes web content for search engines' },
        { name: 'Social Media', description: 'Manages social channels and campaigns' },
        { name: 'ADS', description: 'Runs paid advertising campaigns' },
    ],
    'Sales': [
        { name: 'SDR', description: 'Qualifies inbound and outbound leads' },
        { name: 'Account Executive', description: 'Closes deals and manages accounts' },
        { name: 'Sales Ops', description: 'Supports the sales team with data and tools' },
    ],
    'HR': [
        { name: 'Recruiter', description: 'Sources and hires new talent' },
        { name: 'HRBP', description: 'Partners with business units on HR strategy' },
        { name: 'Payroll', description: 'Manages compensation and payroll processing' },
    ],
    'Finance': [
        { name: 'Analyst', description: 'Analyses financial data and trends' },
        { name: 'Accountant', description: 'Maintains books and prepares financial reports' },
        { name: 'Controller', description: 'Oversees accounting operations' },
    ],
    'Operations': [
        { name: 'Logistics', description: 'Coordinates supply chain and delivery' },
        { name: 'Procurement', description: 'Manages vendor relationships and purchasing' },
        { name: 'Safety', description: 'Ensures workplace health and safety compliance' },
    ],
    'Design': [
        { name: 'UI/UX', description: 'Designs user interfaces and user experiences' },
        { name: 'Graphic', description: 'Creates visual assets and illustrations' },
        { name: 'Brand', description: 'Maintains brand identity and guidelines' },
    ],
};

const seed = async () => {
    try {
        console.log('🌱 Seeding roles...');

        // 1. Fetch all departments
        const deptResult = await pool.query('SELECT id, name FROM departments');
        const deptMap = {};
        deptResult.rows.forEach(d => { deptMap[d.name] = d.id; });

        // 2. Insert roles
        const roleIdMap = {}; // role_name → role_id
        for (const [deptName, roles] of Object.entries(ROLES_BY_DEPT)) {
            const deptId = deptMap[deptName];
            if (!deptId) { console.warn(`⚠️  Dept not found: ${deptName}`); continue; }

            for (const role of roles) {
                const res = await pool.query(
                    `INSERT INTO roles (name, description, department_id)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, department_id = EXCLUDED.department_id
                     RETURNING id`,
                    [role.name, role.description, deptId]
                );
                roleIdMap[role.name] = res.rows[0].id;
                console.log(`  ✅ Role: ${role.name} (Dept: ${deptName})`);
            }
        }

        // 3. Link employees.role_id based on their designation
        console.log('\n🔗 Linking employees to roles...');
        for (const [roleName, roleId] of Object.entries(roleIdMap)) {
            const result = await pool.query(
                `UPDATE employees SET role_id = $1 WHERE designation = $2`,
                [roleId, roleName]
            );
            console.log(`  Linked ${result.rowCount} employees → ${roleName}`);
        }

        console.log('\n✨ Roles seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
};

seed();
