require('dotenv').config();

module.exports = {
    development: {
        client: 'pg',
        connection: {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'root',
            database: process.env.DB_NAME || 'crud_db',
            port: process.env.DB_PORT || 5432,
        },
        migrations: {
            directory: './migrations',
        },
    },
    production: {
        client: 'pg',
        connection: process.env.DATABASE_URL ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        } : {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
        },
        migrations: {
            directory: './migrations',
        },
    },
};
