import React from 'react';
import { useProject, useScanProject, useUpdateProject } from '../../hooks/useProjects';
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

  return (
    <div className="p-6">
      {/* Header */}
      <button onClick={onBack} className="text-sm text-matrix-muted hover:text-gray-300 mb-4 transition-colors">
        ← {t('projects', language)}
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-gray-200">{project.name}</h1>
            <button onClick={cycleStatus} className={`px-2 py-0.5 text-xs rounded-full ${statusColors[project.status] || ''}`}>
              {project.status}
            </button>
          </div>
          {project.description && <p className="text-sm text-matrix-muted">{project.description}</p>}
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline mt-1 inline-block">
              {project.url}
            </a>
          )}
        </div>
        {project.path && (
          <button
            onClick={() => scanProject.mutate(project.id)}
            className="px-3 py-1.5 text-sm bg-matrix-accent/20 text-matrix-accent rounded hover:bg-matrix-accent/30 transition-colors"
          >
            ⟳ Scan
          </button>
        )}
      </div>

      {/* Info cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {project.path && (
          <InfoCard label={t('directory', language)} value={project.path} small />
        )}
        {ts && (
          <>
            <InfoCard label={t('linesOfCode', language)} value={formatLines(ts.totalLines)} />
            <InfoCard label={t('deps', language)} value={String(ts.dependencies)} />
            <InfoCard label="Tests" value={ts.hasTests ? '✓' : '✕'} color={ts.hasTests ? 'text-matrix-success' : 'text-matrix-danger'} />
            <InfoCard label="CI/CD" value={ts.hasCiCd ? '✓' : '✕'} color={ts.hasCiCd ? 'text-matrix-success' : 'text-matrix-danger'} />
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
            <div className="h-full bg-matrix-accent rounded-full transition-all" style={{ width: `${scan.progressPercent}%` }} />
          </div>
          <div className="flex gap-4 text-xs text-matrix-muted">
            <span>☑ {scan.completedTasks}/{scan.totalTasks} tasks</span>
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
            {ts.languages.map(lang => (
              <div key={lang.name} className="h-full" style={{ backgroundColor: lang.color, width: `${lang.percent}%` }} title={`${lang.name} ${lang.percent}%`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {ts.languages.map(lang => (
              <span key={lang.name} className="flex items-center gap-1.5 text-xs text-matrix-muted">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                {lang.name} <span className="text-gray-500">{lang.percent}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scan breakdown by file */}
      {rawData.length > 0 && (
        <div className="mb-6 p-4 bg-matrix-surface rounded-lg border border-matrix-border">
          <h3 className="text-sm font-medium text-gray-300 mb-3">{t('scanBreakdown', language)}</h3>
          <div className="space-y-2">
            {rawData.map((f: { file: string; completedTasks: number; totalTasks: number; progressPercent: number; blockers: string[]; wipItems: string[] }) => (
              <div key={f.file} className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-mono">{f.file}</span>
                <div className="flex items-center gap-3">
                  <span className="text-matrix-muted">{f.completedTasks}/{f.totalTasks}</span>
                  <div className="w-24 h-1.5 bg-matrix-bg rounded-full overflow-hidden">
                    <div className="h-full bg-matrix-accent rounded-full" style={{ width: `${f.progressPercent}%` }} />
                  </div>
                  <span className="text-matrix-muted w-8 text-right">{f.progressPercent}%</span>
                  {f.blockers.length > 0 && <span className="text-matrix-danger">⚠{f.blockers.length}</span>}
                  {f.wipItems.length > 0 && <span className="text-matrix-warning">◉{f.wipItems.length}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Git info */}
      {ts?.lastCommit && (
        <div className="p-4 bg-matrix-surface rounded-lg border border-matrix-border">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Git</h3>
          <div className="space-y-1 text-xs text-matrix-muted">
            {ts.gitBranch && <p>⎇ <span className="text-gray-300">{ts.gitBranch}</span>{ts.gitDirty ? <span className="text-matrix-warning ml-1">(uncommitted changes)</span> : ''}</p>}
            <p>Last commit: <span className="text-gray-300">{ts.lastCommit.message}</span></p>
            <p className="text-gray-500">{new Date(ts.lastCommit.date).toLocaleDateString()}</p>
          </div>
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
          {project.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-blue-400/10 text-blue-400 rounded-full">{tag}</span>
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
      <p className={`${small ? 'text-xs font-mono truncate' : 'text-lg font-semibold'} ${color || 'text-gray-200'}`}>{value}</p>
    </div>
  );
}

function formatLines(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
