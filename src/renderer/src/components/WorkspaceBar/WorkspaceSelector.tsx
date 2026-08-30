import React, { useState } from 'react';
import { Workspace } from '../../../../shared/types';
import { Compass, BookOpen, Code2, Folder, Plus, X, Check } from 'lucide-react';

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSwitchWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string, color?: string, icon?: string) => void;
  onDeleteWorkspace: (id: string) => void;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  workspaces,
  activeWorkspaceId,
  onSwitchWorkspace,
  onCreateWorkspace,
  onDeleteWorkspace,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsColor, setNewWsColor] = useState('#0284C7');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass':
        return <Compass className="w-3.5 h-3.5" />;
      case 'BookOpen':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'Code2':
        return <Code2 className="w-3.5 h-3.5" />;
      default:
        return <Folder className="w-3.5 h-3.5" />;
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWsName.trim()) {
      onCreateWorkspace(newWsName.trim(), newWsColor, 'Folder');
      setNewWsName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {workspaces.map((ws) => {
        const isActive = ws.id === activeWorkspaceId;
        return (
          <button
            key={ws.id}
            onClick={() => onSwitchWorkspace(ws.id)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              isActive
                ? 'bg-[var(--accent-subtle)] text-[var(--accent)] shadow-xs border border-[var(--accent-border)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
            }`}
            title={`Switch to ${ws.name} Workspace`}
          >
            <span style={{ color: ws.color }}>{getIcon(ws.icon)}</span>
            <span>{ws.name}</span>
          </button>
        );
      })}

      {isCreating ? (
        <form onSubmit={handleCreate} className="flex items-center space-x-1 bg-[var(--surface)] border border-[var(--border)] rounded-md px-2 py-0.5 shadow-xs">
          <input
            type="text"
            placeholder="Workspace name..."
            value={newWsName}
            onChange={(e) => setNewWsName(e.target.value)}
            className="text-xs text-[var(--text-primary)] bg-transparent outline-none w-28 py-0.5"
            autoFocus
          />
          <button type="submit" className="p-0.5 text-emerald-500 hover:opacity-80">
            <Check className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-3 h-3" />
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          title="New Workspace"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
