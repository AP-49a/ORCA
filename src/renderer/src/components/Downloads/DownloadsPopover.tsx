import React from 'react';
import { DownloadItem } from '../../../../shared/types';
import { X, Download, FolderOpen, FileText, Ban } from 'lucide-react';

interface DownloadsPopoverProps {
  downloads: DownloadItem[];
  isOpen: boolean;
  onClose: () => void;
  onCancelDownload: (id: string) => void;
  onOpenFile: (id: string) => void;
  onShowInFolder: (id: string) => void;
  onClearCompleted: () => void;
}

export const DownloadsPopover: React.FC<DownloadsPopoverProps> = ({
  downloads,
  isOpen,
  onClose,
  onCancelDownload,
  onOpenFile,
  onShowInFolder,
  onClearCompleted,
}) => {
  if (!isOpen) return null;

  return (
    <div className="orca-modal-backdrop">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="orca-modal-card max-w-md p-5 max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">Downloads</h2>
          </div>
          <div className="flex items-center space-x-2">
            {downloads.some((d) => d.status === 'completed' || d.status === 'cancelled') && (
              <button
                onClick={onClearCompleted}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium px-2 py-1 rounded hover:bg-[var(--surface-hover)] transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)] py-2">
          {downloads.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] text-xs">No recent downloads.</div>
          ) : (
            downloads.map((dl) => (
              <div key={dl.id} className="py-2.5 px-2 hover:bg-[var(--surface-hover)] rounded-xl transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2 min-w-0 mr-2">
                    <FileText className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate" title={dl.filename}>
                      {dl.filename}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {dl.status === 'progressing' && (
                      <button
                        onClick={() => onCancelDownload(dl.id)}
                        className="p-1 text-[var(--text-muted)] hover:text-rose-500 rounded"
                        title="Cancel"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {dl.status === 'completed' && (
                      <>
                        <button
                          onClick={() => onOpenFile(dl.id)}
                          className="px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)] bg-[var(--accent-subtle)] hover:opacity-90 rounded"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => onShowInFolder(dl.id)}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded"
                          title="Show in folder"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {dl.status === 'progressing' && (
                  <div className="w-full bg-[var(--border)] rounded-full h-1.5 overflow-hidden my-1.5">
                    <div
                      className="bg-[var(--accent)] h-full rounded-full transition-all duration-300"
                      style={{ width: `${dl.progress}%` }}
                    />
                  </div>
                )}

                {/* Meta info */}
                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                  <span>
                    {dl.status === 'completed'
                      ? 'Completed'
                      : dl.status === 'progressing'
                      ? `${dl.progress}% • ${Math.round(dl.speed / 1024)} KB/s`
                      : dl.status}
                  </span>
                  <span>
                    {Math.round(dl.receivedBytes / (1024 * 1024) * 10) / 10} MB
                    {dl.totalBytes > 0 ? ` / ${Math.round(dl.totalBytes / (1024 * 1024) * 10) / 10} MB` : ''}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
