import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './IpcChannels';
import { TabManager } from '../browser/TabManager';
import { BrowserWindowManager } from '../browser/BrowserWindowManager';
import { MemoryManager } from '../memory/MemoryManager';
import { StorageManager } from '../persistence/StorageManager';
import { DownloadManager } from '../browser/DownloadManager';
import { Bookmark, BrowserSettings, Workspace } from '../../shared/types';

export function registerIpcHandlers(
  tabManager: TabManager,
  windowManager: BrowserWindowManager,
  memoryManager: MemoryManager,
  storageManager: StorageManager,
  downloadManager: DownloadManager
) {
  // --- Tabs ---
  ipcMain.handle(IPC_CHANNELS.TAB_CREATE, async (_, options) => {
    return tabManager.createTab(options);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_CLOSE, async (_, tabId) => {
    return tabManager.closeTab(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_SELECT, async (_, tabId) => {
    return tabManager.selectTab(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_NAVIGATE, async (_, tabId, url) => {
    const settings = storageManager.getSettings();
    console.log('[main-ipc] TAB_NAVIGATE:', { tabId, url, searchEngine: settings.searchEngine });
    return tabManager.navigateTab(tabId, url, settings.searchEngine);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_RELOAD, async (_, tabId) => {
    return tabManager.reloadTab(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_STOP, async (_, tabId) => {
    return tabManager.stopTab(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_GO_BACK, async (_, tabId) => {
    return tabManager.goBack(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_GO_FORWARD, async (_, tabId) => {
    return tabManager.goForward(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_TOGGLE_PIN, async (_, tabId) => {
    return tabManager.togglePinTab(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_TOGGLE_MUTE, async (_, tabId) => {
    return tabManager.toggleMuteTab(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_DUPLICATE, async (_, tabId) => {
    return tabManager.duplicateTab(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_REORDER, async (_, tabIds) => {
    return tabManager.reorderTabs(tabIds);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_SUSPEND, async (_, tabId) => {
    return tabManager.suspendTab(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_HIBERNATE, async (_, tabId) => {
    return tabManager.hibernateTab(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_RESTORE, async (_, tabId) => {
    return tabManager.restoreTab(tabId);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_SET_ZOOM, async (_, tabId, zoomLevel) => {
    return tabManager.setZoom(tabId, zoomLevel);
  });

  ipcMain.handle(IPC_CHANNELS.TAB_KEEP_AWAKE, async (_, tabId: string, keepAwake: boolean) => {
    return tabManager.setKeepAwake(tabId, keepAwake);
  });

  // --- Workspaces ---
  ipcMain.handle(IPC_CHANNELS.WORKSPACE_LIST, async () => {
    return storageManager.getWorkspaces();
  });

  ipcMain.handle(IPC_CHANNELS.WORKSPACE_CREATE, async (_, name: string, color?: string, icon?: string) => {
    const workspaces = storageManager.getWorkspaces();
    const newWs: Workspace = {
      id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      color: color || '#0284C7',
      icon: icon || 'Folder',
      createdAt: Date.now(),
    };
    workspaces.push(newWs);
    storageManager.saveWorkspaces(workspaces);
    return newWs;
  });

  ipcMain.handle(IPC_CHANNELS.WORKSPACE_UPDATE, async (_, workspace: Workspace) => {
    const workspaces = storageManager.getWorkspaces();
    const index = workspaces.findIndex(w => w.id === workspace.id);
    if (index >= 0) {
      workspaces[index] = workspace;
      storageManager.saveWorkspaces(workspaces);
    }
  });

  ipcMain.handle(IPC_CHANNELS.WORKSPACE_DELETE, async (_, workspaceId: string) => {
    let workspaces = storageManager.getWorkspaces();
    workspaces = workspaces.filter(w => w.id !== workspaceId);
    storageManager.saveWorkspaces(workspaces);
  });

  ipcMain.handle(IPC_CHANNELS.WORKSPACE_SWITCH, async (_, workspaceId: string) => {
    const tabs = tabManager.getTabs().filter(t => t.workspaceId === workspaceId);
    if (tabs.length > 0) {
      await tabManager.selectTab(tabs[0].id);
    } else {
      // Create a tab in this workspace
      await tabManager.createTab({ url: 'orca://newtab', workspaceId, active: true });
    }
  });

  // --- Memory ---
  ipcMain.handle(IPC_CHANNELS.MEMORY_GET_STATS, async () => {
    return memoryManager.getStats();
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_OPTIMIZE_NOW, async () => {
    return memoryManager.optimizeNow();
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_SUSPEND_ALL_ELIGIBLE, async () => {
    return memoryManager.suspendAllEligible();
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_RESTORE_ALL, async () => {
    return memoryManager.restoreAll();
  });

  // --- Bookmarks ---
  ipcMain.handle(IPC_CHANNELS.BOOKMARK_GET_ALL, async () => {
    return storageManager.getBookmarks();
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARK_ADD, async (_, url: string, title: string, favicon?: string) => {
    const bookmarks = storageManager.getBookmarks();
    const newBm: Bookmark = {
      id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url,
      title: title || url,
      favicon,
      folderId: null,
      createdAt: Date.now(),
    };
    bookmarks.unshift(newBm);
    storageManager.saveBookmarks(bookmarks);
    return newBm;
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARK_UPDATE, async (_, bookmark: Bookmark) => {
    const bookmarks = storageManager.getBookmarks();
    const idx = bookmarks.findIndex(b => b.id === bookmark.id);
    if (idx >= 0) {
      bookmarks[idx] = bookmark;
      storageManager.saveBookmarks(bookmarks);
    }
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARK_REMOVE, async (_, bookmarkId: string) => {
    let bookmarks = storageManager.getBookmarks();
    bookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    storageManager.saveBookmarks(bookmarks);
  });

  // --- History ---
  ipcMain.handle(IPC_CHANNELS.HISTORY_GET_ALL, async () => {
    return storageManager.getHistory();
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_SEARCH, async (_, query: string) => {
    const history = storageManager.getHistory();
    const q = query.toLowerCase();
    return history.filter(h => h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q));
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_DELETE, async (_, id: string) => {
    let history = storageManager.getHistory();
    history = history.filter(h => h.id !== id);
    storageManager.saveHistory(history);
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, async () => {
    storageManager.clearHistory();
  });

  // --- Downloads ---
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_GET_ALL, async () => {
    return downloadManager.getDownloads();
  });

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_CANCEL, async (_, id: string) => {
    downloadManager.cancelDownload(id);
  });

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_OPEN_FILE, async (_, id: string) => {
    return downloadManager.openFile(id);
  });

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_SHOW_IN_FOLDER, async (_, id: string) => {
    downloadManager.showInFolder(id);
  });

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_CLEAR_COMPLETED, async () => {
    downloadManager.clearCompleted();
  });

  // --- Settings ---
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    return storageManager.getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_, newSettings: Partial<BrowserSettings>) => {
    const current = storageManager.getSettings();
    const updated = { ...current, ...newSettings };
    storageManager.saveSettings(updated);
    return updated;
  });

  // --- Panel Overlay ---
  ipcMain.handle(IPC_CHANNELS.PANEL_OVERLAY_STATE, async (_, isOpen: boolean, panelName: string) => {
    return tabManager.setPanelOverlayState(isOpen, panelName);
  });

  // --- Workspace Memory ---
  ipcMain.handle(IPC_CHANNELS.MEMORY_SUSPEND_WORKSPACE, async (_, workspaceId: string) => {
    return memoryManager.suspendWorkspace(workspaceId);
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_RESTORE_WORKSPACE, async (_, workspaceId: string) => {
    return memoryManager.restoreWorkspace(workspaceId);
  });

  // --- Window Controls ---
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, async () => {
    windowManager.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, async () => {
    windowManager.maximize();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, async () => {
    windowManager.close();
  });
}
