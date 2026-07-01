import { nativeImage, Tray, Menu, BrowserWindow, app } from "electron";
import path from "path";
import { getAddonPath, getAssetPath } from "../exposeDataPath";
import { startTranslucentTB } from "../transluscentTB/start";
import { stopTranslucentTB } from "../transluscentTB/stop";

const kiosk = require(getAddonPath('kiosk.node'));


export const createTray = () => {

  let tray: Tray | null = null;

  const iconPath = getAssetPath('assets', 'tray-icon.png');
  console.log('__dirname:', __dirname);
  console.log('path.join(__dirname, "..", ".."):', path.join(__dirname, '..', '..'));
  console.log('iconPath:', iconPath);

  let trayIcon: Electron.NativeImage;


  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch (err) {
    console.error('Error loading tray icon, using empty image:', err);
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));

  const safeRestoreTaskbar = () => {
    try {
      if (kiosk && typeof kiosk.restoreTaskbar === 'function') {
        kiosk.restoreTaskbar();
      }
    } catch (err) {
      console.error('Error restoring taskbar:', err);
    }
  };

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Reload Windows',
      click: () => {
        try {
          BrowserWindow.getAllWindows().forEach((win) => win.reload())
        } catch (err) {
          console.error('Error reloading windows:', err);
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Taskbar',
      submenu: [
        {
          label: 'Fully Transparent (TTB)',
          click: () => {
            try {
              safeRestoreTaskbar();
              startTranslucentTB(['--transparent']);
            } catch (err) {
              console.error('Error setting transparent taskbar:', err);
            }
          }
        },
        {
          label: 'Blurred (TTB)',
          click: () => {
            try {
              safeRestoreTaskbar();
              startTranslucentTB(['--blur']);
            } catch (err) {
              console.error('Error setting blurred taskbar:', err);
            }
          }
        },
        {
          label: 'Acrylic (TTB)',
          click: () => {
            try {
              safeRestoreTaskbar();
              startTranslucentTB(['--acrylic']);
            } catch (err) {
              console.error('Error setting acrylic taskbar:', err);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Opaque (Native)',
          click: () => {
            try {
              stopTranslucentTB();
              safeRestoreTaskbar();
            } catch (err) {
              console.error('Error restoring opaque taskbar:', err);
            }
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        try {
          app.quit();
        } catch (err) {
          console.error('Error quitting app:', err);
          process.exit(1);
        }
      }
    },
    {
      label: 'DevTools',
      click: () => {
        try {
          BrowserWindow.getAllWindows().forEach((win) => win.webContents.openDevTools())
        } catch (err) {
          console.error('Error opening DevTools:', err);
        }
      }
    }
  ]);

  tray.setToolTip('Desktop Overlay');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    try {
      const wins = BrowserWindow.getAllWindows();
      const anyVisible = wins.some((win) => win.isVisible());
      wins.forEach((win) => anyVisible ? win.hide() : win.show());
    } catch (err) {
      console.error('Error toggling window visibility:', err);
    }
  });


  return tray;

};