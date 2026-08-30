export type TabState = 'ACTIVE' | 'IDLE' | 'SUSPENDED' | 'HIBERNATED';

export type OceanTier = 'SURFACE' | 'SHALLOW' | 'DEEP' | 'ABYSS';

export type MemoryPressureLevel = 'low' | 'moderate' | 'high' | 'critical';

export type SuspensionAggressiveness = 'conservative' | 'balanced' | 'aggressive';

export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string | null;
  createdAt: number;
  lastAccessedAt: number;
  lastInteractionAt?: number;
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
  keepAwake?: boolean;
  lastSuspendedAt?: number;
  lastHibernatedAt?: number;
  suspendCount?: number;
  restoreCount?: number;
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
  activeTabCount?: number;
  suspendedTabCount?: number;
  suspensionEvent?: boolean;
}

export interface SuspensionCandidate {
  tabId: string;
  title: string;
  url: string;
  favicon?: string | null;
  workspaceId: string;
  workspaceName?: string;
  inactiveForMs: number;
  estimatedMemoryMB: number;
  priority: number; // higher = more urgent to suspend
  protected: boolean;
  protectionReason?: string;
}

export interface WorkspaceMemorySummary {
  workspaceId: string;
  workspaceName: string;
  activeTabs: number;
  idleTabs: number;
  suspendedTabs: number;
  hibernatedTabs: number;
  estimatedActiveMB: number;
  estimatedSavedMB: number;
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
  pressureLevel: MemoryPressureLevel;
  pressureMessage?: string;
  engineAction: string;
  eligibleToSuspendCount: number;
  potentialRecoveryMB: number;
  suspensionCandidates: SuspensionCandidate[];
  tabsByWorkspace: WorkspaceMemorySummary[];
  historyTimeline: MemoryPoint[];
  // Lifetime stats (per-session)
  lifetimeFreedMB: number;
  lifetimeSuspendedCount: number;
}

export interface BrowserSettings {
  autoSuspend: boolean;
  suspendTimeoutMinutes: number;
  suspendAggressiveness: SuspensionAggressiveness;
  memoryPressureThresholdPercent: number; // 60 | 70 | 80 | 90
  neverSuspendPinned: boolean;
  neverSuspendMedia: boolean;
  neverSuspendDownloads: boolean;
  autoHibernate: boolean;
  hibernateTimeoutDays: number;
  neverSuspendDomains: string[];
  neverHibernateDomains: string[];
  searchEngine: string;
  defaultDownloadPath: string;
  theme: 'light' | 'dark' | 'system' | 'ocean';
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


