console.log('[ORCA PRELOAD] STARTED');
console.log('[ORCA PRELOAD] LOADED');

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../main/ipc/IpcChannels';
import {
  Bookmark,
  BrowserSettings,
  DownloadItem,
  HistoryItem,
  MemoryStats,
  Tab,
  Workspace,
} from '../shared/types';

export interface OrcaAPI {
  // Tabs
  createTab: (options?: { url?: string; workspaceId?: string; active?: boolean }) => Promise<Tab>;
  closeTab: (tabId: string) => Promise<void>;
  selectTab: (tabId: string) => Promise<void>;
  navigateTab: (tabId: string, url: string) => Promise<void>;
  reloadTab: (tabId: string) => Promise<void>;
  stopTab: (tabId: string) => Promise<void>;
  goBack: (tabId: string) => Promise<void>;
  goForward: (tabId: string) => Promise<void>;
  togglePinTab: (tabId: string) => Promise<void>;
  toggleMuteTab: (tabId: string) => Promise<void>;
  duplicateTab: (tabId: string) => Promise<Tab>;
  reorderTabs: (tabIds: string[]) => Promise<void>;
  suspendTab: (tabId: string) => Promise<void>;
  hibernateTab: (tabId: string) => Promise<void>;
  restoreTab: (tabId: string) => Promise<void>;
  setZoom: (tabId: string, zoomLevel: number) => Promise<void>;

  // Workspaces
  listWorkspaces: () => Promise<Workspace[]>;
  createWorkspace: (name: string, color?: string, icon?: string) => Promise<Workspace>;
  updateWorkspace: (workspace: Workspace) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;

  // Memory
  getMemoryStats: () => Promise<MemoryStats>;
  optimizeNow: () => Promise<{ freedMB: number; suspendedCount: number }>;
  suspendAllEligible: () => Promise<{ freedMB: number; suspendedCount: number }>;
  restoreAll: () => Promise<void>;

  // Bookmarks
  getBookmarks: () => Promise<Bookmark[]>;
  addBookmark: (url: string, title: string, favicon?: string) => Promise<Bookmark>;
  updateBookmark: (bookmark: Bookmark) => Promise<void>;
  removeBookmark: (bookmarkId: string) => Promise<void>;

  // History
  getHistory: () => Promise<HistoryItem[]>;
  searchHistory: (query: string) => Promise<HistoryItem[]>;
  deleteHistoryItem: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;

  // Downloads
  getDownloads: () => Promise<DownloadItem[]>;
  cancelDownload: (id: string) => Promise<void>;
  openDownloadFile: (id: string) => Promise<void>;
  showDownloadInFolder: (id: string) => Promise<void>;
  clearCompletedDownloads: () => Promise<void>;

  // Settings
  getSettings: () => Promise<BrowserSettings>;
  updateSettings: (settings: Partial<BrowserSettings>) => Promise<BrowserSettings>;

  // Tab keep-awake
  setTabKeepAwake: (tabId: string, keepAwake: boolean) => Promise<void>;

  // Workspace memory
  suspendWorkspace: (workspaceId: string) => Promise<{ freedMB: number; suspendedCount: number }>;
  restoreWorkspace: (workspaceId: string) => Promise<void>;

  // Panel Overlay
  setPanelOverlayState: (isOpen: boolean, panelName: string) => Promise<string | null>;

  // Window Controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;

  // Event Listeners
  onTabsUpdated: (callback: (tabs: Tab[]) => void) => () => void;
  onActiveTabChanged: (callback: (activeTabId: string | null) => void) => () => void;
  onTabNavigated: (callback: (data: { tabId: string; url: string }) => void) => () => void;
  onTabLoading: (callback: (data: { tabId: string; loading: boolean }) => void) => () => void;
  onTabTitleUpdated: (callback: (data: { tabId: string; title: string }) => void) => () => void;
  onTabFaviconUpdated: (callback: (data: { tabId: string; favicon: string }) => void) => () => void;
  onTabStateChanged: (callback: (data: { tabId: string; state: string }) => void) => () => void;
  onMemoryStatsUpdated: (callback: (stats: MemoryStats) => void) => () => void;
  onDownloadUpdated: (callback: (downloads: DownloadItem[]) => void) => () => void;
  onWorkspacesUpdated: (callback: (workspaces: Workspace[]) => void) => () => void;
  onBookmarksUpdated: (callback: (bookmarks: Bookmark[]) => void) => () => void;
  onHistoryUpdated: (callback: (history: HistoryItem[]) => void) => () => void;
  onSettingsUpdated: (callback: (settings: BrowserSettings) => void) => () => void;
}

const api: OrcaAPI = {
  // Tabs
  createTab: (options) => ipcRenderer.invoke(IPC_CHANNELS.TAB_CREATE, options),
  closeTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.TAB_CLOSE, tabId),
  selectTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.TAB_SELECT, tabId),
  navigateTab: (tabId, url) => ipcRenderer.invoke(IPC_CHANNELS.TAB_NAVIGATE, tabId, url),
  reloadTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.TAB_RELOAD, tabId),
  stopTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.TAB_STOP, tabId),
  goBack: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.TAB_GO_BACK, tabId),
  goForward: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.TAB_GO_FORWARD, tabId),
  togglePinTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.TAB_TOGGLE_PIN, tabId),
  toggleMuteTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.TAB_TOGGLE_MUTE, tabId),
  duplicateTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.TAB_DUPLICATE, tabId),
  reorderTabs: (tabIds) => ipcRenderer.invoke(IPC_CHANNELS.TAB_REORDER, tabIds),
  suspendTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.TAB_SUSPEND, tabId),
  hibernateTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.TAB_HIBERNATE, tabId),
  restoreTab: (tabId) => ipcRenderer.invoke(IPC_CHANNELS.TAB_RESTORE, tabId),
  setZoom: (tabId, zoomLevel) => ipcRenderer.invoke(IPC_CHANNELS.TAB_SET_ZOOM, tabId, zoomLevel),
  setTabKeepAwake: (tabId, keepAwake) => ipcRenderer.invoke(IPC_CHANNELS.TAB_KEEP_AWAKE, tabId, keepAwake),

  // Workspaces
  listWorkspaces: () => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_LIST),
  createWorkspace: (name, color, icon) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_CREATE, name, color, icon),
  updateWorkspace: (workspace) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_UPDATE, workspace),
  deleteWorkspace: (workspaceId) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_DELETE, workspaceId),
  switchWorkspace: (workspaceId) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_SWITCH, workspaceId),

  // Memory
  getMemoryStats: () => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_GET_STATS),
  optimizeNow: () => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_OPTIMIZE_NOW),
  suspendAllEligible: () => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_SUSPEND_ALL_ELIGIBLE),
  restoreAll: () => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_RESTORE_ALL),
  suspendWorkspace: (workspaceId) => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_SUSPEND_WORKSPACE, workspaceId),
  restoreWorkspace: (workspaceId) => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_RESTORE_WORKSPACE, workspaceId),

  // Bookmarks
  getBookmarks: () => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARK_GET_ALL),
  addBookmark: (url, title, favicon) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARK_ADD, url, title, favicon),
  updateBookmark: (bookmark) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARK_UPDATE, bookmark),
  removeBookmark: (bookmarkId) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARK_REMOVE, bookmarkId),

  // History
  getHistory: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_GET_ALL),
  searchHistory: (query) => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_SEARCH, query),
  deleteHistoryItem: (id) => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_DELETE, id),
  clearHistory: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_CLEAR),

  // Downloads
  getDownloads: () => ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_GET_ALL),
  cancelDownload: (id) => ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_CANCEL, id),
  openDownloadFile: (id) => ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_OPEN_FILE, id),
  showDownloadInFolder: (id) => ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_SHOW_IN_FOLDER, id),
  clearCompletedDownloads: () => ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_CLEAR_COMPLETED),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  updateSettings: (settings) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, settings),

  // Panel Overlay
  setPanelOverlayState: (isOpen, panelName) => ipcRenderer.invoke(IPC_CHANNELS.PANEL_OVERLAY_STATE, isOpen, panelName),

  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
  closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),

  // Event subscription helpers
  onTabsUpdated: (callback) => {
    const handler = (_: any, tabs: Tab[]) => callback(tabs);
    ipcRenderer.on(IPC_CHANNELS.EVENT_TABS_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_TABS_UPDATED, handler);
  },
  onActiveTabChanged: (callback) => {
    const handler = (_: any, tabId: string | null) => callback(tabId);
    ipcRenderer.on(IPC_CHANNELS.EVENT_ACTIVE_TAB_CHANGED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_ACTIVE_TAB_CHANGED, handler);
  },
  onTabNavigated: (callback) => {
    const handler = (_: any, data: { tabId: string; url: string }) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.EVENT_TAB_NAVIGATED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_TAB_NAVIGATED, handler);
  },
  onTabLoading: (callback) => {
    const handler = (_: any, data: { tabId: string; loading: boolean }) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.EVENT_TAB_LOADING, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_TAB_LOADING, handler);
  },
  onTabTitleUpdated: (callback) => {
    const handler = (_: any, data: { tabId: string; title: string }) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.EVENT_TAB_TITLE_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_TAB_TITLE_UPDATED, handler);
  },
  onTabFaviconUpdated: (callback) => {
    const handler = (_: any, data: { tabId: string; favicon: string }) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.EVENT_TAB_FAVICON_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_TAB_FAVICON_UPDATED, handler);
  },
  onTabStateChanged: (callback) => {
    const handler = (_: any, data: { tabId: string; state: string }) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.EVENT_TAB_STATE_CHANGED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_TAB_STATE_CHANGED, handler);
  },
  onMemoryStatsUpdated: (callback) => {
    const handler = (_: any, stats: MemoryStats) => callback(stats);
    ipcRenderer.on(IPC_CHANNELS.EVENT_MEMORY_STATS_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_MEMORY_STATS_UPDATED, handler);
  },
  onDownloadUpdated: (callback) => {
    const handler = (_: any, downloads: DownloadItem[]) => callback(downloads);
    ipcRenderer.on(IPC_CHANNELS.EVENT_DOWNLOAD_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_DOWNLOAD_UPDATED, handler);
  },
  onWorkspacesUpdated: (callback) => {
    const handler = (_: any, workspaces: Workspace[]) => callback(workspaces);
    ipcRenderer.on(IPC_CHANNELS.EVENT_WORKSPACES_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_WORKSPACES_UPDATED, handler);
  },
  onBookmarksUpdated: (callback) => {
    const handler = (_: any, bookmarks: Bookmark[]) => callback(bookmarks);
    ipcRenderer.on(IPC_CHANNELS.EVENT_BOOKMARKS_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_BOOKMARKS_UPDATED, handler);
  },
  onHistoryUpdated: (callback) => {
    const handler = (_: any, history: HistoryItem[]) => callback(history);
    ipcRenderer.on(IPC_CHANNELS.EVENT_HISTORY_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_HISTORY_UPDATED, handler);
  },
  onSettingsUpdated: (callback) => {
    const handler = (_: any, settings: BrowserSettings) => callback(settings);
    ipcRenderer.on(IPC_CHANNELS.EVENT_SETTINGS_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_SETTINGS_UPDATED, handler);
  },
};

contextBridge.exposeInMainWorld('orcaAPI', api);
console.log('[ORCA PRELOAD] READY');
