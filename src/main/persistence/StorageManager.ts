import fs from 'fs';
import path from 'path';
import { createRequire } from 'node:module';
import { Bookmark, BrowserSettings, HistoryItem, SessionData, Workspace, Tab, TabState } from '../../shared/types';

const require = createRequire(import.meta.url);
const electronApi = (typeof process !== 'undefined' && process.versions?.electron) ? require('electron') : {};
const app = electronApi.app;


export class StorageManager {
  private baseDir: string;
  private settingsFile: string;
  private workspacesFile: string;
  private bookmarksFile: string;
  private historyFile: string;
  private sessionFile: string;

  constructor(customBaseDir?: string) {
    if (customBaseDir) {
      this.baseDir = customBaseDir;
    } else {
      let userDataPath = '';
      try {
        userDataPath = typeof app !== 'undefined' && app?.getPath ? app.getPath('userData') : '';
      } catch {}
      this.baseDir = userDataPath
        ? path.join(userDataPath, 'orca_storage')
        : path.join(process.cwd(), '.orca_storage');
    }
    this.ensureDirectory();
    this.settingsFile = path.join(this.baseDir, 'settings.json');
    this.workspacesFile = path.join(this.baseDir, 'workspaces.json');
    this.bookmarksFile = path.join(this.baseDir, 'bookmarks.json');
    this.historyFile = path.join(this.baseDir, 'history.json');
    this.sessionFile = path.join(this.baseDir, 'session.json');
  }


  private ensureDirectory() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private safeWriteJson<T>(filePath: string, data: T): void {
    try {
      this.ensureDirectory();
      const tmpPath = `${filePath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, filePath);
    } catch (err) {
      console.error(`Failed to write JSON to ${filePath}:`, err);
    }
  }

  private safeReadJson<T>(filePath: string, fallback: T): T {
    try {
      if (!fs.existsSync(filePath)) {
        return fallback;
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`Failed to read JSON from ${filePath}:`, err);
      return fallback;
    }
  }

  // --- Settings ---
  public getSettings(): BrowserSettings {
    const defaultSettings: BrowserSettings = {
      autoSuspend: true,
      suspendTimeoutMinutes: 15,
      suspendAggressiveness: 'balanced',
      suspendTimeoutCustomized: false,
      memoryPressureThresholdPercent: 80,
      neverSuspendPinned: true,
      neverSuspendMedia: true,
      neverSuspendDownloads: true,
      autoHibernate: true,
      hibernateTimeoutDays: 3,
      neverSuspendDomains: [
        'docs.google.com',
        'sheets.google.com',
        'github.com',
        'figma.com',
        'notion.so',
        'codepen.io',
        'replit.com'
      ],
      neverHibernateDomains: [
        'docs.google.com',
        'notion.so'
      ],
      searchEngine: 'https://www.google.com/search?q=',
      defaultDownloadPath: app.getPath('downloads'),
      theme: 'ocean',
      restoreSessionOnStartup: true,
      showMemoryBadge: true,
    };
    return { ...defaultSettings, ...this.safeReadJson<Partial<BrowserSettings>>(this.settingsFile, {}) };
  }

  public saveSettings(settings: BrowserSettings): void {
    this.safeWriteJson(this.settingsFile, settings);
  }

  // --- Workspaces ---
  public getWorkspaces(): Workspace[] {
    const defaultWorkspaces: Workspace[] = [
      {
        id: 'ws-personal',
        name: 'Personal',
        color: '#0284C7',
        icon: 'Compass',
        createdAt: Date.now(),
      },
      {
        id: 'ws-research',
        name: 'Research',
        color: '#0D9488',
        icon: 'BookOpen',
        createdAt: Date.now(),
      },
      {
        id: 'ws-dev',
        name: 'Development',
        color: '#6366F1',
        icon: 'Code2',
        createdAt: Date.now(),
      },
    ];
    const loaded = this.safeReadJson<Workspace[]>(this.workspacesFile, []);
    return loaded.length > 0 ? loaded : defaultWorkspaces;
  }

  public saveWorkspaces(workspaces: Workspace[]): void {
    this.safeWriteJson(this.workspacesFile, workspaces);
  }

  // --- Bookmarks ---
  public getBookmarks(): Bookmark[] {
    const defaultBookmarks: Bookmark[] = [
      {
        id: 'bm-1',
        title: 'Wikipedia',
        url: 'https://www.wikipedia.org',
        folderId: null,
        createdAt: Date.now(),
      },
      {
        id: 'bm-2',
        title: 'GitHub',
        url: 'https://github.com',
        folderId: null,
        createdAt: Date.now(),
      },
      {
        id: 'bm-3',
        title: 'DuckDuckGo',
        url: 'https://duckduckgo.com',
        folderId: null,
        createdAt: Date.now(),
      },
      {
        id: 'bm-4',
        title: 'ArXiv',
        url: 'https://arxiv.org',
        folderId: null,
        createdAt: Date.now(),
      }
    ];
    return this.safeReadJson<Bookmark[]>(this.bookmarksFile, defaultBookmarks);
  }

  public saveBookmarks(bookmarks: Bookmark[]): void {
    this.safeWriteJson(this.bookmarksFile, bookmarks);
  }

  // --- History ---
  public getHistory(): HistoryItem[] {
    return this.safeReadJson<HistoryItem[]>(this.historyFile, []);
  }

  public addHistoryItem(item: Omit<HistoryItem, 'id' | 'visitCount'>): void {
    const history = this.getHistory();
    const existingIndex = history.findIndex(h => h.url === item.url);
    if (existingIndex >= 0) {
      history[existingIndex].timestamp = item.timestamp;
      history[existingIndex].title = item.title || history[existingIndex].title;
      history[existingIndex].visitCount += 1;
      // Move to front
      const [updated] = history.splice(existingIndex, 1);
      history.unshift(updated);
    } else {
      history.unshift({
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: item.url,
        title: item.title || item.url,
        favicon: item.favicon,
        timestamp: item.timestamp,
        visitCount: 1,
      });
    }

    // Limit to latest 3000 items
    const truncated = history.slice(0, 3000);
    this.safeWriteJson(this.historyFile, truncated);
  }

  public saveHistory(history: HistoryItem[]): void {
    this.safeWriteJson(this.historyFile, history);
  }

  public clearHistory(): void {
    this.safeWriteJson(this.historyFile, []);
  }

  // --- Session ---
  public static readonly CURRENT_SESSION_VERSION = 1;

  public getSession(): SessionData | null {
    const raw = this.safeReadJson<any>(this.sessionFile, null);
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    // Validate version
    if (typeof raw.version !== 'number' || raw.version < 1) {
      console.warn('[StorageManager] Incompatible session schema version:', raw.version);
      return null;
    }

    // Validate workspaces array
    if (!Array.isArray(raw.workspaces)) {
      return null;
    }

    // Validate tabs array
    if (!Array.isArray(raw.tabs)) {
      return null;
    }

    // Sanitize tabs to ensure all required fields exist and no runtime/transient data leaks
    const sanitizedTabs: Tab[] = raw.tabs
      .filter((t: any) => t && typeof t.id === 'string' && typeof t.url === 'string')
      .map((t: any): Tab => ({
        id: t.id,
        url: t.url,
        title: typeof t.title === 'string' ? t.title : (t.url === 'orca://newtab' ? 'New Tab' : 'Tab'),
        favicon: typeof t.favicon === 'string' ? t.favicon : null,
        createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
        lastAccessedAt: typeof t.lastAccessedAt === 'number' ? t.lastAccessedAt : Date.now(),
        lastInteractionAt: typeof t.lastInteractionAt === 'number' ? t.lastInteractionAt : undefined,
        state: (['ACTIVE', 'IDLE', 'SUSPENDED', 'HIBERNATED'].includes(t.state) ? t.state : 'ACTIVE') as TabState,
        workspaceId: typeof t.workspaceId === 'string' ? t.workspaceId : 'ws-personal',
        pinned: Boolean(t.pinned),
        muted: Boolean(t.muted),
        loading: false, // Always initialize false on restore
        canGoBack: false,
        canGoForward: false,
        estimatedMemoryMB: typeof t.estimatedMemoryMB === 'number' ? t.estimatedMemoryMB : 180,
        actualMemoryMB: typeof t.actualMemoryMB === 'number' ? t.actualMemoryMB : undefined,
        zoomLevel: typeof t.zoomLevel === 'number' ? t.zoomLevel : 0,
        audioActive: false,
        keepAwake: Boolean(t.keepAwake),
        suspensionProtected: Boolean(t.suspensionProtected),
        suspensionProtectionReason: t.suspensionProtectionReason,
        lastSuspendedAt: typeof t.lastSuspendedAt === 'number' ? t.lastSuspendedAt : undefined,
        lastHibernatedAt: typeof t.lastHibernatedAt === 'number' ? t.lastHibernatedAt : undefined,
        suspendCount: typeof t.suspendCount === 'number' ? t.suspendCount : 0,
        restoreCount: typeof t.restoreCount === 'number' ? t.restoreCount : 0,
      }));

    return {
      version: raw.version,
      timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
      workspaces: raw.workspaces,
      activeWorkspaceId: typeof raw.activeWorkspaceId === 'string' ? raw.activeWorkspaceId : (raw.workspaces[0]?.id || 'ws-personal'),
      tabs: sanitizedTabs,
      activeTabId: typeof raw.activeTabId === 'string' ? raw.activeTabId : (sanitizedTabs[0]?.id || null),
      settings: raw.settings,
    };
  }

  public saveSession(session: SessionData): void {
    const serializableSession: SessionData = {
      version: StorageManager.CURRENT_SESSION_VERSION,
      timestamp: Date.now(),
      workspaces: session.workspaces || [],
      activeWorkspaceId: session.activeWorkspaceId || 'ws-personal',
      activeTabId: session.activeTabId,
      tabs: (session.tabs || []).map((t) => ({
        id: t.id,
        url: t.url,
        title: t.title,
        favicon: t.favicon,
        createdAt: t.createdAt,
        lastAccessedAt: t.lastAccessedAt,
        lastInteractionAt: t.lastInteractionAt,
        state: t.state,
        workspaceId: t.workspaceId,
        pinned: t.pinned,
        muted: t.muted,
        loading: false, // Do not persist transient loading
        canGoBack: false,
        canGoForward: false,
        estimatedMemoryMB: t.estimatedMemoryMB,
        actualMemoryMB: t.actualMemoryMB,
        zoomLevel: t.zoomLevel,
        audioActive: false,
        keepAwake: t.keepAwake,
        suspensionProtected: t.suspensionProtected,
        suspensionProtectionReason: t.suspensionProtectionReason,
        lastSuspendedAt: t.lastSuspendedAt,
        lastHibernatedAt: t.lastHibernatedAt,
        suspendCount: t.suspendCount,
        restoreCount: t.restoreCount,
      })),
      settings: session.settings,
    };
    this.safeWriteJson(this.sessionFile, serializableSession);
  }

  public clearSession(): void {
    try {
      if (fs.existsSync(this.sessionFile)) {
        fs.unlinkSync(this.sessionFile);
      }
    } catch (err) {
      console.error('Failed to clear session file:', err);
    }
  }
}

