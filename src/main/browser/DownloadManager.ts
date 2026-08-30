import { session, shell, DownloadItem as ElectronDownloadItem, WebContents } from 'electron';
import { DownloadItem } from '../../shared/types';

export class DownloadManager {
  private downloads: Map<string, DownloadItem> = new Map();
  private activeItems: Map<string, ElectronDownloadItem> = new Map();
  private onUpdatedCallback?: (downloads: DownloadItem[]) => void;

  constructor(onUpdated?: (downloads: DownloadItem[]) => void) {
    this.onUpdatedCallback = onUpdated;
    this.setupListeners();
  }

  public setUpdateCallback(callback: (downloads: DownloadItem[]) => void) {
    this.onUpdatedCallback = callback;
  }

  private setupListeners() {
    session.defaultSession.on('will-download', (event, item, webContents) => {
      const id = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const downloadItem: DownloadItem = {
        id,
        filename: item.getFilename(),
        url: item.getURL(),
        savePath: item.getSavePath(),
        totalBytes: item.getTotalBytes(),
        receivedBytes: item.getReceivedBytes(),
        progress: 0,
        speed: 0,
        status: 'progressing',
        startTime: Date.now(),
      };

      this.downloads.set(id, downloadItem);
      this.activeItems.set(id, item);
      this.notify();

      let lastReceived = 0;
      let lastTime = Date.now();

      item.on('updated', (evt, state) => {
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;
        const currentReceived = item.getReceivedBytes();
        const total = item.getTotalBytes();
        
        const speed = timeDiff > 0 ? Math.round((currentReceived - lastReceived) / timeDiff) : 0;
        lastReceived = currentReceived;
        lastTime = now;

        const current = this.downloads.get(id);
        if (current) {
          current.receivedBytes = currentReceived;
          current.totalBytes = total;
          current.progress = total > 0 ? Math.min(100, Math.round((currentReceived / total) * 100)) : 0;
          current.speed = speed;
          current.savePath = item.getSavePath();
          current.status = state === 'progressing' ? 'progressing' : (state === 'interrupted' ? 'interrupted' : 'paused');
          this.notify();
        }
      });

      item.once('done', (evt, state) => {
        const current = this.downloads.get(id);
        if (current) {
          current.receivedBytes = item.getReceivedBytes();
          current.progress = 100;
          current.speed = 0;
          current.endTime = Date.now();
          current.savePath = item.getSavePath();
          current.status = state === 'completed' ? 'completed' : (state === 'cancelled' ? 'cancelled' : 'interrupted');
          this.activeItems.delete(id);
          this.notify();
        }
      });
    });
  }

  public getDownloads(): DownloadItem[] {
    return Array.from(this.downloads.values()).sort((a, b) => b.startTime - a.startTime);
  }

  public cancelDownload(id: string): void {
    const active = this.activeItems.get(id);
    if (active) {
      active.cancel();
    }
  }

  public async openFile(id: string): Promise<void> {
    const item = this.downloads.get(id);
    if (item && item.savePath && item.status === 'completed') {
      await shell.openPath(item.savePath);
    }
  }

  public showInFolder(id: string): void {
    const item = this.downloads.get(id);
    if (item && item.savePath) {
      shell.showItemInFolder(item.savePath);
    }
  }

  public clearCompleted(): void {
    for (const [id, item] of this.downloads.entries()) {
      if (item.status === 'completed' || item.status === 'cancelled') {
        this.downloads.delete(id);
      }
    }
    this.notify();
  }

  private notify() {
    if (this.onUpdatedCallback) {
      this.onUpdatedCallback(this.getDownloads());
    }
  }
}
