import os from 'os';
import { app } from 'electron';
import { MemoryPoint, MemoryStats, Tab } from '../../shared/types';

export class MemoryEstimator {
  private historyTimeline: MemoryPoint[] = [];
  private readonly MAX_HISTORY_POINTS = 30;

  /**
   * Samples current system and application process memory
   */
  public async getMemoryStats(tabs: Tab[]): Promise<MemoryStats> {
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

    try {
      const metrics = app.getAppMetrics();
      for (const m of metrics) {
        const memKb = m.memory.workingSetSize || (m.memory.privateBytes + m.memory.sharedBytes);
        browserTotalKB += memKb;
        if (m.type === 'Browser') {
          browserMainKB += memKb;
        } else {
          browserRenderersKB += memKb;
        }
      }
    } catch {
      // Fallback to process.getProcessMemoryInfo()
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

    // Calculate tabs by state
    const tabsByState = {
      active: 0,
      idle: 0,
      suspended: 0,
      hibernated: 0,
    };

    let estimatedSavingsMB = 0;
    let eligibleToSuspendCount = 0;
    let potentialRecoveryMB = 0;

    // Standard Chromium tab memory footprint baseline ~140MB - 320MB
    const BASE_TAB_MEMORY_MB = 180;

    for (const tab of tabs) {
      if (tab.state === 'ACTIVE') {
        tabsByState.active++;
      } else if (tab.state === 'IDLE') {
        tabsByState.idle++;
        if (!tab.pinned && !tab.audioActive && !tab.suspensionProtected) {
          eligibleToSuspendCount++;
          potentialRecoveryMB += (tab.estimatedMemoryMB || BASE_TAB_MEMORY_MB);
        }
      } else if (tab.state === 'SUSPENDED') {
        tabsByState.suspended++;
        // Recovered memory is tab's estimated footprint minus negligible metadata (~0.1MB)
        estimatedSavingsMB += (tab.estimatedMemoryMB || BASE_TAB_MEMORY_MB);
      } else if (tab.state === 'HIBERNATED') {
        tabsByState.hibernated++;
        estimatedSavingsMB += (tab.estimatedMemoryMB || BASE_TAB_MEMORY_MB);
      }
    }

    // Memory pressure detection: free RAM < 15% or < 1500MB
    const memoryPressure = systemUsedPercent >= 85 || systemFreeMB < 1500;
    let pressureMessage: string | undefined;
    if (memoryPressure && eligibleToSuspendCount > 0) {
      pressureMessage = `${eligibleToSuspendCount} inactive tabs can be suspended to recover ~${Math.round(potentialRecoveryMB)} MB RAM`;
    } else if (memoryPressure) {
      pressureMessage = 'System memory is constrained';
    }

    // Update timeline history
    const now = Date.now();
    this.historyTimeline.push({
      timestamp: now,
      browserMB: browserTotalMB,
      systemUsedPercent,
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
      pressureMessage,
      eligibleToSuspendCount,
      potentialRecoveryMB: Math.round(potentialRecoveryMB),
      historyTimeline: [...this.historyTimeline],
    };
  }
}
