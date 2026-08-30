import { BrowserSettings, MemoryStats, Tab } from '../../shared/types';
import { MemoryEstimator } from './MemoryEstimator';
import { SuspensionRules } from './SuspensionRules';

export interface MemoryManagerDelegate {
  getTabs: () => Tab[];
  getActiveTabId: () => string | null;
  getSettings: () => BrowserSettings;
  suspendTab: (tabId: string) => Promise<void>;
  hibernateTab: (tabId: string) => Promise<void>;
  restoreTab: (tabId: string) => Promise<void>;
  notifyMemoryUpdated: (stats: MemoryStats) => void;
  notifyTabStateChanged: (tabId: string, state: string) => void;
}

export class MemoryManager {
  private delegate: MemoryManagerDelegate;
  private estimator: MemoryEstimator;
  private monitorTimer: NodeJS.Timeout | null = null;
  private isOptimizing = false;

  constructor(delegate: MemoryManagerDelegate) {
    this.delegate = delegate;
    this.estimator = new MemoryEstimator();
  }

  public start() {
    if (this.monitorTimer) return;
    // Light periodic check every 10 seconds
    this.monitorTimer = setInterval(() => {
      this.runLifecycleSweep();
    }, 10000);

    // Initial check
    setTimeout(() => this.runLifecycleSweep(), 1500);
  }

  public stop() {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
  }

  public async getStats(): Promise<MemoryStats> {
    const tabs = this.delegate.getTabs();
    return this.estimator.getMemoryStats(tabs);
  }

  /**
   * Periodic sweep checking tab idle states, suspension eligibility, and hibernation eligibility
   */
  public async runLifecycleSweep() {
    const tabs = this.delegate.getTabs();
    const activeTabId = this.delegate.getActiveTabId();
    const settings = this.delegate.getSettings();
    const now = Date.now();

    for (const tab of tabs) {
      // Skip active tab
      if (tab.id === activeTabId) {
        continue;
      }

      // 1. Transition Active -> Idle if inactive for > 2 minutes (visual & internal state)
      const inactiveDurationMs = now - tab.lastAccessedAt;
      if (tab.state === 'ACTIVE' && inactiveDurationMs > 2 * 60 * 1000) {
        tab.state = 'IDLE';
        this.delegate.notifyTabStateChanged(tab.id, 'IDLE');
      }

      // 2. Check if eligible for suspension
      if (tab.state === 'IDLE' || tab.state === 'ACTIVE') {
        const suspendCheck = SuspensionRules.canSuspend(tab, activeTabId, settings);
        if (suspendCheck.eligible) {
          console.log(`[MemoryManager] Auto-suspending tab ${tab.id} (${tab.title || tab.url})`);
          await this.delegate.suspendTab(tab.id);
          continue;
        } else {
          tab.suspensionProtectionReason = suspendCheck.reason;
        }
      }

      // 3. Check if eligible for hibernation
      if (tab.state === 'SUSPENDED') {
        const hibernateCheck = SuspensionRules.canHibernate(tab, activeTabId, settings);
        if (hibernateCheck.eligible) {
          console.log(`[MemoryManager] Auto-hibernating tab ${tab.id} (${tab.title || tab.url})`);
          await this.delegate.hibernateTab(tab.id);
        }
      }
    }

    // Refresh and emit memory stats
    const stats = await this.getStats();
    this.delegate.notifyMemoryUpdated(stats);
  }

  /**
   * Immediately suspends all eligible inactive tabs to relieve RAM
   */
  public async optimizeNow(): Promise<{ freedMB: number; suspendedCount: number }> {
    if (this.isOptimizing) return { freedMB: 0, suspendedCount: 0 };
    this.isOptimizing = true;

    try {
      const beforeStats = await this.getStats();
      const tabs = this.delegate.getTabs();
      const activeTabId = this.delegate.getActiveTabId();
      const settings = this.delegate.getSettings();

      let suspendedCount = 0;
      let estimatedFreedMB = 0;

      for (const tab of tabs) {
        if (tab.id === activeTabId) continue;
        if (tab.state === 'ACTIVE' || tab.state === 'IDLE') {
          // Manual optimize suspends non-active tabs that are not pinned and not playing audio
          if (!tab.pinned && !tab.audioActive && !tab.url.startsWith('orca://')) {
            const domain = tab.url.split('/')[2] || '';
            const isProtected = settings.neverSuspendDomains.some(d => domain.includes(d.trim()));
            if (!isProtected) {
              await this.delegate.suspendTab(tab.id);
              suspendedCount++;
              estimatedFreedMB += (tab.estimatedMemoryMB || 180);
            }
          }
        }
      }

      const afterStats = await this.getStats();
      this.delegate.notifyMemoryUpdated(afterStats);

      return { freedMB: Math.round(estimatedFreedMB), suspendedCount };
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Suspends all eligible tabs according to standard rules
   */
  public async suspendAllEligible(): Promise<{ freedMB: number; suspendedCount: number }> {
    return this.optimizeNow();
  }

  /**
   * Restores all suspended tabs back to active
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
}
