const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DEFAULT_TODOS_DIR = path.join(os.homedir(), '.claude', 'todos');
const PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

let mainWindow;
let sessionToProjectMap = {};
let currentDir = DEFAULT_TODOS_DIR;
let currentSessionFile = null;
let watcher = null;

function buildSessionToProjectMap() {
  sessionToProjectMap = {};
  try {
    const projectDirs = fs.readdirSync(PROJECTS_DIR).filter(d => {
      const fullPath = path.join(PROJECTS_DIR, d);
      return fs.statSync(fullPath).isDirectory() && d.startsWith('-');
    });

    for (const projectDir of projectDirs) {
      // Convert directory name back to path: -Users-foo-bar -> /Users/foo/bar
      const projectPath = projectDir.replace(/^-/, '/').replace(/-/g, '/');
      const projectName = path.basename(projectPath);
      const fullProjectDir = path.join(PROJECTS_DIR, projectDir);

      // Find session IDs in this project directory
      const items = fs.readdirSync(fullProjectDir);
      for (const item of items) {
        // Session IDs are UUIDs (either as folders or .jsonl files)
        const sessionId = item.replace('.jsonl', '');
        if (sessionId.match(/^[0-9a-f-]{36}$/i)) {
          sessionToProjectMap[sessionId] = {
            path: projectPath,
            name: projectName
          };
        }
      }
    }
  } catch (err) {
    console.error('Error building session map:', err);
  }
}

function getProjectForSession(sessionFileName) {
  // Extract session ID from filename like "abc123-def456.json" or "abc123-agent-def456.json"
  const baseName = sessionFileName.replace('.json', '');

  // Try direct match first
  if (sessionToProjectMap[baseName]) {
    return sessionToProjectMap[baseName];
  }

  // Try to find by session ID prefix (before -agent-)
  const mainSessionId = baseName.split('-agent-')[0];
  if (sessionToProjectMap[mainSessionId]) {
    return sessionToProjectMap[mainSessionId];
  }

  // Try partial match (first UUID part)
  for (const sessionId of Object.keys(sessionToProjectMap)) {
    if (baseName.startsWith(sessionId) || sessionId.startsWith(baseName.substring(0, 36))) {
      return sessionToProjectMap[sessionId];
    }
  }

  return null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1e1e1e'
  });

  mainWindow.loadFile('index.html');
}

function getSessions() {
  try {
    const files = fs.readdirSync(currentDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const filePath = path.join(currentDir, f);
        const stat = fs.statSync(filePath);
        let todoCount = 0;
        let preview = '';
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (Array.isArray(content)) {
            todoCount = content.length;
            const inProgress = content.find(t => t.status === 'in_progress');
            preview = inProgress ? inProgress.content : (content[0]?.content || '');
          }
        } catch (e) {}
        const project = getProjectForSession(f);
        return {
          name: f,
          path: filePath,
          mtime: stat.mtime,
          todoCount,
          preview: preview.substring(0, 50),
          projectName: project?.name || null,
          projectPath: project?.path || null
        };
      })
      .filter(f => {
        if (f.todoCount === 0) return false;
        // Hide sessions older than 1 hour
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        return f.mtime.getTime() > oneHourAgo;
      })
      .sort((a, b) => b.mtime - a.mtime);

    return files;
  } catch (err) {
    console.error('Error reading directory:', err);
    return [];
  }
}

function readTodoFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const todos = JSON.parse(content);
    return Array.isArray(todos) ? todos : [];
  } catch (err) {
    return [];
  }
}

function getTodos(sessionFile) {
  const filePath = sessionFile || currentSessionFile;
  if (!filePath || !fs.existsSync(filePath)) {
    return { todos: [], fileName: null, mtime: null };
  }

  const stat = fs.statSync(filePath);
  return {
    todos: readTodoFile(filePath),
    fileName: path.basename(filePath),
    mtime: stat.mtime.toISOString()
  };
}

function startWatching() {
  if (watcher) {
    watcher.close();
  }

  try {
    watcher = fs.watch(currentDir, (eventType, filename) => {
      if (filename && filename.endsWith('.json')) {
        // Send updated session list
        const sessions = getSessions();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('sessions-updated', sessions);
        }

        // If watching a specific file, send todo updates
        if (currentSessionFile && filename === path.basename(currentSessionFile)) {
          const data = getTodos(currentSessionFile);
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('todos-updated', data);
          }
        }
      }
    });
  } catch (err) {
    console.error('Error watching directory:', err);
  }
}

app.whenReady().then(() => {
  // Set dock icon on macOS
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'icon.png'));
  }

  buildSessionToProjectMap();
  createWindow();
  startWatching();

  ipcMain.handle('get-sessions', () => {
    return getSessions();
  });

  ipcMain.handle('get-todos', (event, sessionFile) => {
    return getTodos(sessionFile);
  });

  ipcMain.handle('select-session', (event, sessionFile) => {
    currentSessionFile = sessionFile;
    return getTodos(sessionFile);
  });

  ipcMain.handle('get-current-dir', () => {
    return currentDir;
  });

  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      defaultPath: currentDir
    });

    if (!result.canceled && result.filePaths.length > 0) {
      currentDir = result.filePaths[0];
      currentSessionFile = null;
      startWatching();
      return {
        dir: currentDir,
        sessions: getSessions()
      };
    }
    return null;
  });

  ipcMain.handle('select-sound-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('reset-to-default', () => {
    currentDir = DEFAULT_TODOS_DIR;
    currentSessionFile = null;
    startWatching();
    return {
      dir: currentDir,
      sessions: getSessions()
    };
  });
});

app.on('window-all-closed', () => {
  if (watcher) {
    watcher.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
