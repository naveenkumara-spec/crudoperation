const bcrypt = require('bcryptjs');

const password = 'Gowtham@165';
bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Hashed Password:', hash);
});
