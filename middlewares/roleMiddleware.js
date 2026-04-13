function requireRole(role) {
    return function(req, res, next) {
        if (req.session && req.session.user && req.session.user.role === role) {
            return next();
        }
        res.status(403).send('<h1>403 Forbidden</h1><p>You do not have permission to access this resource.</p><a href="/dashboard">Back to Dashboard</a>');
    };
}

function requirePermission(permission) {
    return function(req, res, next) {
        if (!req.session || !req.session.user) {
            return res.redirect('/');
        }
        // Admins always have all permissions
        if (req.session.user.role === 'admin') {
            return next();
        }
        // Check staff permissions
        let perms = [];
        try {
            perms = JSON.parse(req.session.user.permissions || '[]');
        } catch(e) {
            perms = [];
        }
        if (perms.indexOf(permission) !== -1) {
            return next();
        }
        res.status(403).send('<h1>403 Forbidden</h1><p>You need the <strong>' + permission + '</strong> permission.</p><a href="/dashboard">Back to Dashboard</a>');
    };
}

module.exports = { requireRole, requirePermission };
