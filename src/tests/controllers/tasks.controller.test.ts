import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../backend/repositories/tasks.repository', () => ({
  tasksRepo: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findFiltered: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../backend/repositories/activity.repository', () => ({
  activityRepo: { log: vi.fn() },
}));

import { tasksController } from '../../backend/controllers/tasks.controller';
import { tasksRepo } from '../../backend/repositories/tasks.repository';
import { activityRepo } from '../../backend/repositories/activity.repository';

const mockReq = (opts: { body?: unknown; params?: Record<string, string>; query?: Record<string, string> } = {}) =>
  ({ body: opts.body ?? {}, params: opts.params ?? {}, query: opts.query ?? {} }) as any;

const mockRes = () => {
  const res = { status: vi.fn(), json: vi.fn(), send: vi.fn() };
  res.status.mockReturnValue(res);
  return res as any;
};

beforeEach(() => vi.clearAllMocks());

describe('tasksController', () => {
  describe('create', () => {
    it('returns 400 when title is missing', () => {
      const req = mockReq({ body: { planId: 1 } });
      const res = mockRes();
      tasksController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(tasksRepo.create).not.toHaveBeenCalled();
    });

    it('returns 400 when planId is missing', () => {
      const req = mockReq({ body: { title: 'Test' } });
      const res = mockRes();
      tasksController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('creates task and returns 201', () => {
      vi.mocked(tasksRepo.create).mockReturnValue({ id: 1, title: 'Test', status: 'pending' } as any);
      const req = mockReq({ body: { planId: 1, title: 'Test' } });
      const res = mockRes();
      tasksController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(tasksRepo.create).toHaveBeenCalledWith({ planId: 1, title: 'Test' });
    });

    it('calls activityRepo.log after creating', () => {
      vi.mocked(tasksRepo.create).mockReturnValue({ id: 1, title: 'Test' } as any);
      const req = mockReq({ body: { planId: 1, title: 'Test' } });
      const res = mockRes();
      tasksController.create(req, res);
      expect(activityRepo.log).toHaveBeenCalledWith('created', 'task', 1, expect.stringContaining('Test'));
    });
  });

  describe('update', () => {
    it('returns 404 when task not found', () => {
      vi.mocked(tasksRepo.update).mockReturnValue(undefined);
      const req = mockReq({ body: {}, params: { id: '999' } });
      const res = mockRes();
      tasksController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('sets completedAt when status is done', () => {
      vi.mocked(tasksRepo.update).mockReturnValue({ id: 1, title: 'Test', status: 'done' } as any);
      const req = mockReq({ body: { status: 'done' }, params: { id: '1' } });
      const res = mockRes();
      tasksController.update(req, res);
      const updateCall = vi.mocked(tasksRepo.update).mock.calls[0];
      expect(updateCall[1]).toMatchObject({ status: 'done', completedAt: expect.any(String) });
    });

    it('clears completedAt when status is changed from done', () => {
      vi.mocked(tasksRepo.update).mockReturnValue({
        id: 1,
        title: 'Test',
        status: 'pending',
        completedAt: null,
      } as any);
      const req = mockReq({ body: { status: 'pending' }, params: { id: '1' } });
      const res = mockRes();
      tasksController.update(req, res);
      const updateCall = vi.mocked(tasksRepo.update).mock.calls[0];
      expect(updateCall[1]).toMatchObject({ status: 'pending', completedAt: null });
    });

    it('logs completed when status is done', () => {
      vi.mocked(tasksRepo.update).mockReturnValue({ id: 1, title: 'Test', status: 'done' } as any);
      const req = mockReq({ body: { status: 'done' }, params: { id: '1' } });
      const res = mockRes();
      tasksController.update(req, res);
      expect(activityRepo.log).toHaveBeenCalledWith('completed', 'task', 1, expect.stringContaining('Test'));
    });
  });

  describe('delete', () => {
    it('returns 404 when task not found', () => {
      vi.mocked(tasksRepo.findById).mockReturnValue(undefined);
      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();
      tasksController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(tasksRepo.delete).not.toHaveBeenCalled();
    });

    it('deletes task and logs', () => {
      vi.mocked(tasksRepo.findById).mockReturnValue({ id: 1, title: 'Test' } as any);
      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      tasksController.delete(req, res);
      expect(tasksRepo.delete).toHaveBeenCalledWith(1);
      expect(activityRepo.log).toHaveBeenCalledWith('deleted', 'task', 1, expect.stringContaining('Test'));
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe('getAll', () => {
    it('returns filtered tasks by status', () => {
      vi.mocked(tasksRepo.findFiltered).mockReturnValue([{ id: 1, status: 'done' }] as any);
      const req = mockReq({ query: { status: 'done' } });
      const res = mockRes();
      tasksController.getAll(req, res);
      expect(tasksRepo.findFiltered).toHaveBeenCalledWith({ status: 'done' });
      expect(res.json).toHaveBeenCalledWith([{ id: 1, status: 'done' }]);
    });

    it('returns filtered tasks by plan_id', () => {
      vi.mocked(tasksRepo.findFiltered).mockReturnValue([] as any);
      const req = mockReq({ query: { plan_id: '5' } });
      const res = mockRes();
      tasksController.getAll(req, res);
      expect(tasksRepo.findFiltered).toHaveBeenCalledWith({ planId: 5 });
    });
  });

  describe('getById', () => {
    it('returns 404 when not found', () => {
      vi.mocked(tasksRepo.findById).mockReturnValue(undefined);
      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();
      tasksController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns task when found', () => {
      vi.mocked(tasksRepo.findById).mockReturnValue({ id: 1, title: 'Test' } as any);
      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      tasksController.getById(req, res);
      expect(res.json).toHaveBeenCalledWith({ id: 1, title: 'Test' });
    });
  });
});
