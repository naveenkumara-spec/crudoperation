require('dotenv').config();

const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_NAME;

const conn = process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('railway') ? false : { rejectUnauthorized: false }
} : {
    host: process.env.PGHOST || process.env.DB_HOST || (isRailway ? undefined : 'localhost'),
    user: process.env.PGUSER || process.env.DB_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'root',
    database: process.env.PGDATABASE || process.env.DB_NAME || 'crud_db',
    port: process.env.PGPORT || process.env.DB_PORT || 5432,
    ssl: (process.env.PGHOST && !process.env.PGHOST.includes('railway')) ? { rejectUnauthorized: false } : false
};

console.log('--- KNEX CONFIG STARTING ---');
console.log('HAS DATABASE_URL:', !!process.env.DATABASE_URL);
console.log('HAS DB_HOST:', !!(process.env.PGHOST || process.env.DB_HOST));
console.log('NODE_ENV:', process.env.NODE_ENV);

module.exports = {
    development: {
        client: 'pg',
        connection: conn,
        migrations: { directory: './migrations' },
    },
    production: {
        client: 'pg',
        connection: conn,
        migrations: { directory: './migrations' },
    },
};
