import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface Subscription {
  id: number;
  name: string;
  cycle: string;
  resetDay: number;
  budget: number;
  currentUsed: number;
  updatedAt: string;
}

export function useSubscriptions() {
  return useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: () => apiFetch('/subscriptions'),
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; cycle?: string; resetDay?: number; budget?: number }) =>
      apiFetch('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); },
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; cycle?: string; resetDay?: number; budget?: number; currentUsed?: number }) =>
      apiFetch(`/subscriptions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); },
  });
}

export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/subscriptions/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); },
  });
}

export function useUpdateUsage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, currentUsed }: { id: number; currentUsed: number }) =>
      apiFetch(`/subscriptions/${id}/usage`, { method: 'PATCH', body: JSON.stringify({ currentUsed }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); },
  });
}
