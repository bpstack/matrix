import React, { useState } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, Task } from '../../hooks/useTasks';
import { usePlans } from '../../hooks/usePlans';
import { useUiStore } from '../../stores/ui.store';
import { t, LangKey } from '../../lib/i18n';
import { TaskBoard } from './TaskBoard';
import { Calendar } from '../ui/Calendar';

const statusIcons: Record<string, string> = { pending: '○', in_progress: '◐', done: '●' };
const statusColors: Record<string, string> = {
  pending: 'text-gray-500',
  in_progress: 'text-matrix-warning',
  done: 'text-matrix-success',
};
const priorityColors: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
};
const nextStatus: Record<string, string> = { pending: 'in_progress', in_progress: 'done', done: 'pending' };

export function TasksView() {
  const { language } = useUiStore();
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const draggedIdRef = React.useRef<number | null>(null);
  const dropTargetRef = React.useRef<number | null>(null);
  const { data: tasks, isLoading } = useTasks(statusFilter ? { status: statusFilter } : undefined);
  const { data: plans } = usePlans();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();

  const [newTitle, setNewTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newPlanId, setNewPlanId] = useState<number | ''>('');
  const [newDeadline, setNewDeadline] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDeadline, setEditDeadline] = useState('');

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description ?? '');
    setEditDeadline(task.deadline ?? '');
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle('');
    setEditDescription('');
    setEditDeadline('');
  };

  const saveEdit = (id: number) => {
    const title = editTitle.trim();
    if (!title) return;
    updateTask.mutate({
      id,
      title,
      description: editDescription.trim() || undefined,
      deadline: editDeadline || undefined,
    });
    cancelEdit();
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    draggedIdRef.current = taskId;
    setDraggedId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    draggedIdRef.current = null;
    dropTargetRef.current = null;
    setDraggedId(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, taskId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetRef.current !== taskId) {
      dropTargetRef.current = taskId;
      setDropTarget(taskId);
    }
  };

  const handleDrop = (e: React.DragEvent, planTasks: Task[]) => {
    e.preventDefault();
    const fromId = draggedIdRef.current;
    const toId = dropTargetRef.current;
    draggedIdRef.current = null;
    dropTargetRef.current = null;
    setDraggedId(null);
    setDropTarget(null);
    if (fromId === null || toId === null || fromId === toId) return;
    const fromIdx = planTasks.findIndex((t) => t.id === fromId);
    const toIdx = planTasks.findIndex((t) => t.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...planTasks];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    reordered.forEach((task, index) => {
      if (task.sortOrder !== index) updateTask.mutate({ id: task.id, sortOrder: index });
    });
  };

  const sortedTasks = [...(tasks || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (isLoading) return <div className="p-4 text-matrix-muted text-sm">Loading...</div>;

  const grouped = new Map<number, typeof sortedTasks>();
  for (const task of sortedTasks) {
    if (!grouped.has(task.planId)) grouped.set(task.planId, []);
    grouped.get(task.planId)!.push(task);
  }

  const planNameMap = new Map<number, string>();
  for (const p of plans || []) planNameMap.set(p.id, p.title);

  const selectCls =
    'bg-matrix-bg border border-matrix-border rounded px-2 py-1 text-sm text-gray-300 focus:outline-none';

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium text-gray-200">{t('tasks', language)}</h1>
        <div className="flex items-center gap-2">
          <div className="flex border border-matrix-border rounded overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 text-xs transition-colors ${viewMode === 'list' ? 'bg-matrix-accent/10 text-matrix-accent' : 'text-matrix-muted hover:text-gray-300'}`}
              title={t('list' as LangKey, language)}
            >
              ☰
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-2 py-1 text-xs transition-colors ${viewMode === 'board' ? 'bg-matrix-accent/10 text-matrix-accent' : 'text-matrix-muted hover:text-gray-300'}`}
              title={t('board' as LangKey, language)}
            >
              ◫
            </button>
          </div>
          {viewMode === 'list' && (
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
              <option value="">{t('allStatuses', language)}</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          )}
        </div>
      </div>

      {viewMode === 'board' ? (
        <TaskBoard />
      ) : (
        <>
          {plans &&
            plans.length > 0 &&
            (addingTask ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTitle.trim() || !newPlanId) return;
                  createTask.mutate({
                    planId: Number(newPlanId),
                    title: newTitle.trim(),
                    description: newTaskDescription.trim() || undefined,
                    deadline: newDeadline || undefined,
                  });
                  setNewTitle('');
                  setNewTaskDescription('');
                  setNewPlanId('');
                  setNewDeadline('');
                  setAddingTask(false);
                }}
                className="flex flex-col gap-2 mb-4"
              >
                <div className="flex gap-2">
                  <select
                    autoFocus
                    value={newPlanId}
                    onChange={(e) => setNewPlanId(e.target.value ? Number(e.target.value) : '')}
                    className={selectCls}
                  >
                    <option value="">{t('selectPlan', language)}</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={t('taskTitle', language)}
                    className="flex-1 bg-matrix-bg border border-matrix-border rounded px-2 py-1 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/60"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-matrix-accent/10 text-matrix-accent text-sm rounded hover:bg-matrix-accent/20 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingTask(false);
                      setNewTitle('');
                      setNewTaskDescription('');
                      setNewPlanId('');
                      setNewDeadline('');
                    }}
                    className="px-2.5 py-1 text-matrix-muted text-sm rounded hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder={t('taskDescription', language)}
                    className="flex-1 bg-matrix-bg border border-matrix-border rounded px-2 py-1 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/60"
                  />
                  <div className="w-36">
                    <Calendar value={newDeadline} onChange={setNewDeadline} />
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-4">
                <button
                  onClick={() => setAddingTask(true)}
                  className="text-xs text-gray-500 hover:text-matrix-accent transition-colors"
                >
                  + {t('tasks', language)}
                </button>
              </div>
            ))}

          {tasks?.length === 0 && <p className="text-sm text-matrix-muted">{t('noTasks', language)}</p>}
          {[...grouped.entries()].map(([planId, planTasks]) => (
            <div key={planId} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold px-3 py-1.5 rounded-md border bg-matrix-accent/10 text-matrix-accent border-matrix-accent/30">
                  {planNameMap.get(planId) || `Plan #${planId}`}
                </span>
                <span className="text-xs text-matrix-muted">
                  {planTasks?.length || 0} {t('tasks', language)}
                </span>
              </div>
              <div className="grid gap-2">
                {planTasks!.map((task) => (
                  <div
                    key={task.id}
                    className={`group flex flex-col gap-1 py-2.5 px-3 rounded-lg border transition-all ${editingTaskId === task.id ? 'bg-matrix-surface ring-1 ring-matrix-accent/60 border-matrix-accent/30' : `cursor-move bg-matrix-surface/60 border-matrix-border/50 hover:bg-matrix-surface hover:border-matrix-border ${draggedId === task.id ? 'opacity-30' : ''} ${dropTarget === task.id && draggedId !== task.id ? 'ring-2 ring-matrix-accent/50 bg-matrix-accent/10 border-matrix-accent/30' : ''}`}`}
                    draggable={editingTaskId !== task.id}
                    onDragStart={(e) => editingTaskId === null && handleDragStart(e, task.id)}
                    onDragOver={(e) => editingTaskId === null && handleDragOver(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => editingTaskId === null && handleDrop(e, planTasks!)}
                  >
                    {editingTaskId === task.id ? (
                      <div className="space-y-1.5 py-0.5">
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(task.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="w-full bg-matrix-bg border border-matrix-accent/40 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none"
                        />
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          placeholder="Description (optional)"
                          rows={2}
                          className="w-full bg-matrix-bg border border-matrix-border rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/40 resize-y min-h-[3rem]"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-36">
                            <Calendar value={editDeadline} onChange={setEditDeadline} />
                          </div>
                          <button
                            onClick={() => saveEdit(task.id)}
                            className="text-xs px-2.5 py-0.5 bg-matrix-accent/10 text-matrix-accent rounded hover:bg-matrix-accent/20 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs text-matrix-muted hover:text-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="cursor-move text-gray-600 hover:text-gray-400">⋮⋮</span>
                          <button
                            onClick={() => updateTask.mutate({ id: task.id, status: nextStatus[task.status] })}
                            className={`text-sm ${statusColors[task.status]}`}
                            title={task.status}
                          >
                            {statusIcons[task.status]}
                          </button>
                          <span
                            className={`flex-1 text-sm ${task.status === 'done' ? 'line-through text-gray-600' : 'text-gray-300'}`}
                          >
                            {task.title}
                          </span>
                          <select
                            value={task.priority}
                            onChange={(e) => updateTask.mutate({ id: task.id, priority: e.target.value })}
                            className="bg-matrix-bg border border-matrix-border rounded px-1.5 py-0.5 text-[10px] text-matrix-muted focus:outline-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <option value="low">{t('low', language)}</option>
                            <option value="medium">{t('medium', language)}</option>
                            <option value="high">{t('high', language)}</option>
                            <option value="urgent">{t('urgent', language)}</option>
                          </select>
                          <span className={`text-[10px] ${priorityColors[task.priority]} group-hover:hidden`}>
                            {t(task.priority as LangKey, language)}
                          </span>
                          {task.deadline && (
                            <span className="text-xs text-matrix-muted">
                              {new Date(task.deadline + 'T00:00:00').toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(task)}
                              className="text-[10px] text-gray-500 hover:text-matrix-accent transition-colors"
                              title="Edit"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => deleteTask.mutate(task.id)}
                              className="text-[10px] text-gray-500 hover:text-matrix-danger transition-colors"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </span>
                        </div>
                        {task.description && (
                          <span className="text-xs text-gray-500 ml-6 whitespace-pre-wrap">{task.description}</span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
