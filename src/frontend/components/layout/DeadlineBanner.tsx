import { useDeadlines } from '../../hooks/useDeadlines';
import { useUiStore } from '../../stores/ui.store';

export function DeadlineBanner() {
  const { data, isLoading } = useDeadlines();
  const { language, setActiveTab } = useUiStore();

  if (isLoading || !data || data.total === 0) return null;

  const { overdue, dueToday, dueSoon } = data;
  const messages: string[] = [];

  if (overdue.length > 0) {
    messages.push(`${overdue.length} ${language === 'es' ? 'vencida(s)' : 'overdue'}`);
  }
  if (dueToday.length > 0) {
    messages.push(`${dueToday.length} ${language === 'es' ? 'hoy' : 'today'}`);
  }
  if (dueSoon.length > 0) {
    messages.push(`${dueSoon.length} ${language === 'es' ? 'pronto' : 'soon'}`);
  }

  return (
    <div
      className={`px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity ${
        overdue.length > 0 ? 'bg-red-600' : 'bg-amber-500'
      }`}
      onClick={() => setActiveTab('tasks')}
    >
      <div className="flex items-center gap-2">
        <span className="text-white">⚠</span>
        <span className="text-white font-medium">{messages.join(' | ')}</span>
      </div>
      <span className="text-white/80">{language === 'es' ? 'Ver tareas →' : 'View tasks →'}</span>
    </div>
  );
}
