const { app, BrowserWindow, Menu, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
// Removed early require of app to prevent early DB connection in packaged state
// const expressApp = require('./app');

let mainWindow;
let server;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  // Global Error Handling for Main Process
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    dialog.showErrorBox(
      "Application Error (Main Process)",
      `An unexpected error occurred: ${error.message}\n\n${error.stack}`,
    );
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    dialog.showErrorBox(
      "Application Error (Async)",
      `An unhandled promise rejection occurred: ${reason}`,
    );
  });

  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    try {
      // AppData Initialization & Environment config for SQLite
      const userDataPath = app.getPath("userData");

      // Define paths safely in AppData
      const dbPath = path.join(userDataPath, "pos_database.sqlite");
      const sessionsPath = path.join(userDataPath, "sessions.sqlite");
      const uploadsDir = path.join(userDataPath, "uploads");
      const backupsDir = path.join(userDataPath, "backups");

      // Ensure directories exist
      if (!fs.existsSync(uploadsDir))
        fs.mkdirSync(uploadsDir, { recursive: true });
      if (!fs.existsSync(backupsDir))
        fs.mkdirSync(backupsDir, { recursive: true });

      // Push to environment variables so database script configures itself properly
      process.env.DB_PATH = dbPath;
      process.env.SESSION_DB_PATH = sessionsPath;
      process.env.UPLOADS_DIR = uploadsDir;
      process.env.BACKUPS_DIR = backupsDir;
      process.env.IS_ELECTRON = "true";

      // Load Express App only AFTER env variables are set
      console.log("Initializing Express server...");
      const expressApp = require("./app");

      // Start Web Server dynamically on an open port
      server = expressApp.listen(0, "127.0.0.1", () => {
        const port = server.address().port;
        console.log(`Express server running on 127.0.0.1:${port}`);

        // Native Windows frame per user request
        mainWindow = new BrowserWindow({
          width: 1200,
          height: 800,
          minWidth: 1000,
          minHeight: 600,
          title: "Supertech POS System",
          icon: path.join(__dirname, "public", "favicon.ico"),
          show: false,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          },
        });

        // Hide the default electron menu bar
        mainWindow.setMenuBarVisibility(false);

        // Load the locally spun-up Express server
        mainWindow.loadURL(`http://127.0.0.1:${port}`);

        // Handle load failures
        mainWindow.webContents.on(
          "did-fail-load",
          (event, errorCode, errorDescription) => {
            console.error("Failed to load URL:", errorDescription);
            dialog.showErrorBox(
              "Load Error",
              `Failed to connect to internal server: ${errorDescription} (${errorCode})`,
            );
          },
        );

        mainWindow.on("ready-to-show", () => {
          mainWindow.maximize();
          mainWindow.show();
        });

        // Fallback show in case ready-to-show hangs
        setTimeout(() => {
          if (mainWindow && !mainWindow.isVisible()) {
            console.warn(
              "Fallback: Showing window because ready-to-show timed out.",
            );
            mainWindow.show();
          }
        }, 5000);

        mainWindow.on("closed", () => {
          mainWindow = null;
        });
      });

      server.on("error", (err) => {
        console.error("Server error:", err);
        dialog.showErrorBox(
          "Server Error",
          `Express server failed to start: ${err.message}`,
        );
      });
    } catch (error) {
      console.error("Initialization error:", error);
      dialog.showErrorBox(
        "Initialization Error",
        `Failed to start application components: ${error.message}\n\n${error.stack}`,
      );
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
