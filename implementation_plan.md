# Electron Desktop Application & Disaster Recovery Plan

The goal is to securely wrap your robust Node.js/Express application into a standalone desktop executable (`.exe`) via Electron. This strategy is ideal for selling to clients, as it isolates the application, simplifies execution (double-click to run), and prevents end-users from accidentally breaking source files.

## 1. Electron wrapper (`main.js`)

We will introduce Electron into the codebase.

**How it works:**
- When the user launches the app, Electron spins up a hidden Node.js background process which launches your Express `server.js`.
- Electron then opens a chromeless native `BrowserWindow` operating in full-screen (or maximized), locking the user into your web application (`http://localhost:3000`).
- The user feels like they are using a native desktop app, but they are interacting with the web UI we've perfected.

#### [NEW] `main.js` (Electron Entry Point)
A script handling the window creation, menu hiding, and orchestrating the underlying Express server launch.

#### [MODIFY] `package.json`
- Add `electron`, `electron-builder`, and `wait-on` dependencies.
- Configure packaging scripts (e.g., `npm run build:windows`) to compile a sleek Setup Wizard (`.exe`).

## 2. Robust File & Database Management (Disaster Proofing)

> [!WARNING]
> **The Problem:** Currently, the database (`pos_database.sqlite`) is saved directly inside the code folder. If a user installs the desktop version to `C:\Program Files\`, the system will crash immediately because Windows blocks writes to Program Files. 
> Also, if they uninstall/reinstall the app to fix a bug, the database gets wiped out.

### The Fix: AppData Isolation
We will modify the database script so that when running inside Electron, all mission-critical data files—`pos_database.sqlite`, `sessions.sqlite`, and the `public/uploads/` images—are saved to immutable OS-level App Data folders (e.g., `C:\Users\[Username]\AppData\Roaming\POS-System\`).

#### [MODIFY] `config/database.js`
- Route database paths through `app.getPath('userData')` if Electron is detected.

#### [MODIFY] `routes/settingsRoutes.js`
- Move uploaded logos to the AppData storage folder.

## 3. The Disaster Recovery & Backup Plan

"What if something happens to the DB or system?"

1. **Automated Daily Backups:** I will set up a background scheduler within Node.js (`node-cron`). Every night at midnight, it will silently copy `pos_database.sqlite` into an `AppData/Backups` folder. It will keep a rolling window of the last 30 days.
2. **One-Click Local Restore:** The `/backup` route we built already acts as a brilliant recovery portal. If corruption occurs, the user can open this tab, click "Restore", and the system will replace the broken DB with yesterday's backup and restart.
3. **Emergency Hard Reset:** I will document a procedure for your client support. If the app completely crashes and they can't even reach the UI, tech support can browse to `%AppData%\POS-System`, manually delete `pos_database.sqlite`, rename a backup to `pos_database.sqlite`, and double-click the app to recover instantly.

## 4. Selling, Structuring Support & Maintenance 

To sell this app effectively safely, we need:
- **Locked Code (`.asar`):** `electron-builder` will compress your proprietary Node source code into an encrypted `.asar` archive so buyers cannot steal or tamper with the logic.
- **Support Portal:** Add a static "Help / Support" tab in the sidebar containing your contact information, email, or ticketing link so clients know exactly who to reach out to if they need maintenance.

#### [NEW] `views/support/index.ejs`
A static page displaying license information, software version, and your maintenance contact details.

## Open Questions
- Do you want the desktop app to open in a frameless window (modern look), or a native Windows frame containing minimize/maximize/close buttons?
- What support email or contact number would you like to display on the "Help / Support" page?
