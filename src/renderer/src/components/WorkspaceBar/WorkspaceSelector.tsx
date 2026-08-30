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
                ? 'bg-sky-100 text-sky-900 shadow-xs border border-sky-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
            title={`Switch to ${ws.name} Workspace`}
          >
            <span style={{ color: ws.color }}>{getIcon(ws.icon)}</span>
            <span>{ws.name}</span>
          </button>
        );
      })}

      {isCreating ? (
        <form onSubmit={handleCreate} className="flex items-center space-x-1 bg-white border border-slate-300 rounded-md px-2 py-0.5 shadow-xs">
          <input
            type="text"
            placeholder="Workspace name..."
            value={newWsName}
            onChange={(e) => setNewWsName(e.target.value)}
            className="text-xs text-slate-800 bg-transparent outline-none w-28 py-0.5"
            autoFocus
          />
          <button type="submit" className="p-0.5 text-emerald-600 hover:text-emerald-800">
            <Check className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="p-0.5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3 h-3" />
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="New Workspace"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
