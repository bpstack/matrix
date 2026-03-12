import React, { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useMission, useCreateMission, useUpdateMission, useDeleteMission } from '../../hooks/useMission';
import { useObjectives, useCreateObjective, useUpdateObjective, useDeleteObjective, Objective } from '../../hooks/useObjectives';
import { usePlans, useCreatePlan, useUpdatePlan, useDeletePlan } from '../../hooks/usePlans';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, Task } from '../../hooks/useTasks';
import { useProjects, Project } from '../../hooks/useProjects';
import { useIdeas, useCreateIdea } from '../../hooks/useIdeas';
import { useStats } from '../../hooks/useStats';
import { useActivity } from '../../hooks/useActivity';
import { useUiStore } from '../../stores/ui.store';
import { t, LangKey } from '../../lib/i18n';

interface MissionResponse {
  id: number;
}

interface ObjectiveResponse {
  id: number;
}

interface PlanResponse {
  id: number;
}

/* ── Shared ── */

function progressColor(value: number): string {
  if (value <= 33) return 'bg-red-500';
  if (value <= 66) return 'bg-amber-500';
  return 'bg-green-500';
}

function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-matrix-border/50 rounded-full h-1 ${className}`}>
      <div
        className={`${progressColor(value)} h-1 rounded-full transition-all duration-300`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-matrix-surface border border-matrix-border rounded-md p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-matrix-border">
        <span className="text-sm text-matrix-muted">{icon}</span>
        <h2 className="text-sm font-medium text-gray-300">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ComingSoonCard({ title, icon, description }: { title: string; icon: string; description: string }) {
  return (
    <SectionCard title={title} icon={icon}>
      <div className="flex flex-col items-center justify-center py-6 text-matrix-muted">
        <span className="text-xl mb-2 opacity-20">{icon}</span>
        <p className="text-xs">{description}</p>
        <span className="mt-1.5 text-xs px-2 py-0.5 bg-matrix-border/50 text-matrix-muted rounded-full">
          Coming soon
        </span>
      </div>
    </SectionCard>
  );
}

/* ── Action buttons (edit + delete, shown on hover) ── */

function ActionButtons({
  onEdit,
  onDelete,
  deleteLabel = '✕',
  size = 'xs',
}: {
  onEdit: () => void;
  onDelete: () => void;
  deleteLabel?: string;
  size?: 'xs' | 'sm';
}) {
  const cls = size === 'xs' ? 'text-[10px]' : 'text-xs';
  return (
    <span className="inline-flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className={`${cls} text-matrix-muted/50 hover:text-matrix-accent transition-colors`}
      >
        ✎
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={`${cls} text-matrix-muted/50 hover:text-matrix-danger transition-colors`}
      >
        {deleteLabel}
      </button>
    </span>
  );
}

function InlineEdit({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);
  const commit = () => {
    const t = draft.trim();
    if (t && t !== value) onSave(t);
    else onCancel();
  };
  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') onCancel();
      }}
      className="bg-matrix-bg border border-matrix-accent/40 rounded px-2 py-0.5 text-sm text-gray-200 focus:outline-none w-full"
    />
  );
}

/* ── Strategic Schema: Wizard ── */

type WizardStep = 'mission' | 'objectives' | 'plans' | 'tasks';
const WIZARD_STEPS: WizardStep[] = ['mission', 'objectives', 'plans', 'tasks'];

function StrategicSchemaSetup() {
  const { language } = useUiStore();
  const [step, setStep] = useState<WizardStep>('mission');
  const [missionTitle, setMissionTitle] = useState('');
  const [missionDesc, setMissionDesc] = useState('');
  const [objectiveInputs, setObjectiveInputs] = useState([{ title: '', description: '' }]);
  const [planInputs, setPlanInputs] = useState<Record<number, { title: string; description: string }[]>>({
    0: [{ title: '', description: '' }],
  });
  const [taskInputs, setTaskInputs] = useState<Record<string, { title: string; priority: string }[]>>({});

  const createMission = useCreateMission();
  const createObjective = useCreateObjective();
  const createPlan = useCreatePlan();
  const createTask = useCreateTask();

  const [saving, setSaving] = useState(false);
  const stepIndex = WIZARD_STEPS.indexOf(step);

  const addObjective = () => {
    if (objectiveInputs.length >= 10) return;
    const newIdx = objectiveInputs.length;
    setObjectiveInputs([...objectiveInputs, { title: '', description: '' }]);
    setPlanInputs({ ...planInputs, [newIdx]: [{ title: '', description: '' }] });
  };

  const removeObjective = (idx: number) => {
    if (objectiveInputs.length <= 1) return;
    setObjectiveInputs(objectiveInputs.filter((_, i) => i !== idx));
    const newPlans = { ...planInputs };
    delete newPlans[idx];
    const reindexed: typeof planInputs = {};
    let j = 0;
    for (let i = 0; i < objectiveInputs.length; i++) {
      if (i === idx) continue;
      reindexed[j] = newPlans[i] || [{ title: '', description: '' }];
      j++;
    }
    setPlanInputs(reindexed);
  };

  const addPlan = (objIdx: number) => {
    const current = planInputs[objIdx] || [];
    if (current.length >= 10) return;
    setPlanInputs({ ...planInputs, [objIdx]: [...current, { title: '', description: '' }] });
  };

  const removePlan = (objIdx: number, planIdx: number) => {
    const current = planInputs[objIdx] || [];
    if (current.length <= 1) return;
    setPlanInputs({ ...planInputs, [objIdx]: current.filter((_, i) => i !== planIdx) });
  };

  const addTask = (key: string) => {
    const current = taskInputs[key] || [];
    if (current.length >= 10) return;
    setTaskInputs({ ...taskInputs, [key]: [...current, { title: '', priority: 'medium' }] });
  };

  const removeTask = (key: string, taskIdx: number) => {
    const current = taskInputs[key] || [];
    if (current.length <= 1) return;
    setTaskInputs({ ...taskInputs, [key]: current.filter((_, i) => i !== taskIdx) });
  };

  const goToStep = (s: WizardStep) => {
    if (s === 'tasks') {
      const newTaskInputs: typeof taskInputs = {};
      objectiveInputs.forEach((_, oi) => {
        (planInputs[oi] || []).forEach((_, pi) => {
          const key = `${oi}-${pi}`;
          if (!taskInputs[key]) {
            newTaskInputs[key] = [{ title: '', priority: 'medium' }];
          } else {
            newTaskInputs[key] = taskInputs[key];
          }
        });
      });
      setTaskInputs({ ...taskInputs, ...newTaskInputs });
    }
    setStep(s);
  };

  const canAdvance = () => {
    switch (step) {
      case 'mission':
        return missionTitle.trim().length > 0;
      case 'objectives':
        return objectiveInputs.some((o) => o.title.trim().length > 0);
      case 'plans':
        return Object.values(planInputs).some((arr) => arr.some((p) => p.title.trim().length > 0));
      case 'tasks':
        return true;
    }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const missionRes = await createMission.mutateAsync({
        title: missionTitle.trim(),
        description: missionDesc.trim() || undefined,
      }) as MissionResponse;
      const missionId = missionRes.id;
      for (let oi = 0; oi < objectiveInputs.length; oi++) {
        const obj = objectiveInputs[oi];
        if (!obj.title.trim()) continue;
        const objRes = await createObjective.mutateAsync({
          missionId,
          title: obj.title.trim(),
          description: obj.description.trim() || undefined,
        }) as ObjectiveResponse;
        const objId = objRes.id;
        const objPlans = planInputs[oi] || [];
        for (let pi = 0; pi < objPlans.length; pi++) {
          const plan = objPlans[pi];
          if (!plan.title.trim()) continue;
          const planRes = await createPlan.mutateAsync({
            objectiveId: objId,
            title: plan.title.trim(),
            description: plan.description.trim() || undefined,
          }) as PlanResponse;
          const planId = planRes.id;
          const key = `${oi}-${pi}`;
          const planTasks = taskInputs[key] || [];
          for (const task of planTasks) {
            if (!task.title.trim()) continue;
            await createTask.mutateAsync({ planId, title: task.title.trim(), priority: task.priority });
          }
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full bg-matrix-bg border border-matrix-border rounded px-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/60 transition-colors';

  return (
    <div>
      {/* Step tabs */}
      <div className="flex gap-px mb-4 border border-matrix-border rounded overflow-hidden">
        {WIZARD_STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => (i <= stepIndex ? goToStep(s) : undefined)}
            className={`flex-1 py-1.5 px-2 text-xs transition-colors capitalize ${
              s === step
                ? 'bg-matrix-accent/10 text-matrix-accent'
                : i < stepIndex
                  ? 'bg-matrix-bg text-gray-400 hover:text-gray-300 cursor-pointer'
                  : 'bg-matrix-bg text-gray-600 cursor-default'
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* Mission */}
      {step === 'mission' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-matrix-muted mb-1">Title</label>
            <input
              value={missionTitle}
              onChange={(e) => setMissionTitle(e.target.value)}
              placeholder="Your strategic mission..."
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-matrix-muted mb-1">
              Description <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              value={missionDesc}
              onChange={(e) => setMissionDesc(e.target.value)}
              placeholder="What does this mission aim to achieve?"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
      )}

      {/* Objectives */}
      {step === 'objectives' && (
        <div className="space-y-2">
          {objectiveInputs.map((obj, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-xs text-matrix-muted w-4 text-right shrink-0 pt-2">{i + 1}.</span>
              <div className="flex-1 space-y-1">
                <input
                  value={obj.title}
                  onChange={(e) => {
                    const next = [...objectiveInputs];
                    next[i] = { ...next[i], title: e.target.value };
                    setObjectiveInputs(next);
                  }}
                  placeholder={`Objective ${i + 1}...`}
                  className={`flex-1 ${inputCls}`}
                />
                <textarea
                  value={obj.description}
                  onChange={(e) => {
                    const next = [...objectiveInputs];
                    next[i] = { ...next[i], description: e.target.value };
                    setObjectiveInputs(next);
                  }}
                  placeholder="Description (optional)..."
                  className={`w-full text-sm bg-matrix-surface border border-matrix-border rounded px-2 py-1.5 text-gray-200 placeholder-matrix-muted/50 focus:outline-none focus:border-matrix-accent resize-none`}
                  rows={2}
                />
              </div>
              {objectiveInputs.length > 1 && (
                <button
                  onClick={() => removeObjective(i)}
                  className="text-xs text-matrix-muted hover:text-matrix-danger transition-colors mt-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {objectiveInputs.length < 10 && (
            <button
              onClick={addObjective}
              className="text-xs text-matrix-muted hover:text-matrix-accent transition-colors ml-6"
            >
              + Add objective
            </button>
          )}
        </div>
      )}

      {/* Plans */}
      {step === 'plans' && (
        <div className="space-y-4">
          {objectiveInputs.map((obj, oi) => {
            if (!obj.title.trim()) return null;
            const plans = planInputs[oi] || [{ title: '', description: '' }];
            return (
              <div key={oi}>
                <p className="text-xs text-matrix-muted mb-1.5">
                  <span className="text-matrix-accent/50">{oi + 1}.</span> {obj.title}
                </p>
                <div className="ml-5 space-y-1.5">
                  {plans.map((plan, pi) => (
                    <div key={pi} className="flex gap-2 items-center">
                      <span className="text-xs text-matrix-muted w-3 text-right shrink-0">{pi + 1}.</span>
                      <input
                        value={plan.title}
                        onChange={(e) => {
                          const next = [...plans];
                          next[pi] = { ...next[pi], title: e.target.value };
                          setPlanInputs({ ...planInputs, [oi]: next });
                        }}
                        placeholder={`Plan ${pi + 1}...`}
                        className={`flex-1 ${inputCls}`}
                      />
                      {plans.length > 1 && (
                        <button
                          onClick={() => removePlan(oi, pi)}
                          className="text-xs text-matrix-muted hover:text-matrix-danger transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {plans.length < 10 && (
                    <button
                      onClick={() => addPlan(oi)}
                      className="text-xs text-matrix-muted hover:text-matrix-accent transition-colors ml-5"
                    >
                      + Add plan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tasks */}
      {step === 'tasks' && (
        <div className="space-y-4">
          {objectiveInputs.map((obj, oi) => {
            if (!obj.title.trim()) return null;
            const plans = planInputs[oi] || [];
            return plans.map((plan, pi) => {
              if (!plan.title.trim()) return null;
              const key = `${oi}-${pi}`;
              const tasks = taskInputs[key] || [{ title: '', priority: 'medium' }];
              return (
                <div key={key}>
                  <p className="text-xs text-matrix-muted mb-1.5">
                    <span className="text-matrix-accent/50">{obj.title}</span>
                    <span className="mx-1 text-gray-600">/</span>
                    {plan.title}
                  </p>
                  <div className="ml-5 space-y-1.5">
                    {tasks.map((task, ti) => (
                      <div key={ti} className="flex gap-2 items-center">
                        <span className="text-xs text-matrix-muted w-3 text-right shrink-0">{ti + 1}.</span>
                        <input
                          value={task.title}
                          onChange={(e) => {
                            const next = [...tasks];
                            next[ti] = { ...next[ti], title: e.target.value };
                            setTaskInputs({ ...taskInputs, [key]: next });
                          }}
                          placeholder={`Task ${ti + 1}...`}
                          className={`flex-1 ${inputCls}`}
                        />
                        <select
                          value={task.priority}
                          onChange={(e) => {
                            const next = [...tasks];
                            next[ti] = { ...next[ti], priority: e.target.value };
                            setTaskInputs({ ...taskInputs, [key]: next });
                          }}
                          className="bg-matrix-bg border border-matrix-border rounded px-1.5 py-1.5 text-xs text-matrix-muted focus:outline-none"
                        >
                          <option value="low">{t('low', language)}</option>
                          <option value="medium">{t('medium', language)}</option>
                          <option value="high">{t('high', language)}</option>
                          <option value="urgent">{t('urgent', language)}</option>
                        </select>
                        {tasks.length > 1 && (
                          <button
                            onClick={() => removeTask(key, ti)}
                            className="text-xs text-matrix-muted hover:text-matrix-danger transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    {tasks.length < 10 && (
                      <button
                        onClick={() => addTask(key)}
                        className="text-xs text-matrix-muted hover:text-matrix-accent transition-colors ml-5"
                      >
                        + Add task
                      </button>
                    )}
                  </div>
                </div>
              );
            });
          })}
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between mt-6 pt-3 border-t border-matrix-border">
        <button
          onClick={() => stepIndex > 0 && goToStep(WIZARD_STEPS[stepIndex - 1])}
          className={`text-xs px-3 py-1.5 rounded transition-colors ${stepIndex > 0 ? 'text-gray-400 hover:text-gray-300' : 'text-gray-700 cursor-default'}`}
        >
          Back
        </button>
        <div className="flex gap-1">
          {WIZARD_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full ${i <= stepIndex ? 'bg-matrix-accent' : 'bg-matrix-border'}`}
            />
          ))}
        </div>
        {step === 'tasks' ? (
          <button
            onClick={saveAll}
            disabled={saving || !canAdvance()}
            className="text-xs px-4 py-1.5 bg-matrix-accent/90 text-matrix-bg font-medium rounded hover:bg-matrix-accent transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Create Schema'}
          </button>
        ) : (
          <button
            onClick={() => canAdvance() && goToStep(WIZARD_STEPS[stepIndex + 1])}
            disabled={!canAdvance()}
            className="text-xs px-4 py-1.5 bg-matrix-accent/10 text-matrix-accent rounded hover:bg-matrix-accent/20 transition-colors disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Active schema view ── */

function StrategicSchemaActive() {
  const { language } = useUiStore();
  const { data: missions } = useMission();
  const updateMission = useUpdateMission();
  const deleteMission = useDeleteMission();
  const mission = missions?.[0];
  const { data: objectives } = useObjectives(mission?.id);
  const createObjective = useCreateObjective();
  const updateObjective = useUpdateObjective();
  const deleteObjective = useDeleteObjective();

  const [expandedObj, setExpandedObj] = useState<number | null>(null);
  const { data: plans } = usePlans(expandedObj ?? undefined);
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();

  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);
  const { data: planTasks } = useTasks(expandedPlan ? { planId: expandedPlan } : undefined);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [editing, setEditing] = useState<string | null>(null); // "mission", "obj-3", "plan-5", "task-7"
  const [editDrafts, setEditDrafts] = useState<Record<string, { title?: string; description?: string }>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // same key pattern
  const [addingObj, setAddingObj] = useState(false);
  const [newObjTitle, setNewObjTitle] = useState('');
  const [newObjDesc, setNewObjDesc] = useState('');
  const [addingPlan, setAddingPlan] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  if (!mission) return null;

  const statusIcon: Record<string, string> = { pending: '○', in_progress: '◐', done: '●' };
  const statusColor: Record<string, string> = {
    pending: 'text-gray-500',
    in_progress: 'text-matrix-warning',
    done: 'text-matrix-success',
  };
  const priorityColor: Record<string, string> = {
    low: 'text-gray-500',
    medium: 'text-blue-400',
    high: 'text-orange-400',
    urgent: 'text-red-400',
  };
  const nextStatus: Record<string, string> = { pending: 'in_progress', in_progress: 'done', done: 'pending' };

  const confirmDelete = (key: string, deleteFn: () => void) => {
    if (deleteConfirm === key) {
      deleteFn();
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(key);
    }
  };

  const inlineCls =
    'flex-1 bg-transparent border border-matrix-border/50 rounded px-2 py-1 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/40';

  return (
    <div>
      {/* Mission */}
      <div className="group flex items-center justify-between mb-1 border-l-2 border-matrix-accent pl-2">
        {editing === 'mission' ? (
          <div className="flex-1 space-y-1">
            <InlineEdit
              value={mission.title}
              onSave={(title) => {
                updateMission.mutate({ id: mission.id, title });
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
            <textarea
              value={mission.description || ''}
              onChange={(e) => updateMission.mutate({ id: mission.id, description: e.target.value || undefined })}
              placeholder="Description (optional)..."
              className="w-full text-xs bg-matrix-bg border border-matrix-border rounded px-2 py-1 text-gray-300 placeholder-matrix-muted/50 focus:outline-none focus:border-matrix-accent/40 resize-none"
              rows={2}
            />
          </div>
        ) : (
          <span className="text-sm font-medium text-gray-200">{mission.title}</span>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-matrix-muted">{mission.progress}%</span>
          {editing !== 'mission' && (
            <ActionButtons
              onEdit={() => setEditing('mission')}
              onDelete={() =>
                confirmDelete('mission', () => deleteMission.mutate({ id: mission.id, action: 'cascade' }))
              }
              deleteLabel={deleteConfirm === 'mission' ? '?' : '✕'}
            />
          )}
        </div>
      </div>
      {!editing && mission.description && <p className="text-xs text-matrix-muted mb-1.5">{mission.description}</p>}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-matrix-accent uppercase tracking-wider">Meta</span>
        <div className="flex-1">
          <ProgressBar value={mission.progress} />
        </div>
        <span className="text-xs font-mono text-matrix-muted w-8 text-right">{mission.progress}%</span>
      </div>

      {/* Objectives */}
      <div className="space-y-1">
        {objectives?.map((obj, idx) => {
          const objKey = `obj-${obj.id}`;
          return (
            <div key={obj.id} className="border border-matrix-border/40 rounded overflow-hidden">
              <div
                className="group flex items-start gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => {
                  if (editing !== objKey) {
                    setExpandedObj(expandedObj === obj.id ? null : obj.id);
                    setExpandedPlan(null);
                  }
                }}
              >
                <span
                  className={`text-[10px] text-matrix-muted transition-transform mt-1 ${expandedObj === obj.id ? 'rotate-90' : ''}`}
                >
                  ▸
                </span>
                <div className="flex-1 min-w-0">
                  {editing === objKey ? (
                    <div className="space-y-1">
                      <input
                        value={editDrafts[objKey]?.title ?? obj.title}
                        onChange={(e) =>
                          setEditDrafts((d) => ({ ...d, [objKey]: { ...d[objKey], title: e.target.value } }))
                        }
                        onBlur={() => {
                          updateObjective.mutate({ id: obj.id, title: editDrafts[objKey]?.title ?? obj.title });
                          setEditing(null);
                        }}
                        className="bg-matrix-bg border border-matrix-accent/40 rounded px-2 py-0.5 text-sm text-gray-200 focus:outline-none w-full"
                      />
                      <textarea
                        value={editDrafts[objKey]?.description ?? obj.description ?? ''}
                        onChange={(e) =>
                          setEditDrafts((d) => ({ ...d, [objKey]: { ...d[objKey], description: e.target.value } }))
                        }
                        onBlur={() => {
                          updateObjective.mutate({
                            id: obj.id,
                            description: editDrafts[objKey]?.description ?? obj.description ?? undefined,
                          });
                          setEditing(null);
                        }}
                        placeholder="Description (optional)..."
                        className="w-full text-xs bg-matrix-bg border border-matrix-border rounded px-2 py-1 text-gray-300 placeholder-matrix-muted/50 focus:outline-none focus:border-matrix-accent resize-none"
                        rows={2}
                      />
                      <button
                        onClick={() => {
                          updateObjective.mutate({
                            id: obj.id,
                            title: editDrafts[objKey]?.title ?? obj.title,
                            description: editDrafts[objKey]?.description ?? obj.description ?? undefined,
                          });
                          setEditing(null);
                        }}
                        className="text-xs text-matrix-muted hover:text-gray-200"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-300 block truncate">{obj.title}</span>
                  )}
                  {obj.description && expandedObj === obj.id && (
                    <span className="text-xs text-matrix-muted/70 block mt-0.5 whitespace-pre-wrap">
                      {obj.description}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <div className="w-12">
                    <ProgressBar value={obj.progress} />
                  </div>
                  <span className="text-[10px] text-gray-500">Objetivo {idx + 1}</span>
                </div>
                <span className="text-[10px] font-mono text-matrix-muted/60 ml-1">{obj.progress}%</span>
                <ActionButtons
                  onEdit={() => {
                    setEditing(objKey);
                    setEditDrafts((d) => ({
                      ...d,
                      [objKey]: { title: obj.title, description: obj.description || '' },
                    }));
                  }}
                  onDelete={() =>
                    confirmDelete(objKey, () => deleteObjective.mutate({ id: obj.id, action: 'cascade' }))
                  }
                  deleteLabel={deleteConfirm === objKey ? '?' : '✕'}
                />
              </div>
              {expandedObj === obj.id && (
                <div className="px-3 pb-2 pt-1 border-t border-matrix-border/30 transition-all duration-300">
                  <div className="ml-3 space-y-1">
                    {plans?.map((plan, planIdx) => {
                      const planKey = `plan-${plan.id}`;
                      return (
                        <div key={plan.id}>
                          <div
                            className="group flex items-start gap-2 py-1 px-2 rounded cursor-pointer hover:bg-white/[0.02] transition-colors"
                            onClick={() => {
                              if (editing !== planKey) setExpandedPlan(expandedPlan === plan.id ? null : plan.id);
                            }}
                          >
                            <span
                              className={`text-[9px] text-matrix-muted transition-transform mt-0.5 ${expandedPlan === plan.id ? 'rotate-90' : ''}`}
                            >
                              ▸
                            </span>
                            {editing === planKey ? (
                              <InlineEdit
                                value={plan.title}
                                onSave={(title) => {
                                  updatePlan.mutate({ id: plan.id, title });
                                  setEditing(null);
                                }}
                                onCancel={() => setEditing(null)}
                              />
                            ) : (
                              <span className="text-sm text-gray-400 flex-1">{plan.title}</span>
                            )}
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="w-10">
                                <ProgressBar value={plan.progress} />
                              </div>
                              <span className="text-[9px] text-gray-500">Plan {planIdx + 1}</span>
                            </div>
                            <span className="text-[10px] font-mono text-matrix-muted/60 ml-1">{plan.progress}%</span>
                            <ActionButtons
                              onEdit={() => setEditing(planKey)}
                              onDelete={() =>
                                confirmDelete(planKey, () => deletePlan.mutate({ id: plan.id, action: 'cascade' }))
                              }
                              deleteLabel={deleteConfirm === planKey ? '?' : '✕'}
                            />
                          </div>
                          {expandedPlan === plan.id && (
                            <div className="ml-6 mt-0.5 space-y-px mb-1.5">
                              {planTasks?.map((task) => {
                                const taskKey = `task-${task.id}`;
                                return (
                                  <div
                                    key={task.id}
                                    className="group flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-white/[0.02]"
                                  >
                                    <button
                                      onClick={() =>
                                        updateTask.mutate({ id: task.id, status: nextStatus[task.status] })
                                      }
                                      className={`text-xs ${statusColor[task.status]}`}
                                    >
                                      {statusIcon[task.status]}
                                    </button>
                                    {editing === taskKey ? (
                                      <InlineEdit
                                        value={task.title}
                                        onSave={(title) => {
                                          updateTask.mutate({ id: task.id, title });
                                          setEditing(null);
                                        }}
                                        onCancel={() => setEditing(null)}
                                      />
                                    ) : (
                                      <span
                                        className={`text-sm flex-1 ${task.status === 'done' ? 'line-through text-gray-600' : 'text-gray-400'}`}
                                      >
                                        {task.title}
                                      </span>
                                    )}
                                    <span className={`text-[10px] ${priorityColor[task.priority]}`}>
                                      {t(task.priority as LangKey, language)}
                                    </span>
                                    {editing !== taskKey && (
                                      <ActionButtons
                                        onEdit={() => setEditing(taskKey)}
                                        onDelete={() => deleteTask.mutate(task.id)}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                              {addingTask ? (
                                <form
                                  className="flex gap-1.5 mt-0.5"
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!newTaskTitle.trim()) return;
                                    createTask.mutate({ planId: plan.id, title: newTaskTitle.trim() });
                                    setNewTaskTitle('');
                                    setAddingTask(false);
                                  }}
                                >
                                  <input
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Task..."
                                    autoFocus
                                    onBlur={() => !newTaskTitle.trim() && setAddingTask(false)}
                                    className={inlineCls}
                                  />
                                </form>
                              ) : (
                                <button
                                  onClick={() => setAddingTask(true)}
                                  className="text-xs text-gray-500 hover:text-matrix-accent transition-colors ml-1 mt-0.5"
                                >
                                  + task
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {addingPlan ? (
                      <form
                        className="flex gap-1.5 mt-0.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newPlanTitle.trim()) return;
                          createPlan.mutate({ objectiveId: obj.id, title: newPlanTitle.trim() });
                          setNewPlanTitle('');
                          setAddingPlan(false);
                        }}
                      >
                        <input
                          value={newPlanTitle}
                          onChange={(e) => setNewPlanTitle(e.target.value)}
                          placeholder="Plan..."
                          autoFocus
                          onBlur={() => !newPlanTitle.trim() && setAddingPlan(false)}
                          className={inlineCls}
                        />
                      </form>
                    ) : (
                      <button
                        onClick={() => setAddingPlan(true)}
                        className="text-xs text-gray-500 hover:text-matrix-accent transition-colors mt-0.5"
                      >
                        + plan
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {addingObj ? (
          <form
            className="space-y-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newObjTitle.trim()) return;
              createObjective.mutate({
                missionId: mission.id,
                title: newObjTitle.trim(),
                description: newObjDesc.trim() || undefined,
              });
              setNewObjTitle('');
              setNewObjDesc('');
              setAddingObj(false);
            }}
          >
            <input
              value={newObjTitle}
              onChange={(e) => setNewObjTitle(e.target.value)}
              placeholder="Objective..."
              autoFocus
              className={inlineCls}
            />
            <textarea
              value={newObjDesc}
              onChange={(e) => setNewObjDesc(e.target.value)}
              placeholder="Description (optional)..."
              className="w-full text-sm bg-matrix-surface border border-matrix-border rounded px-2 py-1.5 text-gray-200 placeholder-matrix-muted/50 focus:outline-none focus:border-matrix-accent resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button type="submit" className="text-xs text-matrix-accent hover:text-matrix-accent-hover">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewObjTitle('');
                  setNewObjDesc('');
                  setAddingObj(false);
                }}
                className="text-xs text-matrix-muted hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingObj(true)}
            className="text-xs text-gray-500 hover:text-matrix-accent transition-colors"
          >
            + objective
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Time ago helper ── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const activityIcons: Record<string, string> = {
  created: '+',
  completed: '✓',
  promoted: '↑',
  scanned: '⟲',
  deleted: '✕',
  decided: '⚖',
};

/* ── Dashboard Cards ── */

function StatsCard({ language }: { language: 'en' | 'es' }) {
  const { data: stats } = useStats();
  if (!stats) return null;
  const items = [
    {
      label: t('tasks' as LangKey, language),
      value: `${stats.completedTasks}/${stats.totalTasks}`,
      sub: stats.totalTasks > 0,
    },
    { label: t('activePlans' as LangKey, language), value: String(stats.activePlans) },
    { label: t('pendingIdeas' as LangKey, language), value: String(stats.pendingIdeas) },
    { label: t('completionRate' as LangKey, language), value: `${stats.completionRate}%` },
  ];
  return (
    <SectionCard title={t('globalStats' as LangKey, language)} icon="◪">
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-lg font-semibold text-gray-200">{item.value}</p>
            <p className="text-[10px] text-matrix-muted">{item.label}</p>
          </div>
        ))}
      </div>
      {stats.totalTasks > 0 && (
        <div className="mt-3">
          <ProgressBar value={stats.completionRate} />
        </div>
      )}
    </SectionCard>
  );
}

function ActiveProjectsCard({ language }: { language: 'en' | 'es' }) {
  const { data: allProjects } = useProjects();
  const { setActiveTab } = useUiStore();
  const active = (allProjects || []).filter((p: Project) => p.status === 'active').slice(0, 5);
  return (
    <SectionCard title={t('activeProjects' as LangKey, language)} icon="◫">
      {active.length === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">{t('noProjects' as LangKey, language)}</p>
      ) : (
        <div className="space-y-2">
          {active.map((p: Project) => (
            <button
              key={p.id}
              onClick={() => setActiveTab('projects')}
              className="w-full flex items-center gap-2 text-left hover:bg-white/[0.02] rounded px-1 py-1 transition-colors"
            >
              <span className="text-sm text-gray-300 flex-1 truncate">{p.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-matrix-border/50 text-matrix-muted'}`}
              >
                {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
              </span>
              {p.scan && (
                <div className="w-12">
                  <ProgressBar value={p.scan.progressPercent} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function RecentActivityCard({ language }: { language: 'en' | 'es' }) {
  const { data: activity } = useActivity(10);
  return (
    <SectionCard title={t('recentActivity' as LangKey, language)} icon="⟲">
      {!activity || activity.length === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">{t('noActivity' as LangKey, language)}</p>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto pr-4">
          {activity.map((a) => (
            <div key={a.id} className="flex items-start gap-2 py-1 text-xs">
              <span className="text-matrix-accent shrink-0 w-3 text-center">{activityIcons[a.action] || '•'}</span>
              <span className="text-gray-400 flex-1 truncate">{a.description}</span>
              <span className="text-matrix-muted/50 shrink-0">{timeAgo(a.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function QuickCaptureCard({ language }: { language: 'en' | 'es' }) {
  const [mode, setMode] = useState<'idea' | 'task'>('idea');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [planId, setPlanId] = useState<number | ''>('');
  const [saved, setSaved] = useState(false);

  const createIdea = useCreateIdea();
  const createTask = useCreateTask();
  const { data: plans } = usePlans();

  const handleSave = () => {
    if (!title.trim()) return;
    if (mode === 'idea') {
      createIdea.mutate({ title: title.trim(), description: description.trim() || undefined });
    } else {
      if (!planId) return;
      createTask.mutate({ planId: Number(planId), title: title.trim() });
    }
    setTitle('');
    setDescription('');
    setPlanId('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls =
    'w-full bg-matrix-bg border border-matrix-border rounded px-2 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/60 transition-colors';

  return (
    <SectionCard title={t('quickCapture' as LangKey, language)} icon="✦">
      <div className="space-y-2">
        <div className="flex gap-1">
          {(['idea', 'task'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-xs px-3 py-1 rounded transition-colors ${mode === m ? 'bg-matrix-accent/10 text-matrix-accent' : 'text-matrix-muted hover:text-gray-300'}`}
            >
              {t(m as LangKey, language)}
            </button>
          ))}
        </div>
        {mode === 'task' && plans && (
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value ? Number(e.target.value) : '')}
            className={inputCls}
          >
            <option value="">{t('selectPlan' as LangKey, language)}</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        )}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={mode === 'idea' ? 'Idea title...' : t('taskTitle' as LangKey, language)}
          className={inputCls}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        {mode === 'idea' && (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)..."
            rows={2}
            className={`${inputCls} resize-none`}
          />
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!title.trim() || (mode === 'task' && !planId)}
            className="text-xs px-3 py-1.5 bg-matrix-accent/10 text-matrix-accent rounded hover:bg-matrix-accent/20 transition-colors disabled:opacity-50"
          >
            {t('create' as LangKey, language)}
          </button>
          {saved && <span className="text-xs text-green-400">{t('saved' as LangKey, language)} ✓</span>}
        </div>
      </div>
    </SectionCard>
  );
}

/* ── Objectives at a Glance ── */

function ObjectivesGlanceCard({ language }: { language: 'en' | 'es' }) {
  const { data: missions } = useMission();
  const mission = missions?.[0];
  const { data: objectives } = useObjectives(mission?.id);

  return (
    <SectionCard title={language === 'es' ? 'Objetivos' : 'Objectives at a Glance'} icon="◎">
      {!objectives || objectives.length === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">
          {language === 'es' ? 'Sin objetivos' : 'No objectives yet'}
        </p>
      ) : (
        <div className="space-y-2.5">
          {objectives.map((obj) => (
            <div key={obj.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-300 truncate flex-1">{obj.title}</span>
                <span className="text-[10px] font-mono text-matrix-muted ml-2">{obj.progress}%</span>
              </div>
              <ProgressBar value={obj.progress} />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* ── Focus Queue (top priority tasks) ── */

function FocusQueueCard({ language }: { language: 'en' | 'es' }) {
  const { data: allTasks } = useTasks();
  const updateTask = useUpdateTask();

  const statusIcon: Record<string, string> = { pending: '○', in_progress: '◐', done: '●' };
  const statusColor: Record<string, string> = {
    pending: 'text-gray-500',
    in_progress: 'text-matrix-warning',
    done: 'text-matrix-success',
  };
  const nextStatus: Record<string, string> = { pending: 'in_progress', in_progress: 'done', done: 'pending' };
  const prioOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  const prioDot: Record<string, string> = {
    low: 'bg-gray-500',
    medium: 'bg-blue-400',
    high: 'bg-orange-400',
    urgent: 'bg-red-400',
  };

  const focusTasks = [...(allTasks || [])].sort((a, b) => {
    // done tasks go to the bottom
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return (prioOrder[a.priority] ?? 9) - (prioOrder[b.priority] ?? 9);
  });

  return (
    <SectionCard title={language === 'es' ? 'Cola de enfoque' : 'Focus Queue'} icon="▸">
      {focusTasks.length === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">
          {language === 'es' ? 'Sin tareas pendientes' : 'All clear!'}
        </p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto pr-4">
          {focusTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 py-1 group">
              <button
                onClick={() => updateTask.mutate({ id: task.id, status: nextStatus[task.status] })}
                className={`text-xs ${statusColor[task.status]}`}
              >
                {statusIcon[task.status]}
              </button>
              <span
                className={`text-sm flex-1 truncate ${task.status === 'done' ? 'line-through text-gray-600' : 'text-gray-300'}`}
              >
                {task.title}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${prioDot[task.priority]}`} />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* ── Upcoming Deadlines ── */

function UpcomingDeadlinesCard({ language }: { language: 'en' | 'es' }) {
  const { data: allTasks } = useTasks();

  const tasksWithDeadline = [...(allTasks || [])]
    .filter((t) => t.deadline && t.status !== 'done')
    .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))
    .slice(0, 5);

  const daysLeft = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    return diff;
  };
  const daysColor = (d: number) =>
    d <= 1 ? 'text-red-400' : d <= 3 ? 'text-orange-400' : d <= 7 ? 'text-amber-400' : 'text-gray-500';

  // If no real deadlines, show mock data
  const mockDeadlines = [
    { title: 'API contracts finalization', deadline: '2026-03-12', dLeft: 3 },
    { title: 'Design review sprint 4', deadline: '2026-03-14', dLeft: 5 },
    { title: 'Staging deployment', deadline: '2026-03-16', dLeft: 7 },
    { title: 'Documentation update', deadline: '2026-03-20', dLeft: 11 },
  ];

  const hasReal = tasksWithDeadline.length > 0;
  const items = hasReal
    ? tasksWithDeadline.map((t) => ({ title: t.title, dLeft: daysLeft(t.deadline!) }))
    : mockDeadlines.map((m) => ({ title: m.title, dLeft: m.dLeft }));

  return (
    <SectionCard title={language === 'es' ? 'Próximos vencimientos' : 'Upcoming Deadlines'} icon="⏰">
      {!hasReal && <p className="text-[10px] text-matrix-muted/50 mb-2 italic">Sample data</p>}
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={`${daysColor(item.dLeft)} font-mono text-[10px] w-7 text-right shrink-0`}>
              {item.dLeft <= 0 ? 'today' : `${item.dLeft}d`}
            </span>
            <span className="text-gray-400 flex-1 truncate">{item.title}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ── Weekly Heatmap ── */

function WeeklyHeatmapCard({ language }: { language: 'en' | 'es' }) {
  const { data: activity } = useActivity(50);

  // Build heatmap from real activity data (last 4 weeks)
  const now = Date.now();
  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const weeks = 4;
  const grid: number[][] = Array.from({ length: weeks }, () => Array(7).fill(0));

  for (const a of activity || []) {
    const actDate = new Date(a.createdAt);
    const diff = Math.floor((now - actDate.getTime()) / 86400000);
    if (diff >= 0 && diff < weeks * 7) {
      const weekIdx = Math.floor(diff / 7);
      const dayIdx = actDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      // Convert to Monday-based (L=0, M=1, X=2, J=3, V=4, S=5, D=6)
      const mondayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
      if (weekIdx < weeks && mondayIdx >= 0) grid[weeks - 1 - weekIdx][mondayIdx]++;
    }
  }

  // If no real data, use mock heatmap
  const hasData = (activity || []).length > 0;
  const mockGrid = [
    [1, 3, 2, 0, 4, 1, 0],
    [2, 1, 5, 3, 2, 0, 0],
    [0, 4, 3, 2, 1, 3, 1],
    [3, 2, 1, 4, 5, 2, 0],
  ];
  const displayGrid = hasData ? grid : mockGrid;

  const maxVal = Math.max(...displayGrid.flat(), 1);
  const cellColor = (v: number) => {
    if (v === 0) return 'bg-matrix-border/30';
    const intensity = v / maxVal;
    if (intensity <= 0.33) return 'bg-matrix-accent/20';
    if (intensity <= 0.66) return 'bg-matrix-accent/50';
    return 'bg-matrix-accent/80';
  };

  return (
    <SectionCard title={language === 'es' ? 'Actividad semanal' : 'Activity Heatmap'} icon="▦">
      {!hasData && <p className="text-[10px] text-matrix-muted/50 mb-2 italic">Sample data</p>}
      <div className="space-y-1">
        {displayGrid.map((week, wi) => (
          <div key={wi} className="flex gap-1">
            {week.map((val, di) => (
              <div
                key={di}
                className={`flex-1 h-4 rounded-sm ${cellColor(val)} transition-colors`}
                title={`${val} actions`}
              />
            ))}
          </div>
        ))}
        <div className="flex gap-1 mt-0.5">
          {dayLabels.map((d, i) => (
            <span key={i} className="flex-1 text-center text-[9px] text-matrix-muted">
              {d}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-[9px] text-matrix-muted">{language === 'es' ? 'Menos' : 'Less'}</span>
        {[0, 0.25, 0.5, 0.8].map((v, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${v === 0 ? 'bg-matrix-border/30' : v <= 0.33 ? 'bg-matrix-accent/20' : v <= 0.66 ? 'bg-matrix-accent/50' : 'bg-matrix-accent/80'}`}
          />
        ))}
        <span className="text-[9px] text-matrix-muted">{language === 'es' ? 'Más' : 'More'}</span>
      </div>
    </SectionCard>
  );
}

/* ── Task Distribution Mini ── */

function TaskDistributionCard({ language }: { language: 'en' | 'es' }) {
  const { data: allTasks } = useTasks();

  const counts: Record<string, number> = { pending: 0, in_progress: 0, done: 0 };
  for (const t of allTasks || []) {
    counts[t.status] = (counts[t.status] || 0) + 1;
  }
  const total = Object.values(counts).reduce((s, v) => s + v, 0);

  const bars = [
    { key: 'done', label: language === 'es' ? 'Hecho' : 'Done', color: 'bg-green-500', count: counts.done },
    {
      key: 'in_progress',
      label: language === 'es' ? 'En progreso' : 'In Progress',
      color: 'bg-amber-500',
      count: counts.in_progress,
    },
    { key: 'pending', label: language === 'es' ? 'Pendiente' : 'Pending', color: 'bg-gray-500', count: counts.pending },
  ];

  return (
    <SectionCard title={language === 'es' ? 'Distribución de tareas' : 'Task Breakdown'} icon="◔">
      {total === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">{t('noTasks' as LangKey, language)}</p>
      ) : (
        <div className="space-y-2">
          {/* Stacked bar */}
          <div className="flex h-3 rounded-full overflow-hidden">
            {bars
              .filter((b) => b.count > 0)
              .map((b) => (
                <div key={b.key} className={`${b.color}/70`} style={{ width: `${(b.count / total) * 100}%` }} />
              ))}
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {bars.map((b) => (
              <div key={b.key} className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${b.color}/70`} />
                <span className="text-gray-400 flex-1">{b.label}</span>
                <span className="text-matrix-muted font-mono text-[10px]">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ── Notes / Scratchpad ── */

function ScratchpadCard({ language }: { language: 'en' | 'es' }) {
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem('matrix-scratchpad') || '';
    } catch {
      return '';
    }
  });

  const handleChange = (val: string) => {
    setNotes(val);
    try {
      localStorage.setItem('matrix-scratchpad', val);
    } catch {
      /* ignore */
    }
  };

  return (
    <SectionCard title={language === 'es' ? 'Bloc de notas' : 'Scratchpad'} icon="✏">
      <textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={language === 'es' ? 'Escribe notas rápidas aquí...' : 'Quick notes, reminders, ideas...'}
        rows={5}
        className="w-full bg-matrix-bg border border-matrix-border rounded px-2 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/60 transition-colors resize-none"
      />
      <p className="text-[10px] text-gray-500 mt-1 text-right">
        {language === 'es' ? 'Guardado localmente' : 'Saved locally'}
      </p>
    </SectionCard>
  );
}

/* ── Analytics Charts ── */

function barColor(value: number): string {
  if (value <= 33) return '#ef4444';
  if (value <= 66) return '#f59e0b';
  return '#22c55e';
}

const TASK_COLORS: Record<string, string> = {
  pending: '#6b7280',
  in_progress: '#f59e0b',
  done: '#22c55e',
};

const IDEA_COLORS: Record<string, string> = {
  pending: '#6b7280',
  evaluating: '#3b82f6',
  approved: '#22c55e',
  rejected: '#ef4444',
  promoted: '#a855f7',
};

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value?: number; progress?: number } }>;
}

const ChartTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-matrix-surface border border-matrix-border rounded px-2 py-1 text-xs">
      <p className="text-gray-300">
        {d.name}: {d.value ?? d.progress}%
      </p>
    </div>
  );
};

function ObjectivesChartCard({ language }: { language: 'en' | 'es' }) {
  const { data: missions } = useMission();
  const mission = missions?.[0];
  const { data: objectives } = useObjectives(mission?.id);

  const objData = (objectives || []).map((o: Objective) => ({
    name: o.title.length > 25 ? o.title.slice(0, 25) + '…' : o.title,
    progress: o.progress ?? 0,
  }));

  return (
    <SectionCard title={t('objectivesProgress' as LangKey, language)} icon="◪">
      {objData.length === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">
          {language === 'es' ? 'Sin objetivos' : 'No objectives yet'}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={objData.length * 50 + 20}>
          <BarChart data={objData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="progress" radius={[0, 4, 4, 0]} barSize={20}>
              {objData.map((entry, i) => (
                <Cell key={i} fill={barColor(entry.progress)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

function TaskPieCard({ language }: { language: 'en' | 'es' }) {
  const { data: allTasks } = useTasks();
  const taskCounts: Record<string, number> = { pending: 0, in_progress: 0, done: 0 };
  for (const task of allTasks || []) {
    taskCounts[task.status] = (taskCounts[task.status] || 0) + 1;
  }
  const taskData = Object.entries(taskCounts)
    .filter(([, v]) => v > 0)
    .map(([status, value]) => ({ name: status, value }));

  return (
    <SectionCard title={t('taskDistribution' as LangKey, language)} icon="◔">
      {taskData.length === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">{t('noTasks' as LangKey, language)}</p>
      ) : (
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={taskData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
              >
                {taskData.map((entry, i) => (
                  <Cell key={i} fill={TASK_COLORS[entry.name] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-1">
            {taskData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TASK_COLORS[d.name] }} />
                <span className="text-matrix-muted">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function IdeasPieCard({ language }: { language: 'en' | 'es' }) {
  const { data: allIdeas } = useIdeas();
  const ideaCounts: Record<string, number> = {};
  for (const idea of allIdeas || []) {
    ideaCounts[idea.status] = (ideaCounts[idea.status] || 0) + 1;
  }
  const ideaData = Object.entries(ideaCounts)
    .filter(([, v]) => v > 0)
    .map(([status, value]) => ({ name: status, value }));

  return (
    <SectionCard title={t('ideasPipeline' as LangKey, language)} icon="✦">
      {ideaData.length === 0 ? (
        <p className="text-xs text-matrix-muted py-4 text-center">{language === 'es' ? 'Sin ideas' : 'No ideas yet'}</p>
      ) : (
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={ideaData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
              >
                {ideaData.map((entry, i) => (
                  <Cell key={i} fill={IDEA_COLORS[entry.name] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-1">
            {ideaData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: IDEA_COLORS[d.name] }} />
                <span className="text-matrix-muted">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ── Main ── */

export function OverviewView() {
  const { language } = useUiStore();
  const { data: missions, isLoading } = useMission();
  const mission = missions?.[0];

  if (isLoading) return <div className="p-4 text-matrix-muted text-sm">{t('loading', language)}</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-medium text-gray-200">{t('overview', language)}</h1>

      {/* Top row: Schema left, side cards right */}
      <div className="flex gap-4">
        {/* Left: Strategic Schema + bottom cards */}
        <div className="flex-1 min-w-0 space-y-4">
          <SectionCard title="Strategic Schema" icon="◈">
            {mission ? <StrategicSchemaActive /> : <StrategicSchemaSetup />}
          </SectionCard>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StatsCard language={language} />
            <ActiveProjectsCard language={language} />
            <RecentActivityCard language={language} />
            <QuickCaptureCard language={language} />
          </div>
          {/* Analytics Charts */}
          <ObjectivesChartCard language={language} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TaskPieCard language={language} />
            <IdeasPieCard language={language} />
          </div>
        </div>

        {/* Right column: visible on xl+ */}
        <div className="hidden xl:flex flex-col gap-4 w-80 shrink-0">
          <ObjectivesGlanceCard language={language} />
          <FocusQueueCard language={language} />
          <TaskDistributionCard language={language} />
          <WeeklyHeatmapCard language={language} />
          <UpcomingDeadlinesCard language={language} />
          <ScratchpadCard language={language} />
        </div>
      </div>

      {/* Show right-column cards below on smaller screens */}
      <div className="xl:hidden grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ObjectivesGlanceCard language={language} />
        <FocusQueueCard language={language} />
        <TaskDistributionCard language={language} />
        <WeeklyHeatmapCard language={language} />
        <UpcomingDeadlinesCard language={language} />
        <ScratchpadCard language={language} />
      </div>
    </div>
  );
}
