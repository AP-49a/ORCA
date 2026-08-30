import { Tab, BrowserSettings, SuspensionCandidate, Workspace } from '../../shared/types';
import { NavigationManager } from '../browser/NavigationManager';

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

// Aggressiveness thresholds in minutes
const AGGRESSIVENESS_TIMEOUTS: Record<string, number> = {
  conservative: 60,
  balanced: 15,
  aggressive: 5,
};

// Under memory pressure, reduce the idle requirement
const PRESSURE_TIMEOUT_REDUCTION: Record<string, number> = {
  conservative: 0.33, // 33% reduction (60m -> 40m)
  balanced: 0.5,      // 50% reduction (15m -> 7.5m)
  aggressive: 0.8,    // 80% reduction (5m -> 1m)
};

export class SuspensionRules {
  /**
   * Resolve effective idle timeout in ms, accounting for aggressiveness + pressure
   */
  public static resolveIdleTimeoutMs(
    settings: BrowserSettings,
    underPressure: boolean
  ): number {
    // User's explicit suspend timeout takes precedence; aggressiveness adjusts defaults
    const aggressivenessDefault = (AGGRESSIVENESS_TIMEOUTS[settings.suspendAggressiveness ?? 'balanced'] ?? 15) * 60 * 1000;
    const userTimeoutMs = settings.suspendTimeoutMinutes * 60 * 1000;

    // If user has set suspendTimeoutMinutes explicitly (non-default), use it; otherwise use aggressiveness
    let baseTimeout = userTimeoutMs;

    if (underPressure) {
      const reduction = PRESSURE_TIMEOUT_REDUCTION[settings.suspendAggressiveness ?? 'balanced'] ?? 0.25;
      baseTimeout = Math.round(baseTimeout * (1 - reduction));
    }

    return Math.max(60_000, baseTimeout); // minimum 1 minute always
  }

  /**
   * Determine if a tab is eligible for suspension (Active/Idle -> Suspended)
   */
  public static canSuspend(
    tab: Tab,
    activeTabId: string | null,
    settings: BrowserSettings,
    underPressure = false
  ): EligibilityResult {
    if (!settings.autoSuspend) {
      return { eligible: false, reason: 'Automatic suspension is disabled' };
    }

    if (tab.id === activeTabId) {
      return { eligible: false, reason: 'Currently active tab' };
    }

    if (tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED') {
      return { eligible: false, reason: 'Already suspended or hibernated' };
    }

    // keepAwake is an explicit user override
    if (tab.keepAwake) {
      return { eligible: false, reason: 'Tab is set to Keep Awake' };
    }

    if (tab.pinned && (settings.neverSuspendPinned ?? true)) {
      return { eligible: false, reason: 'Pinned tab' };
    }

    if (tab.audioActive && (settings.neverSuspendMedia ?? true)) {
      return { eligible: false, reason: 'Playing audio/media' };
    }

    if (tab.url.startsWith('orca://') || tab.url.startsWith('about:')) {
      return { eligible: false, reason: 'Internal browser page' };
    }

    const domain = NavigationManager.extractDomain(tab.url).toLowerCase();
    const isNeverSuspend = settings.neverSuspendDomains.some((d) => {
      const match = d.trim().toLowerCase();
      return match && (domain === match || domain.endsWith(`.${match}`));
    });

    if (isNeverSuspend) {
      return { eligible: false, reason: `Domain ${domain} is on "Never Suspend" list` };
    }

    // Check idle duration
    const lastActive = Math.max(tab.lastAccessedAt, tab.lastInteractionAt ?? 0);
    const idleDurationMs = Date.now() - lastActive;
    const requiredIdleMs = SuspensionRules.resolveIdleTimeoutMs(settings, underPressure);

    if (idleDurationMs < requiredIdleMs) {
      const remaining = Math.ceil((requiredIdleMs - idleDurationMs) / 60_000);
      return {
        eligible: false,
        reason: `Idle for ${Math.round(idleDurationMs / 60_000)}m, needs ${Math.round(requiredIdleMs / 60_000)}m (${remaining}m remaining)`,
      };
    }

    return { eligible: true };
  }

  /**
   * Determine if a tab is eligible for hibernation (Suspended -> Hibernated)
   */
  public static canHibernate(
    tab: Tab,
    activeTabId: string | null,
    settings: BrowserSettings
  ): EligibilityResult {
    if (!settings.autoHibernate) {
      return { eligible: false, reason: 'Automatic hibernation is disabled' };
    }

    if (tab.id === activeTabId) {
      return { eligible: false, reason: 'Currently active tab' };
    }

    if (tab.state === 'HIBERNATED') {
      return { eligible: false, reason: 'Already hibernated' };
    }

    if (tab.pinned) {
      return { eligible: false, reason: 'Pinned tab' };
    }

    if (tab.keepAwake) {
      return { eligible: false, reason: 'Tab is set to Keep Awake' };
    }

    const domain = NavigationManager.extractDomain(tab.url).toLowerCase();
    const isNeverHibernate = settings.neverHibernateDomains.some((d) => {
      const match = d.trim().toLowerCase();
      return match && (domain === match || domain.endsWith(`.${match}`));
    });

    if (isNeverHibernate) {
      return { eligible: false, reason: `Domain ${domain} is on "Never Hibernate" list` };
    }

    const durationMs = Date.now() - tab.lastAccessedAt;
    const requiredHibernateMs = settings.hibernateTimeoutDays * 24 * 60 * 60 * 1000;

    if (durationMs < requiredHibernateMs) {
      return { eligible: false, reason: 'Not inactive long enough for hibernation' };
    }

    return { eligible: true };
  }

  /**
   * Build a prioritized suspension candidate list (highest priority = suspend first)
   * Priority score: higher inactivity time = higher priority
   */
  public static getSuspensionCandidates(
    tabs: Tab[],
    activeTabId: string | null,
    settings: BrowserSettings,
    workspaces: Workspace[],
    underPressure = false
  ): SuspensionCandidate[] {
    const now = Date.now();
    const wsMap = new Map(workspaces.map((w) => [w.id, w.name]));

    const candidates: SuspensionCandidate[] = [];

    for (const tab of tabs) {
      if (tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED') continue;
      if (tab.url.startsWith('orca://')) continue;

      const lastActive = Math.max(tab.lastAccessedAt, tab.lastInteractionAt ?? 0);
      const inactiveForMs = now - lastActive;

      const eligibility = SuspensionRules.canSuspend(tab, activeTabId, settings, underPressure);

      candidates.push({
        tabId: tab.id,
        title: tab.title || tab.url,
        url: tab.url,
        favicon: tab.favicon,
        workspaceId: tab.workspaceId,
        workspaceName: wsMap.get(tab.workspaceId) || tab.workspaceId,
        inactiveForMs,
        estimatedMemoryMB: tab.actualMemoryMB ?? tab.estimatedMemoryMB,
        priority: eligibility.eligible ? Math.floor(inactiveForMs / 60_000) : -1,
        protected: !eligibility.eligible,
        protectionReason: eligibility.reason,
      });
    }

    // Sort: eligible first (priority desc), then protected ones
    candidates.sort((a, b) => b.priority - a.priority);

    return candidates;
  }
}
