const UserModel = require('../models/userModel');

class UserController {
    static getIndex(req, res) {
        const users = UserModel.getAll();
        res.render('users/index', { title: 'User Management', users, error: req.query.error });
    }

    static getCreate(req, res) {
        res.render('users/form', { title: 'Create User', editUser: null });
    }

    static postCreate(req, res) {
        try {
            const { username, password, role, permissions } = req.body;
            const perms = permissions ? (Array.isArray(permissions) ? permissions : [permissions]) : [];
            UserModel.create({ username, password, role, permissions: perms });
            res.redirect('/users');
        } catch (error) {
            res.render('users/form', { title: 'Create User', editUser: null, error: error.message });
        }
    }

    static getEdit(req, res) {
        const editUser = UserModel.findById(req.params.id);
        if (!editUser) return res.redirect('/users');
        editUser.permissions = JSON.parse(editUser.permissions || '[]');
        res.render('users/form', { title: 'Edit User', editUser });
    }

    static postEdit(req, res) {
        try {
            const { role, permissions, password } = req.body;
            const perms = permissions ? (Array.isArray(permissions) ? permissions : [permissions]) : [];
            UserModel.update(req.params.id, { role, permissions: perms });
            if (password && password.trim().length > 0) {
                UserModel.updatePassword(req.params.id, password);
            }
            res.redirect('/users');
        } catch (error) {
            const editUser = UserModel.findById(req.params.id);
            res.render('users/form', { title: 'Edit User', editUser, error: error.message });
        }
    }

    static postDelete(req, res) {
        try {
            UserModel.delete(req.params.id);
            res.redirect('/users');
        } catch (error) {
            console.error('Delete user error:', error.message);
            res.redirect('/users?error=' + encodeURIComponent(error.message));
        }
    }

    static postToggleStatus(req, res) {
        try {
            UserModel.toggleStatus(req.params.id);
        } catch (error) {
            console.error('Toggle status error:', error.message);
        }
        res.redirect('/users');
    }
}

module.exports = UserController;
