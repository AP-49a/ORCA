import React, { useEffect } from 'react';
import { useBrowserStore } from './store/useBrowserStore';
import { TitleBar } from './components/TitleBar/TitleBar';
import { TabBar } from './components/TabBar/TabBar';
import { NavigationBar } from './components/NavigationBar/NavigationBar';
import { NewTabPage } from './components/NewTabPage/NewTabPage';
import { MemoryCenter } from './components/MemoryCenter/MemoryCenter';
import { TabLibrary } from './components/TabLibrary/TabLibrary';
import { BookmarksModal } from './components/Bookmarks/BookmarksModal';
import { HistoryModal } from './components/History/HistoryModal';
import { DownloadsPopover } from './components/Downloads/DownloadsPopover';
import { SettingsModal } from './components/Settings/SettingsModal';
import { RestorationOverlay } from './components/RestorationOverlay/RestorationOverlay';
import { OrcaLogo } from './components/Icons/OrcaLogo';

export const App: React.FC = () => {
  const store = useBrowserStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'q') {
        event.preventDefault();
        window.orcaAPI?.closeWindow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleBookmark = () => {
    if (!store.activeTab) return;
    const isBookmarked = store.bookmarks.some((b) => b.url === store.activeTab?.url);
    if (isBookmarked) {
      const b = store.bookmarks.find((bm) => bm.url === store.activeTab?.url);
      if (b) store.removeBookmark(b.id);
    } else {
      store.addBookmark(
        store.activeTab.url,
        store.activeTab.title || store.activeTab.url,
        store.activeTab.favicon || undefined
      );
    }
  };

  const isInternalNewTab = !store.activeTab || store.activeTab.url === 'orca://newtab';

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-50">
      {/* 0. CUSTOM TITLE BAR */}
      <TitleBar
        onMinimize={store.minimizeWindow}
        onMaximize={store.maximizeWindow}
        onClose={store.closeWindow}
      />

      {/* 1. TOP TAB BAR */}
      <TabBar
        tabs={store.activeWorkspaceTabs}
        activeTabId={store.activeTabId}
        memoryStats={store.memoryStats}
        onSelectTab={store.selectTab}
        onCloseTab={store.closeTab}
        onCreateTab={() => store.createTab()}
        onTogglePinTab={store.togglePinTab}
        onToggleMuteTab={store.toggleMuteTab}
        onSuspendTab={store.suspendTab}
        onHibernateTab={store.hibernateTab}
        onDuplicateTab={store.duplicateTab}
        onRestoreTab={store.restoreTab}
        onOpenMemoryCenter={() => store.setIsMemoryCenterOpen(true)}
      />

      {/* 2. NAVIGATION BAR */}
      <NavigationBar
        activeTab={store.activeTab}
        bookmarks={store.bookmarks}
        workspaces={store.workspaces}
        activeWorkspaceId={store.activeWorkspaceId}
        onNavigate={(url) => {
          if (store.activeTabId) {
            store.navigateTab(store.activeTabId, url);
          } else {
            store.createTab(url);
          }
        }}
        onReload={() => store.activeTabId && store.reloadTab(store.activeTabId)}
        onStop={() => store.activeTabId && store.stopTab(store.activeTabId)}
        onGoBack={() => store.activeTabId && store.goBack(store.activeTabId)}
        onGoForward={() => store.activeTabId && store.goForward(store.activeTabId)}
        onToggleBookmark={handleToggleBookmark}
        onSetZoom={(zoom) => store.activeTabId && store.setZoom(store.activeTabId, zoom)}
        onSwitchWorkspace={store.switchWorkspace}
        onCreateWorkspace={store.createWorkspace}
        onDeleteWorkspace={store.deleteWorkspace}
        onOpenMemoryCenter={() => store.setIsMemoryCenterOpen(true)}
        onOpenTabLibrary={() => store.setIsTabLibraryOpen(true)}
        onOpenBookmarks={() => store.setIsBookmarksOpen(true)}
        onOpenHistory={() => store.setIsHistoryOpen(true)}
        onOpenDownloads={() => store.setIsDownloadsOpen(true)}
        onOpenSettings={() => store.setIsSettingsOpen(true)}
      />

      {/* 3. MAIN CONTENT VIEWPORT */}
      <main className="flex-1 w-full relative overflow-hidden">
        {isInternalNewTab ? (
          <NewTabPage
            bookmarks={store.bookmarks}
            history={store.history}
            workspaces={store.workspaces}
            activeWorkspaceId={store.activeWorkspaceId}
            memoryStats={store.memoryStats}
            onNavigate={(url) => {
              if (store.activeTabId) {
                store.navigateTab(store.activeTabId, url);
              } else {
                store.createTab(url);
              }
            }}
            onSwitchWorkspace={store.switchWorkspace}
            onOpenMemoryCenter={() => store.setIsMemoryCenterOpen(true)}
          />
        ) : null}
      </main>

      {/* 4. MODALS & OVERLAYS */}
      <MemoryCenter
        stats={store.memoryStats}
        isOpen={store.isMemoryCenterOpen}
        onClose={() => store.setIsMemoryCenterOpen(false)}
        onOptimizeNow={store.optimizeNow}
        onRestoreAll={store.restoreAll}
        onOpenTabLibrary={() => {
          store.setIsMemoryCenterOpen(false);
          store.setIsTabLibraryOpen(true);
        }}
      />

      <TabLibrary
        tabs={store.tabs}
        workspaces={store.workspaces}
        activeTabId={store.activeTabId}
        isOpen={store.isTabLibraryOpen}
        onClose={() => store.setIsTabLibraryOpen(false)}
        onSelectTab={store.selectTab}
        onSuspendTab={store.suspendTab}
        onHibernateTab={store.hibernateTab}
        onRestoreTab={store.restoreTab}
        onCloseTab={store.closeTab}
      />

      <BookmarksModal
        bookmarks={store.bookmarks}
        isOpen={store.isBookmarksOpen}
        onClose={() => store.setIsBookmarksOpen(false)}
        onNavigate={(url) => {
          if (store.activeTabId) {
            store.navigateTab(store.activeTabId, url);
          } else {
            store.createTab(url);
          }
        }}
        onRemoveBookmark={store.removeBookmark}
      />

      <HistoryModal
        history={store.history}
        isOpen={store.isHistoryOpen}
        onClose={() => store.setIsHistoryOpen(false)}
        onNavigate={(url) => {
          if (store.activeTabId) {
            store.navigateTab(store.activeTabId, url);
          } else {
            store.createTab(url);
          }
        }}
        onDeleteHistoryItem={store.deleteHistoryItem}
        onClearHistory={store.clearHistory}
      />

      <DownloadsPopover
        downloads={store.downloads}
        isOpen={store.isDownloadsOpen}
        onClose={() => store.setIsDownloadsOpen(false)}
        onCancelDownload={(id) => window.orcaAPI?.cancelDownload(id)}
        onOpenFile={(id) => window.orcaAPI?.openDownloadFile(id)}
        onShowInFolder={(id) => window.orcaAPI?.showDownloadInFolder(id)}
        onClearCompleted={() => window.orcaAPI?.clearCompletedDownloads()}
      />

      <SettingsModal
        settings={store.settings}
        isOpen={store.isSettingsOpen}
        onClose={() => store.setIsSettingsOpen(false)}
        onUpdateSettings={store.updateSettings}
      />

      <RestorationOverlay tabTitle={store.restoringTabTitle} />
    </div>
  );
};
