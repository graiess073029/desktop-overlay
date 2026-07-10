import { app, BrowserWindow, dialog, screen as electronScreen, ipcMain, Tray } from 'electron';
import path from 'path';
import { executeCommand } from './services/executeCommand';
import { getAppsData } from './services/apps/getAppsData';
import { getBackgroundsData } from './services/backgrounds/getBackgroundsData';
import { getModesData } from './services/getModesData';
import { addBackground } from './services/backgrounds/addBackground';
import { getDataSample, getLatestData, sharedMemReader } from './services/sensors/sharedMemReader';
import { mapSensorsWithAI } from './services/sensors/sensorMapper';
import { getDiskData } from './services/sensors/getDiscData';
import { deleteBackground } from './services/backgrounds/deleteBackground';
import { deleteApp } from './services/apps/deleteApp';
import { addApp, readDesktop } from './services/apps/addApp';
import { getSpecs } from './services/sensors/getSpecs';
import { getAddonPath } from './services/exposeDataPath';
import { startHWiNFO } from './services/hwinfo/start';
import { startTranslucentTB } from './services/transluscentTB/start';
import { stopTranslucentTB } from './services/transluscentTB/stop';
import { checkSensorMapping } from './services/sensors/checkMapping';
import { verifyDataFiles } from './services/checkCacheFiles';
import { createTray } from './services/tray/createTray';
import { setGpuPreference } from './setGpu';

app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256');

setGpuPreference();

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
  console.log("Other instance already running");
  process.exit(0);
} else {
  app.on('second-instance', () => {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length) {
      windows.forEach((win) => {
        if (win) {
          if (win.isMinimized()) win.restore();
          win.focus();
        }
      });
    }
  })
}

const kiosk = require(getAddonPath('kiosk.node'));

let tray: Tray | null = null;
let displayBounds: Electron.Display[] = [];
const installedHwnds: bigint[] = [];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let sensorInterval: NodeJS.Timeout | null = null;
let isAnyWindowVisible = true;
let pollingRateMs = 1000;

const startSensorPolling = () => {
  if (sensorInterval) clearInterval(sensorInterval);
  sensorInterval = setInterval(async () => {
    if (!isAnyWindowVisible) return;
    await sharedMemReader();
    getLatestData();
  }, pollingRateMs);
};

const updatePollingRate = () => {
  const anyVisible = BrowserWindow.getAllWindows().some(w => w.isVisible());
  isAnyWindowVisible = anyVisible;
  pollingRateMs = anyVisible ? 2000 : 5000;
};

const createWindow = () => {
  const displays = electronScreen.getAllDisplays();
  displayBounds = displays;

  displays.forEach((display, index) => {
    const { x, y, width, height } = display.bounds;

    const win = new BrowserWindow({
      x, y, width, height,
      type: 'toolbar',           // ← NEW: special DWM layer for overlays
      movable: false,
      frame: false,
      alwaysOnTop: false,
      autoHideMenuBar: false,
      enableLargerThanScreen: true,
      resizable: false,
      skipTaskbar: true,
      fullscreen: false,
      roundedCorners: false,
      show: false,
      focusable: true,
      transparent: true,         // ← NEW: cleaner DWM compositing
      hasShadow: false,          // ← NEW: no shadow artifacts
      thickFrame: false,         // ← NEW: no resize border
      webPreferences: {
        preload: path.join(__dirname, 'preload', 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        backgroundThrottling: false,  // ← RESTORED: safe now, prevents renderer freeze
        additionalArguments: [
          `--display-index=${index}`,
          `--display-id=${display.id}`
        ]
      }
    });

    win.once('ready-to-show', () => win.show());

    win.on('hide', updatePollingRate);
    win.on('show', updatePollingRate);
    win.on('minimize', updatePollingRate);
    win.on('restore', updatePollingRate);

    display.bounds.x === 0 && display.bounds.y === 0
      ? win.loadFile(path.join(__dirname, "renderer", 'primary', 'index.html')).catch(e => console.error(e))
      : win.loadFile(path.join(__dirname, 'renderer', 'secondary', 'index.html')).catch(e => console.error(e));

    // CRITICAL FIX: readBigUInt64LE for 64-bit HWND, not readUInt32LE
    const buffer = win.getNativeWindowHandle();
    const hwnd = buffer.readBigUInt64LE(0);

    kiosk.installOverlay(hwnd, index);
    installedHwnds.push(hwnd);

  });
};

const handleIPC = async () => {
  ipcMain.on('refresh-windows', () => {
    try {
      BrowserWindow.getAllWindows().forEach((win) => {
        win.reload()
      });
    } catch (err) {
      console.error("Error refreshing windows:", err);
    }
  });

  ipcMain.handle('get-sensor-data', async () => {
    try {
      return await getLatestData();
    } catch (err) {
      console.error('Error getting sensor data:', err);
      throw err;
    }
  });

  ipcMain.handle('execute-command', async (event, command) => {
    try {
      executeCommand(command);
    } catch (err) {
      console.error('Error executing command:', err);
      throw err;
    }
  });

  ipcMain.handle('get-apps-data', async () => {
    try {
      return await getAppsData();
    } catch (err) {
      console.error('Error getting apps data:', err);
      throw err;
    }
  });

  ipcMain.handle('get-backgrounds-data', async () => {
    try {
      return await getBackgroundsData();
    } catch (err) {
      console.error('Error getting backgrounds data:', err);
      throw err;
    }
  });

  ipcMain.handle('get-modes-data', async () => {
    try {
      return await getModesData();
    } catch (err) {
      console.error('Error getting modes data:', err);
      throw err;
    }
  });

  ipcMain.handle('get-readings', async () => {
    try {
      return await sharedMemReader();
    } catch (err) {
      console.error('Error getting readings:', err);
      throw err;
    }
  });

  ipcMain.handle('pick-file', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Backgrounds', extensions: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm'] }]
      });
      return result.canceled ? null : result.filePaths[0];
    } catch (err) {
      console.error('Error picking file:', err);
      throw err;
    }
  });

  ipcMain.handle('pick-app', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Applications', extensions: ['lnk', 'exe', 'bat', 'cmd', 'ps1'] }]
      });
      return result.canceled ? null : result.filePaths[0];
    } catch (err) {
      console.error('Error picking app:', err);
      throw err;
    }
  });

  ipcMain.handle('add-background', async (event, filePath: string) => {
    try {
      return await addBackground(filePath);
    } catch (err) {
      console.error('Error adding background:', err);
      throw err;
    }
  });

  const sensorMappingHandler = async () => {
    try {
      const dataSample = getDataSample();
      if (!dataSample) {
        console.log("No data sample available for mapping, retrying...");
        await delay(1500);
        return await sensorMappingHandler();
      }
      return await mapSensorsWithAI(dataSample);
    } catch (err) {
      console.error('Error in sensor mapping handler:', err);
      throw err;
    }
  }

  ipcMain.handle('request-sensors-mapping', sensorMappingHandler);

  ipcMain.handle('get-disc-data', async () => {
    try {
      return await getDiskData();
    } catch (err) {
      console.error('Error getting disk data:', err);
      throw err;
    }
  });

  ipcMain.handle('delete-background', async (event, index: number) => {
    try {
      return await deleteBackground(index);
    } catch (err) {
      console.error('Error deleting background:', err);
      throw err;
    }
  });

  ipcMain.handle('delete-app', async (event, paths: string[]) => {
    try {
      return await deleteApp(paths);
    } catch (err) {
      console.error('Error deleting app:', err);
      throw err;
    }
  });

  ipcMain.handle('add-app', async (event, appData: { path: string, displayedName: string }) => {
    try {
      return await addApp(appData);
    } catch (err) {
      console.error('Error adding app:', err);
      throw err;
    }
  });

  ipcMain.handle('get-specs', async () => {
    try {
      return await getSpecs();
    } catch (err) {
      console.error('Error getting specs:', err);
      throw err;
    }
  });

  ipcMain.handle('get-display-bounds', () => {
    try {
      return displayBounds.map(d => d.bounds);
    } catch (err) {
      console.error('Error getting display bounds:', err);
      throw err;
    }
  });

  ipcMain.handle('imitate-desktop', async () => {
    try {
      return await readDesktop();
    } catch (err) {
      console.error('Error imitating desktop:', err);
      throw err;
    }
  });
}

const cleanupNativeTweaks = () => {
  try {
    // Uninstall each overlay individually with its BigInt HWND
    installedHwnds.forEach((hwnd) => {
      if (kiosk && typeof kiosk.uninstallOverlay === 'function') {
        kiosk.uninstallOverlay(hwnd);
      }
    });
    installedHwnds.length = 0;

    if (kiosk && typeof kiosk.restoreTaskbar === 'function') {
      kiosk.restoreTaskbar();
    }

    stopTranslucentTB();
    tray?.destroy();
  } catch (error) {
    console.error("Failed to clean up native configurations cleanly:", error);
    try {
      executeCommand("explorer.exe");
    } catch (e) {
      console.error('Failed to restore the desktop:', e);
    }
  }
};


app.whenReady().then(async () => {
  try {
    await verifyDataFiles();
    await checkSensorMapping();
    await startHWiNFO();
    startSensorPolling();
    createWindow();
    tray = createTray();
    await startTranslucentTB();
  }
  catch (err) {
    console.error("Startup error:", err);
    cleanupNativeTweaks();
    app.quit();
  }
}).catch((err) => {
  console.error("Startup error:", err);
  cleanupNativeTweaks();
  app.quit();
});

app.on('window-all-closed', () => {
  cleanupNativeTweaks();
  app.quit();
});

app.on("before-quit", () => {
  cleanupNativeTweaks();
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  cleanupNativeTweaks();
  app.quit();
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  cleanupNativeTweaks();
});

handleIPC();