import type { BrowserWindow, BaseWindow } from 'electron';
import { Tab, TabState } from '../../shared/types';
import { NavigationManager } from './NavigationManager';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const electronApi = process.versions.electron ? require('electron') : {};
const WebContentsViewCtor = (electronApi as any).WebContentsView ?? class FallbackWebContentsView {
  public webContents: any;

  constructor(options: any = {}) {
    this.webContents = {
      ...options,
      loadURL: async () => undefined,
      reload: () => undefined,
      stop: () => undefined,
      canGoBack: () => false,
      canGoForward: () => false,
      goBack: () => undefined,
      goForward: () => undefined,
      setAudioMuted: () => undefined,
      getZoomLevel: () => 0,
      setZoomLevel: () => undefined,
      on: () => undefined,
      setWindowOpenHandler: () => ({ action: 'deny' }),
    };
  }

  public setBounds() { return undefined; }
  public setVisible() { return undefined; }
};

export interface TabManagerCallbacks {
  onTabsUpdated: (tabs: Tab[]) => void;
  onActiveTabChanged: (activeTabId: string | null) => void;
  onTabNavigated: (tabId: string, url: string) => void;
  onTabLoading: (tabId: string, loading: boolean) => void;
  onTabTitleUpdated: (tabId: string, title: string) => void;
  onTabFaviconUpdated: (tabId: string, favicon: string) => void;
  onTabStateChanged: (tabId: string, state: TabState) => void;
  onHistoryItemAdded: (url: string, title: string, favicon?: string) => void;
}

export class TabManager {
  private window: BaseWindow | BrowserWindow | null = null;
  private tabs: Map<string, Tab> = new Map();
  private views: Map<string, any> = new Map();
  private activeTabId: string | null = null;
  private callbacks: TabManagerCallbacks;
  private contentBounds = { x: 0, y: 116, width: 1200, height: 684 };
  private readonly chromeHeight = 116;
  private isPanelOverlayActive = false;
  // Maps tabId -> renderer process PID for real memory correlation
  private tabPidMap: Map<string, number> = new Map();

  constructor(callbacks: TabManagerCallbacks) {
    this.callbacks = callbacks;
  }

  /** Returns the tabId -> renderer PID map for memory estimation */
  public getTabPidMap(): Map<string, number> {
    return new Map(this.tabPidMap);
  }

  /** Set or clear the Keep Awake protection on a tab */
  public async setKeepAwake(tabId: string, keepAwake: boolean): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    tab.keepAwake = keepAwake;
    if (keepAwake) {
      tab.suspensionProtected = true;
      tab.suspensionProtectionReason = 'Keep Awake';
    } else {
      tab.suspensionProtected = false;
      tab.suspensionProtectionReason = undefined;
    }
    this.notifyTabsUpdated();
  }

  private attachViewToWindow(view: any) {
    if (!this.window) {
      return;
    }

    if (this.isPanelOverlayActive) {
      return;
    }

    // Always synchronize contentBounds with current window dimensions
    try {
      if (!this.window.isDestroyed() && typeof (this.window as any).getContentSize === 'function') {
        const [winWidth, winHeight] = (this.window as any).getContentSize();
        if (winWidth > 0 && winHeight > 0) {
          const contentHeight = Math.max(0, winHeight - this.chromeHeight);
          this.contentBounds = {
            x: 0,
            y: this.chromeHeight,
            width: winWidth,
            height: contentHeight,
          };
        }
      }
    } catch {}

    try {
      if (this.window.contentView && typeof this.window.contentView.addChildView === 'function') {
        const children = (this.window.contentView as any).children || [];
        if (!children.includes(view)) {
          this.window.contentView.addChildView(view);
        }
      } else if ('setBrowserView' in this.window && typeof (this.window as any).setBrowserView === 'function') {
        (this.window as any).setBrowserView(view);
      }
    } catch (err: any) {
      console.warn('[TabManager] Error attaching view:', err.message);
    }

    try {
      const bounds = {
        x: this.contentBounds.x,
        y: this.contentBounds.y,
        width: Math.max(0, this.contentBounds.width),
        height: Math.max(0, this.contentBounds.height),
      };
      view.setBounds(bounds);
      view.setVisible(true);
      console.log('[ORCA VIEW] attached');
      console.log(`[ORCA VIEW] bounds: ${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);
      console.log('[ORCA VIEW] visible: true');
    } catch (err: any) {
      console.warn('[TabManager] Error setting view bounds:', err.message);
    }
  }

  private detachViewFromWindow(view: any) {
    if (!this.window || !view) return;
    try {
      view.setVisible(false);
    } catch {}
    try {
      if (this.window.contentView && typeof this.window.contentView.removeChildView === 'function') {
        this.window.contentView.removeChildView(view);
      } else if ('removeBrowserView' in this.window && typeof (this.window as any).removeBrowserView === 'function') {
        (this.window as any).removeBrowserView(view);
      }
    } catch {}
  }

  public setWindow(window: BaseWindow | BrowserWindow) {
    this.window = window;
  }

  public updateContentBounds(bounds: { x: number; y: number; width: number; height: number }) {
    const chromeHeight = Math.max(0, bounds.y || this.chromeHeight);
    const contentHeight = Math.max(0, bounds.height - chromeHeight);
    this.contentBounds = {
      x: 0,
      y: chromeHeight,
      width: Math.max(0, bounds.width),
      height: contentHeight,
    };

    if (this.activeTabId && !this.isPanelOverlayActive) {
      const activeTab = this.tabs.get(this.activeTabId);
      if (activeTab && !activeTab.url.startsWith('orca://')) {
        const activeView = this.views.get(this.activeTabId);
        if (activeView && this.window) {
          this.attachViewToWindow(activeView);
        }
      }
    }
  }

  public async setPanelOverlayState(isOpen: boolean, panelName: string): Promise<string | null> {
    this.isPanelOverlayActive = isOpen;
    console.log(`[ORCA PANEL] panel: ${panelName}`);
    console.log(`[ORCA PANEL] opened: ${isOpen}`);
    console.log(`[ORCA PANEL] activeWebContentsView: ${this.activeTabId || 'none'}`);
    console.log(`[ORCA PANEL] view hierarchy: [BrowserWindow.contentView -> WebContentsView(${this.activeTabId || 'none'})]`);
    console.log(`[ORCA PANEL] bounds: x=${this.contentBounds.x} y=${this.contentBounds.y} width=${this.contentBounds.width} height=${this.contentBounds.height}`);

    if (!this.activeTabId) return null;
    const activeTab = this.tabs.get(this.activeTabId);
    const activeView = this.views.get(this.activeTabId);

    if (!activeView || !activeTab || activeTab.url.startsWith('orca://')) {
      return null;
    }

    if (isOpen) {
      let snapshotDataUrl: string | null = null;
      try {
        if (activeView.webContents && typeof activeView.webContents.capturePage === 'function') {
          const image = await activeView.webContents.capturePage();
          if (image && !image.isEmpty()) {
            snapshotDataUrl = image.toDataURL();
          }
        }
      } catch (err: any) {
        console.warn('[TabManager] capturePage error:', err?.message || err);
      }

      this.detachViewFromWindow(activeView);
      return snapshotDataUrl;
    } else {
      if (this.window) {
        this.attachViewToWindow(activeView);
      }
      return null;
    }
  }

  public getTabs(): Tab[] {
    return Array.from(this.tabs.values());
  }

  public getTab(tabId: string): Tab | undefined {
    return this.tabs.get(tabId);
  }

  public getActiveTabId(): string | null {
    return this.activeTabId;
  }

  public getActiveTab(): Tab | undefined {
    return this.activeTabId ? this.tabs.get(this.activeTabId) : undefined;
  }

  /**
   * Creates a new browser tab with its own WebContentsView
   */
  public async createTab(options?: {
    url?: string;
    workspaceId?: string;
    active?: boolean;
    pinned?: boolean;
  }): Promise<Tab> {
    const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const url = options?.url || 'orca://newtab';
    const workspaceId = options?.workspaceId || 'ws-personal';
    const active = options?.active ?? true;

    const tab: Tab = {
      id,
      url,
      title: url === 'orca://newtab' ? 'New Tab' : 'Loading...',
      favicon: null,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      state: 'ACTIVE',
      workspaceId,
      pinned: options?.pinned ?? false,
      muted: false,
      loading: false,
      canGoBack: false,
      canGoForward: false,
      estimatedMemoryMB: 180,
      zoomLevel: 0,
      audioActive: false,
    };

    this.tabs.set(id, tab);

    // Create real WebContentsView for the tab if not an internal orca:// page
    if (!url.startsWith('orca://')) {
      this.createViewForTab(tab);
    }

    if (active) {
      await this.selectTab(id);
    }

    this.notifyTabsUpdated();
    return tab;
  }

  private createViewForTab(tab: Tab): any {
    const view = new WebContentsViewCtor({
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
      },
    });
    (view as any).id = tab.id;
    console.log(`[ORCA VIEW] created (tabId=${tab.id})`);
    console.log(`[ORCA VIEW] URL: ${tab.url}`);

    this.views.set(tab.id, view);
    this.setupViewEvents(tab.id, view);

    // Record renderer PID for real memory measurement
    try {
      const pid = view.webContents.getProcessId?.() ?? view.webContents.getOSProcessId?.();
      if (pid) {
        this.tabPidMap.set(tab.id, pid);
        console.log(`[ORCA VIEW] renderer PID: ${pid} (tabId=${tab.id})`);
      }
    } catch {/* PID not available in fallback stub */}

    if (tab.url && !tab.url.startsWith('orca://')) {
      view.webContents.loadURL(tab.url).catch((err: any) => {
        console.warn(`Failed to load ${tab.url}:`, err.message);
      });
    }

    return view;
  }

  private setupViewEvents(tabId: string, view: any) {
    const wc = view.webContents;

    wc.on('did-start-loading', () => {
      const tab = this.tabs.get(tabId);
      console.log(`[ORCA WEB] event: did-start-loading url: ${tab?.url}`);
      if (tab) {
        tab.loading = true;
        this.callbacks.onTabLoading(tabId, true);
        this.notifyTabsUpdated();
      }
    });

    wc.on('did-stop-loading', () => {
      const tab = this.tabs.get(tabId);
      console.log(`[ORCA WEB] event: did-stop-loading url: ${tab?.url}`);
      if (tab) {
        tab.loading = false;
        tab.canGoBack = wc.canGoBack();
        tab.canGoForward = wc.canGoForward();
        this.callbacks.onTabLoading(tabId, false);
        this.notifyTabsUpdated();
      }
    });

    wc.on('page-title-updated', (_: any, title: string) => {
      const tab = this.tabs.get(tabId);
      if (tab && title) {
        tab.title = title;
        this.callbacks.onTabTitleUpdated(tabId, title);
        this.callbacks.onHistoryItemAdded(tab.url, title, tab.favicon || undefined);
        this.notifyTabsUpdated();
      }
    });

    wc.on('page-favicon-updated', (_: any, favicons: string[]) => {
      const tab = this.tabs.get(tabId);
      if (tab && favicons.length > 0) {
        tab.favicon = favicons[0];
        this.callbacks.onTabFaviconUpdated(tabId, favicons[0]);
        this.notifyTabsUpdated();
      }
    });

    wc.on('did-navigate', (_: any, url: string) => {
      console.log(`[ORCA WEB] event: did-navigate url: ${url}`);
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.url = url;
        tab.canGoBack = wc.canGoBack();
        tab.canGoForward = wc.canGoForward();
        this.callbacks.onTabNavigated(tabId, url);
        this.callbacks.onHistoryItemAdded(url, tab.title || url, tab.favicon || undefined);
        this.notifyTabsUpdated();
      }
    });

    wc.on('did-navigate-in-page', (_: any, url: string) => {
      console.log(`[ORCA WEB] event: did-navigate-in-page url: ${url}`);
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.url = url;
        tab.canGoBack = wc.canGoBack();
        tab.canGoForward = wc.canGoForward();
        this.callbacks.onTabNavigated(tabId, url);
        this.notifyTabsUpdated();
      }
    });

    wc.on('did-fail-load', (_: any, errorCode: number, errorDescription: string, validatedURL: string) => {
      console.log(`[ORCA WEB] event: did-fail-load url: ${validatedURL} errorCode: ${errorCode} errorDescription: ${errorDescription}`);
    });

    wc.on('render-process-gone', (_: any, details: any) => {
      console.log(`[ORCA WEB] event: render-process-gone reason: ${details.reason} exitCode: ${details.exitCode}`);
    });

    wc.on('media-started-playing', () => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.audioActive = true;
        this.notifyTabsUpdated();
      }
    });

    wc.on('media-paused', () => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.audioActive = false;
        this.notifyTabsUpdated();
      }
    });

    // Handle new-window / target="_blank"
    wc.setWindowOpenHandler((details: any) => {
      this.createTab({ url: details.url, active: true });
      return { action: 'deny' };
    });
  }

  /**
   * Switches the active tab
   */
  public async selectTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    tab.lastAccessedAt = Date.now();

    // If tab is SUSPENDED or HIBERNATED, restore it
    if (tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED') {
      await this.restoreTab(tabId);
    } else {
      tab.state = 'ACTIVE';
    }

    // Hide old active view before swapping to the next one
    if (this.activeTabId && this.activeTabId !== tabId) {
      const oldView = this.views.get(this.activeTabId);
      if (oldView) {
        this.detachViewFromWindow(oldView);
      }
    }

    this.activeTabId = tabId;

    // Show new active view
    if (!tab.url.startsWith('orca://')) {
      let view = this.views.get(tabId);
      if (!view) {
        view = this.createViewForTab(tab);
      }
      if (this.window) {
        this.attachViewToWindow(view);
      }
    }

    this.callbacks.onActiveTabChanged(tabId);
    this.notifyTabsUpdated();
  }

  /**
   * Suspends a tab: destroys underlying WebContentsView to free real Chromium RAM
   */
  public async suspendTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    if (tab.id === this.activeTabId) return; // Cannot suspend active tab

    const view = this.views.get(tabId);
    if (view) {
      this.detachViewFromWindow(view);
      try {
        // Capture zoom before closing
        tab.zoomLevel = view.webContents.getZoomLevel();
        // Store memory estimate before destroying
        try {
          const pid = view.webContents.getProcessId?.() ?? view.webContents.getOSProcessId?.();
          if (pid && tab.actualMemoryMB === undefined) {
            // leave actualMemoryMB as-is for savings tracking
          }
        } catch {}
        // Destroy WebContents to release OS RAM
        (view.webContents as any).close();
      } catch (err) {
        console.warn(`Error closing WebContents for tab ${tabId}:`, err);
      }
      this.views.delete(tabId);
      this.tabPidMap.delete(tabId);
    }

    tab.state = 'SUSPENDED';
    tab.lastSuspendedAt = Date.now();
    tab.suspendCount = (tab.suspendCount ?? 0) + 1;
    this.callbacks.onTabStateChanged(tabId, 'SUSPENDED');
    this.notifyTabsUpdated();
  }

  /**
   * Hibernates a tab: long-term inactive archive
   */
  public async hibernateTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    if (tab.id === this.activeTabId) return;

    // Ensure view is suspended first
    if (this.views.has(tabId)) {
      await this.suspendTab(tabId);
    }

    tab.state = 'HIBERNATED';
    tab.lastHibernatedAt = Date.now();
    this.callbacks.onTabStateChanged(tabId, 'HIBERNATED');
    this.notifyTabsUpdated();
  }

  /**
   * Restores a suspended or hibernated tab
   */
  public async restoreTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    tab.state = 'ACTIVE';
    tab.lastAccessedAt = Date.now();
    tab.loading = true;
    tab.restoreCount = (tab.restoreCount ?? 0) + 1;

    if (!tab.url.startsWith('orca://')) {
      let view = this.views.get(tabId);
      if (!view) {
        view = this.createViewForTab(tab);
      }
      if (this.window && this.activeTabId === tabId) {
        this.attachViewToWindow(view);
      }
    }

    this.callbacks.onTabStateChanged(tabId, 'ACTIVE');
    this.notifyTabsUpdated();
  }

  /**
   * Navigates a tab to a new URL
   */
  public async navigateTab(tabId: string, rawInput: string, searchEngineUrl: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    const targetUrl = NavigationManager.normalizeInput(rawInput, searchEngineUrl);
    console.log('[TabManager] navigateTab:', { tabId, rawInput, targetUrl });
    tab.url = targetUrl;
    tab.lastAccessedAt = Date.now();

    if (targetUrl.startsWith('orca://')) {
      tab.title = targetUrl === 'orca://newtab' ? 'New Tab' : targetUrl.replace('orca://', '');
      tab.loading = false;
      const view = this.views.get(tabId);
      if (view) {
        this.detachViewFromWindow(view);
      }
    } else {
      let view = this.views.get(tabId);
      if (!view) {
        view = this.createViewForTab(tab);
      }
      if (this.window && this.activeTabId === tabId) {
        this.attachViewToWindow(view);
      }
      console.log('[TabManager] loadURL:', targetUrl);
      console.log(`[ORCA VIEW] URL: ${targetUrl}`);
      view.webContents.loadURL(targetUrl).catch((err: any) => {
        console.warn(`Failed to navigate to ${targetUrl}:`, err.message);
      });
    }

    this.notifyTabsUpdated();
  }

  public async reloadTab(tabId: string): Promise<void> {
    const view = this.views.get(tabId);
    if (view) {
      view.webContents.reload();
    }
  }

  public async stopTab(tabId: string): Promise<void> {
    const view = this.views.get(tabId);
    if (view) {
      view.webContents.stop();
    }
  }

  public async goBack(tabId: string): Promise<void> {
    const view = this.views.get(tabId);
    if (view && view.webContents.canGoBack()) {
      view.webContents.goBack();
    }
  }

  public async goForward(tabId: string): Promise<void> {
    const view = this.views.get(tabId);
    if (view && view.webContents.canGoForward()) {
      view.webContents.goForward();
    }
  }

  public async togglePinTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.pinned = !tab.pinned;
      this.notifyTabsUpdated();
    }
  }

  public async toggleMuteTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    const view = this.views.get(tabId);
    if (tab) {
      tab.muted = !tab.muted;
      if (view) {
        view.webContents.setAudioMuted(tab.muted);
      }
      this.notifyTabsUpdated();
    }
  }

  public async duplicateTab(tabId: string): Promise<Tab> {
    const source = this.tabs.get(tabId);
    return this.createTab({
      url: source?.url || 'orca://newtab',
      workspaceId: source?.workspaceId,
      active: true,
    });
  }

  public async setZoom(tabId: string, zoomLevel: number): Promise<void> {
    const tab = this.tabs.get(tabId);
    const view = this.views.get(tabId);
    if (tab && view) {
      tab.zoomLevel = zoomLevel;
      view.webContents.setZoomLevel(zoomLevel);
    }
  }

  public async closeTab(tabId: string): Promise<void> {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    const view = this.views.get(tabId);
    if (view) {
      this.detachViewFromWindow(view);
      try {
        (view.webContents as any).close();
      } catch {}
      this.views.delete(tabId);
    }

    const tabList = Array.from(this.tabs.values());
    const currentIndex = tabList.findIndex(t => t.id === tabId);
    this.tabs.delete(tabId);

    // If closing active tab, switch to another tab in same workspace or any tab
    if (this.activeTabId === tabId) {
      const remaining = Array.from(this.tabs.values());
      if (remaining.length > 0) {
        const nextIndex = Math.min(currentIndex, remaining.length - 1);
        await this.selectTab(remaining[nextIndex].id);
      } else {
        this.activeTabId = null;
        // Create an empty new tab if all tabs were closed
        await this.createTab({ url: 'orca://newtab', active: true });
      }
    }

    this.notifyTabsUpdated();
  }

  public reorderTabs(tabIds: string[]): void {
    const newMap = new Map<string, Tab>();
    for (const id of tabIds) {
      const tab = this.tabs.get(id);
      if (tab) {
        newMap.set(id, tab);
      }
    }
    // Add any remaining
    for (const [id, tab] of this.tabs.entries()) {
      if (!newMap.has(id)) {
        newMap.set(id, tab);
      }
    }
    this.tabs = newMap;
    this.notifyTabsUpdated();
  }

  public restoreSessionTabs(savedTabs: Tab[], activeTabId: string | null): void {
    this.tabs.clear();
    for (const t of savedTabs) {
      // Inactive tabs restore in suspended state so startup is instant and zero RAM overhead!
      const isSavedActive = t.id === activeTabId;
      const state: TabState = isSavedActive ? 'ACTIVE' : (t.state === 'HIBERNATED' ? 'HIBERNATED' : 'SUSPENDED');
      this.tabs.set(t.id, {
        ...t,
        state,
        loading: false,
      });
    }

    if (activeTabId && this.tabs.has(activeTabId)) {
      this.selectTab(activeTabId);
    } else if (this.tabs.size > 0) {
      const first = Array.from(this.tabs.values())[0];
      this.selectTab(first.id);
    } else {
      this.createTab({ url: 'orca://newtab', active: true });
    }
  }

  private notifyTabsUpdated() {
    this.callbacks.onTabsUpdated(this.getTabs());
  }
}
