/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.table('users', (table) => {
        table.integer('age');
        table.date('dob');
        table.date('joining_date');
        table.decimal('salary', 15, 2);
        table.string('department');
        table.string('location');
        table.text('address');
        table.text('bio');
        table.string('gender');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.table('users', (table) => {
        table.dropColumns(['age', 'dob', 'joining_date', 'salary', 'department', 'location', 'address', 'bio', 'gender']);
    });
};
