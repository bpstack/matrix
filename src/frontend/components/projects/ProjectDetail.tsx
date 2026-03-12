import React, { useState } from 'react';
import { useProject, useScanProject, useUpdateProject, useDeleteProject } from '../../hooks/useProjects';
import { useUiStore } from '../../stores/ui.store';
import { t } from '../../lib/i18n';

interface Props {
  projectId: number;
  onBack: () => void;
}

export function ProjectDetail({ projectId, onBack }: Props) {
  const { language } = useUiStore();
  const { data: project, isLoading } = useProject(projectId);
  const scanProject = useScanProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPath, setEditPath] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');

  if (isLoading || !project) return <div className="p-6 text-matrix-muted">{t('loading', language)}</div>;

  const ts = project.techStats;
  const scan = project.scan;
  const rawData = scan?.rawData ? JSON.parse(scan.rawData) : [];

  const statusColors: Record<string, string> = {
    active: 'bg-matrix-success/20 text-matrix-success',
    paused: 'bg-matrix-warning/20 text-matrix-warning',
    completed: 'bg-blue-400/20 text-blue-400',
    archived: 'bg-gray-500/20 text-gray-400',
  };

  const cycleStatus = () => {
    const order = ['active', 'paused', 'completed', 'archived'];
    const next = order[(order.indexOf(project.status) + 1) % order.length];
    updateProject.mutate({ id: project.id, status: next });
  };

  const startEdit = () => {
    setEditName(project.name);
    setEditPath(project.path || '');
    setEditUrl(project.url || '');
    setEditDescription(project.description || '');
    setIsEditing(true);
  };

  const saveEdit = () => {
    updateProject.mutate(
      {
        id: project.id,
        name: editName.trim() || undefined,
        path: editPath.trim() || undefined,
        url: editUrl.trim() || undefined,
        description: editDescription.trim() || undefined,
      },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  };

  const handleDelete = () => {
    if (confirm(t('deleteProjectConfirm', language) || 'Delete this project?')) {
      deleteProject.mutate(project.id, { onSuccess: onBack });
    }
  };

  const handleSelectDirectory = async () => {
    const dir = await window.matrix.selectDirectory();
    if (dir) setEditPath(dir);
  };

  const openFolder = () => {
    if (project.path) window.matrix.openDirectory(project.path);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <button onClick={onBack} className="text-sm text-matrix-muted hover:text-gray-300 mb-4 transition-colors">
        ← {t('projects', language)}
      </button>

      <div className="flex items-start justify-between mb-6">
        {isEditing ? (
          <div className="flex-1 space-y-3 mr-4">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={t('projectName', language)}
              className="w-full px-3 py-2 bg-matrix-bg border border-matrix-border rounded text-lg font-semibold text-gray-200 placeholder-matrix-muted focus:border-matrix-accent focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                value={editPath}
                onChange={(e) => setEditPath(e.target.value)}
                placeholder={t('projectPath', language)}
                className="flex-1 px-3 py-2 bg-matrix-bg border border-matrix-border rounded text-sm text-gray-200 placeholder-matrix-muted focus:border-matrix-accent focus:outline-none"
              />
              <button
                onClick={handleSelectDirectory}
                className="px-3 py-2 text-sm bg-matrix-bg border border-matrix-border rounded text-gray-300 hover:bg-matrix-surface transition-colors"
              >
                📁
              </button>
            </div>
            <input
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="URL (GitHub, GitLab...)"
              className="w-full px-3 py-2 bg-matrix-bg border border-matrix-border rounded text-sm text-gray-200 placeholder-matrix-muted focus:border-matrix-accent focus:outline-none"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder={t('taskDescription', language)}
              rows={2}
              className="w-full px-3 py-2 bg-matrix-bg border border-matrix-border rounded text-sm text-gray-200 placeholder-matrix-muted focus:border-matrix-accent focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="px-3 py-1.5 text-sm bg-matrix-accent text-black rounded hover:bg-matrix-accent-hover transition-colors font-medium"
              >
                {t('save', language)}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-sm text-matrix-muted hover:text-gray-300 transition-colors"
              >
                {t('cancel', language)}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-semibold text-gray-200">{project.name}</h1>
              <button
                onClick={cycleStatus}
                className={`px-2 py-0.5 text-xs rounded-full ${statusColors[project.status] || ''}`}
              >
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </button>
            </div>
            {project.description && <p className="text-sm text-matrix-muted">{project.description}</p>}
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline mt-1 inline-block"
              >
                {project.url}
              </a>
            )}
          </div>
        )}
        <div className="flex gap-2 shrink-0">
          {!isEditing && (
            <>
              <button
                onClick={startEdit}
                className="px-3 py-1.5 text-sm bg-matrix-surface border border-matrix-border text-gray-300 rounded hover:bg-matrix-bg transition-colors"
              >
                ✎ {t('edit', language)}
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm text-matrix-danger hover:bg-matrix-danger/10 rounded transition-colors"
              >
                ✕
              </button>
            </>
          )}
          {project.path && !isEditing && (
            <button
              onClick={() => scanProject.mutate(project.id)}
              className="px-3 py-1.5 text-sm bg-matrix-accent/20 text-matrix-accent rounded hover:bg-matrix-accent/30 transition-colors"
            >
              ⟳ Scan
            </button>
          )}
        </div>
      </div>

      {/* Info cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {project.path && (
          <div onClick={openFolder} className="cursor-pointer hover:border-matrix-accent/50 transition-colors">
            <InfoCard label={t('directory', language)} value={project.path} small />
          </div>
        )}
        {ts && (
          <>
            <InfoCard label={t('linesOfCode', language)} value={formatLines(ts.totalLines)} />
            <InfoCard label={t('deps', language)} value={String(ts.dependencies)} />
            <InfoCard
              label="Tests"
              value={ts.hasTests ? '✓' : '✕'}
              color={ts.hasTests ? 'text-matrix-success' : 'text-matrix-danger'}
            />
            <InfoCard
              label="CI/CD"
              value={ts.hasCiCd ? '✓' : '✕'}
              color={ts.hasCiCd ? 'text-matrix-success' : 'text-matrix-danger'}
            />
          </>
        )}
      </div>

      {/* Progress bar */}
      {scan && scan.totalTasks > 0 && (
        <div className="mb-6 p-4 bg-matrix-surface rounded-lg border border-matrix-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">{t('progress', language)}</span>
            <span className="text-sm font-mono text-matrix-accent">{scan.progressPercent}%</span>
          </div>
          <div className="h-2 bg-matrix-bg rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-matrix-accent rounded-full transition-all"
              style={{ width: `${scan.progressPercent}%` }}
            />
          </div>
          <div className="flex gap-4 text-xs text-matrix-muted">
            <span>
              ☑ {scan.completedTasks}/{scan.totalTasks} tasks
            </span>
            {scan.blockers > 0 && <span className="text-matrix-danger">⚠ {scan.blockers} blockers</span>}
            {scan.wipItems > 0 && <span className="text-matrix-warning">◉ {scan.wipItems} WIP</span>}
          </div>
        </div>
      )}

      {/* Languages */}
      {ts && ts.languages.length > 0 && (
        <div className="mb-6 p-4 bg-matrix-surface rounded-lg border border-matrix-border">
          <h3 className="text-sm font-medium text-gray-300 mb-3">{t('languages', language)}</h3>
          {/* Language bar */}
          <div className="h-2 rounded-full overflow-hidden flex mb-3">
            {ts.languages.map((lang) => (
              <div
                key={lang.name}
                className="h-full"
                style={{ backgroundColor: lang.color, width: `${lang.percent}%` }}
                title={`${lang.name} ${lang.percent}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {ts.languages.map((lang) => (
              <span key={lang.name} className="flex items-center gap-1.5 text-xs text-matrix-muted">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                {lang.name} <span className="text-gray-500">{lang.percent}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scan breakdown + Git info side by side */}
      {(rawData.length > 0 || ts?.lastCommit) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Scan breakdown */}
          {rawData.length > 0 && (
            <div className="p-4 bg-matrix-surface rounded-lg border border-matrix-border">
              <h3 className="text-sm font-medium text-gray-300 mb-3">{t('scanBreakdown', language)}</h3>
              {/* Header */}
              <div className="flex items-center text-xs text-matrix-muted mb-2 px-1">
                <span className="w-24">File</span>
                <span className="w-12 text-center">Tasks</span>
                <span className="flex-1 mx-2">Progress</span>
                <span className="w-8 text-right">%</span>
                <span className="w-10 text-center" title="Blockers - Issues that are blocking progress">
                  ⚠
                </span>
                <span className="w-10 text-center" title="WIP - Work in progress items">
                  ◉
                </span>
              </div>
              <div className="space-y-1">
                {rawData.map(
                  (f: {
                    file: string;
                    completedTasks: number;
                    totalTasks: number;
                    progressPercent: number;
                    blockers: string[];
                    wipItems: string[];
                  }) => (
                    <div key={f.file} className="flex items-center text-xs bg-matrix-bg/50 rounded px-2 py-1.5">
                      <span className="w-24 text-gray-300 font-mono truncate" title={f.file}>
                        {f.file}
                      </span>
                      <span className="w-12 text-center text-matrix-muted">
                        {f.completedTasks}/{f.totalTasks}
                      </span>
                      <div className="flex-1 mx-2">
                        <div className="h-1 bg-matrix-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-matrix-accent rounded-full"
                            style={{ width: `${f.progressPercent}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-8 text-right text-matrix-accent font-mono">{f.progressPercent}%</span>
                      <span className="w-10 text-center">
                        {f.blockers.length > 0 ? (
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded bg-matrix-danger/20 text-matrix-danger text-xs font-bold cursor-help"
                            title={`BLOCKERS:\n\n${f.blockers.join('\n')}`}
                          >
                            {f.blockers.length}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </span>
                      <span className="w-10 text-center">
                        {f.wipItems.length > 0 ? (
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded bg-matrix-warning/20 text-matrix-warning text-xs font-bold cursor-help"
                            title={`WORK IN PROGRESS:\n\n${f.wipItems.join('\n')}`}
                          >
                            {f.wipItems.length}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </span>
                    </div>
                  ),
                )}
              </div>
              {/* Legend */}
              <div className="mt-2 pt-2 border-t border-matrix-border flex gap-3 text-xs text-matrix-muted">
                <span>
                  <span className="text-matrix-danger">⚠</span> Blocker
                </span>
                <span>
                  <span className="text-matrix-warning">◉</span> Work in progress
                </span>
              </div>
            </div>
          )}

          {/* Git info */}
          {ts?.lastCommit && (
            <div className="p-4 bg-matrix-surface rounded-lg border border-matrix-border">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Git</h3>
              <div className="space-y-2 text-xs text-matrix-muted">
                {ts.gitBranch && (
                  <div className="flex items-center gap-2">
                    <span>⎇</span>
                    <span className="text-gray-300">{ts.gitBranch}</span>
                    {ts.gitDirty && <span className="text-matrix-warning">(uncommitted)</span>}
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Last commit:</span>
                  <span className="text-gray-300 ml-1">{ts.lastCommit.message}</span>
                </div>
                <div className="text-gray-500">{new Date(ts.lastCommit.date).toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Linked entities */}
      {project.links && project.links.length > 0 && (
        <div className="mt-6 p-4 bg-matrix-surface rounded-lg border border-matrix-border">
          <h3 className="text-sm font-medium text-gray-300 mb-3">{t('linkedEntities', language)}</h3>
          <div className="space-y-1.5">
            {project.links.map((link: { id: number; linkableType: string; linkableId: number }) => {
              const icons: Record<string, string> = { mission: '◈', objective: '◎', plan: '◻', task: '☰' };
              return (
                <div key={link.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">
                    <span className="mr-1.5">{icons[link.linkableType] || '•'}</span>
                    {link.linkableType} #{link.linkableId}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {project.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-blue-400/10 text-blue-400 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, small, color }: { label: string; value: string; small?: boolean; color?: string }) {
  return (
    <div className="p-3 bg-matrix-surface rounded-lg border border-matrix-border">
      <p className="text-xs text-matrix-muted mb-1">{label}</p>
      <p className={`${small ? 'text-xs font-mono truncate' : 'text-lg font-semibold'} ${color || 'text-gray-200'}`}>
        {value}
      </p>
    </div>
  );
}

function formatLines(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
