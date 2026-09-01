export const IPC_CHANNELS = {
  // Tabs
  TAB_CREATE: 'tab:create',
  TAB_CLOSE: 'tab:close',
  TAB_SELECT: 'tab:select',
  TAB_NAVIGATE: 'tab:navigate',
  TAB_RELOAD: 'tab:reload',
  TAB_STOP: 'tab:stop',
  TAB_GO_BACK: 'tab:go-back',
  TAB_GO_FORWARD: 'tab:go-forward',
  TAB_TOGGLE_PIN: 'tab:toggle-pin',
  TAB_TOGGLE_MUTE: 'tab:toggle-mute',
  TAB_DUPLICATE: 'tab:duplicate',
  TAB_REORDER: 'tab:reorder',
  TAB_SUSPEND: 'tab:suspend',
  TAB_HIBERNATE: 'tab:hibernate',
  TAB_RESTORE: 'tab:restore',
  TAB_SET_ZOOM: 'tab:set-zoom',
  TAB_KEEP_AWAKE: 'tab:keep-awake',
  
  // Workspaces
  WORKSPACE_LIST: 'workspace:list',
  WORKSPACE_CREATE: 'workspace:create',
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',
  WORKSPACE_SWITCH: 'workspace:switch',

  // Memory & Lifecycle
  MEMORY_GET_STATS: 'memory:get-stats',
  MEMORY_OPTIMIZE_NOW: 'memory:optimize-now',
  MEMORY_SUSPEND_ALL_ELIGIBLE: 'memory:suspend-all-eligible',
  MEMORY_RESTORE_ALL: 'memory:restore-all',
  MEMORY_SUSPEND_WORKSPACE: 'memory:suspend-workspace',
  MEMORY_RESTORE_WORKSPACE: 'memory:restore-workspace',
  
  // Bookmarks
  BOOKMARK_GET_ALL: 'bookmark:get-all',
  BOOKMARK_ADD: 'bookmark:add',
  BOOKMARK_UPDATE: 'bookmark:update',
  BOOKMARK_REMOVE: 'bookmark:remove',
  
  // History
  HISTORY_GET_ALL: 'history:get-all',
  HISTORY_SEARCH: 'history:search',
  HISTORY_DELETE: 'history:delete',
  HISTORY_CLEAR: 'history:clear',
  
  // Downloads
  DOWNLOAD_GET_ALL: 'download:get-all',
  DOWNLOAD_CANCEL: 'download:cancel',
  DOWNLOAD_OPEN_FILE: 'download:open-file',
  DOWNLOAD_SHOW_IN_FOLDER: 'download:show-in-folder',
  DOWNLOAD_CLEAR_COMPLETED: 'download:clear-completed',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',

  // Panel Overlay
  PANEL_OVERLAY_STATE: 'panel:overlay-state',

  // Window Controls
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  // Theme
  THEME_GET: 'theme:get',

  // Events from Main -> Renderer
  EVENT_THEME_CHANGED: 'event:theme-changed',
  EVENT_TABS_UPDATED: 'event:tabs-updated',
  EVENT_ACTIVE_TAB_CHANGED: 'event:active-tab-changed',
  EVENT_TAB_NAVIGATED: 'event:tab-navigated',
  EVENT_TAB_LOADING: 'event:tab-loading',
  EVENT_TAB_TITLE_UPDATED: 'event:tab-title-updated',
  EVENT_TAB_FAVICON_UPDATED: 'event:tab-favicon-updated',
  EVENT_TAB_STATE_CHANGED: 'event:tab-state-changed',
  EVENT_MEMORY_STATS_UPDATED: 'event:memory-stats-updated',
  EVENT_DOWNLOAD_UPDATED: 'event:download-updated',
  EVENT_WORKSPACES_UPDATED: 'event:workspaces-updated',
  EVENT_BOOKMARKS_UPDATED: 'event:bookmarks-updated',
  EVENT_HISTORY_UPDATED: 'event:history-updated',
  EVENT_SETTINGS_UPDATED: 'event:settings-updated',
} as const;
