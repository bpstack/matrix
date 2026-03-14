import React, { useState, useRef, useEffect } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, Task } from '../../hooks/useTasks';
import { usePlans } from '../../hooks/usePlans';
import { useUiStore } from '../../stores/ui.store';
import { t, LangKey } from '../../lib/i18n';
import { Dropdown } from '../ui/Dropdown';

const COLUMNS = ['pending', 'in_progress', 'done'] as const;
const columnLabels: Record<string, LangKey> = {
  pending: 'pending',
  in_progress: 'inProgress',
  done: 'done',
};
const columnColors: Record<string, string> = {
  pending: 'border-t-gray-500',
  in_progress: 'border-t-amber-500',
  done: 'border-t-green-500',
};
const priorityDots: Record<string, string> = {
  low: 'bg-gray-500',
  medium: 'bg-blue-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-400',
};

function getDeadlineBorder(deadline: string | null | undefined, status: string): string {
  if (status === 'done' || !deadline) return 'border-matrix-border/50';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(deadline);
  const taskDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (taskDay < today) return 'border-red-500';
  if (taskDay.getTime() === today.getTime()) return 'border-red-400';
  const soon = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (taskDay <= soon) return 'border-amber-500';
  return 'border-matrix-border/50';
}

function hasMultipleLines(text: string): boolean {
  return text.includes('\n') || text.length > 100;
}

export function TaskBoard() {
  const { language, quickCreateModal, closeQuickCreate } = useUiStore();
  const { data: allTasks } = useTasks();
  const { data: plans } = usePlans();
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();

  const [planFilter, setPlanFilter] = useState<number | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const draggedRef = useRef<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Add task form state
  const [addingTask, setAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPlanId, setNewPlanId] = useState<number | ''>('');

  // Edit task state
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (quickCreateModal.type === 'task') {
      setAddingTask(true);
      closeQuickCreate();
    }
  }, [quickCreateModal, closeQuickCreate]);

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description ?? '');
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const saveEdit = (id: number) => {
    const title = editTitle.trim();
    if (!title) return;
    updateTask.mutate({ id, title, description: editDescription.trim() || undefined });
    cancelEdit();
  };

  const planNameMap = new Map<number, string>();
  for (const p of plans || []) planNameMap.set(p.id, p.title);

  let filtered = allTasks || [];
  if (planFilter) filtered = filtered.filter((t) => t.planId === planFilter);
  if (priorityFilter) filtered = filtered.filter((t) => t.priority === priorityFilter);

  const grouped: Record<string, Task[]> = { pending: [], in_progress: [], done: [] };
  for (const task of filtered) {
    const col = grouped[task.status] ? task.status : 'pending';
    grouped[col].push(task);
  }
  for (const col of COLUMNS) {
    grouped[col].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    draggedRef.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  };

  const handleDragLeave = () => setDragOverCol(null);

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = draggedRef.current;
    draggedRef.current = null;
    if (taskId === null) return;
    const task = (allTasks || []).find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    updateTask.mutate({ id: taskId, status: newStatus });
  };

  const handleAddTask = () => {
    if (!newTitle.trim() || !newPlanId) return;
    createTask.mutate({
      planId: Number(newPlanId),
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
    });
    setNewTitle('');
    setNewDescription('');
    setNewPlanId('');
    setAddingTask(false);
  };

  return (
    <div>
      {/* Filters + Add Task */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Dropdown
            value={String(planFilter)}
            onChange={(val) => setPlanFilter(val ? Number(val) : '')}
            options={[
              { value: '', label: 'All plans' },
              ...(plans || []).map((p) => ({ value: String(p.id), label: p.title })),
            ]}
            className="w-40"
          />
          <Dropdown
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[
              { value: '', label: 'All priorities' },
              { value: 'low', label: t('low', language) },
              { value: 'medium', label: t('medium', language) },
              { value: 'high', label: t('high', language) },
              { value: 'urgent', label: t('urgent', language) },
            ]}
            className="w-36"
          />
          {!addingTask && (
            <button
              onClick={() => setAddingTask(true)}
              className="text-xs text-gray-500 hover:text-matrix-accent transition-colors ml-1"
            >
              + {t('tasks', language)}
            </button>
          )}
        </div>
        {addingTask && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddTask();
            }}
            className="flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <Dropdown
                value={String(newPlanId)}
                onChange={(val) => setNewPlanId(val ? Number(val) : '')}
                options={[
                  { value: '', label: t('selectPlan', language) },
                  ...(plans || []).map((p) => ({ value: String(p.id), label: p.title })),
                ]}
                className="w-40"
              />
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('taskTitle', language)}
                className="flex-1 bg-matrix-bg border border-matrix-border rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/60"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-matrix-accent/10 text-matrix-accent text-xs rounded hover:bg-matrix-accent/20 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingTask(false);
                  setNewTitle('');
                  setNewDescription('');
                  setNewPlanId('');
                }}
                className="px-2.5 py-1 text-matrix-muted text-xs rounded hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder={t('taskDescription', language)}
              rows={2}
              className="bg-matrix-bg border border-matrix-border rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/60 resize-y min-h-[3rem]"
            />
          </form>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full">
        {COLUMNS.map((col) => (
          <div
            key={col}
            className={`bg-matrix-surface border border-matrix-border border-t-2 ${columnColors[col]} rounded-md flex flex-col min-h-[400px] ${dragOverCol === col ? 'ring-1 ring-matrix-accent/50' : ''}`}
            onDragOver={(e) => handleDragOver(e, col)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col)}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-matrix-border/40">
              <span className="text-xs font-medium text-gray-300">{t(columnLabels[col], language)}</span>
              <span className="text-[10px] bg-matrix-border/50 text-matrix-muted px-1.5 py-0.5 rounded-full">
                {grouped[col].length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {grouped[col].map((task) => {
                const isExpanded = expandedCard === task.id;
                const isEditing = editingTaskId === task.id;
                const showToggle = task.description ? hasMultipleLines(task.description) : false;
                return (
                  <div
                    key={task.id}
                    draggable={!isEditing}
                    onDragStart={(e) => !isEditing && handleDragStart(e, task.id)}
                    className={`group bg-matrix-bg border-l-2 ${getDeadlineBorder(task.deadline, task.status)} rounded-md p-3 transition-colors ${isEditing ? 'ring-1 ring-matrix-accent/40' : 'cursor-move hover:border-matrix-accent/30'}`}
                  >
                    {isEditing ? (
                      <div className="space-y-1.5">
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
                          <button
                            onClick={() => saveEdit(task.id)}
                            className="text-[10px] px-2.5 py-0.5 bg-matrix-accent/10 text-matrix-accent rounded hover:bg-matrix-accent/20 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-[10px] text-matrix-muted hover:text-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-600 text-xs mt-0.5 shrink-0">⋮⋮</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-300 leading-snug">{task.title}</p>
                          {task.description && (
                            <div className="mt-1.5">
                              <p
                                className={`text-xs text-matrix-muted leading-relaxed whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-2'}`}
                              >
                                {task.description}
                              </p>
                              {showToggle && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedCard(isExpanded ? null : task.id);
                                  }}
                                  className="text-[10px] text-matrix-accent hover:text-matrix-accent-hover mt-0.5"
                                >
                                  {isExpanded ? '▲' : '▼'}
                                </button>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDots[task.priority]}`} />
                            <Dropdown
                              value={task.priority}
                              onChange={(value) => {
                                updateTask.mutate({ id: task.id, priority: value });
                              }}
                              options={[
                                { value: 'low', label: t('low', language) },
                                { value: 'medium', label: t('medium', language) },
                                { value: 'high', label: t('high', language) },
                                { value: 'urgent', label: t('urgent', language) },
                              ]}
                              className="hidden group-hover:inline w-20"
                            />
                            <span
                              className={`text-[10px] font-medium ${priorityDots[task.priority].replace('bg-', 'text-')} group-hover:hidden`}
                            >
                              {t(task.priority as LangKey, language)}
                            </span>
                            <span className="text-matrix-border">·</span>
                            <span className="text-[10px] text-matrix-muted truncate">
                              {planNameMap.get(task.planId) || ''}
                            </span>
                          </div>
                          {task.deadline && (
                            <div className="mt-1.5 text-[10px] text-matrix-muted">📅 {task.deadline}</div>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(task);
                            }}
                            className="text-[10px] text-matrix-muted/50 hover:text-matrix-accent"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask.mutate(task.id);
                            }}
                            className="text-[10px] text-matrix-muted/50 hover:text-matrix-danger"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
