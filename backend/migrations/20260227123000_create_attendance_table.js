/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('attendance', (table) => {
        table.increments('id').primary();
        table.date('date').notNullable().index();
        table.integer('employee_id').references('id').inTable('employees').onDelete('CASCADE');
        table.integer('department_id').references('id').inTable('departments').onDelete('SET NULL');
        table.string('role').notNullable(); // Snapshot of the role at recording time
        table.string('status').notNullable(); // present, absent
        table.timestamp('created_at').defaultTo(knex.fn.now());

        // Ensure one attendance per employee per day
        table.unique(['date', 'employee_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('attendance');
};
