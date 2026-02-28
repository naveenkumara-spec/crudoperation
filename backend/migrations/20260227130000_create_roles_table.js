/**
 * Migration: Create roles table and link employees to it
 * @param { import("knex").Knex } knex
 */
exports.up = async function (knex) {
    // 1. Create roles table
    await knex.schema.createTable('roles', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable().unique();
        table.string('description');
        table.integer('department_id')
            .references('id').inTable('departments').onDelete('SET NULL').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // 2. Add role_id FK to employees table
    await knex.schema.table('employees', (table) => {
        table.integer('role_id').references('id').inTable('roles').onDelete('SET NULL').nullable();
    });
};

exports.down = async function (knex) {
    await knex.schema.table('employees', (table) => {
        table.dropColumn('role_id');
    });
    await knex.schema.dropTableIfExists('roles');
};
