const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

class AuthController {
    static getLogin(req, res) {
        if (req.session.user) return res.redirect('/dashboard');
        res.render('auth/login', { title: 'Login' });
    }

    static postLogin(req, res) {
        const { username, password } = req.body;
        const user = UserModel.findByUsername(username);

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.render('auth/login', { title: 'Login', error: 'Invalid username or password' });
        }

        // Store permissions in session
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            permissions: user.permissions || '[]'
        };
        res.redirect('/dashboard');
    }

    static logout(req, res) {
        req.session.destroy();
        res.redirect('/');
    }
}

module.exports = AuthController;
