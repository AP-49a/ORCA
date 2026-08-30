import { app, BrowserWindow } from 'electron';
import { TabManager } from './browser/TabManager';
import { BrowserWindowManager } from './browser/BrowserWindowManager';
import { MemoryManager } from './memory/MemoryManager';
import { StorageManager } from './persistence/StorageManager';
import { DownloadManager } from './browser/DownloadManager';
import { registerIpcHandlers } from './ipc/IpcHandlers';
import { IPC_CHANNELS } from './ipc/IpcChannels';
import { Tab, TabState, MemoryStats, DownloadItem } from '../shared/types';


let storageManager: StorageManager;
let tabManager: TabManager;
let windowManager: BrowserWindowManager;
let memoryManager: MemoryManager;
let downloadManager: DownloadManager;
let mainWindow: BrowserWindow | null = null;

function sendToRenderer(channel: string, ...args: any[]) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send(channel, ...args);
  }
}

async function initializeApp() {
  storageManager = new StorageManager();
  const settings = storageManager.getSettings();

  // Setup TabManager with callbacks that forward to the React UI
  tabManager = new TabManager({
    onTabsUpdated: (tabs: Tab[]) => {
      sendToRenderer(IPC_CHANNELS.EVENT_TABS_UPDATED, tabs);
      saveCurrentSession();
    },
    onActiveTabChanged: (activeTabId: string | null) => {
      sendToRenderer(IPC_CHANNELS.EVENT_ACTIVE_TAB_CHANGED, activeTabId);
      saveCurrentSession();
    },
    onTabNavigated: (tabId: string, url: string) => {
      sendToRenderer(IPC_CHANNELS.EVENT_TAB_NAVIGATED, { tabId, url });
    },
    onTabLoading: (tabId: string, loading: boolean) => {
      sendToRenderer(IPC_CHANNELS.EVENT_TAB_LOADING, { tabId, loading });
    },
    onTabTitleUpdated: (tabId: string, title: string) => {
      sendToRenderer(IPC_CHANNELS.EVENT_TAB_TITLE_UPDATED, { tabId, title });
    },
    onTabFaviconUpdated: (tabId: string, favicon: string) => {
      sendToRenderer(IPC_CHANNELS.EVENT_TAB_FAVICON_UPDATED, { tabId, favicon });
    },
    onTabStateChanged: (tabId: string, state: TabState) => {
      sendToRenderer(IPC_CHANNELS.EVENT_TAB_STATE_CHANGED, { tabId, state });
    },
    onHistoryItemAdded: (url: string, title: string, favicon?: string) => {
      if (!url.startsWith('orca://') && !url.startsWith('about:')) {
        storageManager.addHistoryItem({ url, title, favicon, timestamp: Date.now() });
        sendToRenderer(IPC_CHANNELS.EVENT_HISTORY_UPDATED, storageManager.getHistory());
      }
    },
  });

  windowManager = new BrowserWindowManager(tabManager);

  // Setup MemoryManager
  memoryManager = new MemoryManager({
    getTabs: () => tabManager.getTabs(),
    getActiveTabId: () => tabManager.getActiveTabId(),
    getSettings: () => storageManager.getSettings(),
    suspendTab: async (id: string) => tabManager.suspendTab(id),
    hibernateTab: async (id: string) => tabManager.hibernateTab(id),
    restoreTab: async (id: string) => tabManager.restoreTab(id),
    notifyMemoryUpdated: (stats: MemoryStats) => {
      sendToRenderer(IPC_CHANNELS.EVENT_MEMORY_STATS_UPDATED, stats);
    },
    notifyTabStateChanged: (tabId: string, state: string) => {
      sendToRenderer(IPC_CHANNELS.EVENT_TAB_STATE_CHANGED, { tabId, state });
    },
  });

  // Setup DownloadManager
  downloadManager = new DownloadManager((downloads: DownloadItem[]) => {
    sendToRenderer(IPC_CHANNELS.EVENT_DOWNLOAD_UPDATED, downloads);
  });

  // Register all IPC Handlers
  registerIpcHandlers(tabManager, windowManager, memoryManager, storageManager, downloadManager);

  // Create Window
  mainWindow = await windowManager.createMainWindow();

  // Restore previous session or create default tab
  const savedSession = storageManager.getSession();
  if (settings.restoreSessionOnStartup && savedSession && savedSession.tabs.length > 0) {
    tabManager.restoreSessionTabs(savedSession.tabs, savedSession.activeTabId);
  } else {
    await tabManager.createTab({ url: 'orca://newtab', active: true });
  }

  // Start background memory optimization engine
  memoryManager.start();
}

function saveCurrentSession() {
  if (!storageManager || !tabManager) return;
  const tabs = tabManager.getTabs();
  const activeTabId = tabManager.getActiveTabId();
  const workspaces = storageManager.getWorkspaces();
  const settings = storageManager.getSettings();

  storageManager.saveSession({
    workspaces,
    activeWorkspaceId: workspaces[0]?.id || 'ws-personal',
    tabs,
    activeTabId,
    settings,
  });
}

app.whenReady().then(initializeApp);

app.on('window-all-closed', () => {
  saveCurrentSession();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (memoryManager) {
    memoryManager.stop();
  }
  saveCurrentSession();
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await initializeApp();
  }
});
