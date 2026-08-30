import { BrowserSettings, MemoryStats, Tab, Workspace } from '../../shared/types';
import { MemoryEstimator } from './MemoryEstimator';
import { SuspensionRules } from './SuspensionRules';

export interface MemoryManagerDelegate {
  getTabs: () => Tab[];
  getActiveTabId: () => string | null;
  getSettings: () => BrowserSettings;
  getWorkspaces: () => Workspace[];
  getTabPidMap: () => Map<string, number>;
  suspendTab: (tabId: string) => Promise<void>;
  hibernateTab: (tabId: string) => Promise<void>;
  restoreTab: (tabId: string) => Promise<void>;
  notifyMemoryUpdated: (stats: MemoryStats) => void;
  notifyTabStateChanged: (tabId: string, state: string) => void;
}

type EngineState = 'monitoring' | 'candidates_detected' | 'suspending' | 'pressure_reduced';

export class MemoryManager {
  private delegate: MemoryManagerDelegate;
  private estimator: MemoryEstimator;
  private monitorTimer: NodeJS.Timeout | null = null;
  private isOptimizing = false;

  // Lifetime per-session stats
  private lifetimeFreedMB = 0;
  private lifetimeSuspendedCount = 0;

  // Engine state for UI action label
  private engineState: EngineState = 'monitoring';
  private pressureReducedAt = 0;

  constructor(delegate: MemoryManagerDelegate) {
    this.delegate = delegate;
    this.estimator = new MemoryEstimator();
  }

  public start() {
    if (this.monitorTimer) return;
    // Sweep every 30 seconds — lightweight
    this.monitorTimer = setInterval(() => {
      this.runLifecycleSweep();
    }, 30_000);

    // Initial check after 2s
    setTimeout(() => this.runLifecycleSweep(), 2000);
  }

  public stop() {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
  }

  public async getStats(): Promise<MemoryStats> {
    return this.estimator.getMemoryStats(
      this.delegate.getTabs(),
      this.delegate.getActiveTabId(),
      this.delegate.getSettings(),
      this.delegate.getWorkspaces(),
      this.delegate.getTabPidMap(),
      this.lifetimeFreedMB,
      this.lifetimeSuspendedCount,
      this.engineActionLabel()
    );
  }

  private engineActionLabel(): string {
    const now = Date.now();
    if (this.engineState === 'pressure_reduced' && now - this.pressureReducedAt < 30_000) {
      return 'Memory pressure reduced';
    }
    switch (this.engineState) {
      case 'candidates_detected': return 'Suspend candidates detected';
      case 'suspending':          return 'Suspending inactive tabs...';
      default:                    return 'Monitoring';
    }
  }

  /**
   * Periodic lifecycle sweep: idle promotion, auto-suspension, hibernation
   */
  public async runLifecycleSweep() {
    const tabs = this.delegate.getTabs();
    const activeTabId = this.delegate.getActiveTabId();
    const settings = this.delegate.getSettings();
    const now = Date.now();

    // Build a quick pressure estimate from OS
    const stats = await this.getStats();
    const underPressure = stats.memoryPressure;

    // --- 1. Idle promotion: ACTIVE -> IDLE after 2 minutes of inactivity ---
    for (const tab of tabs) {
      if (tab.id === activeTabId) continue;
      const lastActive = Math.max(tab.lastAccessedAt, tab.lastInteractionAt ?? 0);
      if (tab.state === 'ACTIVE' && now - lastActive > 2 * 60 * 1000) {
        tab.state = 'IDLE';
        this.delegate.notifyTabStateChanged(tab.id, 'IDLE');
      }
    }

    // --- 2. Check suspension eligibility ---
    const candidates = SuspensionRules.getSuspensionCandidates(
      tabs, activeTabId, settings, this.delegate.getWorkspaces(), underPressure
    );
    const eligibleCandidates = candidates.filter(c => !c.protected);

    if (eligibleCandidates.length > 0) {
      if (this.engineState === 'monitoring') {
        this.engineState = 'candidates_detected';
      }
    }

    // --- 3. Auto-suspend eligible tabs ---
    if (settings.autoSuspend && eligibleCandidates.length > 0) {
      this.engineState = 'suspending';
      for (const candidate of eligibleCandidates) {
        const tab = tabs.find(t => t.id === candidate.tabId);
        if (!tab) continue;
        const check = SuspensionRules.canSuspend(tab, activeTabId, settings, underPressure);
        if (check.eligible) {
          console.log(`[MemoryManager] Auto-suspending: ${tab.title || tab.url} (idle ${Math.round(candidate.inactiveForMs / 60_000)}m)`);
          const memBefore = tab.actualMemoryMB ?? tab.estimatedMemoryMB ?? 180;
          await this.delegate.suspendTab(tab.id);
          this.lifetimeFreedMB += memBefore;
          this.lifetimeSuspendedCount++;
          this.estimator.markSuspensionEvent(memBefore);
        }
      }
      if (underPressure) {
        this.engineState = 'pressure_reduced';
        this.pressureReducedAt = Date.now();
      } else {
        this.engineState = 'monitoring';
      }
    } else if (this.engineState !== 'pressure_reduced') {
      this.engineState = eligibleCandidates.length > 0 ? 'candidates_detected' : 'monitoring';
    }

    // --- 4. Auto-hibernate suspended tabs ---
    for (const tab of tabs) {
      if (tab.state === 'SUSPENDED') {
        const hibernateCheck = SuspensionRules.canHibernate(tab, activeTabId, settings);
        if (hibernateCheck.eligible) {
          console.log(`[MemoryManager] Auto-hibernating: ${tab.title || tab.url}`);
          await this.delegate.hibernateTab(tab.id);
        }
      }
    }

    // Emit updated stats
    const updatedStats = await this.getStats();
    this.delegate.notifyMemoryUpdated(updatedStats);
  }

  /**
   * Immediately suspend all eligible inactive tabs (manual Optimize Now)
   */
  public async optimizeNow(): Promise<{ freedMB: number; suspendedCount: number }> {
    if (this.isOptimizing) return { freedMB: 0, suspendedCount: 0 };
    this.isOptimizing = true;

    try {
      const tabs = this.delegate.getTabs();
      const activeTabId = this.delegate.getActiveTabId();
      const settings = this.delegate.getSettings();

      let suspendedCount = 0;
      let estimatedFreedMB = 0;

      // Manual optimize ignores idle timeout — suspend all non-active, non-protected eligible tabs
      for (const tab of tabs) {
        if (tab.id === activeTabId) continue;
        if (tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED') continue;
        if (tab.url.startsWith('orca://')) continue;
        if (tab.keepAwake) continue;
        if (tab.pinned && (settings.neverSuspendPinned ?? true)) continue;
        if (tab.audioActive && (settings.neverSuspendMedia ?? true)) continue;

        const domain = tab.url.split('/')[2] || '';
        const isProtected = settings.neverSuspendDomains.some((d) => domain.includes(d.trim()));
        if (!isProtected) {
          const memBefore = tab.actualMemoryMB ?? tab.estimatedMemoryMB ?? 180;
          await this.delegate.suspendTab(tab.id);
          suspendedCount++;
          estimatedFreedMB += memBefore;
          this.lifetimeFreedMB += memBefore;
          this.lifetimeSuspendedCount++;
          this.estimator.markSuspensionEvent(memBefore);
        }
      }

      const afterStats = await this.getStats();
      this.delegate.notifyMemoryUpdated(afterStats);

      return { freedMB: Math.round(estimatedFreedMB), suspendedCount };
    } finally {
      this.isOptimizing = false;
    }
  }

  public async suspendAllEligible(): Promise<{ freedMB: number; suspendedCount: number }> {
    return this.optimizeNow();
  }

  /**
   * Restores all suspended/hibernated tabs
   */
  public async restoreAll(): Promise<void> {
    const tabs = this.delegate.getTabs();
    for (const tab of tabs) {
      if (tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED') {
        await this.delegate.restoreTab(tab.id);
      }
    }
    const stats = await this.getStats();
    this.delegate.notifyMemoryUpdated(stats);
  }

  /**
   * Suspend all eligible tabs in a specific workspace
   */
  public async suspendWorkspace(workspaceId: string): Promise<{ freedMB: number; suspendedCount: number }> {
    const tabs = this.delegate.getTabs();
    const activeTabId = this.delegate.getActiveTabId();
    const settings = this.delegate.getSettings();

    let suspendedCount = 0;
    let estimatedFreedMB = 0;

    for (const tab of tabs) {
      if (tab.workspaceId !== workspaceId) continue;
      if (tab.id === activeTabId) continue;
      if (tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED') continue;
      if (tab.url.startsWith('orca://')) continue;
      if (tab.keepAwake) continue;
      if (tab.pinned && (settings.neverSuspendPinned ?? true)) continue;
      if (tab.audioActive && (settings.neverSuspendMedia ?? true)) continue;

      const memBefore = tab.actualMemoryMB ?? tab.estimatedMemoryMB ?? 180;
      await this.delegate.suspendTab(tab.id);
      suspendedCount++;
      estimatedFreedMB += memBefore;
      this.lifetimeFreedMB += memBefore;
      this.lifetimeSuspendedCount++;
    }

    const stats = await this.getStats();
    this.delegate.notifyMemoryUpdated(stats);
    return { freedMB: Math.round(estimatedFreedMB), suspendedCount };
  }

  /**
   * Restore all tabs in a specific workspace
   */
  public async restoreWorkspace(workspaceId: string): Promise<void> {
    const tabs = this.delegate.getTabs();
    for (const tab of tabs) {
      if (tab.workspaceId !== workspaceId) continue;
      if (tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED') {
        await this.delegate.restoreTab(tab.id);
      }
    }
    const stats = await this.getStats();
    this.delegate.notifyMemoryUpdated(stats);
  }
}
