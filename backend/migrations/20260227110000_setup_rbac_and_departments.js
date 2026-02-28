/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('departments', (table) => {
            table.increments('id').primary();
            table.string('name').notNullable().unique();
            table.string('description');
            table.timestamp('created_at').defaultTo(knex.fn.now());
        })
        .table('users', (table) => {
            table.string('role').defaultTo('employee'); // employee, admin, owner
            table.string('avatar');
        })
        .table('employees', (table) => {
            table.integer('department_id').references('id').inTable('departments').onDelete('SET NULL');
            table.string('status').defaultTo('active'); // active, inactive
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .table('employees', (table) => {
            table.dropColumn('department_id');
            table.dropColumn('status');
        })
        .table('users', (table) => {
            table.dropColumn('role');
            table.dropColumn('avatar');
        })
        .dropTableIfExists('departments');
};
