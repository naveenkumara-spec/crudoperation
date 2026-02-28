const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/avatars';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database connection
const poolConfig = process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
} : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'crud_db',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
};

const pool = new Pool(poolConfig);

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Authentication required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// RBAC Middleware
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user || (roles.length && !roles.includes(req.user.role))) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
    let { email, password } = req.body;
    if (email) email = email.trim().toLowerCase();
    try {
        const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ message: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.username,
                email: user.email,
                role: user.role,
                age: user.age,
                dob: user.dob,
                gender: user.gender,
                salary: user.salary,
                department: user.department,
                location: user.location,
                address: user.address,
                bio: user.bio,
                avatar_url: user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${process.env.VITE_API_URL || 'http://localhost:5000'}/${user.avatar}`) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    let { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    username = username.trim();
    email = email.trim().toLowerCase();

    try {
        // Check if user exists
        const check = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
        if (check.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, hashedPassword, 'employee']
        );

        const user = result.rows[0];
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// ─── Users List Route (Protected) ────────────────────────────────────────────
app.get('/api/users', authenticateToken, async (req, res) => {
    const {
        search = '',
        page = 1,
        limit = 10,
        sortBy = 'id',
        order = 'ASC',
        department,
        role,
        gender,
    } = req.query;

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const offset = (pageNum - 1) * limitNum;
    const searchQuery = `%${search}%`;

    const allowedSort = ['id', 'username', 'email', 'department', 'role', 'salary', 'age', 'joining_date', 'gender'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'id';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let conditions = ['(username ILIKE $1 OR email ILIKE $1 OR department ILIKE $1)'];
    let params = [searchQuery];

    if (department) {
        const deptArr = Array.isArray(department) ? department : [department];
        conditions.push(`department = ANY($${params.length + 1}::text[])`);
        params.push(deptArr);
    }
    if (role) {
        const roleArr = Array.isArray(role) ? role : [role];
        conditions.push(`role = ANY($${params.length + 1}::text[])`);
        params.push(roleArr);
    }
    if (gender) {
        const genderArr = Array.isArray(gender) ? gender : [gender];
        conditions.push(`gender = ANY($${params.length + 1}::text[])`);
        params.push(genderArr);
    }

    const where = conditions.join(' AND ');

    try {
        const countResult = await pool.query(`SELECT COUNT(*) FROM users WHERE ${where}`, params);
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
            `SELECT id, username, email, role, age, gender, department, salary, location, joining_date, avatar
             FROM users
             WHERE ${where}
             ORDER BY ${sortField} ${sortOrder}
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, limitNum, offset]
        );

        res.json({ data: result.rows, pagination: { total, page: pageNum, limit: limitNum } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Profile Route
app.put('/api/users/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
    const { name, age, dob, gender, salary, department, location, address, bio } = req.body;
    const userId = req.user.id;
    let avatarPath = null;

    if (req.file) {
        avatarPath = `uploads/avatars/${req.file.filename}`;
    }

    try {
        let query = `
            UPDATE users 
            SET username = $1, age = $2, dob = $3, gender = $4, salary = $5, 
                department = $6, location = $7, address = $8, bio = $9`;

        let params = [name, age, dob, gender, salary, department, location, address, bio];

        if (avatarPath) {
            query += `, avatar = $10 WHERE id = $11 RETURNING *`;
            params.push(avatarPath, userId);
        } else {
            query += ` WHERE id = $10 RETURNING *`;
            params.push(userId);
        }

        const result = await pool.query(query, params);
        const updatedUser = result.rows[0];

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                avatar: updatedUser.avatar ? (updatedUser.avatar.startsWith('http') ? updatedUser.avatar : `${process.env.VITE_API_URL || 'http://localhost:5000'}/${updatedUser.avatar}`) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${updatedUser.username}`,
                age: updatedUser.age,
                gender: updatedUser.gender,
                dob: updatedUser.dob,
                joining_date: updatedUser.joining_date,
                salary: updatedUser.salary,
                department: updatedUser.department,
                location: updatedUser.location,
                address: updatedUser.address,
                bio: updatedUser.bio
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Employee Routes (Protected)
app.get('/api/employees', authenticateToken, async (req, res) => {
    const { search = '', page = 1, limit = 10, sortBy = 'created_at', order = 'DESC', status } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    try {
        const offset = (pageNum - 1) * limitNum;
        const searchQuery = `%${search}%`;

        // Base where condition
        let whereClause = '(name ILIKE $1 OR designation ILIKE $1)';
        let params = [searchQuery];

        // Add status filter if provided
        if (status) {
            const statusArray = Array.isArray(status) ? status : [status];
            if (statusArray.length > 0) {
                whereClause += ` AND status = ANY($${params.length + 1}::text[])`;
                params.push(statusArray);
            }
        }

        // Validate sortBy field to prevent SQL injection
        const allowedSortFields = ['id', 'name', 'designation', 'salary', 'status', 'created_at'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM employees WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
            `SELECT * FROM employees WHERE ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, limitNum, offset]
        );

        res.json({
            data: result.rows,
            pagination: { total, page: pageNum, limit: limitNum }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/employees', authenticateToken, authorize(['admin', 'owner']), async (req, res) => {
    const { name, designation, salary, status = 'active' } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO employees (name, designation, salary, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, designation, salary, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/employees/:id', authenticateToken, authorize(['admin', 'owner']), async (req, res) => {
    const { id } = req.params;
    const { name, designation, salary, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE employees SET name = $1, designation = $2, salary = $3, status = $4 WHERE id = $5 RETURNING *',
            [name, designation, salary, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/employees/:id', authenticateToken, authorize(['owner']), async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM employees WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Department Routes ────────────────────────────────────────────────────────
app.get('/api/departments', authenticateToken, async (req, res) => {
    const { search = '' } = req.query;
    try {
        const searchQuery = `%${search}%`;
        const result = await pool.query(`
            SELECT
                d.*,
                COUNT(DISTINCT e.id)::int       AS employee_count,
                COUNT(DISTINCT r.id)::int        AS role_count,
                json_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) AS roles
            FROM departments d
            LEFT JOIN employees e ON e.department_id = d.id
            LEFT JOIN roles r     ON r.department_id = d.id
            WHERE d.name ILIKE $1 OR d.description ILIKE $1
            GROUP BY d.id
            ORDER BY d.name ASC
        `, [searchQuery]);
        res.json({ data: result.rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/departments', authenticateToken, authorize(['admin', 'owner']), async (req, res) => {
    const { name, description = '' } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Department name is required' });
    try {
        const result = await pool.query(
            'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *',
            [name.trim(), description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Department name already exists' });
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/departments/:id', authenticateToken, authorize(['admin', 'owner']), async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Department name is required' });
    try {
        const result = await pool.query(
            'UPDATE departments SET name=$1, description=$2 WHERE id=$3 RETURNING *',
            [name.trim(), description, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Department not found' });
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Department name already exists' });
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/departments/:id', authenticateToken, authorize(['owner']), async (req, res) => {
    const { id } = req.params;
    try {
        const check = await pool.query('SELECT COUNT(*) FROM employees WHERE department_id=$1', [id]);
        const count = parseInt(check.rows[0].count);
        if (count > 0) {
            return res.status(409).json({ error: `Cannot delete: ${count} employees are assigned to this department` });
        }
        await pool.query('DELETE FROM departments WHERE id=$1', [id]);
        res.status(204).send();
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Roles Routes (full CRUD on roles table) ──────────────────────────────────
app.get('/api/roles', authenticateToken, async (req, res) => {
    const { search = '', page, limit = 50, department_id } = req.query;
    try {
        const searchQuery = `%${search}%`;
        let whereClause = '(r.name ILIKE $1 OR r.description ILIKE $1)';
        let params = [searchQuery];

        if (department_id) {
            const deptArray = Array.isArray(department_id) ? department_id : [department_id];
            if (deptArray.length > 0) {
                whereClause += ` AND r.department_id = ANY($${params.length + 1}::int[])`;
                params.push(deptArray.map(id => parseInt(id)));
            }
        }

        const result = await pool.query(`
            SELECT
                r.id, r.name, r.description, r.created_at,
                r.department_id,
                d.name                              AS department_name,
                COUNT(e.id)::int                    AS employee_count
            FROM roles r
            LEFT JOIN departments d ON r.department_id = d.id
            LEFT JOIN employees   e ON e.role_id = r.id
            WHERE ${whereClause}
            GROUP BY r.id, d.name
            ORDER BY r.name ASC
            ${page ? `LIMIT $${params.length + 1} OFFSET $${params.length + 2}` : ''}
        `, page ? [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)] : params);

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM roles r WHERE ${whereClause}`,
            params
        );

        res.json({ data: result.rows, total: parseInt(countResult.rows[0].count) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/roles/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT r.*, d.name AS department_name, COUNT(e.id)::int AS employee_count
            FROM roles r
            LEFT JOIN departments d ON r.department_id = d.id
            LEFT JOIN employees   e ON e.role_id = r.id
            WHERE r.id = $1
            GROUP BY r.id, d.name
        `, [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Role not found' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/roles', authenticateToken, authorize(['admin', 'owner']), async (req, res) => {
    const { name, description = '', department_id = null } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Role name is required' });
    try {
        const result = await pool.query(
            'INSERT INTO roles (name, description, department_id) VALUES ($1, $2, $3) RETURNING *',
            [name.trim(), description, department_id || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Role name already exists' });
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/roles/:id', authenticateToken, authorize(['admin', 'owner']), async (req, res) => {
    const { id } = req.params;
    const { name, description, department_id } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Role name is required' });
    try {
        const result = await pool.query(
            'UPDATE roles SET name=$1, description=$2, department_id=$3 WHERE id=$4 RETURNING *',
            [name.trim(), description, department_id || null, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Role not found' });
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Role name already exists' });
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/roles/:id', authenticateToken, authorize(['owner']), async (req, res) => {
    const { id } = req.params;
    try {
        const check = await pool.query('SELECT COUNT(*) FROM employees WHERE role_id=$1', [id]);
        const count = parseInt(check.rows[0].count);
        if (count > 0) {
            return res.status(409).json({ error: `Cannot delete: ${count} employees have this role` });
        }
        await pool.query('DELETE FROM roles WHERE id=$1', [id]);
        res.status(204).send();
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        const empCount = await pool.query('SELECT COUNT(*) FROM employees');
        const deptCount = await pool.query('SELECT COUNT(*) FROM departments');
        const activeEmp = await pool.query("SELECT COUNT(*) FROM employees WHERE status = 'active'");

        res.json({
            totalEmployees: parseInt(empCount.rows[0].count),
            totalDepartments: parseInt(deptCount.rows[0].count),
            activeEmployees: parseInt(activeEmp.rows[0].count),
            growth: '+12%' // Mock growth
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Attendance Report Route
app.get('/api/attendance/report', authenticateToken, async (req, res) => {
    const { startDate, endDate, department_id } = req.query;
    try {
        let whereClause = 'a.date BETWEEN $1 AND $2';
        let params = [startDate, endDate];

        if (department_id) {
            const deptArray = Array.isArray(department_id) ? department_id : [department_id];
            if (deptArray.length > 0) {
                whereClause += ` AND a.department_id = ANY($${params.length + 1}::int[])`;
                params.push(deptArray.map(id => parseInt(id)));
            }
        }

        // 1. Detailed breakdown query
        const query = `
            SELECT d.name as dept_name, d.id as dept_id, a.role, 
                   SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
                   SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent
            FROM attendance a
            JOIN departments d ON a.department_id = d.id
            WHERE ${whereClause}
            GROUP BY d.name, d.id, a.role
            ORDER BY d.name, a.role;
        `;
        const result = await pool.query(query, params);

        // 2. Summary stats query
        const summaryQuery = `
            SELECT 
                COUNT(*) as total_records,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_present,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as total_absent
            FROM attendance a
            WHERE ${whereClause}
        `;
        const summaryResult = await pool.query(summaryQuery, params);
        const summary = summaryResult.rows[0];

        // 3. Simple Trend (Placeholder for MoM logic - can be expanded with subqueries)
        // For actual MoM, we would run another query for (startDate - 1 month) to (endDate - 1 month)
        const stats = {
            total: parseInt(summary.total_records),
            present: parseInt(summary.total_present),
            absent: parseInt(summary.total_absent),
            rate: summary.total_records > 0 ? Math.round((summary.total_present / summary.total_records) * 100) : 0,
            trend: "+2%" // Hardcoded for Demo; In production, calculate against previous period
        };

        const departmentsMap = {};
        result.rows.forEach(row => {
            if (!departmentsMap[row.dept_name]) {
                departmentsMap[row.dept_name] = { name: row.dept_name, roles: [] };
            }
            departmentsMap[row.dept_name].roles.push({
                role: row.role,
                present: parseInt(row.present),
                absent: parseInt(row.absent)
            });
        });

        res.json({
            range: { start: startDate, end: endDate },
            stats: stats,
            departments: Object.values(departmentsMap)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend files in production
const frontendPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(frontendPath, 'index.html'));
        }
    });
} else {
    app.get('/', (req, res) => {
        res.send('EMS API v2.0 - RBAC & CRUD Ready (Frontend not built)');
    });
}

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
