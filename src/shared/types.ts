export type TabState = 'ACTIVE' | 'IDLE' | 'SUSPENDED' | 'HIBERNATED';

export type OceanTier = 'SURFACE' | 'SHALLOW' | 'DEEP' | 'ABYSS';

export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string | null;
  createdAt: number;
  lastAccessedAt: number;
  state: TabState;
  workspaceId: string;
  pinned: boolean;
  muted: boolean;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  estimatedMemoryMB: number;
  actualMemoryMB?: number;
  zoomLevel: number;
  scrollPosition?: { x: number; y: number };
  audioActive?: boolean;
  suspensionProtected?: boolean;
  suspensionProtectionReason?: string;
  lastSuspendedAt?: number;
  lastHibernatedAt?: number;
}

export interface Workspace {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  folderId: string | null;
  createdAt: number;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  timestamp: number;
  visitCount: number;
}

export type DownloadStatus = 'progressing' | 'completed' | 'cancelled' | 'interrupted' | 'paused';

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  savePath: string;
  totalBytes: number;
  receivedBytes: number;
  progress: number; // 0 to 100
  speed: number;    // bytes per sec
  status: DownloadStatus;
  startTime: number;
  endTime?: number;
}

export interface MemoryPoint {
  timestamp: number;
  browserMB: number;
  systemUsedPercent: number;
}

export interface MemoryStats {
  systemTotalMB: number;
  systemFreeMB: number;
  systemUsedMB: number;
  systemUsedPercent: number;
  browserTotalMB: number;
  browserMainMB: number;
  browserRenderersMB: number;
  estimatedSavingsMB: number;
  tabsByState: {
    active: number;
    idle: number;
    suspended: number;
    hibernated: number;
  };
  memoryPressure: boolean;
  pressureMessage?: string;
  eligibleToSuspendCount: number;
  potentialRecoveryMB: number;
  historyTimeline: MemoryPoint[];
}

export interface BrowserSettings {
  autoSuspend: boolean;
  suspendTimeoutMinutes: number; // 15, 30, 60, 120, custom
  autoHibernate: boolean;
  hibernateTimeoutDays: number; // 1, 3, 7, 30
  neverSuspendDomains: string[];
  neverHibernateDomains: string[];
  searchEngine: string;
  defaultDownloadPath: string;
  theme: 'light' | 'ocean';
  restoreSessionOnStartup: boolean;
  showMemoryBadge: boolean;
}

export interface SessionData {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  tabs: Tab[];
  activeTabId: string | null;
  settings: BrowserSettings;
}
