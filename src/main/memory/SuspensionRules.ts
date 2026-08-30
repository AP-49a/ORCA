import { Tab, BrowserSettings } from '../../shared/types';
import { NavigationManager } from '../browser/NavigationManager';

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

export class SuspensionRules {
  /**
   * Determine if a tab is eligible for suspension (Active/Idle -> Suspended)
   */
  public static canSuspend(tab: Tab, activeTabId: string | null, settings: BrowserSettings): EligibilityResult {
    if (!settings.autoSuspend) {
      return { eligible: false, reason: 'Automatic suspension is disabled' };
    }

    if (tab.id === activeTabId) {
      return { eligible: false, reason: 'Currently active tab' };
    }

    if (tab.state === 'SUSPENDED' || tab.state === 'HIBERNATED') {
      return { eligible: false, reason: 'Already suspended or hibernated' };
    }

    if (tab.pinned) {
      return { eligible: false, reason: 'Pinned tab' };
    }

    if (tab.audioActive) {
      return { eligible: false, reason: 'Playing audio/media' };
    }

    if (tab.url.startsWith('orca://') || tab.url.startsWith('about:')) {
      return { eligible: false, reason: 'Internal browser page' };
    }

    const domain = NavigationManager.extractDomain(tab.url).toLowerCase();
    const isNeverSuspend = settings.neverSuspendDomains.some(d => {
      const match = d.trim().toLowerCase();
      return match && (domain === match || domain.endsWith(`.${match}`));
    });

    if (isNeverSuspend) {
      return { eligible: false, reason: `Domain ${domain} is on "Never Suspend" list` };
    }

    // Check idle duration
    const idleDurationMs = Date.now() - tab.lastAccessedAt;
    const requiredIdleMs = settings.suspendTimeoutMinutes * 60 * 1000;

    if (idleDurationMs < requiredIdleMs) {
      return { eligible: false, reason: `Tab idle for ${Math.round(idleDurationMs / 1000)}s, requires ${settings.suspendTimeoutMinutes * 60}s` };
    }

    return { eligible: true };
  }

  /**
   * Determine if a tab is eligible for hibernation (Suspended -> Hibernated)
   */
  public static canHibernate(tab: Tab, activeTabId: string | null, settings: BrowserSettings): EligibilityResult {
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

    const domain = NavigationManager.extractDomain(tab.url).toLowerCase();
    const isNeverHibernate = settings.neverHibernateDomains.some(d => {
      const match = d.trim().toLowerCase();
      return match && (domain === match || domain.endsWith(`.${match}`));
    });

    if (isNeverHibernate) {
      return { eligible: false, reason: `Domain ${domain} is on "Never Hibernate" list` };
    }

    // Check duration since last accessed
    const durationMs = Date.now() - tab.lastAccessedAt;
    const requiredHibernateMs = settings.hibernateTimeoutDays * 24 * 60 * 60 * 1000;

    if (durationMs < requiredHibernateMs) {
      return { eligible: false, reason: 'Not inactive long enough for hibernation' };
    }

    return { eligible: true };
  }
}
