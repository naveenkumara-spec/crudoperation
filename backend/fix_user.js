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

async function fixUser() {
    const client = await pool.connect();
    try {
        const email = 'naveenkumararunachalam97@gmail.com';
        const rawPassword = 'Gowtham@165';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        console.log(`Checking for user: ${email}...`);
        const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (res.rows.length > 0) {
            console.log('User found. Updating password...');
            await client.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
            console.log('Password updated successfully.');
        } else {
            console.log('User not found. Creating new user...');
            await client.query(
                'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
                ['naveenkumar', email, hashedPassword, 'admin']
            );
            console.log('User created successfully with role: admin.');
        }
    } catch (err) {
        console.error('Error fixing user:', err);
    } finally {
        client.release();
        process.exit();
    }
}

fixUser();
