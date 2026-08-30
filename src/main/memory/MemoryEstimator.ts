import os from 'os';
import { app } from 'electron';
import {
  MemoryPoint,
  MemoryPressureLevel,
  MemoryStats,
  SuspensionCandidate,
  Tab,
  Workspace,
  WorkspaceMemorySummary,
} from '../../shared/types';
import { SuspensionRules } from './SuspensionRules';
import { BrowserSettings } from '../../shared/types';

const BASE_TAB_MEMORY_MB = 180;

export class MemoryEstimator {
  private historyTimeline: MemoryPoint[] = [];
  private readonly MAX_HISTORY_POINTS = 60;

  /**
   * Samples current system and application process memory.
   * @param tabs          All current tabs
   * @param activeTabId   Currently active tab id
   * @param settings      Current browser settings
   * @param workspaces    Workspace list for breakdown
   * @param tabPidMap     Map of tabId -> renderer process PID for real memory correlation
   * @param lifetimeFreedMB  Accumulated freed MB this session
   * @param lifetimeSuspendedCount  Accumulated suspension count this session
   * @param engineAction  Current engine status string
   */
  public async getMemoryStats(
    tabs: Tab[],
    activeTabId: string | null,
    settings: BrowserSettings,
    workspaces: Workspace[],
    tabPidMap: Map<string, number>,
    lifetimeFreedMB: number,
    lifetimeSuspendedCount: number,
    engineAction: string
  ): Promise<MemoryStats> {
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;

    const systemTotalMB = Math.round(totalMemBytes / (1024 * 1024));
    const systemFreeMB = Math.round(freeMemBytes / (1024 * 1024));
    const systemUsedMB = Math.round(usedMemBytes / (1024 * 1024));
    const systemUsedPercent = Math.round((systemUsedMB / systemTotalMB) * 100);

    // Get real Electron process metrics
    let browserTotalKB = 0;
    let browserMainKB = 0;
    let browserRenderersKB = 0;
    const pidToMemKB = new Map<number, number>();

    try {
      const metrics = app.getAppMetrics();
      for (const m of metrics) {
        const memKb = m.memory.workingSetSize || (m.memory.privateBytes + m.memory.sharedBytes) / 1024;
        pidToMemKB.set(m.pid, memKb);
        browserTotalKB += memKb;
        if (m.type === 'Browser') {
          browserMainKB += memKb;
        } else {
          browserRenderersKB += memKb;
        }
      }
    } catch {
      try {
        const pInfo = await process.getProcessMemoryInfo();
        browserTotalKB = pInfo.residentSet;
        browserMainKB = pInfo.residentSet;
      } catch {
        browserTotalKB = 150 * 1024;
      }
    }

    const browserTotalMB = Math.round(browserTotalKB / 1024);
    const browserMainMB = Math.round(browserMainKB / 1024);
    const browserRenderersMB = Math.round(browserRenderersKB / 1024);

    // Annotate actual per-tab memory where PID is known
    for (const tab of tabs) {
      if (tab.state === 'ACTIVE' || tab.state === 'IDLE') {
        const pid = tabPidMap.get(tab.id);
        if (pid && pidToMemKB.has(pid)) {
          tab.actualMemoryMB = Math.round(pidToMemKB.get(pid)! / 1024);
        }
      }
    }

    // Count tabs by state
    const tabsByState = { active: 0, idle: 0, suspended: 0, hibernated: 0 };
    let estimatedSavingsMB = 0;
    let eligibleToSuspendCount = 0;
    let potentialRecoveryMB = 0;

    for (const tab of tabs) {
      switch (tab.state) {
        case 'ACTIVE':  tabsByState.active++;  break;
        case 'IDLE':    tabsByState.idle++;    break;
        case 'SUSPENDED': tabsByState.suspended++; break;
        case 'HIBERNATED': tabsByState.hibernated++; break;
      }

      if (tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED') {
        estimatedSavingsMB += tab.estimatedMemoryMB || BASE_TAB_MEMORY_MB;
      }

      if ((tab.state === 'ACTIVE' || tab.state === 'IDLE') && tab.id !== activeTabId) {
        const check = SuspensionRules.canSuspend(tab, activeTabId, settings, false);
        if (check.eligible) {
          eligibleToSuspendCount++;
          potentialRecoveryMB += tab.actualMemoryMB ?? tab.estimatedMemoryMB ?? BASE_TAB_MEMORY_MB;
        }
      }
    }

    // Pressure level
    const threshold = settings.memoryPressureThresholdPercent ?? 80;
    let pressureLevel: MemoryPressureLevel = 'low';
    if (systemUsedPercent >= threshold + 10) {
      pressureLevel = 'critical';
    } else if (systemUsedPercent >= threshold) {
      pressureLevel = 'high';
    } else if (systemUsedPercent >= threshold - 15) {
      pressureLevel = 'moderate';
    }

    const memoryPressure = pressureLevel === 'high' || pressureLevel === 'critical';

    let pressureMessage: string | undefined;
    if (memoryPressure && eligibleToSuspendCount > 0) {
      pressureMessage = `${eligibleToSuspendCount} inactive tab${eligibleToSuspendCount > 1 ? 's' : ''} can be suspended to recover ~${Math.round(potentialRecoveryMB)} MB`;
    } else if (memoryPressure) {
      pressureMessage = 'System memory is constrained — all eligible tabs already suspended';
    }

    // Suspension candidates list
    const suspensionCandidates: SuspensionCandidate[] = SuspensionRules.getSuspensionCandidates(
      tabs,
      activeTabId,
      settings,
      workspaces,
      memoryPressure
    );

    // Workspace breakdown
    const wsMap = new Map(workspaces.map((w) => [w.id, w.name]));
    const wsSummaryMap = new Map<string, WorkspaceMemorySummary>();
    for (const ws of workspaces) {
      wsSummaryMap.set(ws.id, {
        workspaceId: ws.id,
        workspaceName: ws.name,
        activeTabs: 0, idleTabs: 0, suspendedTabs: 0, hibernatedTabs: 0,
        estimatedActiveMB: 0, estimatedSavedMB: 0,
      });
    }
    for (const tab of tabs) {
      if (!wsSummaryMap.has(tab.workspaceId)) {
        wsSummaryMap.set(tab.workspaceId, {
          workspaceId: tab.workspaceId,
          workspaceName: wsMap.get(tab.workspaceId) || tab.workspaceId,
          activeTabs: 0, idleTabs: 0, suspendedTabs: 0, hibernatedTabs: 0,
          estimatedActiveMB: 0, estimatedSavedMB: 0,
        });
      }
      const ws = wsSummaryMap.get(tab.workspaceId)!;
      const tabMem = tab.actualMemoryMB ?? tab.estimatedMemoryMB ?? BASE_TAB_MEMORY_MB;
      switch (tab.state) {
        case 'ACTIVE':
          ws.activeTabs++;
          ws.estimatedActiveMB += tabMem;
          break;
        case 'IDLE':
          ws.idleTabs++;
          ws.estimatedActiveMB += tabMem;
          break;
        case 'SUSPENDED':
          ws.suspendedTabs++;
          ws.estimatedSavedMB += tab.estimatedMemoryMB || BASE_TAB_MEMORY_MB;
          break;
        case 'HIBERNATED':
          ws.hibernatedTabs++;
          ws.estimatedSavedMB += tab.estimatedMemoryMB || BASE_TAB_MEMORY_MB;
          break;
      }
    }
    const tabsByWorkspace = Array.from(wsSummaryMap.values()).filter(
      (s) => s.activeTabs + s.idleTabs + s.suspendedTabs + s.hibernatedTabs > 0
    );

    // Timeline
    const now = Date.now();
    this.historyTimeline.push({
      timestamp: now,
      browserMB: browserTotalMB,
      systemUsedPercent,
      activeTabCount: tabsByState.active + tabsByState.idle,
      suspendedTabCount: tabsByState.suspended + tabsByState.hibernated,
    });
    if (this.historyTimeline.length > this.MAX_HISTORY_POINTS) {
      this.historyTimeline.shift();
    }

    return {
      systemTotalMB,
      systemFreeMB,
      systemUsedMB,
      systemUsedPercent,
      browserTotalMB,
      browserMainMB,
      browserRenderersMB,
      estimatedSavingsMB: Math.round(estimatedSavingsMB),
      tabsByState,
      memoryPressure,
      pressureLevel,
      pressureMessage,
      engineAction,
      eligibleToSuspendCount,
      potentialRecoveryMB: Math.round(potentialRecoveryMB),
      suspensionCandidates,
      tabsByWorkspace,
      historyTimeline: [...this.historyTimeline],
      lifetimeFreedMB: Math.round(lifetimeFreedMB),
      lifetimeSuspendedCount,
    };
  }

  /**
   * Record a suspension event on the timeline
   */
  public markSuspensionEvent(freedMB: number) {
    if (this.historyTimeline.length > 0) {
      this.historyTimeline[this.historyTimeline.length - 1].suspensionEvent = true;
    }
  }
}
