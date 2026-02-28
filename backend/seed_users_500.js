/**
 * Seed 500 users into the users table
 * Run: node seed_users_500.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'crud_db',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5433,
});

const firstNames = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna',
    'Ishaan', 'Shriya', 'Ananya', 'Diya', 'Priya', 'Kavya', 'Meera', 'Riya', 'Pooja',
    'Neha', 'Divya', 'Rahul', 'Rohit', 'Amit', 'Suresh', 'Ramesh', 'Vijay', 'Sunil',
    'Anil', 'Ravi', 'Manoj', 'Sandeep', 'Rajesh', 'Deepak', 'Vinod', 'Nikhil', 'Kiran',
    'Naveena', 'Lakshmi', 'Sunita', 'Geeta', 'Rekha', 'Sarita', 'Manju', 'Suman',
    'Harish', 'Girish', 'Satish', 'Naresh', 'Dinesh', 'Mahesh', 'Ganesh', 'Mukesh',
    'Jothi', 'Senthil', 'Murugan', 'Selvam', 'Kumar', 'Rajan', 'Balan', 'Karthik',
    'Suresh', 'Gokul', 'Prasad', 'Venkat', 'Srikanth', 'Ashwin', 'Balaji', 'Naveen',
];

const lastNames = [
    'Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Joshi', 'Mehta', 'Shah',
    'Reddy', 'Nair', 'Pillai', 'Menon', 'Iyer', 'Narayanan', 'Krishnan', 'Rajan',
    'Bose', 'Das', 'Roy', 'Mukherjee', 'Banerjee', 'Chatterjee', 'Ghosh', 'Sen',
    'Rao', 'Murthy', 'Naidu', 'Chowdhury', 'Pandey', 'Tiwari', 'Mishra', 'Srivastava',
    'Chauhan', 'Yadav', 'Shukla', 'Tripathi', 'Dubey', 'Agarwal', 'Jain', 'Saxena',
    'Kapoor', 'Malhotra', 'Chopra', 'Khanna', 'Bhatia', 'Sethi', 'Mehra', 'Arora',
    'Murugan', 'Selvaraj', 'Kannan', 'Subramanian', 'Subramaniam', 'Natarajan', 'Srinivas',
];

const departments = ['Engineering', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Legal', 'Design', 'Product', 'Support'];
const roles = ['admin', 'employee', 'employee', 'employee', 'employee', 'employee'];
const genders = ['Male', 'Female', 'Other'];
const locations = [
    'Chennai, TN', 'Mumbai, MH', 'Bangalore, KA', 'Hyderabad, TS', 'Delhi, DL',
    'Pune, MH', 'Kolkata, WB', 'Ahmedabad, GJ', 'Jaipur, RJ', 'Coimbatore, TN',
    'Kochi, KL', 'Chandigarh, PB', 'Lucknow, UP', 'Nagpur, MH', 'Indore, MP',
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDate(start, end) {
    const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return d.toISOString().split('T')[0];
}

async function seed() {
    console.log('🌱 Seeding 500 users...');
    const hashedPassword = await bcrypt.hash('Password@123', 10);

    let inserted = 0;
    const batch = [];

    for (let i = 1; i <= 500; i++) {
        const firstName = rand(firstNames);
        const lastName = rand(lastNames);
        const username = `${firstName} ${lastName}`;
        const email = `user${i}@ems.pro`;
        const dept = rand(departments);
        const gender = rand(genders);
        const age = randInt(22, 55);
        const dob = randDate(new Date(1970, 0, 1), new Date(2001, 11, 31));
        const joiningDate = randDate(new Date(2018, 0, 1), new Date(2025, 11, 31));
        const salary = randInt(30000, 150000);
        const location = rand(locations);
        const role = rand(roles);
        const address = `${randInt(1, 999)}, ${rand(['MG Road', 'Anna Nagar', 'Adyar', 'T Nagar', 'Velachery', 'Powai', 'Bandra', 'Whitefield', 'Koramangala'])}, ${location}`;
        const bio = `${dept} professional with ${randInt(1, 15)} years of experience.`;

        batch.push([username, email, hashedPassword, role, age, dob, joiningDate, salary, dept, location, address, bio, gender]);
    }

    // Insert in chunks of 50
    for (let i = 0; i < batch.length; i += 50) {
        const chunk = batch.slice(i, i + 50);
        const values = chunk.map((_, idx) => {
            const base = idx * 13;
            return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11},$${base + 12},$${base + 13})`;
        }).join(',');

        const flat = chunk.flat();
        await pool.query(
            `INSERT INTO users (username, email, password, role, age, dob, joining_date, salary, department, location, address, bio, gender)
             VALUES ${values}
             ON CONFLICT (email) DO NOTHING`,
            flat
        );
        inserted += chunk.length;
        console.log(`  ✅ Inserted ${inserted}/500`);
    }

    console.log('🎉 Done! 500 users seeded successfully.');
    await pool.end();
}

seed().catch(err => {
    console.error('❌ Error:', err.message);
    pool.end();
    process.exit(1);
});
