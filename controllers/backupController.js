const BackupService = require('../services/backupService');

class BackupController {
    static getIndex(req, res) {
        const backups = BackupService.listBackups();
        res.render('backup/index', { title: 'Backup Management', backups });
    }

    static async postCreate(req, res) {
        try {
            await BackupService.createBackup();
            res.redirect('/backup');
        } catch (error) {
            console.error('Backup Error:', error);
            res.redirect('/backup?error=Failed to create backup');
        }
    }

    static postRestore(req, res) {
        try {
            const { filename } = req.body;
            BackupService.restoreBackup(filename);
            // The process will restart, but we can render a success message instructing the user to wait
            res.send(`
                <html>
                <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                    <h2>Restore Initiated successfully!</h2>
                    <p>The system is restarting to apply the backup. You will be redirected shortly.</p>
                    <script>
                        setTimeout(() => { window.location.href = '/dashboard'; }, 4000);
                    </script>
                </body>
                </html>
            `);
        } catch (error) {
            console.error('Restore Error:', error);
            res.redirect('/backup?error=Failed to restore backup');
        }
    }

    static postDelete(req, res) {
        try {
            const { filename } = req.body;
            BackupService.deleteBackup(filename);
            res.redirect('/backup');
        } catch (error) {
            console.error('Delete Backup Error:', error);
            res.redirect('/backup?error=Failed to delete backup');
        }
    }

    static getDownload(req, res) {
        try {
            const filename = req.params.filename;
            const filePath = BackupService.getBackupPath(filename);
            res.download(filePath);
        } catch (error) {
            console.error('Download Backup Error:', error);
            res.redirect('/backup?error=Failed to download backup');
        }
    }
}

module.exports = BackupController;
