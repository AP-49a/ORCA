import { BrowserWindow, app, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { TabManager } from './TabManager';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BrowserWindowManager {
  private mainWindow: BrowserWindow | null = null;
  private tabManager: TabManager;
  private readonly TOP_CHROME_HEIGHT = 116; // Title bar (32px) + Tab bar (40px) + Nav bar (44px)

  constructor(tabManager: TabManager) {
    this.tabManager = tabManager;
  }

  public async createMainWindow(): Promise<BrowserWindow> {
    const isDev = !app.isPackaged;
    const preloadPath = path.join(__dirname, '../preload/index.cjs');

    if (!fs.existsSync(preloadPath)) {
      console.error(`[BrowserWindowManager] Preload file NOT found at: ${preloadPath}`);
    } else {
      console.log(`[BrowserWindowManager] Preload verified at: ${preloadPath}`);
    }

    // Resolve application icon
    const possibleIconPaths = [
      path.join(app.getAppPath(), 'assets/orca.ico'),
      path.join(process.resourcesPath, 'assets/orca.ico'),
      path.join(__dirname, '../../assets/orca.ico'),
      path.join(__dirname, '../../../assets/orca.ico'),
      path.join(app.getAppPath(), 'assets/orca-icon-256.png'),
    ];
    const foundPath = possibleIconPaths.find((p) => fs.existsSync(p));
    const appIcon = foundPath ? nativeImage.createFromPath(foundPath) : undefined;

    this.mainWindow = new BrowserWindow({
      width: 1360,
      height: 880,
      minWidth: 800,
      minHeight: 500,
      frame: false,
      titleBarStyle: 'hidden',
      titleBarOverlay: false,
      backgroundColor: '#F8FAFC',
      icon: appIcon || foundPath,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    if (appIcon && !appIcon.isEmpty()) {
      this.mainWindow.setIcon(appIcon);
    }

    this.tabManager.setWindow(this.mainWindow);

    // Keep the webpage view below the ORCA chrome. A full-window BrowserView
    // covers the renderer chrome and intercepts clicks. The native frame is the
    // real OS window controls; the React chrome remains in the renderer.
    const updateBounds = () => {
      if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
      const [width, height] = this.mainWindow.getContentSize();
      this.tabManager.updateContentBounds({
        x: 0,
        y: this.TOP_CHROME_HEIGHT,
        width,
        height,
      });
    };

    this.mainWindow.on('resize', updateBounds);
    this.mainWindow.on('will-resize', updateBounds);
    this.mainWindow.on('resized', updateBounds);
    this.mainWindow.on('maximize', updateBounds);
    this.mainWindow.on('unmaximize', updateBounds);
    this.mainWindow.on('restore', updateBounds);
    this.mainWindow.on('enter-full-screen', updateBounds);
    this.mainWindow.on('leave-full-screen', updateBounds);

    // Initial bounds calculation immediately and after layout stabilization
    updateBounds();
    setTimeout(updateBounds, 100);
    setTimeout(updateBounds, 300);

    // Load URL
    if (isDev && process.env['VITE_DEV_SERVER_URL']) {
      await this.mainWindow.loadURL(process.env['VITE_DEV_SERVER_URL']);
    } else {
      const htmlPath = path.join(__dirname, '../../dist/index.html');
      await this.mainWindow.loadFile(htmlPath);
    }

    return this.mainWindow;
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  public minimize() {
    this.mainWindow?.minimize();
  }

  public maximize() {
    if (this.mainWindow?.isMaximized()) {
      this.mainWindow.unmaximize();
    } else {
      this.mainWindow?.maximize();
    }
  }

  public close() {
    this.mainWindow?.close();
  }
}
