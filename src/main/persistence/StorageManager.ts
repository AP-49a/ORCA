import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { Bookmark, BrowserSettings, HistoryItem, SessionData, Workspace, Tab } from '../../shared/types';

export class StorageManager {
  private baseDir: string;
  private settingsFile: string;
  private workspacesFile: string;
  private bookmarksFile: string;
  private historyFile: string;
  private sessionFile: string;

  constructor() {
    this.baseDir = path.join(app.getPath('userData'), 'orca_storage');
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
  public getSession(): SessionData | null {
    return this.safeReadJson<SessionData | null>(this.sessionFile, null);
  }

  public saveSession(session: SessionData): void {
    this.safeWriteJson(this.sessionFile, session);
  }
}
