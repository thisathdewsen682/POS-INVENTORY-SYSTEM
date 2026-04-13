const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const expressApp = require('./app');

let mainWindow;
let server;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        // AppData Initialization & Environment config for SQLite
        const userDataPath = app.getPath('userData');
        
        // Define paths safely in AppData
        const dbPath = path.join(userDataPath, 'pos_database.sqlite');
        const sessionsPath = path.join(userDataPath, 'sessions.sqlite');
        const uploadsDir = path.join(userDataPath, 'uploads');
        const backupsDir = path.join(userDataPath, 'backups');

        // Ensure directories exist
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

        // Push to environment variables so database script configures itself properly
        process.env.DB_PATH = dbPath;
        process.env.SESSION_DB_PATH = sessionsPath;
        process.env.UPLOADS_DIR = uploadsDir;
        process.env.BACKUPS_DIR = backupsDir;
        process.env.IS_ELECTRON = 'true';

        // Automated Daily Backup (Runs everyday at 23:59)
        cron.schedule('59 23 * * *', () => {
            console.log('Running automated daily backup...');
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const backupFile = path.join(backupsDir, `backup_${dateStr}_auto.sqlite`);
            try {
                // Ensure better-sqlite3 is required after DB_PATH is explicitly set
                const db = require('./config/database');
                db.backup(backupFile)
                  .then(() => console.log('Automated Daily Backup Successful!'))
                  .catch(err => console.error('Automated Daily Backup Failed!', err));
            } catch (err) {
                console.error('Backup cron error: ', err);
            }
        });

        // Start Web Server dynamically on an open port
        server = expressApp.listen(0, () => {
            const port = server.address().port;
            console.log(`Express server running on dynamic port ${port}`);

            // Native Windows frame per user request
            mainWindow = new BrowserWindow({
                width: 1200,
                height: 800,
                minWidth: 1000,
                minHeight: 600,
                title: 'Supertech POS System',
                icon: path.join(__dirname, 'public', 'favicon.ico'),
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            // Hide the default electron menu bar
            mainWindow.setMenuBarVisibility(false);
            
            // Load the locally spun-up Express server
            mainWindow.loadURL(`http://localhost:${port}`);

            mainWindow.on('ready-to-show', () => {
                mainWindow.maximize();
                mainWindow.show();
            });

            mainWindow.on('closed', () => {
                mainWindow = null;
            });
        });
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
}
