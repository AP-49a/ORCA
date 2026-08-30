import { useState, useEffect } from 'react';
import {
  Bookmark,
  BrowserSettings,
  DownloadItem,
  HistoryItem,
  MemoryStats,
  Tab,
  Workspace,
} from '../../../shared/types';
import { OrcaAPI } from '../../../preload';

declare global {
  interface Window {
    orcaAPI?: OrcaAPI;
  }
}

export function useBrowserStore() {
  const api = window.orcaAPI;

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('ws-personal');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [settings, setSettings] = useState<BrowserSettings>({
    autoSuspend: true,
    suspendTimeoutMinutes: 15,
    suspendAggressiveness: 'balanced',
    memoryPressureThresholdPercent: 80,
    neverSuspendPinned: true,
    neverSuspendMedia: true,
    neverSuspendDownloads: true,
    autoHibernate: true,
    hibernateTimeoutDays: 3,
    neverSuspendDomains: ['docs.google.com', 'sheets.google.com', 'github.com', 'figma.com'],
    neverHibernateDomains: ['docs.google.com'],
    searchEngine: 'https://www.google.com/search?q=',
    defaultDownloadPath: '',
    theme: 'ocean',
    restoreSessionOnStartup: true,
    showMemoryBadge: true,
  });

  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    systemTotalMB: 16384,
    systemFreeMB: 8192,
    systemUsedMB: 8192,
    systemUsedPercent: 50,
    browserTotalMB: 280,
    browserMainMB: 120,
    browserRenderersMB: 160,
    estimatedSavingsMB: 0,
    tabsByState: { active: 1, idle: 0, suspended: 0, hibernated: 0 },
    memoryPressure: false,
    pressureLevel: 'low',
    engineAction: 'Monitoring',
    eligibleToSuspendCount: 0,
    potentialRecoveryMB: 0,
    suspensionCandidates: [],
    tabsByWorkspace: [],
    historyTimeline: [],
    lifetimeFreedMB: 0,
    lifetimeSuspendedCount: 0,
  });

  // Modal / View Controls
  const [isMemoryCenterOpen, setIsMemoryCenterOpen] = useState(false);
  const [isTabLibraryOpen, setIsTabLibraryOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [restoringTabTitle, setRestoringTabTitle] = useState<string | null>(null);

  // Initialize and register event listeners
  useEffect(() => {
    if (!api) return;

    // Fetch initial data
    api.listWorkspaces().then(setWorkspaces);
    api.getBookmarks().then(setBookmarks);
    api.getHistory().then(setHistory);
    api.getDownloads().then(setDownloads);
    api.getSettings().then(setSettings);
    api.getMemoryStats().then(setMemoryStats);

    // Register event subscriptions
    const unsubTabs = api.onTabsUpdated((updatedTabs) => {
      setTabs(updatedTabs);
    });

    const unsubActiveTab = api.onActiveTabChanged((tabId) => {
      setActiveTabId(tabId);
    });

    const unsubMemory = api.onMemoryStatsUpdated((stats) => {
      setMemoryStats(stats);
    });

    const unsubDownloads = api.onDownloadUpdated((dls) => {
      setDownloads(dls);
    });

    const unsubWorkspaces = api.onWorkspacesUpdated((wss) => {
      setWorkspaces(wss);
    });

    const unsubBookmarks = api.onBookmarksUpdated((bms) => {
      setBookmarks(bms);
    });

    const unsubHistory = api.onHistoryUpdated((hist) => {
      setHistory(hist);
    });

    const unsubSettings = api.onSettingsUpdated((sets) => {
      setSettings(sets);
    });

    const unsubState = api.onTabStateChanged(({ tabId, state }) => {
      if (state === 'ACTIVE') {
        const tab = tabs.find(t => t.id === tabId);
        if (tab && (tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED')) {
          setRestoringTabTitle(tab.title || tab.url);
          setTimeout(() => setRestoringTabTitle(null), 700);
        }
      }
    });

    return () => {
      unsubTabs();
      unsubActiveTab();
      unsubMemory();
      unsubDownloads();
      unsubWorkspaces();
      unsubBookmarks();
      unsubHistory();
      unsubSettings();
      unsubState();
    };
  }, [api]);

  // Tab Operations
  const createTab = async (url?: string) => {
    if (!api) return;
    return api.createTab({ url, workspaceId: activeWorkspaceId, active: true });
  };

  const closeTab = async (tabId: string) => {
    if (!api) return;
    return api.closeTab(tabId);
  };

  const selectTab = async (tabId: string) => {
    if (!api) return;
    const tab = tabs.find(t => t.id === tabId);
    if (tab && (tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED')) {
      setRestoringTabTitle(tab.title || tab.url);
      setTimeout(() => setRestoringTabTitle(null), 800);
    }
    return api.selectTab(tabId);
  };

  const navigateTab = async (tabId: string, url: string) => {
    if (!api) return;
    console.log('[useBrowserStore] navigateTab:', { tabId, url });
    return api.navigateTab(tabId, url);
  };

  const reloadTab = async (tabId: string) => {
    if (!api) return;
    return api.reloadTab(tabId);
  };

  const stopTab = async (tabId: string) => {
    if (!api) return;
    return api.stopTab(tabId);
  };

  const goBack = async (tabId: string) => {
    if (!api) return;
    return api.goBack(tabId);
  };

  const goForward = async (tabId: string) => {
    if (!api) return;
    return api.goForward(tabId);
  };

  const togglePinTab = async (tabId: string) => {
    if (!api) return;
    return api.togglePinTab(tabId);
  };

  const toggleMuteTab = async (tabId: string) => {
    if (!api) return;
    return api.toggleMuteTab(tabId);
  };

  const duplicateTab = async (tabId: string) => {
    if (!api) return;
    return api.duplicateTab(tabId);
  };

  const suspendTab = async (tabId: string) => {
    if (!api) return;
    return api.suspendTab(tabId);
  };

  const hibernateTab = async (tabId: string) => {
    if (!api) return;
    return api.hibernateTab(tabId);
  };

  const restoreTab = async (tabId: string) => {
    if (!api) return;
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setRestoringTabTitle(tab.title || tab.url);
      setTimeout(() => setRestoringTabTitle(null), 800);
    }
    return api.restoreTab(tabId);
  };

  const setZoom = async (tabId: string, zoomLevel: number) => {
    if (!api) return;
    return api.setZoom(tabId, zoomLevel);
  };

  // Workspace Operations
  const switchWorkspace = async (workspaceId: string) => {
    if (!api) return;
    setActiveWorkspaceId(workspaceId);
    return api.switchWorkspace(workspaceId);
  };

  const createWorkspace = async (name: string, color?: string, icon?: string) => {
    if (!api) return;
    const created = await api.createWorkspace(name, color, icon);
    setWorkspaces([...workspaces, created]);
    return created;
  };

  const deleteWorkspace = async (id: string) => {
    if (!api) return;
    await api.deleteWorkspace(id);
    setWorkspaces(workspaces.filter(w => w.id !== id));
  };

  // Memory Operations
  const optimizeNow = async () => {
    if (!api) return;
    const res = await api.optimizeNow();
    const updatedStats = await api.getMemoryStats();
    setMemoryStats(updatedStats);
    return res;
  };

  const restoreAll = async () => {
    if (!api) return;
    await api.restoreAll();
    const updatedStats = await api.getMemoryStats();
    setMemoryStats(updatedStats);
  };

  const setTabKeepAwake = async (tabId: string, keepAwake: boolean) => {
    if (!api) return;
    await api.setTabKeepAwake(tabId, keepAwake);
  };

  const suspendWorkspace = async (workspaceId: string) => {
    if (!api) return;
    const res = await api.suspendWorkspace(workspaceId);
    const updatedStats = await api.getMemoryStats();
    setMemoryStats(updatedStats);
    return res;
  };

  const restoreWorkspace = async (workspaceId: string) => {
    if (!api) return;
    await api.restoreWorkspace(workspaceId);
    const updatedStats = await api.getMemoryStats();
    setMemoryStats(updatedStats);
  };

  // Bookmarks Operations
  const addBookmark = async (url: string, title: string, favicon?: string) => {
    if (!api) return;
    const created = await api.addBookmark(url, title, favicon);
    setBookmarks([created, ...bookmarks]);
    return created;
  };

  const removeBookmark = async (id: string) => {
    if (!api) return;
    await api.removeBookmark(id);
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  // History Operations
  const deleteHistoryItem = async (id: string) => {
    if (!api) return;
    await api.deleteHistoryItem(id);
    setHistory(history.filter(h => h.id !== id));
  };

  const clearHistory = async () => {
    if (!api) return;
    await api.clearHistory();
    setHistory([]);
  };

  // Settings
  const updateSettings = async (newSettings: Partial<BrowserSettings>) => {
    if (!api) return;
    const updated = await api.updateSettings(newSettings);
    setSettings(updated);
  };

  // Window Controls
  const minimizeWindow = () => api?.minimizeWindow();
  const maximizeWindow = () => api?.maximizeWindow();
  const closeWindow = () => api?.closeWindow();

  // Active tab helper
  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeWorkspaceTabs = tabs.filter(t => t.workspaceId === activeWorkspaceId);

  return {
    // State
    tabs,
    activeTab,
    activeTabId,
    activeWorkspaceTabs,
    workspaces,
    activeWorkspaceId,
    bookmarks,
    history,
    downloads,
    settings,
    memoryStats,
    restoringTabTitle,

    // Modal states
    isMemoryCenterOpen,
    setIsMemoryCenterOpen,
    isTabLibraryOpen,
    setIsTabLibraryOpen,
    isBookmarksOpen,
    setIsBookmarksOpen,
    isHistoryOpen,
    setIsHistoryOpen,
    isDownloadsOpen,
    setIsDownloadsOpen,
    isSettingsOpen,
    setIsSettingsOpen,

    // Actions
    createTab,
    closeTab,
    selectTab,
    navigateTab,
    reloadTab,
    stopTab,
    goBack,
    goForward,
    togglePinTab,
    toggleMuteTab,
    duplicateTab,
    suspendTab,
    hibernateTab,
    restoreTab,
    setZoom,
    switchWorkspace,
    createWorkspace,
    deleteWorkspace,
    optimizeNow,
    restoreAll,
    setTabKeepAwake,
    suspendWorkspace,
    restoreWorkspace,
    addBookmark,
    removeBookmark,
    deleteHistoryItem,
    clearHistory,
    updateSettings,
    minimizeWindow,
    maximizeWindow,
    closeWindow,
  };
}
