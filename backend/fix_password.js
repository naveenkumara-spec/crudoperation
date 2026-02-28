const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'crud_db',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
});

const fixAll = async () => {
    const defaultPass = 'admin123';
    const jothiPass = 'Gowtham@165';

    try {
        const hashedDefault = await bcrypt.hash(defaultPass, 10);
        const hashedJothi = await bcrypt.hash(jothiPass, 10);

        // Update Owner
        await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedDefault, 'owner@ems.pro']);
        // Update Admin
        await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedDefault, 'admin@ems.pro']);
        // Update Jothi
        await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedJothi, 'naveenkumararunachalam97@gmail.com']);

        console.log('✅ ALL PASSWORDS FIXED AND HASHED.');
        console.log('owner@ems.pro -> admin123');
        console.log('admin@ems.pro -> admin123');
        console.log('naveenkumararunachalam97@gmail.com -> Gowtham@165');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to fix passwords:', err);
        process.exit(1);
    }
};

fixAll();
