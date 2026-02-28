const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'crud_db',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
});

const seed = async () => {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    try {
        // Create Owner
        await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET role = $4',
            ['Owner', 'owner@ems.pro', hashedPassword, 'owner']
        );

        // Create Admin
        await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET role = $4',
            ['Admin', 'admin@ems.pro', hashedPassword, 'admin']
        );

        console.log('✅ Seeded owner and admin users.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seed();
