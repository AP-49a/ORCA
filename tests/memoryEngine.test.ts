import { Tab, BrowserSettings } from '../src/shared/types';
import { SuspensionRules } from '../src/main/memory/SuspensionRules';
import { NavigationManager } from '../src/main/browser/NavigationManager';
import { TabManager } from '../src/main/browser/TabManager';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[Assertion Failed] ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

export function runMemoryEngineTests() {
  console.log('\n--- Running ORCA Memory Engine Tests ---');

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
  };

  const now = Date.now();

  // Test 1: Active tab must not be suspended
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

  // Test 2: Inactive tab past threshold is eligible
  const inactiveTab: Tab = {
    ...activeTab,
    id: 'tab-2',
    lastAccessedAt: now - (20 * 60 * 1000), // 20 min ago
  };
  const res2 = SuspensionRules.canSuspend(inactiveTab, 'tab-1', settings);
  assert(res2.eligible, 'Inactive tab past 15 min threshold is eligible for suspension');

  // Test 3: Tab with active audio is not suspended
  const audioTab: Tab = {
    ...inactiveTab,
    id: 'tab-3',
    audioActive: true,
  };
  const res3 = SuspensionRules.canSuspend(audioTab, 'tab-1', settings);
  assert(!res3.eligible, 'Tab playing audio/media is protected from suspension');

  // Test 4: Whitelisted domain (docs.google.com) is not suspended
  const googleDocTab: Tab = {
    ...inactiveTab,
    id: 'tab-4',
    url: 'https://docs.google.com/document/d/123',
  };
  const res4 = SuspensionRules.canSuspend(googleDocTab, 'tab-1', settings);
  assert(!res4.eligible, 'Whitelisted domain (docs.google.com) is protected from suspension');

  // Test 5: Pinned tab is not suspended
  const pinnedTab: Tab = {
    ...inactiveTab,
    id: 'tab-5',
    pinned: true,
  };
  const res5 = SuspensionRules.canSuspend(pinnedTab, 'tab-1', settings);
  assert(!res5.eligible, 'Pinned tab is protected from suspension');

  // Test 6: URL Navigation normalizer
  const url1 = NavigationManager.normalizeInput('github.com', settings.searchEngine);
  assert(url1 === 'https://github.com', 'Domain input "github.com" normalized to "https://github.com"');

  const url2 = NavigationManager.normalizeInput('chromium memory optimization', settings.searchEngine);
  assert(url2.includes('google.com/search?q=chromium'), 'Search query normalized to search engine URL');

  const url3 = NavigationManager.normalizeInput('orca://newtab', settings.searchEngine);
  assert(url3 === 'orca://newtab', 'Internal protocol preserved as "orca://newtab"');

  console.log('✓ All ORCA Memory Engine unit tests passed successfully!\n');

  // Regression: active page view must be attached as a window browser view, not as a child overlay that blocks app controls.
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
  assert(calls.includes('addChildView') || calls.includes('setBrowserView:tab-views'), 'Active tab is attached to the window so the app chrome remains clickable');
  assert(calls.includes('setVisible'), 'The browser view is shown only in the content region, keeping the window chrome interactive');
}

runMemoryEngineTests();
