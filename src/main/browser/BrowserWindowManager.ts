import { BrowserWindow, app, nativeImage, nativeTheme } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { TabManager } from './TabManager';
import { IPC_CHANNELS } from '../ipc/IpcChannels';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BrowserWindowManager {
  private mainWindow: BrowserWindow | null = null;
  private tabManager: TabManager;
  private readonly TOP_CHROME_HEIGHT = 116; // Title bar (32px) + Tab bar (40px) + Nav bar (44px)
  private sendToRenderer: ((channel: string, ...args: any[]) => void) | null = null;

  // Resolved icon paths (set once in createMainWindow)
  private lightIconPath: string | null = null; // black logo — for light mode
  private darkIconPath: string | null = null;  // white logo — for dark mode

  constructor(tabManager: TabManager) {
    this.tabManager = tabManager;
  }

  /** Call this from main/index.ts so the window manager can push events to the renderer. */
  public setSendToRenderer(fn: (channel: string, ...args: any[]) => void) {
    this.sendToRenderer = fn;
  }

  /** Returns true when Windows is currently in dark mode. */
  public isDarkMode(): boolean {
    return nativeTheme.shouldUseDarkColors;
  }

  /** Picks the right icon path for the current theme. */
  private getThemeIconPath(): string | null {
    return nativeTheme.shouldUseDarkColors ? this.darkIconPath : this.lightIconPath;
  }

  /** Applies the icon to the main window based on the current nativeTheme. */
  private applyThemeIcon() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
    const iconPath = this.getThemeIconPath();
    if (!iconPath) return;
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      this.mainWindow.setIcon(icon);
    }
  }

  public async createMainWindow(): Promise<BrowserWindow> {
    const isDev = !app.isPackaged;
    const preloadPath = path.join(__dirname, '../preload/index.cjs');

    if (!fs.existsSync(preloadPath)) {
      console.error(`[BrowserWindowManager] Preload file NOT found at: ${preloadPath}`);
    } else {
      console.log(`[BrowserWindowManager] Preload verified at: ${preloadPath}`);
    }

    // ------------------------------------------------------------------
    // Resolve icon paths for both themes.
    // Light mode  → black ORCA logo (orca.ico / orca-logo.png fallback)
    // Dark mode   → white ORCA logo (orca-logo-white.ico / orca-logo-white.png fallback)
    // ------------------------------------------------------------------
    const possibleLightIconPaths = [
      path.join(app.getAppPath(), 'assets/orca.ico'),
      path.join(process.resourcesPath, 'assets/orca.ico'),
      path.join(__dirname, '../../assets/orca.ico'),
      path.join(__dirname, '../../../assets/orca.ico'),
      path.join(app.getAppPath(), 'assets/orca-logo.png'),
    ];
    const possibleDarkIconPaths = [
      path.join(app.getAppPath(), 'assets/orca-logo-white.ico'),
      path.join(process.resourcesPath, 'assets/orca-logo-white.ico'),
      path.join(__dirname, '../../assets/orca-logo-white.ico'),
      path.join(__dirname, '../../../assets/orca-logo-white.ico'),
      path.join(app.getAppPath(), 'assets/orca-logo-white.png'),
    ];

    this.lightIconPath = possibleLightIconPaths.find((p) => fs.existsSync(p)) ?? null;
    this.darkIconPath  = possibleDarkIconPaths.find((p) => fs.existsSync(p)) ?? null;

    // Use the correct icon for the current theme at startup
    const initialIconPath = this.getThemeIconPath() ?? this.lightIconPath ?? undefined;
    const appIcon = initialIconPath ? nativeImage.createFromPath(initialIconPath) : undefined;

    this.mainWindow = new BrowserWindow({
      width: 1360,
      height: 880,
      minWidth: 800,
      minHeight: 500,
      frame: false,
      titleBarStyle: 'hidden',
      titleBarOverlay: false,
      backgroundColor: '#F8FAFC',
      icon: appIcon || initialIconPath,
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

    // ------------------------------------------------------------------
    // Listen for Windows theme changes and update the taskbar/window icon
    // and notify the renderer so it can swap the in-UI logo.
    // ------------------------------------------------------------------
    nativeTheme.on('updated', () => {
      this.applyThemeIcon();
      if (this.sendToRenderer) {
        this.sendToRenderer(IPC_CHANNELS.EVENT_THEME_CHANGED, nativeTheme.shouldUseDarkColors);
      }
    });

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
