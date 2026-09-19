import fs from 'fs';
import path from 'path';
import os from 'os';
import { Tab, BrowserSettings, Workspace, MemoryStats, SessionData } from '../src/shared/types';
import { SuspensionRules } from '../src/main/memory/SuspensionRules';
import { MemoryManager, MemoryManagerDelegate } from '../src/main/memory/MemoryManager';
import { NavigationManager } from '../src/main/browser/NavigationManager';
import { TabManager } from '../src/main/browser/TabManager';
import { StorageManager } from '../src/main/persistence/StorageManager';


// ---------------------------------------------------------------------------
// Test infrastructure
// ---------------------------------------------------------------------------

let passCount = 0;
let failCount = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    failCount++;
    failures.push(message);
    console.error(`  ✗ ${message}`);
  } else {
    passCount++;
    console.log(`  ✓ ${message}`);
  }
}

/**
 * assertBug() — documents a known behavioural quirk in the current implementation
 * without causing the test run to fail.  The assertion is flipped: we assert that
 * the CURRENT (buggy/surprising) behaviour holds so that a future fix immediately
 * causes this assertion to fail, prompting removal.
 *
 * Every call must be accompanied by a BUG_NOTE comment explaining the finding.
 */
function assertBug(currentBehaviour: boolean, bugNote: string) {
  if (!currentBehaviour) {
    failCount++;
    failures.push(`[BUG_NOTE changed] ${bugNote}`);
    console.error(`  ✗ [BUG_NOTE changed — investigate] ${bugNote}`);
  } else {
    passCount++;
    console.log(`  ⚠ [BUG_NOTE documented] ${bugNote}`);
  }
}

function section(name: string) {
  console.log(`\n--- ${name} ---`);
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

/**
 * Complete BrowserSettings that satisfies all required fields.
 * Tests override individual fields as needed.
 */
const baseSettings: BrowserSettings = {
  autoSuspend: true,
  suspendTimeoutMinutes: 15,
  suspendAggressiveness: 'balanced',
  suspendTimeoutCustomized: false,
  memoryPressureThresholdPercent: 80,
  neverSuspendPinned: true,
  neverSuspendMedia: true,
  neverSuspendDownloads: false,
  autoHibernate: true,
  hibernateTimeoutDays: 3,
  neverSuspendDomains: ['docs.google.com', 'figma.com'],
  neverHibernateDomains: ['docs.google.com'],
  searchEngine: 'https://www.google.com/search?q=',
  defaultDownloadPath: '',
  theme: 'ocean',
  restoreSessionOnStartup: true,
  showMemoryBadge: true,
};

const now = Date.now();

/** A minimal valid tab that is ACTIVE. */
function makeTab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: 'tab-default',
    url: 'https://example.com',
    title: 'Example',
    createdAt: now - 3_600_000,
    lastAccessedAt: now - 3_600_000,
    state: 'ACTIVE',
    workspaceId: 'ws-1',
    pinned: false,
    muted: false,
    loading: false,
    canGoBack: false,
    canGoForward: false,
    estimatedMemoryMB: 180,
    zoomLevel: 0,
    ...overrides,
  };
}

/** A workspace stub used by getSuspensionCandidates. */
const baseWorkspaces: Workspace[] = [
  { id: 'ws-1', name: 'Personal', color: '#000', icon: '🌊', createdAt: now - 86_400_000 },
];

// ---------------------------------------------------------------------------
// Existing tests (preserved verbatim from original)
// ---------------------------------------------------------------------------

export function runOriginalTests() {
  section('Original Tests (preserved)');

  const settings: BrowserSettings = {
    autoSuspend: true,
    suspendTimeoutMinutes: 15,
    autoHibernate: true,
    hibernateTimeoutDays: 3,
    neverSuspendDomains: ['docs.google.com', 'figma.com'],
    neverHibernateDomains: ['docs.google.com'],
    searchEngine: 'https://www.google.com/search?q=',
    defaultDownloadPath: '',
    theme: 'ocean',
    restoreSessionOnStartup: true,
    showMemoryBadge: true,
    // fields required by BrowserSettings but omitted in original fixture —
    // filling in safe defaults so TypeScript is satisfied
    suspendAggressiveness: 'balanced',
    memoryPressureThresholdPercent: 80,
    neverSuspendPinned: true,
    neverSuspendMedia: true,
    neverSuspendDownloads: false,
  };

  const activeTab: Tab = {
    id: 'tab-1',
    url: 'https://example.com',
    title: 'Example',
    createdAt: now - 3600000,
    lastAccessedAt: now - 3600000,
    state: 'ACTIVE',
    workspaceId: 'ws-personal',
    pinned: false,
    muted: false,
    loading: false,
    canGoBack: false,
    canGoForward: false,
    estimatedMemoryMB: 180,
    zoomLevel: 0,
  };

  const res1 = SuspensionRules.canSuspend(activeTab, 'tab-1', settings);
  assert(!res1.eligible, 'Active tab is never eligible for suspension');

  const inactiveTab: Tab = {
    ...activeTab,
    id: 'tab-2',
    lastAccessedAt: now - (20 * 60 * 1000),
  };
  const res2 = SuspensionRules.canSuspend(inactiveTab, 'tab-1', settings);
  assert(res2.eligible, 'Inactive tab past 15 min threshold is eligible for suspension');

  const audioTab: Tab = { ...inactiveTab, id: 'tab-3', audioActive: true };
  const res3 = SuspensionRules.canSuspend(audioTab, 'tab-1', settings);
  assert(!res3.eligible, 'Tab playing audio/media is protected from suspension');

  const googleDocTab: Tab = {
    ...inactiveTab,
    id: 'tab-4',
    url: 'https://docs.google.com/document/d/123',
  };
  const res4 = SuspensionRules.canSuspend(googleDocTab, 'tab-1', settings);
  assert(!res4.eligible, 'Whitelisted domain (docs.google.com) is protected from suspension');

  const pinnedTab: Tab = { ...inactiveTab, id: 'tab-5', pinned: true };
  const res5 = SuspensionRules.canSuspend(pinnedTab, 'tab-1', settings);
  assert(!res5.eligible, 'Pinned tab is protected from suspension');

  const keepAwakeTab: Tab = { ...inactiveTab, id: 'tab-6', keepAwake: true };
  const res6 = SuspensionRules.canSuspend(keepAwakeTab, 'tab-1', settings);
  assert(!res6.eligible, 'Keep Awake tab is protected from suspension');

  const aggressiveSettings: BrowserSettings = {
    ...settings,
    suspendAggressiveness: 'aggressive',
    suspendTimeoutMinutes: 5,
  };
  const sixMinTab: Tab = {
    ...activeTab,
    id: 'tab-7',
    lastAccessedAt: now - (6 * 60 * 1000),
  };
  const res7 = SuspensionRules.canSuspend(sixMinTab, 'tab-1', aggressiveSettings);
  assert(res7.eligible, 'Aggressive mode suspends tabs inactive for >5 min');

  const eightMinTab: Tab = {
    ...activeTab,
    id: 'tab-8',
    lastAccessedAt: now - (8 * 60 * 1000),
  };
  const res8Normal = SuspensionRules.canSuspend(eightMinTab, 'tab-1', settings, false);
  const res8Pressure = SuspensionRules.canSuspend(eightMinTab, 'tab-1', settings, true);
  assert(!res8Normal.eligible, '8m tab is not eligible under normal conditions');
  assert(res8Pressure.eligible, '8m tab becomes eligible under memory pressure acceleration');

  const url1 = NavigationManager.normalizeInput('github.com', settings.searchEngine);
  assert(url1 === 'https://github.com', 'Domain input "github.com" normalized to "https://github.com"');

  const url2 = NavigationManager.normalizeInput('chromium memory optimization', settings.searchEngine);
  assert(url2.includes('google.com/search?q=chromium'), 'Search query normalized to search engine URL');

  const url3 = NavigationManager.normalizeInput('orca://newtab', settings.searchEngine);
  assert(url3 === 'orca://newtab', 'Internal protocol preserved as "orca://newtab"');

  console.log('✓ Original tests section complete\n');

  // TabManager regression
  const calls: string[] = [];
  const fakeView = {
    id: 'tab-views',
    setBounds: () => calls.push('setBounds'),
    setVisible: () => calls.push('setVisible'),
    webContents: { canGoBack: () => false, canGoForward: () => false },
  };
  const fakeWindow = {
    setBrowserView: (view: unknown) => calls.push(`setBrowserView:${String((view as any)?.id ?? 'view')}`),
    removeBrowserView: (view: unknown) => calls.push(`removeBrowserView:${String((view as any)?.id ?? 'view')}`),
    contentView: {
      addChildView: () => calls.push('addChildView'),
      removeChildView: () => calls.push('removeChildView'),
    },
  };

  const manager = new TabManager({
    onTabsUpdated: () => undefined,
    onActiveTabChanged: () => undefined,
    onTabNavigated: () => undefined,
    onTabLoading: () => undefined,
    onTabTitleUpdated: () => undefined,
    onTabFaviconUpdated: () => undefined,
    onTabStateChanged: () => undefined,
    onHistoryItemAdded: () => undefined,
  }) as any;

  (manager as any).window = fakeWindow as any;
  (manager as any).tabs.set('tab-views', {
    id: 'tab-views',
    url: 'https://example.com',
    title: 'Example',
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
    state: 'ACTIVE',
    workspaceId: 'ws-personal',
    pinned: false,
    muted: false,
    loading: false,
    canGoBack: false,
    canGoForward: false,
    estimatedMemoryMB: 180,
    zoomLevel: 0,
  });
  (manager as any).views.set('tab-views', fakeView as any);
  (manager as any).activeTabId = 'tab-views';

  manager.selectTab('tab-views');
  assert(
    calls.includes('addChildView') || calls.includes('setBrowserView:tab-views'),
    'Active tab is attached to the window so the app chrome remains clickable',
  );
  assert(
    calls.includes('setVisible'),
    'The browser view is shown only in the content region, keeping the window chrome interactive',
  );
}

// ---------------------------------------------------------------------------
// TASK 1 — canHibernate() tests
// ---------------------------------------------------------------------------

export function runCanHibernateTests() {
  section('TASK 1 — canHibernate()');

  // -------------------------------------------------------------------------
  // 1a. Active tab (matched by activeTabId)
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({ id: 'h-active', lastAccessedAt: now - 10 * 86_400_000 }); // old enough
    const result = SuspensionRules.canHibernate(tab, 'h-active', baseSettings);
    assert(!result.eligible, 'canHibernate: active tab (matching activeTabId) is not eligible');
    assert(result.reason === 'Currently active tab', 'canHibernate: active tab reason = "Currently active tab"');
  }

  // -------------------------------------------------------------------------
  // 1a-ext. Lifecycle state guard (ACTIVE and IDLE tabs cannot hibernate)
  // -------------------------------------------------------------------------
  {
    const tabActive = makeTab({
      id: 'h-active-state-not-active-id',
      state: 'ACTIVE',
      lastAccessedAt: now - 10 * 86_400_000,
    });
    const resultActive = SuspensionRules.canHibernate(tabActive, 'some-other-tab', baseSettings);
    assert(!resultActive.eligible, 'canHibernate: ACTIVE-state tab (non-focused) is not eligible');
    assert(
      resultActive.reason === 'Tab must be suspended before it can be hibernated',
      'canHibernate: ACTIVE-state tab reason is "Tab must be suspended before it can be hibernated"',
    );

    const tabIdle = makeTab({
      id: 'h-idle-state',
      state: 'IDLE',
      lastAccessedAt: now - 10 * 86_400_000,
    });
    const resultIdle = SuspensionRules.canHibernate(tabIdle, 'some-other-tab', baseSettings);
    assert(!resultIdle.eligible, 'canHibernate: IDLE-state tab is not eligible');
    assert(
      resultIdle.reason === 'Tab must be suspended before it can be hibernated',
      'canHibernate: IDLE-state tab reason is "Tab must be suspended before it can be hibernated"',
    );
  }

  // -------------------------------------------------------------------------
  // 1b. Already hibernated tab
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({ id: 'h-already', state: 'HIBERNATED', lastAccessedAt: now - 10 * 86_400_000 });
    const result = SuspensionRules.canHibernate(tab, 'other-tab', baseSettings);
    assert(!result.eligible, 'canHibernate: already HIBERNATED tab is not eligible');
    assert(result.reason === 'Already hibernated', 'canHibernate: already hibernated reason is correct');
  }

  // -------------------------------------------------------------------------
  // 1c. Pinned tab
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({
      id: 'h-pinned',
      state: 'SUSPENDED',
      pinned: true,
      lastAccessedAt: now - 10 * 86_400_000,
    });
    const result = SuspensionRules.canHibernate(tab, 'other-tab', baseSettings);
    assert(!result.eligible, 'canHibernate: pinned tab is not eligible');
    assert(result.reason === 'Pinned tab', 'canHibernate: pinned tab reason is correct');
  }

  // -------------------------------------------------------------------------
  // 1d. keepAwake tab
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({
      id: 'h-keepawake',
      state: 'SUSPENDED',
      keepAwake: true,
      lastAccessedAt: now - 10 * 86_400_000,
    });
    const result = SuspensionRules.canHibernate(tab, 'other-tab', baseSettings);
    assert(!result.eligible, 'canHibernate: keepAwake tab is not eligible');
    assert(result.reason === 'Tab is set to Keep Awake', 'canHibernate: keepAwake reason is correct');
  }

  // -------------------------------------------------------------------------
  // 1e. neverHibernateDomains — exact domain match
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({
      id: 'h-never-exact',
      state: 'SUSPENDED',
      url: 'https://docs.google.com/doc/1',
      lastAccessedAt: now - 10 * 86_400_000,
    });
    const result = SuspensionRules.canHibernate(tab, 'other-tab', baseSettings);
    assert(!result.eligible, 'canHibernate: exact neverHibernateDomain (docs.google.com) is not eligible');
    assert(
      result.reason?.includes('docs.google.com') === true,
      'canHibernate: neverHibernateDomain reason mentions the domain',
    );
  }

  // -------------------------------------------------------------------------
  // 1f. neverHibernateDomains — subdomain match
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({
      id: 'h-never-subdomain',
      state: 'SUSPENDED',
      url: 'https://drive.docs.google.com/file/xyz',   // subdomain of docs.google.com
      lastAccessedAt: now - 10 * 86_400_000,
    });
    // drive.docs.google.com ends with ".docs.google.com" — should be protected
    const result = SuspensionRules.canHibernate(tab, 'other-tab', baseSettings);
    assert(!result.eligible, 'canHibernate: subdomain of neverHibernateDomain is not eligible');
  }

  // -------------------------------------------------------------------------
  // 1g. neverHibernateDomains — unrelated domain is NOT protected
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({
      id: 'h-never-unrelated',
      state: 'SUSPENDED',
      url: 'https://github.com/some/repo',
      lastAccessedAt: now - 10 * 86_400_000,
    });
    const result = SuspensionRules.canHibernate(tab, 'other-tab', baseSettings);
    assert(result.eligible, 'canHibernate: unrelated domain is eligible for hibernation');
  }

  // -------------------------------------------------------------------------
  // 1h. Timeout — tab older than hibernateTimeoutDays is eligible
  // -------------------------------------------------------------------------
  {
    const daysMs = baseSettings.hibernateTimeoutDays * 24 * 60 * 60 * 1000;
    const tab = makeTab({
      id: 'h-timeout-old',
      state: 'SUSPENDED',
      url: 'https://github.com/old',
      lastAccessedAt: now - daysMs - 1000, // 1 second past the threshold
    });
    const result = SuspensionRules.canHibernate(tab, 'other-tab', baseSettings);
    assert(result.eligible, 'canHibernate: tab 1s past hibernateTimeoutDays is eligible');
  }

  // -------------------------------------------------------------------------
  // 1i. Timeout — tab newer than hibernateTimeoutDays is NOT eligible
  // -------------------------------------------------------------------------
  {
    const daysMs = baseSettings.hibernateTimeoutDays * 24 * 60 * 60 * 1000;
    const tab = makeTab({
      id: 'h-timeout-new',
      state: 'SUSPENDED',
      url: 'https://github.com/new',
      lastAccessedAt: now - daysMs + 60_000, // 1 minute before threshold
    });
    const result = SuspensionRules.canHibernate(tab, 'other-tab', baseSettings);
    assert(!result.eligible, 'canHibernate: tab 1 minute before hibernateTimeoutDays is not eligible');
    assert(
      result.reason === 'Not inactive long enough for hibernation',
      'canHibernate: "not inactive long enough" reason is present',
    );
  }

  // -------------------------------------------------------------------------
  // 1j. autoHibernate = false — no tab is eligible
  // -------------------------------------------------------------------------
  {
    const noHibernateSettings: BrowserSettings = { ...baseSettings, autoHibernate: false };
    const tab = makeTab({
      id: 'h-nohib',
      state: 'SUSPENDED',
      url: 'https://github.com/whatever',
      lastAccessedAt: now - 10 * 86_400_000,
    });
    const result = SuspensionRules.canHibernate(tab, 'other-tab', noHibernateSettings);
    assert(!result.eligible, 'canHibernate: autoHibernate=false makes no tab eligible');
    assert(
      result.reason === 'Automatic hibernation is disabled',
      'canHibernate: autoHibernate=false reason is correct',
    );
  }
}

// ---------------------------------------------------------------------------
// TASK 2 — resolveIdleTimeoutMs() tests
// ---------------------------------------------------------------------------

export function runResolveIdleTimeoutTests() {
  section('TASK 2 — resolveIdleTimeoutMs()');

  const MIN_TIMEOUT_MS = 60_000; // 1 minute (enforced by implementation)

  // -------------------------------------------------------------------------
  // 2a. Aggressiveness Presets (suspendTimeoutCustomized = false)
  // -------------------------------------------------------------------------
  {
    // 1. Conservative preset: 60 minutes
    const conservativeSettings: BrowserSettings = {
      ...baseSettings,
      suspendAggressiveness: 'conservative',
      suspendTimeoutMinutes: 60,
      suspendTimeoutCustomized: false,
    };
    const tConservative = SuspensionRules.resolveIdleTimeoutMs(conservativeSettings, false);
    assert(
      tConservative === 60 * 60 * 1000,
      'resolveIdleTimeoutMs: conservative preset (customized=false) → 60 min (3 600 000 ms)',
    );

    // 2. Balanced preset: 15 minutes
    const balancedSettings: BrowserSettings = {
      ...baseSettings,
      suspendAggressiveness: 'balanced',
      suspendTimeoutMinutes: 15,
      suspendTimeoutCustomized: false,
    };
    const tBalanced = SuspensionRules.resolveIdleTimeoutMs(balancedSettings, false);
    assert(
      tBalanced === 15 * 60 * 1000,
      'resolveIdleTimeoutMs: balanced preset (customized=false) → 15 min (900 000 ms)',
    );

    // 3. Aggressive preset: 5 minutes
    const aggressiveSettings: BrowserSettings = {
      ...baseSettings,
      suspendAggressiveness: 'aggressive',
      suspendTimeoutMinutes: 5,
      suspendTimeoutCustomized: false,
    };
    const tAggressive = SuspensionRules.resolveIdleTimeoutMs(aggressiveSettings, false);
    assert(
      tAggressive === 5 * 60 * 1000,
      'resolveIdleTimeoutMs: aggressive preset (customized=false) → 5 min (300 000 ms)',
    );
  }

  // -------------------------------------------------------------------------
  // 2b. Explicit Custom Timeout Overrides (suspendTimeoutCustomized = true)
  // -------------------------------------------------------------------------
  {
    // 4. Aggressive + explicit 30-minute override → 30 minutes
    const aggressiveWithOverride: BrowserSettings = {
      ...baseSettings,
      suspendAggressiveness: 'aggressive',
      suspendTimeoutMinutes: 30,
      suspendTimeoutCustomized: true,
    };
    const t30 = SuspensionRules.resolveIdleTimeoutMs(aggressiveWithOverride, false);
    assert(
      t30 === 30 * 60 * 1000,
      'resolveIdleTimeoutMs: aggressive + explicit 30m override (customized=true) → 30 min (1 800 000 ms)',
    );

    // 5. Conservative + explicit 5-minute override → 5 minutes
    const conservativeWithOverride: BrowserSettings = {
      ...baseSettings,
      suspendAggressiveness: 'conservative',
      suspendTimeoutMinutes: 5,
      suspendTimeoutCustomized: true,
    };
    const t5 = SuspensionRules.resolveIdleTimeoutMs(conservativeWithOverride, false);
    assert(
      t5 === 5 * 60 * 1000,
      'resolveIdleTimeoutMs: conservative + explicit 5m override (customized=true) → 5 min (300 000 ms)',
    );

    // 6. Balanced + explicit 120-minute override → 120 minutes
    const balancedWithOverride: BrowserSettings = {
      ...baseSettings,
      suspendAggressiveness: 'balanced',
      suspendTimeoutMinutes: 120,
      suspendTimeoutCustomized: true,
    };
    const t120 = SuspensionRules.resolveIdleTimeoutMs(balancedWithOverride, false);
    assert(
      t120 === 120 * 60 * 1000,
      'resolveIdleTimeoutMs: balanced + explicit 120m override (customized=true) → 120 min (7 200 000 ms)',
    );
  }

  // -------------------------------------------------------------------------
  // 2c. Memory Pressure Reduction applied AFTER determining base timeout
  // -------------------------------------------------------------------------
  {
    // Balanced preset under pressure (50% reduction of 15m) → 7.5 min = 450 000 ms
    const balancedSettings: BrowserSettings = {
      ...baseSettings,
      suspendAggressiveness: 'balanced',
      suspendTimeoutMinutes: 15,
      suspendTimeoutCustomized: false,
    };
    const balancedPressure = SuspensionRules.resolveIdleTimeoutMs(balancedSettings, true);
    const expectedBalanced = Math.round(15 * 60 * 1000 * (1 - 0.5));
    assert(
      balancedPressure === expectedBalanced,
      `resolveIdleTimeoutMs: balanced pressure reduction (50%) → ${expectedBalanced} ms`,
    );

    // Aggressive preset under pressure (80% reduction of 5m) → 1 min = 60 000 ms
    const aggressiveSettings: BrowserSettings = {
      ...baseSettings,
      suspendAggressiveness: 'aggressive',
      suspendTimeoutMinutes: 5,
      suspendTimeoutCustomized: false,
    };
    const aggressivePressure = SuspensionRules.resolveIdleTimeoutMs(aggressiveSettings, true);
    const expectedAggressive = Math.round(5 * 60 * 1000 * (1 - 0.8));
    assert(
      aggressivePressure === expectedAggressive,
      `resolveIdleTimeoutMs: aggressive pressure reduction (80%) on preset → ${expectedAggressive} ms`,
    );

    // Conservative preset under pressure (33% reduction of 60m) → 40.2m = 2 412 000 ms
    const conservativeSettings: BrowserSettings = {
      ...baseSettings,
      suspendAggressiveness: 'conservative',
      suspendTimeoutMinutes: 60,
      suspendTimeoutCustomized: false,
    };
    const conservativePressure = SuspensionRules.resolveIdleTimeoutMs(conservativeSettings, true);
    const expectedConservative = Math.round(60 * 60 * 1000 * (1 - 0.33));
    assert(
      conservativePressure === expectedConservative,
      `resolveIdleTimeoutMs: conservative pressure reduction (33%) on preset → ${expectedConservative} ms`,
    );

    // Aggressive + 30m customized override under pressure (80% reduction of 30m) → 6m = 360 000 ms
    const customWithPressure: BrowserSettings = {
      ...baseSettings,
      suspendAggressiveness: 'aggressive',
      suspendTimeoutMinutes: 30,
      suspendTimeoutCustomized: true,
    };
    const customPressure = SuspensionRules.resolveIdleTimeoutMs(customWithPressure, true);
    const expectedCustom = Math.round(30 * 60 * 1000 * (1 - 0.8));
    assert(
      customPressure === expectedCustom,
      `resolveIdleTimeoutMs: aggressive pressure reduction (80%) on 30m override → ${expectedCustom} ms`,
    );

    assert(
      aggressivePressure < conservativePressure,
      'resolveIdleTimeoutMs: aggressive pressure timeout is shorter than conservative',
    );
  }

  // -------------------------------------------------------------------------
  // 2d. Minimum timeout floor (never below 60s)
  // -------------------------------------------------------------------------
  {
    // 1-minute customized with aggressive pressure reduction (80% → 12s, clamped to 60s)
    const settings: BrowserSettings = {
      ...baseSettings,
      suspendAggressiveness: 'aggressive',
      suspendTimeoutMinutes: 1,
      suspendTimeoutCustomized: true,
    };
    const result = SuspensionRules.resolveIdleTimeoutMs(settings, true);
    assert(result >= MIN_TIMEOUT_MS, `resolveIdleTimeoutMs: minimum floor is 60s (got ${result} ms)`);
    assert(result === MIN_TIMEOUT_MS, 'resolveIdleTimeoutMs: 1m aggressive under pressure clamps to exactly 60s');
  }

  // -------------------------------------------------------------------------
  // 2e. Backward Compatibility (suspendTimeoutCustomized omitted / undefined)
  // -------------------------------------------------------------------------
  {
    // When suspendTimeoutCustomized is omitted, defaults safely to false (aggressiveness preset)
    const legacyAggressive: BrowserSettings = {
      ...baseSettings,
      suspendAggressiveness: 'aggressive',
      suspendTimeoutMinutes: 15, // legacy default value left in json
      suspendTimeoutCustomized: undefined,
    };
    const legacyResult = SuspensionRules.resolveIdleTimeoutMs(legacyAggressive, false);
    assert(
      legacyResult === 5 * 60 * 1000,
      'resolveIdleTimeoutMs: legacy settings without suspendTimeoutCustomized defaults to aggressiveness preset (5m)',
    );

    const legacyConservative: BrowserSettings = {
      ...baseSettings,
      suspendAggressiveness: 'conservative',
      suspendTimeoutMinutes: 15,
      suspendTimeoutCustomized: undefined,
    };
    const legacyConsResult = SuspensionRules.resolveIdleTimeoutMs(legacyConservative, false);
    assert(
      legacyConsResult === 60 * 60 * 1000,
      'resolveIdleTimeoutMs: legacy conservative settings without suspendTimeoutCustomized defaults to 60m',
    );
  }
}

// ---------------------------------------------------------------------------
// TASK 3 — canSuspend() edge cases
// ---------------------------------------------------------------------------

export function runCanSuspendEdgeCaseTests() {
  section('TASK 3 — canSuspend() edge cases');

  // -------------------------------------------------------------------------
  // 3-1. autoSuspend = false
  // -------------------------------------------------------------------------
  {
    const settings = { ...baseSettings, autoSuspend: false };
    const tab = makeTab({ id: 'cs-autosuspend', lastAccessedAt: now - 30 * 60 * 1000 });
    const result = SuspensionRules.canSuspend(tab, 'other-tab', settings);
    assert(!result.eligible, 'canSuspend: autoSuspend=false makes tab ineligible');
    assert(result.reason === 'Automatic suspension is disabled', 'canSuspend: autoSuspend=false reason is correct');
  }

  // -------------------------------------------------------------------------
  // 3-2. Already SUSPENDED tab
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({ id: 'cs-suspended', state: 'SUSPENDED', lastAccessedAt: now - 30 * 60 * 1000 });
    const result = SuspensionRules.canSuspend(tab, 'other-tab', baseSettings);
    assert(!result.eligible, 'canSuspend: already SUSPENDED tab is not eligible');
    assert(result.reason === 'Already suspended or hibernated', 'canSuspend: suspended reason is correct');
  }

  // -------------------------------------------------------------------------
  // 3-3. Already HIBERNATED tab
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({ id: 'cs-hibernated', state: 'HIBERNATED', lastAccessedAt: now - 30 * 60 * 1000 });
    const result = SuspensionRules.canSuspend(tab, 'other-tab', baseSettings);
    assert(!result.eligible, 'canSuspend: already HIBERNATED tab is not eligible');
    assert(result.reason === 'Already suspended or hibernated', 'canSuspend: hibernated reason is correct');
  }

  // -------------------------------------------------------------------------
  // 3-4. Active tab (id matches activeTabId)
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({ id: 'cs-active-id', lastAccessedAt: now - 30 * 60 * 1000 });
    const result = SuspensionRules.canSuspend(tab, 'cs-active-id', baseSettings);
    assert(!result.eligible, 'canSuspend: currently active tab (id match) is not eligible');
    assert(result.reason === 'Currently active tab', 'canSuspend: active tab reason is correct');
  }

  // -------------------------------------------------------------------------
  // 3-5. orca:// URL
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({ id: 'cs-orca', url: 'orca://newtab', lastAccessedAt: now - 30 * 60 * 1000 });
    const result = SuspensionRules.canSuspend(tab, 'other-tab', baseSettings);
    assert(!result.eligible, 'canSuspend: orca:// URL is not eligible');
    assert(result.reason === 'Internal browser page', 'canSuspend: orca:// reason is correct');
  }

  // -------------------------------------------------------------------------
  // 3-6. about: URL
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({ id: 'cs-about', url: 'about:blank', lastAccessedAt: now - 30 * 60 * 1000 });
    const result = SuspensionRules.canSuspend(tab, 'other-tab', baseSettings);
    assert(!result.eligible, 'canSuspend: about: URL is not eligible');
    assert(result.reason === 'Internal browser page', 'canSuspend: about: reason is correct');
  }

  // -------------------------------------------------------------------------
  // 3-7. neverSuspendDomains — exact match
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({
      id: 'cs-never-exact',
      url: 'https://figma.com/design/abc',
      lastAccessedAt: now - 30 * 60 * 1000,
    });
    const result = SuspensionRules.canSuspend(tab, 'other-tab', baseSettings);
    assert(!result.eligible, 'canSuspend: neverSuspendDomain exact match (figma.com) is not eligible');
    assert(
      result.reason?.includes('figma.com') === true,
      'canSuspend: neverSuspendDomain exact reason mentions domain',
    );
  }

  // -------------------------------------------------------------------------
  // 3-8. neverSuspendDomains — subdomain match
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({
      id: 'cs-never-subdomain',
      url: 'https://app.figma.com/design/xyz',   // subdomain of figma.com
      lastAccessedAt: now - 30 * 60 * 1000,
    });
    const result = SuspensionRules.canSuspend(tab, 'other-tab', baseSettings);
    assert(!result.eligible, 'canSuspend: subdomain of neverSuspendDomain (app.figma.com) is not eligible');
  }

  // -------------------------------------------------------------------------
  // 3-9. Unrelated domain IS eligible
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({
      id: 'cs-unrelated',
      url: 'https://github.com/repo',
      lastAccessedAt: now - 30 * 60 * 1000,
    });
    const result = SuspensionRules.canSuspend(tab, 'other-tab', baseSettings);
    assert(result.eligible, 'canSuspend: unrelated domain (github.com) is eligible when past timeout');
  }

  // -------------------------------------------------------------------------
  // 3-10. Exactly at timeout boundary
  //       resolveIdleTimeoutMs(baseSettings, false) = 15min = 900 000 ms
  //       lastAccessedAt = now - 900 000 → idleDurationMs = 900 000
  //       Condition: idleDurationMs < requiredIdleMs → false (equal, NOT less)
  //       → eligible
  // -------------------------------------------------------------------------
  {
    const requiredMs = 15 * 60 * 1000;
    const tab = makeTab({
      id: 'cs-boundary-exact',
      url: 'https://example.com/a',
      lastAccessedAt: now - requiredMs, // exactly at boundary
    });
    const result = SuspensionRules.canSuspend(tab, 'other-tab', baseSettings);
    // idleDurationMs is computed as Date.now() - lastActive, which will be very
    // close to requiredMs but may be 1-2ms larger due to execution time → eligible
    assert(result.eligible, 'canSuspend: tab idle exactly at boundary is eligible (>= threshold)');
  }

  // -------------------------------------------------------------------------
  // 3-11. Just below timeout boundary (1 second short)
  // -------------------------------------------------------------------------
  {
    const requiredMs = 15 * 60 * 1000;
    const tab = makeTab({
      id: 'cs-boundary-below',
      url: 'https://example.com/b',
      lastAccessedAt: now - requiredMs + 60_000, // 1 minute short of threshold
    });
    const result = SuspensionRules.canSuspend(tab, 'other-tab', baseSettings);
    assert(!result.eligible, 'canSuspend: tab idle 1 min below threshold is not eligible');
    assert(typeof result.reason === 'string' && result.reason.includes('Idle for'), 'canSuspend: below-threshold reason contains "Idle for"');
  }

  // -------------------------------------------------------------------------
  // 3-12. Just above timeout boundary
  // -------------------------------------------------------------------------
  {
    const requiredMs = 15 * 60 * 1000;
    const tab = makeTab({
      id: 'cs-boundary-above',
      url: 'https://example.com/c',
      lastAccessedAt: now - requiredMs - 60_000, // 1 minute past threshold
    });
    const result = SuspensionRules.canSuspend(tab, 'other-tab', baseSettings);
    assert(result.eligible, 'canSuspend: tab idle 1 min past threshold is eligible');
  }

  // -------------------------------------------------------------------------
  // 3-13. lastInteractionAt newer than lastAccessedAt
  //       canSuspend uses Math.max(lastAccessedAt, lastInteractionAt ?? 0)
  //       so a recent interaction extends the idle clock.
  // -------------------------------------------------------------------------
  {
    const interactionRecent = now - 5 * 60 * 1000; // 5 min ago (within 15m threshold)
    const tab = makeTab({
      id: 'cs-interaction',
      url: 'https://example.com/d',
      lastAccessedAt: now - 30 * 60 * 1000,    // 30 min ago (would be eligible without interaction)
      lastInteractionAt: interactionRecent,      // 5 min ago — makes it NOT eligible
    });
    const result = SuspensionRules.canSuspend(tab, 'other-tab', baseSettings);
    assert(!result.eligible, 'canSuspend: recent lastInteractionAt overrides old lastAccessedAt → not eligible');
    assert(typeof result.reason === 'string' && result.reason.includes('Idle for'), 'canSuspend: interaction-recent reason contains "Idle for"');
  }

  // -------------------------------------------------------------------------
  // 3-14. Memory pressure reduces effective timeout
  //       balanced: 15m normal, 7.5m under pressure
  //       Use a tab idle for 10m: not eligible normally, eligible under pressure
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({
      id: 'cs-pressure',
      url: 'https://example.com/e',
      lastAccessedAt: now - 10 * 60 * 1000, // 10 min idle
    });
    const normalResult = SuspensionRules.canSuspend(tab, 'other-tab', baseSettings, false);
    const pressureResult = SuspensionRules.canSuspend(tab, 'other-tab', baseSettings, true);

    assert(!normalResult.eligible, 'canSuspend: 10m idle is not eligible under normal conditions (threshold 15m)');
    assert(pressureResult.eligible, 'canSuspend: 10m idle IS eligible under memory pressure (threshold ~7.5m)');
  }
}

// ---------------------------------------------------------------------------
// TASK 4 — getSuspensionCandidates() tests
// ---------------------------------------------------------------------------

export function runGetSuspensionCandidatesTests() {
  section('TASK 4 — getSuspensionCandidates()');

  const ws = baseWorkspaces;

  // -------------------------------------------------------------------------
  // 4-1. SUSPENDED tabs are skipped
  // -------------------------------------------------------------------------
  {
    const tabs: Tab[] = [
      makeTab({ id: 'cand-susp', state: 'SUSPENDED', url: 'https://example.com/s' }),
    ];
    const candidates = SuspensionRules.getSuspensionCandidates(tabs, null, baseSettings, ws);
    assert(candidates.length === 0, 'getSuspensionCandidates: SUSPENDED tabs produce no candidates');
  }

  // -------------------------------------------------------------------------
  // 4-2. HIBERNATED tabs are skipped
  // -------------------------------------------------------------------------
  {
    const tabs: Tab[] = [
      makeTab({ id: 'cand-hib', state: 'HIBERNATED', url: 'https://example.com/h' }),
    ];
    const candidates = SuspensionRules.getSuspensionCandidates(tabs, null, baseSettings, ws);
    assert(candidates.length === 0, 'getSuspensionCandidates: HIBERNATED tabs produce no candidates');
  }

  // -------------------------------------------------------------------------
  // 4-3. orca:// tabs are skipped
  // -------------------------------------------------------------------------
  {
    const tabs: Tab[] = [
      makeTab({ id: 'cand-orca', url: 'orca://newtab', state: 'IDLE', lastAccessedAt: now - 30 * 60 * 1000 }),
    ];
    const candidates = SuspensionRules.getSuspensionCandidates(tabs, null, baseSettings, ws);
    assert(candidates.length === 0, 'getSuspensionCandidates: orca:// tabs produce no candidates');
  }

  // -------------------------------------------------------------------------
  // 4-4. Eligible tab appears in candidates
  // -------------------------------------------------------------------------
  {
    const tabs: Tab[] = [
      makeTab({ id: 'cand-elig', state: 'IDLE', url: 'https://github.com/x', lastAccessedAt: now - 30 * 60 * 1000 }),
    ];
    const candidates = SuspensionRules.getSuspensionCandidates(tabs, 'other', baseSettings, ws);
    assert(candidates.length === 1, 'getSuspensionCandidates: eligible tab produces one candidate');
    assert(!candidates[0].protected, 'getSuspensionCandidates: eligible candidate is not protected');
  }

  // -------------------------------------------------------------------------
  // 4-5 & 4-6. Protected tabs appear in candidate list and carry protection info
  // -------------------------------------------------------------------------
  {
    const pinnedTab = makeTab({ id: 'cand-pinned', state: 'IDLE', pinned: true, lastAccessedAt: now - 30 * 60 * 1000 });
    const candidates = SuspensionRules.getSuspensionCandidates([pinnedTab], 'other', baseSettings, ws);
    assert(candidates.length === 1, 'getSuspensionCandidates: protected (pinned) tab still appears as candidate');
    assert(candidates[0].protected === true, 'getSuspensionCandidates: protected candidate has protected=true');
    assert(
      typeof candidates[0].protectionReason === 'string' && candidates[0].protectionReason.length > 0,
      'getSuspensionCandidates: protected candidate has a non-empty protectionReason',
    );
  }

  // -------------------------------------------------------------------------
  // 4-7. Eligible candidates have a non-negative priority
  // -------------------------------------------------------------------------
  {
    const tab = makeTab({ id: 'cand-prio', state: 'IDLE', url: 'https://github.com/y', lastAccessedAt: now - 30 * 60 * 1000 });
    const candidates = SuspensionRules.getSuspensionCandidates([tab], 'other', baseSettings, ws);
    assert(candidates.length === 1 && candidates[0].priority >= 0, 'getSuspensionCandidates: eligible candidate has priority >= 0');
  }

  // -------------------------------------------------------------------------
  // 4-8. More inactive tab receives higher priority than less inactive one
  // -------------------------------------------------------------------------
  {
    const olderTab = makeTab({ id: 'cand-old', state: 'IDLE', url: 'https://example.com/old', lastAccessedAt: now - 60 * 60 * 1000 }); // 60 min
    const newerTab = makeTab({ id: 'cand-new', state: 'IDLE', url: 'https://example.com/new', lastAccessedAt: now - 20 * 60 * 1000 }); // 20 min
    const candidates = SuspensionRules.getSuspensionCandidates([olderTab, newerTab], 'other', baseSettings, ws);

    assert(candidates.length === 2, 'getSuspensionCandidates: both eligible tabs appear');
    // Both are eligible; older should have higher priority
    const olderCand = candidates.find(c => c.tabId === 'cand-old')!;
    const newerCand = candidates.find(c => c.tabId === 'cand-new')!;
    assert(
      olderCand.priority > newerCand.priority,
      'getSuspensionCandidates: 60m-idle tab has higher priority than 20m-idle tab',
    );
  }

  // -------------------------------------------------------------------------
  // 4-9. Candidates are sorted: eligible first (desc priority), protected last
  // -------------------------------------------------------------------------
  {
    const eligibleTab = makeTab({ id: 'cand-sort-elig', state: 'IDLE', url: 'https://github.com/z', lastAccessedAt: now - 30 * 60 * 1000 });
    const protectedTab = makeTab({ id: 'cand-sort-prot', state: 'IDLE', pinned: true, url: 'https://github.com/pinned', lastAccessedAt: now - 30 * 60 * 1000 });
    // Pass protected tab first to prove ordering is not input-order dependent
    const candidates = SuspensionRules.getSuspensionCandidates(
      [protectedTab, eligibleTab],
      'other',
      baseSettings,
      ws,
    );

    assert(candidates.length === 2, 'getSuspensionCandidates: both tabs in result');
    // Eligible candidate should come first (priority >= 0 > -1)
    assert(!candidates[0].protected, 'getSuspensionCandidates: first candidate is the eligible (non-protected) one');
    assert(candidates[1].protected, 'getSuspensionCandidates: second candidate is the protected one');
    assert(candidates[1].priority === -1, 'getSuspensionCandidates: protected candidate priority is -1');
  }

  // -------------------------------------------------------------------------
  // 4-10. about: URLs are skipped at the candidate level (matching orca://)
  // -------------------------------------------------------------------------
  {
    const aboutTab = makeTab({
      id: 'cand-about',
      state: 'IDLE',
      url: 'about:blank',
      lastAccessedAt: now - 30 * 60 * 1000,
    });
    const candidates = SuspensionRules.getSuspensionCandidates([aboutTab], 'other', baseSettings, ws);
    assert(candidates.length === 0, 'getSuspensionCandidates: about: URLs produce no candidates (skipped consistently with orca://)');
  }
}

// ---------------------------------------------------------------------------
// TASK 5 — MemoryManager Integration Tests
// ---------------------------------------------------------------------------

interface MockDelegateOptions {
  tabs?: Tab[];
  activeTabId?: string | null;
  settings?: BrowserSettings;
  workspaces?: Workspace[];
  tabPidMap?: Map<string, number>;
}

function createMockHarness(options: MockDelegateOptions = {}) {
  let tabs = options.tabs ? [...options.tabs] : [];
  let activeTabId = options.activeTabId !== undefined ? options.activeTabId : null;
  let settings = options.settings ? { ...options.settings } : { ...baseSettings };
  let workspaces = options.workspaces ? [...options.workspaces] : [...baseWorkspaces];
  let tabPidMap = options.tabPidMap ? new Map(options.tabPidMap) : new Map<string, number>();

  const suspendedTabIds: string[] = [];
  const hibernatedTabIds: string[] = [];
  const restoredTabIds: string[] = [];
  const memoryUpdatedReports: MemoryStats[] = [];
  const tabStateChanges: { tabId: string; state: string }[] = [];

  const delegate: MemoryManagerDelegate = {
    getTabs: () => tabs,
    getActiveTabId: () => activeTabId,
    getSettings: () => settings,
    getWorkspaces: () => workspaces,
    getTabPidMap: () => tabPidMap,
    suspendTab: async (tabId: string) => {
      suspendedTabIds.push(tabId);
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) tab.state = 'SUSPENDED';
    },
    hibernateTab: async (tabId: string) => {
      hibernatedTabIds.push(tabId);
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) tab.state = 'HIBERNATED';
    },
    restoreTab: async (tabId: string) => {
      restoredTabIds.push(tabId);
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) tab.state = 'ACTIVE';
    },
    notifyMemoryUpdated: (stats: MemoryStats) => {
      memoryUpdatedReports.push(stats);
    },
    notifyTabStateChanged: (tabId: string, state: string) => {
      tabStateChanges.push({ tabId, state });
    },
  };

  const manager = new MemoryManager(delegate);

  return {
    manager,
    delegate,
    getTabs: () => tabs,
    setTabs: (newTabs: Tab[]) => { tabs = newTabs; },
    setActiveTabId: (id: string | null) => { activeTabId = id; },
    setSettings: (s: BrowserSettings) => { settings = s; },
    suspendedTabIds,
    hibernatedTabIds,
    restoredTabIds,
    memoryUpdatedReports,
    tabStateChanges,
  };
}

export async function runMemoryManagerTests() {
  section('TASK 5 — MemoryManager Orchestration Tests');

  // -------------------------------------------------------------------------
  // 5-1. runLifecycleSweep() — Active tab is never suspended
  // -------------------------------------------------------------------------
  {
    const activeTab = makeTab({ id: 'active-sweep', state: 'ACTIVE', lastAccessedAt: now - 30 * 60 * 1000 });
    const harness = createMockHarness({ tabs: [activeTab], activeTabId: 'active-sweep' });
    await harness.manager.runLifecycleSweep();
    assert(!harness.suspendedTabIds.includes('active-sweep'), 'runLifecycleSweep: active tab is not suspended');
  }

  // -------------------------------------------------------------------------
  // 5-2. runLifecycleSweep() — Inactive eligible tab is suspended
  // -------------------------------------------------------------------------
  {
    const eligibleTab = makeTab({ id: 'elig-sweep', state: 'IDLE', lastAccessedAt: now - 20 * 60 * 1000 });
    const harness = createMockHarness({ tabs: [eligibleTab], activeTabId: 'other-tab' });
    await harness.manager.runLifecycleSweep();
    assert(harness.suspendedTabIds.includes('elig-sweep'), 'runLifecycleSweep: inactive eligible tab is suspended');
  }

  // -------------------------------------------------------------------------
  // 5-3. runLifecycleSweep() — Protected tabs are not suspended
  // -------------------------------------------------------------------------
  {
    const pinnedTab = makeTab({ id: 'prot-pinned', state: 'IDLE', pinned: true, lastAccessedAt: now - 30 * 60 * 1000 });
    const audioTab = makeTab({ id: 'prot-audio', state: 'IDLE', audioActive: true, lastAccessedAt: now - 30 * 60 * 1000 });
    const keepAwakeTab = makeTab({ id: 'prot-awake', state: 'IDLE', keepAwake: true, lastAccessedAt: now - 30 * 60 * 1000 });
    const domainTab = makeTab({ id: 'prot-domain', state: 'IDLE', url: 'https://docs.google.com/document/1', lastAccessedAt: now - 30 * 60 * 1000 });
    const harness = createMockHarness({
      tabs: [pinnedTab, audioTab, keepAwakeTab, domainTab],
      activeTabId: 'other-tab',
    });
    await harness.manager.runLifecycleSweep();
    assert(!harness.suspendedTabIds.includes('prot-pinned'), 'runLifecycleSweep: pinned tab is not suspended');
    assert(!harness.suspendedTabIds.includes('prot-audio'), 'runLifecycleSweep: audio tab is not suspended');
    assert(!harness.suspendedTabIds.includes('prot-awake'), 'runLifecycleSweep: keepAwake tab is not suspended');
    assert(!harness.suspendedTabIds.includes('prot-domain'), 'runLifecycleSweep: neverSuspendDomains tab is not suspended');
  }

  // -------------------------------------------------------------------------
  // 5-4. runLifecycleSweep() — Already suspended tab is not suspended again
  // -------------------------------------------------------------------------
  {
    const suspendedTab = makeTab({ id: 'already-susp', state: 'SUSPENDED', lastAccessedAt: now - 30 * 60 * 1000 });
    const harness = createMockHarness({ tabs: [suspendedTab], activeTabId: 'other-tab' });
    await harness.manager.runLifecycleSweep();
    assert(harness.suspendedTabIds.length === 0, 'runLifecycleSweep: already suspended tab is not suspended again');
  }

  // -------------------------------------------------------------------------
  // 5-5. runLifecycleSweep() — Auto-hibernates eligible suspended tab
  // -------------------------------------------------------------------------
  {
    const hibEligibleTab = makeTab({
      id: 'hib-elig',
      state: 'SUSPENDED',
      url: 'https://example.com/repo',
      lastAccessedAt: now - 5 * 86_400_000, // 5 days old (threshold 3 days)
    });
    const harness = createMockHarness({ tabs: [hibEligibleTab], activeTabId: 'other-tab' });
    await harness.manager.runLifecycleSweep();
    assert(harness.hibernatedTabIds.includes('hib-elig'), 'runLifecycleSweep: suspended tab older than threshold is hibernated');
  }

  // -------------------------------------------------------------------------
  // 5-6. runLifecycleSweep() — Non-eligible suspended tab is not hibernated
  // -------------------------------------------------------------------------
  {
    const youngSuspTab = makeTab({ id: 'hib-young', state: 'SUSPENDED', lastAccessedAt: now - 1 * 86_400_000 }); // 1 day
    const pinnedSuspTab = makeTab({ id: 'hib-pinned', state: 'SUSPENDED', pinned: true, lastAccessedAt: now - 5 * 86_400_000 });
    const harness = createMockHarness({ tabs: [youngSuspTab, pinnedSuspTab], activeTabId: 'other-tab' });
    await harness.manager.runLifecycleSweep();
    assert(!harness.hibernatedTabIds.includes('hib-young'), 'runLifecycleSweep: suspended tab under hibernate timeout is not hibernated');
    assert(!harness.hibernatedTabIds.includes('hib-pinned'), 'runLifecycleSweep: pinned suspended tab is not hibernated');
  }

  // -------------------------------------------------------------------------
  // 5-7. runLifecycleSweep() — Memory pressure accelerates suspension
  // -------------------------------------------------------------------------
  {
    // 8-minute inactive tab with 15-minute default timeout
    const eightMinTab = makeTab({ id: 'eight-min-tab', state: 'IDLE', lastAccessedAt: now - 8 * 60 * 1000 });
    
    // Low pressure threshold (0%) guarantees system memory pressure is detected
    const pressureHarness = createMockHarness({
      tabs: [eightMinTab],
      activeTabId: 'other-tab',
      settings: { ...baseSettings, memoryPressureThresholdPercent: 0 },
    });
    await pressureHarness.manager.runLifecycleSweep();
    assert(pressureHarness.suspendedTabIds.includes('eight-min-tab'), 'runLifecycleSweep: 8m tab is suspended under memory pressure acceleration');

    // High pressure threshold (100%) guarantees no pressure
    const noPressureTab = makeTab({ id: 'eight-min-tab-2', state: 'IDLE', lastAccessedAt: now - 8 * 60 * 1000 });
    const noPressureHarness = createMockHarness({
      tabs: [noPressureTab],
      activeTabId: 'other-tab',
      settings: { ...baseSettings, memoryPressureThresholdPercent: 100 },
    });
    await noPressureHarness.manager.runLifecycleSweep();
    assert(!noPressureHarness.suspendedTabIds.includes('eight-min-tab-2'), 'runLifecycleSweep: 8m tab is NOT suspended without memory pressure');
  }

  // -------------------------------------------------------------------------
  // 5-8. runLifecycleSweep() — Idle state promotion (ACTIVE -> IDLE after 2m)
  // -------------------------------------------------------------------------
  {
    const activeOldTab = makeTab({ id: 'promo-tab', state: 'ACTIVE', lastAccessedAt: now - 3 * 60 * 1000 });
    const harness = createMockHarness({ tabs: [activeOldTab], activeTabId: 'focused-tab' });
    await harness.manager.runLifecycleSweep();
    assert(
      harness.tabStateChanges.some((c) => c.tabId === 'promo-tab' && c.state === 'IDLE'),
      'runLifecycleSweep: ACTIVE non-focused tab inactive for >2m is promoted to IDLE',
    );
  }

  // -------------------------------------------------------------------------
  // 5-9. runLifecycleSweep() — Lifetime stats and notification update
  // -------------------------------------------------------------------------
  {
    const eligibleTab = makeTab({ id: 'stats-tab', state: 'IDLE', lastAccessedAt: now - 20 * 60 * 1000 });
    const harness = createMockHarness({ tabs: [eligibleTab], activeTabId: 'other' });
    await harness.manager.runLifecycleSweep();
    assert(harness.memoryUpdatedReports.length > 0, 'runLifecycleSweep: notifyMemoryUpdated is called with fresh stats');
    const lastReport = harness.memoryUpdatedReports[harness.memoryUpdatedReports.length - 1];
    assert(lastReport.lifetimeSuspendedCount >= 1, 'runLifecycleSweep: lifetimeSuspendedCount increments on suspension');
  }

  // -------------------------------------------------------------------------
  // 5-10. optimizeNow() & suspendAllEligible()
  // -------------------------------------------------------------------------
  {
    const activeTab = makeTab({ id: 'opt-active', state: 'ACTIVE', lastAccessedAt: now });
    const suspTab = makeTab({ id: 'opt-susp', state: 'SUSPENDED', lastAccessedAt: now - 60_000 });
    const hibTab = makeTab({ id: 'opt-hib', state: 'HIBERNATED', lastAccessedAt: now - 60_000 });
    const orcaTab = makeTab({ id: 'opt-orca', state: 'IDLE', url: 'orca://newtab', lastAccessedAt: now - 60_000 });
    const aboutTab = makeTab({ id: 'opt-about', state: 'IDLE', url: 'about:blank', lastAccessedAt: now - 60_000 });
    const awakeTab = makeTab({ id: 'opt-awake', state: 'IDLE', keepAwake: true, lastAccessedAt: now - 60_000 });
    const pinnedTab = makeTab({ id: 'opt-pinned', state: 'IDLE', pinned: true, lastAccessedAt: now - 60_000 });
    const audioTab = makeTab({ id: 'opt-audio', state: 'IDLE', audioActive: true, lastAccessedAt: now - 60_000 });
    const docExactTab = makeTab({ id: 'opt-doc', state: 'IDLE', url: 'https://google.com/page', lastAccessedAt: now - 60_000 });
    const docSubTab = makeTab({ id: 'opt-doc-sub', state: 'IDLE', url: 'https://drive.google.com/page', lastAccessedAt: now - 60_000 });
    const evilTab = makeTab({ id: 'opt-evil', state: 'IDLE', url: 'https://evilgoogle.com/page', lastAccessedAt: now - 60_000 });
    const attackerTab = makeTab({ id: 'opt-attacker', state: 'IDLE', url: 'https://google.com.attacker.org/page', lastAccessedAt: now - 60_000 });
    const elig1 = makeTab({ id: 'opt-elig1', state: 'IDLE', url: 'https://example.com/1', lastAccessedAt: now - 10_000 }); // only 10s idle
    const elig2 = makeTab({ id: 'opt-elig2', state: 'ACTIVE', url: 'https://example.com/2', lastAccessedAt: now - 10_000 });

    const harness = createMockHarness({
      tabs: [
        activeTab, suspTab, hibTab, orcaTab, aboutTab, awakeTab, pinnedTab, audioTab,
        docExactTab, docSubTab, evilTab, attackerTab, elig1, elig2,
      ],
      activeTabId: 'opt-active',
      settings: {
        ...baseSettings,
        neverSuspendDomains: ['google.com', 'figma.com'],
      },
    });

    const result = await harness.manager.optimizeNow();
    assert(result.suspendedCount === 4, `optimizeNow: returns suspendedCount = 4 (got ${result.suspendedCount})`);
    assert(result.freedMB > 0, 'optimizeNow: returns freedMB > 0');
    assert(harness.suspendedTabIds.includes('opt-elig1'), 'optimizeNow: suspends eligible idle tab immediately without waiting for timeout');
    assert(harness.suspendedTabIds.includes('opt-elig2'), 'optimizeNow: suspends non-focused active tab immediately');
    assert(harness.suspendedTabIds.includes('opt-evil'), 'optimizeNow: suspends evilgoogle.com (false-positive prevention)');
    assert(harness.suspendedTabIds.includes('opt-attacker'), 'optimizeNow: suspends google.com.attacker.org (false-positive prevention)');
    assert(!harness.suspendedTabIds.includes('opt-active'), 'optimizeNow: does not suspend activeTabId');
    assert(!harness.suspendedTabIds.includes('opt-susp'), 'optimizeNow: skips already SUSPENDED tab');
    assert(!harness.suspendedTabIds.includes('opt-hib'), 'optimizeNow: skips already HIBERNATED tab');
    assert(!harness.suspendedTabIds.includes('opt-orca'), 'optimizeNow: skips orca:// tab');
    assert(!harness.suspendedTabIds.includes('opt-about'), 'optimizeNow: skips about: tab');
    assert(!harness.suspendedTabIds.includes('opt-awake'), 'optimizeNow: skips keepAwake tab');
    assert(!harness.suspendedTabIds.includes('opt-pinned'), 'optimizeNow: skips pinned tab');
    assert(!harness.suspendedTabIds.includes('opt-audio'), 'optimizeNow: skips audio tab');
    assert(!harness.suspendedTabIds.includes('opt-doc'), 'optimizeNow: protects exact neverSuspendDomains (google.com)');
    assert(!harness.suspendedTabIds.includes('opt-doc-sub'), 'optimizeNow: protects subdomain of neverSuspendDomains (drive.google.com)');

    // suspendAllEligible() delegates directly to optimizeNow()
    const harness2 = createMockHarness({
      tabs: [makeTab({ id: 'sae-elig', state: 'IDLE', lastAccessedAt: now - 5000 })],
      activeTabId: 'sae-active',
    });
    const saeResult = await harness2.manager.suspendAllEligible();
    assert(saeResult.suspendedCount === 1 && harness2.suspendedTabIds.includes('sae-elig'), 'suspendAllEligible: delegates directly to optimizeNow');
  }

  // -------------------------------------------------------------------------
  // 5-11. restoreAll()
  // -------------------------------------------------------------------------
  {
    const activeTab = makeTab({ id: 'ra-active', state: 'ACTIVE' });
    const idleTab = makeTab({ id: 'ra-idle', state: 'IDLE' });
    const suspTab = makeTab({ id: 'ra-susp', state: 'SUSPENDED' });
    const hibTab = makeTab({ id: 'ra-hib', state: 'HIBERNATED' });

    const harness = createMockHarness({
      tabs: [activeTab, idleTab, suspTab, hibTab],
      activeTabId: 'ra-active',
    });

    await harness.manager.restoreAll();
    assert(harness.restoredTabIds.includes('ra-susp'), 'restoreAll: restores SUSPENDED tab');
    assert(harness.restoredTabIds.includes('ra-hib'), 'restoreAll: restores HIBERNATED tab');
    assert(!harness.restoredTabIds.includes('ra-active'), 'restoreAll: does not restore ACTIVE tab');
    assert(!harness.restoredTabIds.includes('ra-idle'), 'restoreAll: does not restore IDLE tab');
    assert(harness.memoryUpdatedReports.length > 0, 'restoreAll: notifies memory stats updated');
  }

  // -------------------------------------------------------------------------
  // 5-12. suspendWorkspace() & restoreWorkspace()
  // -------------------------------------------------------------------------
  {
    const ws1TabActive = makeTab({ id: 'sw-active', workspaceId: 'ws-1', state: 'ACTIVE' });
    const ws1TabSusp = makeTab({ id: 'sw-susp', workspaceId: 'ws-1', state: 'SUSPENDED' });
    const ws1TabHib = makeTab({ id: 'sw-hib', workspaceId: 'ws-1', state: 'HIBERNATED' });
    const ws1TabOrca = makeTab({ id: 'sw-orca', workspaceId: 'ws-1', url: 'orca://newtab' });
    const ws1TabAbout = makeTab({ id: 'sw-about', workspaceId: 'ws-1', url: 'about:blank' });
    const ws1TabAwake = makeTab({ id: 'sw-awake', workspaceId: 'ws-1', keepAwake: true });
    const ws1TabPinned = makeTab({ id: 'sw-pinned', workspaceId: 'ws-1', pinned: true });
    const ws1TabAudio = makeTab({ id: 'sw-audio', workspaceId: 'ws-1', audioActive: true });
    const ws1TabElig = makeTab({ id: 'sw-elig', workspaceId: 'ws-1', state: 'IDLE', url: 'https://example.com/ws1' });
    const ws1TabDoc = makeTab({ id: 'sw-doc', workspaceId: 'ws-1', state: 'IDLE', url: 'https://docs.google.com/ws1' });
    const ws1TabDocSub = makeTab({ id: 'sw-doc-sub', workspaceId: 'ws-1', state: 'IDLE', url: 'https://drive.docs.google.com/ws1' });

    const ws2TabElig = makeTab({ id: 'sw-ws2-elig', workspaceId: 'ws-2', state: 'IDLE', url: 'https://example.com/ws2' });

    const harness = createMockHarness({
      tabs: [
        ws1TabActive, ws1TabSusp, ws1TabHib, ws1TabOrca, ws1TabAbout,
        ws1TabAwake, ws1TabPinned, ws1TabAudio, ws1TabElig, ws1TabDoc, ws1TabDocSub,
        ws2TabElig,
      ],
      activeTabId: 'sw-active',
      workspaces: [
        { id: 'ws-1', name: 'Personal', color: '#000', icon: '🌊', createdAt: now },
        { id: 'ws-2', name: 'Work', color: '#fff', icon: '💼', createdAt: now },
      ],
    });

    await harness.manager.suspendWorkspace('ws-1');
    assert(harness.suspendedTabIds.includes('sw-elig'), 'suspendWorkspace: suspends eligible tab in target workspace');
    assert(harness.suspendedTabIds.length === 1, 'suspendWorkspace: only the single eligible tab is suspended');
    assert(!harness.suspendedTabIds.includes('sw-ws2-elig'), 'suspendWorkspace: leaves tabs in other workspaces untouched');
    assert(!harness.suspendedTabIds.includes('sw-active'), 'suspendWorkspace: skips activeTabId');
    assert(!harness.suspendedTabIds.includes('sw-susp'), 'suspendWorkspace: skips already suspended tab');
    assert(!harness.suspendedTabIds.includes('sw-hib'), 'suspendWorkspace: skips already hibernated tab');
    assert(!harness.suspendedTabIds.includes('sw-orca'), 'suspendWorkspace: skips orca:// tab');
    assert(!harness.suspendedTabIds.includes('sw-about'), 'suspendWorkspace: skips about: tab');
    assert(!harness.suspendedTabIds.includes('sw-awake'), 'suspendWorkspace: skips keepAwake tab');
    assert(!harness.suspendedTabIds.includes('sw-pinned'), 'suspendWorkspace: skips pinned tab');
    assert(!harness.suspendedTabIds.includes('sw-audio'), 'suspendWorkspace: skips audio tab');
    assert(!harness.suspendedTabIds.includes('sw-doc'), 'suspendWorkspace: respects neverSuspendDomains (exact domain protected)');
    assert(!harness.suspendedTabIds.includes('sw-doc-sub'), 'suspendWorkspace: respects neverSuspendDomains (subdomain protected)');

    // restoreWorkspace('ws-1')
    const ws1RestSusp = makeTab({ id: 'rw-ws1-susp', workspaceId: 'ws-1', state: 'SUSPENDED' });
    const ws1RestHib = makeTab({ id: 'rw-ws1-hib', workspaceId: 'ws-1', state: 'HIBERNATED' });
    const ws1RestActive = makeTab({ id: 'rw-ws1-active', workspaceId: 'ws-1', state: 'ACTIVE' });
    const ws2RestSusp = makeTab({ id: 'rw-ws2-susp', workspaceId: 'ws-2', state: 'SUSPENDED' });

    const restHarness = createMockHarness({
      tabs: [ws1RestSusp, ws1RestHib, ws1RestActive, ws2RestSusp],
      activeTabId: 'rw-ws1-active',
      workspaces: [
        { id: 'ws-1', name: 'Personal', color: '#000', icon: '🌊', createdAt: now },
        { id: 'ws-2', name: 'Work', color: '#fff', icon: '💼', createdAt: now },
      ],
    });

    await restHarness.manager.restoreWorkspace('ws-1');
    assert(restHarness.restoredTabIds.includes('rw-ws1-susp'), 'restoreWorkspace: restores suspended tab in target workspace');
    assert(restHarness.restoredTabIds.includes('rw-ws1-hib'), 'restoreWorkspace: restores hibernated tab in target workspace');
    assert(!restHarness.restoredTabIds.includes('rw-ws1-active'), 'restoreWorkspace: does not restore active tab');
    assert(!restHarness.restoredTabIds.includes('rw-ws2-susp'), 'restoreWorkspace: leaves suspended tabs in other workspaces untouched');
  }

  // -------------------------------------------------------------------------
  // 5-13. Full Lifecycle State Transition Orchestration
  // -------------------------------------------------------------------------
  {
    const lifecycleTab = makeTab({ id: 'life-tab', state: 'ACTIVE', lastAccessedAt: now - 3 * 60 * 1000 });
    const harness = createMockHarness({ tabs: [lifecycleTab], activeTabId: 'focused-tab' });

    // Step 1: Active tab inactive > 2m is promoted to IDLE
    await harness.manager.runLifecycleSweep();
    assert(
      harness.tabStateChanges.some((c) => c.tabId === 'life-tab' && c.state === 'IDLE'),
      'lifecycle: Step 1 ACTIVE → IDLE promotion succeeded',
    );

    // Step 2: Tab becomes inactive for 20m (past 15m threshold) -> auto-suspended
    lifecycleTab.lastAccessedAt = now - 20 * 60 * 1000;
    await harness.manager.runLifecycleSweep();
    assert(harness.suspendedTabIds.includes('life-tab'), 'lifecycle: Step 2 IDLE → SUSPENDED transition requested');

    // Step 3: Tab becomes inactive for 5 days -> auto-hibernated
    lifecycleTab.lastAccessedAt = now - 5 * 86_400_000;
    await harness.manager.runLifecycleSweep();
    assert(harness.hibernatedTabIds.includes('life-tab'), 'lifecycle: Step 3 SUSPENDED → HIBERNATED transition requested');

    // Step 4: Restore request restores tab back to ACTIVE
    await harness.manager.restoreAll();
  }
}

// ---------------------------------------------------------------------------
// TASK 6 — Phase 3A Tab Management UX Tests
function createTestTabManager() {
  const updatedTabs: Tab[][] = [];
  const activeTabHistory: Array<string | null> = [];

  const tabManager = new TabManager({
    onTabsUpdated: (tabs) => updatedTabs.push([...tabs]),
    onActiveTabChanged: (tabId) => activeTabHistory.push(tabId),
    onTabNavigated: () => {},
    onTabLoading: () => {},
    onTabTitleUpdated: () => {},
    onTabFaviconUpdated: () => {},
    onTabStateChanged: () => {},
    onHistoryItemAdded: () => {},
  });

  return { tabManager, updatedTabs, activeTabHistory };
}

export async function runTabManagementTests() {
  section('TASK 6 — Tab Management UX (Phase 3A)');

  // 1. New Tab creation
  {
    const { tabManager } = createTestTabManager();

    const tab1 = await tabManager.createTab({ url: 'https://example.com', active: true });
    assert(tab1.url === 'https://example.com', 'createTab: creates tab with specified URL');
    assert(tab1.state === 'ACTIVE', 'createTab: active tab has ACTIVE state');
    assert(tabManager.getActiveTabId() === tab1.id, 'createTab: sets activeTabId when active=true');

    const tab2 = await tabManager.createTab({ url: 'https://github.com', active: false });
    assert(tabManager.getActiveTabId() === tab1.id, 'createTab: active=false preserves existing active tab');
    assert(tab2.state === 'IDLE' || tab2.state === 'ACTIVE', 'createTab: inactive tab has valid state');
  }

  // 2. Tab Switching
  {
    const { tabManager } = createTestTabManager();
    const t1 = await tabManager.createTab({ url: 'https://site1.com', active: true });
    const t2 = await tabManager.createTab({ url: 'https://site2.com', active: false });

    await tabManager.selectTab(t2.id);
    assert(tabManager.getActiveTabId() === t2.id, 'selectTab: switches activeTabId to target tab');
    assert(tabManager.getTab(t2.id)?.state === 'ACTIVE', 'selectTab: target tab state is ACTIVE');
    assert(tabManager.getTab(t1.id) !== undefined, 'selectTab: previous tab remains in tabs collection');
  }

  // 3. Duplicate Tab
  {
    const { tabManager } = createTestTabManager();
    const t1 = await tabManager.createTab({ url: 'https://news.ycombinator.com', workspaceId: 'ws-work', active: true });
    const duplicated = await tabManager.duplicateTab(t1.id);
    assert(duplicated.id !== t1.id, 'duplicateTab: creates a new distinct tab ID');
    assert(duplicated.url === 'https://news.ycombinator.com', 'duplicateTab: preserves source URL');
    assert(duplicated.workspaceId === 'ws-work', 'duplicateTab: preserves source workspaceId');
    assert(tabManager.getActiveTabId() === duplicated.id, 'duplicateTab: duplicated tab becomes active');
  }

  // 4. Close Tab and neighbor focus
  {
    const { tabManager } = createTestTabManager();
    const t1 = await tabManager.createTab({ url: 'https://tab1.com', active: false });
    const t2 = await tabManager.createTab({ url: 'https://tab2.com', active: false });
    const t3 = await tabManager.createTab({ url: 'https://tab3.com', active: true });

    await tabManager.closeTab(t2.id);
    assert(tabManager.getTab(t2.id) === undefined, 'closeTab: removes closed tab from tabs map');
    assert(tabManager.getActiveTabId() === t3.id, 'closeTab: closing inactive tab does not alter activeTabId');

    // Close active tab t3 -> switches to remaining neighbor (t1)
    await tabManager.closeTab(t3.id);
    assert(tabManager.getActiveTabId() === t1.id, 'closeTab: closing active tab switches to adjacent neighbor');
  }

  // 5. Reopen Closed Tab (Ctrl+Shift+T feature)
  {
    const { tabManager } = createTestTabManager();
    const t1 = await tabManager.createTab({ url: 'https://wikipedia.org', workspaceId: 'ws-research', active: true });
    await tabManager.createTab({ url: 'https://docs.rs', workspaceId: 'ws-research', active: true });

    await tabManager.closeTab(t1.id);
    const reopened = await tabManager.reopenClosedTab();
    assert(reopened !== null, 'reopenClosedTab: returns reopened tab object');
    assert(reopened?.url === 'https://wikipedia.org', 'reopenClosedTab: restores exact URL of closed tab');
    assert(reopened?.workspaceId === 'ws-research', 'reopenClosedTab: restores tab in its original workspace');
    assert(tabManager.getActiveTabId() === reopened?.id, 'reopenClosedTab: reopened tab is set as active');

    // Trying to reopen again when stack is empty returns null
    const emptyReopen = await tabManager.reopenClosedTab();
    assert(emptyReopen === null, 'reopenClosedTab: returns null when no closed tabs remain');
  }

  // 6. Close all tabs auto-creates new tab
  {
    const { tabManager } = createTestTabManager();
    const t1 = await tabManager.createTab({ url: 'https://lone-tab.com', active: true });
    await tabManager.closeTab(t1.id);
    const remaining = tabManager.getTabs();
    assert(remaining.length === 1, 'closeTab: closing last remaining tab auto-creates new empty tab');
    assert(remaining[0].url === 'orca://newtab', 'closeTab: auto-created tab has orca://newtab URL');
  }
}

// ---------------------------------------------------------------------------
// TASK 7 — Core Navigation & Omnibox URL Classification Tests
// ---------------------------------------------------------------------------

async function runCoreNavigationTests() {
  section('TASK 7 — Core Navigation & Omnibox URL Classification');

  const defaultEngine = 'https://www.google.com/search?q=';
  const customEngine = 'https://duckduckgo.com/?q=';

  // 1. Explicit HTTPS URL
  assert(
    NavigationManager.normalizeInput('https://github.com') === 'https://github.com',
    'normalizeInput: explicit HTTPS URL is preserved as-is'
  );
  assert(
    NavigationManager.normalizeInput('https://youtube.com/watch?v=123') === 'https://youtube.com/watch?v=123',
    'normalizeInput: explicit HTTPS URL with path and query is preserved'
  );

  // 2. Explicit HTTP URL
  assert(
    NavigationManager.normalizeInput('http://example.com') === 'http://example.com',
    'normalizeInput: explicit HTTP URL is preserved as-is'
  );
  assert(
    NavigationManager.normalizeInput('http://insecure-site.org/page') === 'http://insecure-site.org/page',
    'normalizeInput: explicit HTTP URL with path is preserved'
  );

  // 3. Domain without protocol
  assert(
    NavigationManager.normalizeInput('youtube.com') === 'https://youtube.com',
    'normalizeInput: domain "youtube.com" receives https:// protocol'
  );
  assert(
    NavigationManager.normalizeInput('github.com') === 'https://github.com',
    'normalizeInput: domain "github.com" receives https:// protocol'
  );
  assert(
    NavigationManager.normalizeInput('SUB.DOMAIN.ORG') === 'https://SUB.DOMAIN.ORG',
    'normalizeInput: uppercase domain receives https:// protocol'
  );

  // 4. Domain with path and query
  assert(
    NavigationManager.normalizeInput('github.com/username/repo') === 'https://github.com/username/repo',
    'normalizeInput: domain with repository path receives https://'
  );
  assert(
    NavigationManager.normalizeInput('sub.example.co.uk/search?q=test#top') === 'https://sub.example.co.uk/search?q=test#top',
    'normalizeInput: multi-part TLD with path, query, and fragment receives https://'
  );

  // 5. Localhost and IP addresses
  assert(
    NavigationManager.normalizeInput('localhost:3000') === 'http://localhost:3000',
    'normalizeInput: localhost with port maps to http://'
  );
  assert(
    NavigationManager.normalizeInput('localhost:8080/dashboard') === 'http://localhost:8080/dashboard',
    'normalizeInput: localhost with port and path maps to http://'
  );
  assert(
    NavigationManager.normalizeInput('127.0.0.1:8000') === 'http://127.0.0.1:8000',
    'normalizeInput: IPv4 address with port maps to http://'
  );
  assert(
    NavigationManager.normalizeInput('192.168.1.1') === 'http://192.168.1.1',
    'normalizeInput: standard LAN IPv4 address maps to http://'
  );

  // 6. Single-word search queries
  assert(
    NavigationManager.normalizeInput('youtube') === `${defaultEngine}youtube`,
    'normalizeInput: single-word "youtube" is treated as search query'
  );
  assert(
    NavigationManager.normalizeInput('weather') === `${defaultEngine}weather`,
    'normalizeInput: single-word "weather" is treated as search query'
  );
  assert(
    NavigationManager.normalizeInput('rust') === `${defaultEngine}rust`,
    'normalizeInput: single-word keyword "rust" is treated as search query'
  );

  // 7. Multi-word search queries
  assert(
    NavigationManager.normalizeInput('best laptops for programming') === `${defaultEngine}best%20laptops%20for%20programming`,
    'normalizeInput: "best laptops for programming" encodes query with %20'
  );
  assert(
    NavigationManager.normalizeInput('weather today') === `${defaultEngine}weather%20today`,
    'normalizeInput: "weather today" encodes query properly'
  );
  assert(
    NavigationManager.normalizeInput('React documentation') === `${defaultEngine}React%20documentation`,
    'normalizeInput: "React documentation" is treated as search query'
  );

  // 8. Special characters in search queries
  assert(
    NavigationManager.normalizeInput('C programming pointers') === `${defaultEngine}C%20programming%20pointers`,
    'normalizeInput: "C programming pointers" encodes properly'
  );
  assert(
    NavigationManager.normalizeInput('C++ & Rust #1') === `${defaultEngine}C%2B%2B%20%26%20Rust%20%231`,
    'normalizeInput: special characters (+, &, #) are safely percent-encoded'
  );

  // 9. Empty and whitespace-only input
  assert(
    NavigationManager.normalizeInput('') === 'orca://newtab',
    'normalizeInput: empty string defaults to orca://newtab'
  );
  assert(
    NavigationManager.normalizeInput('   ') === 'orca://newtab',
    'normalizeInput: whitespace-only string defaults to orca://newtab'
  );

  // 10. Custom search engine support
  assert(
    NavigationManager.normalizeInput('hello world', customEngine) === `${customEngine}hello%20world`,
    'normalizeInput: respects custom search engine URL'
  );

  // 11. Domain Extraction utility
  assert(
    NavigationManager.extractDomain('https://github.com/username/repo') === 'github.com',
    'extractDomain: extracts host from https URL'
  );
  assert(
    NavigationManager.extractDomain('orca://newtab') === 'orca',
    'extractDomain: returns "orca" for internal pages'
  );

  // 12. TabManager navigateTab integration with search query
  {
    const { tabManager } = createTestTabManager();
    const tab = await tabManager.createTab({ url: 'orca://newtab', active: true });
    await tabManager.navigateTab(tab.id, 'youtube', defaultEngine);
    const updatedTab = tabManager.getTab(tab.id);
    assert(
      updatedTab?.url === `${defaultEngine}youtube`,
      'TabManager.navigateTab: typing "youtube" navigates to search engine URL'
    );
    assert(
      updatedTab?.loading === true,
      'TabManager.navigateTab: initiates loading state on web navigation'
    );
  }

  // 13. TabManager navigateTab integration with direct domain
  {
    const { tabManager } = createTestTabManager();
    const tab = await tabManager.createTab({ url: 'orca://newtab', active: true });
    await tabManager.navigateTab(tab.id, 'youtube.com', defaultEngine);
    const updatedTab = tabManager.getTab(tab.id);
    assert(
      updatedTab?.url === 'https://youtube.com',
      'TabManager.navigateTab: typing "youtube.com" navigates directly to https://youtube.com'
    );
  }

  // 14. TabManager createTab integration with query normalization
  {
    const { tabManager } = createTestTabManager();
    const tab = await tabManager.createTab({ url: 'best laptops for programming', searchEngineUrl: defaultEngine });
    assert(
      tab.url === `${defaultEngine}best%20laptops%20for%20programming`,
      'TabManager.createTab: normalizes query input on tab creation'
    );
  }
}

// ---------------------------------------------------------------------------
// TASK 8 — Phase 3C Session Persistence Tests
// ---------------------------------------------------------------------------

async function runSessionPersistenceTests() {
  section('TASK 8 — Session Persistence (Phase 3C)');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orca-session-test-'));

  try {
    const storage = new StorageManager(tempDir);

    const testWorkspaces: Workspace[] = [
      { id: 'ws-personal', name: 'Personal', color: '#0284C7', icon: 'Compass', createdAt: 1000 },
      { id: 'ws-research', name: 'Research', color: '#0D9488', icon: 'BookOpen', createdAt: 2000 },
    ];

    const testTabs: Tab[] = [
      {
        id: 'tab-1',
        url: 'https://github.com',
        title: 'GitHub',
        favicon: 'https://github.com/favicon.ico',
        createdAt: 1000,
        lastAccessedAt: 5000,
        state: 'ACTIVE',
        workspaceId: 'ws-personal',
        pinned: true,
        muted: false,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        estimatedMemoryMB: 150,
        zoomLevel: 0,
      },
      {
        id: 'tab-2',
        url: 'https://youtube.com',
        title: 'YouTube',
        favicon: 'https://youtube.com/favicon.ico',
        createdAt: 2000,
        lastAccessedAt: 4000,
        state: 'SUSPENDED',
        workspaceId: 'ws-personal',
        pinned: false,
        muted: true,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        estimatedMemoryMB: 80,
        zoomLevel: 1,
        lastSuspendedAt: 6000,
        suspendCount: 1,
      },
      {
        id: 'tab-3',
        url: 'https://arxiv.org',
        title: 'ArXiv',
        createdAt: 3000,
        lastAccessedAt: 3000,
        state: 'HIBERNATED',
        workspaceId: 'ws-research',
        pinned: false,
        muted: false,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        estimatedMemoryMB: 30,
        zoomLevel: 0,
        lastHibernatedAt: 7000,
      },
    ];

    // 1. Serialize session
    const sessionToSave: SessionData = {
      version: 1,
      timestamp: Date.now(),
      workspaces: testWorkspaces,
      activeWorkspaceId: 'ws-personal',
      tabs: testTabs,
      activeTabId: 'tab-1',
    };

    storage.saveSession(sessionToSave);
    const sessionFilePath = path.join(tempDir, 'session.json');
    assert(fs.existsSync(sessionFilePath), 'saveSession: session.json file is written to disk');

    const fileContent = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
    assert(fileContent.version === 1, 'saveSession: serialized data contains schema version 1');
    assert(typeof fileContent.timestamp === 'number', 'saveSession: serialized data contains numeric timestamp');
    assert(fileContent.activeWorkspaceId === 'ws-personal', 'saveSession: activeWorkspaceId is preserved');
    assert(fileContent.activeTabId === 'tab-1', 'saveSession: activeTabId is preserved');
    assert(fileContent.tabs.length === 3, 'saveSession: all 3 tabs are serialized');

    // 2. Deserialize session
    const loadedSession = storage.getSession();
    assert(loadedSession !== null, 'getSession: successfully deserializes saved session');
    assert(loadedSession?.version === 1, 'getSession: deserialized version is 1');
    assert(loadedSession?.workspaces.length === 2, 'getSession: restores 2 workspaces');
    assert(loadedSession?.tabs.length === 3, 'getSession: restores 3 tabs');

    // 3. Restore workspaces
    assert(loadedSession?.workspaces[0].name === 'Personal', 'restoreWorkspaces: first workspace is Personal');
    assert(loadedSession?.workspaces[1].name === 'Research', 'restoreWorkspaces: second workspace is Research');

    // 4. Restore tabs metadata
    const restoredTab1 = loadedSession?.tabs.find((t) => t.id === 'tab-1');
    assert(restoredTab1?.url === 'https://github.com', 'restoreTabs: tab-1 URL is restored');
    assert(restoredTab1?.title === 'GitHub', 'restoreTabs: tab-1 title is restored');
    assert(restoredTab1?.pinned === true, 'restoreTabs: tab-1 pinned state is true');
    assert(restoredTab1?.loading === false, 'restoreTabs: transient loading state is initialized to false');

    // 5. Restore tab order
    assert(loadedSession?.tabs[0].id === 'tab-1', 'restoreTabOrder: tab index 0 is tab-1');
    assert(loadedSession?.tabs[1].id === 'tab-2', 'restoreTabOrder: tab index 1 is tab-2');
    assert(loadedSession?.tabs[2].id === 'tab-3', 'restoreTabOrder: tab index 2 is tab-3');

    // 6. Restore active workspace
    assert(loadedSession?.activeWorkspaceId === 'ws-personal', 'restoreActiveWorkspace: active workspace matches saved session');

    // 7. TabManager session restoration integration
    {
      const { tabManager } = createTestTabManager();
      await tabManager.restoreSessionTabs(loadedSession!.tabs, loadedSession!.activeTabId, loadedSession!.activeWorkspaceId);

      assert(tabManager.getTabs().length === 3, 'TabManager.restoreSessionTabs: restores all 3 tabs into manager');
      assert(tabManager.getActiveTabId() === 'tab-1', 'TabManager.restoreSessionTabs: sets active tab to tab-1');
      assert(tabManager.getTab('tab-1')?.state === 'ACTIVE', 'TabManager.restoreSessionTabs: active tab has ACTIVE state');
      assert(tabManager.getActiveWorkspaceId() === 'ws-personal', 'TabManager.restoreSessionTabs: sets activeWorkspaceId');

      // 8. Suspended / hibernated tabs restore from metadata
      const tab2 = tabManager.getTab('tab-2');
      assert(tab2?.state === 'SUSPENDED', 'TabManager.restoreSessionTabs: suspended tab maintains SUSPENDED state');
      const tab3 = tabManager.getTab('tab-3');
      assert(tab3?.state === 'HIBERNATED', 'TabManager.restoreSessionTabs: hibernated tab maintains HIBERNATED state');

      // 9. Selecting suspended tab lazily restores it
      await tabManager.selectTab('tab-2');
      assert(tabManager.getActiveTabId() === 'tab-2', 'TabManager.selectTab: selecting suspended tab switches activeTabId');
      assert(tabManager.getTab('tab-2')?.state === 'ACTIVE', 'TabManager.selectTab: restores suspended tab to ACTIVE state on selection');
    }

    // 10. Fallback on empty / missing session
    {
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orca-empty-session-'));
      const emptyStorage = new StorageManager(emptyDir);
      assert(emptyStorage.getSession() === null, 'getSession: returns null when session.json is missing');

      const { tabManager } = createTestTabManager();
      await tabManager.restoreSessionTabs([], null);
      assert(tabManager.getTabs().length === 1, 'restoreSessionTabs: empty session creates 1 default tab');
      assert(tabManager.getTabs()[0].url === 'orca://newtab', 'restoreSessionTabs: default tab is orca://newtab');
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }

    // 11. Fallback on malformed session JSON
    {
      const corruptDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orca-corrupt-session-'));
      const corruptStorage = new StorageManager(corruptDir);
      fs.writeFileSync(path.join(corruptDir, 'session.json'), '{ invalid json @@');
      assert(corruptStorage.getSession() === null, 'getSession: handles malformed JSON without crashing and returns null');
      fs.rmSync(corruptDir, { recursive: true, force: true });
    }

    // 12. Version validation
    {
      const oldVersionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orca-old-version-'));
      const oldStorage = new StorageManager(oldVersionDir);
      fs.writeFileSync(path.join(oldVersionDir, 'session.json'), JSON.stringify({ version: 0, tabs: [] }));
      assert(oldStorage.getSession() === null, 'getSession: rejects incompatible version 0');
      fs.rmSync(oldVersionDir, { recursive: true, force: true });
    }

    // 13. Session persistence does not contain runtime Electron objects
    {
      const rawText = fs.readFileSync(sessionFilePath, 'utf-8');
      assert(!rawText.includes('webContents'), 'safety: serialized session does not contain webContents references');
      assert(!rawText.includes('BrowserWindow'), 'safety: serialized session does not contain BrowserWindow references');
      assert(!rawText.includes('processId'), 'safety: serialized session does not contain processId references');
    }

    // 14. Clear session
    {
      storage.clearSession();
      assert(storage.getSession() === null, 'clearSession: session file is cleared and getSession returns null');
    }

    // 15. Duplicate restoration protection
    {
      const { tabManager } = createTestTabManager();
      await tabManager.restoreSessionTabs(testTabs, 'tab-1');
      assert(tabManager.getTabs().length === 3, 'restoreSessionTabs: first restoration populates 3 tabs');
      // Second call replaces cleanly rather than duplicating
      await tabManager.restoreSessionTabs(testTabs, 'tab-1');
      assert(tabManager.getTabs().length === 3, 'restoreSessionTabs: second restoration does not duplicate tabs');
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function runMemoryEngineTests() {
  console.log('\n=== ORCA Memory Engine & Tab Management Test Suite ===');

  runOriginalTests();
  runCanHibernateTests();
  runResolveIdleTimeoutTests();
  runCanSuspendEdgeCaseTests();
  runGetSuspensionCandidatesTests();
  await runMemoryManagerTests();
  await runTabManagementTests();
  await runCoreNavigationTests();
  await runSessionPersistenceTests();

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n=== TEST RESULTS ===');
  console.log(`  Passed : ${passCount}`);
  console.log(`  Failed : ${failCount}`);

  if (failures.length > 0) {
    console.log('\nFailed assertions:');
    for (const f of failures) {
      console.error(`  ✗ ${f}`);
    }
  }

  if (failCount > 0) {
    throw new Error(`[ORCA Tests] ${failCount} assertion(s) failed.`);
  }

  console.log('\n✓ All ORCA Memory Engine & Tab Management tests passed!\n');
}

runMemoryEngineTests();



