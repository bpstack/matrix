import { eq } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { subscriptions } from '../db/schema';

const now = () => new Date().toISOString();

export const subscriptionsRepo = {
  findAll() {
    return getDb().select().from(subscriptions).all();
  },

  findById(id: number) {
    return getDb().select().from(subscriptions).where(eq(subscriptions.id, id)).get();
  },

  create(data: { name: string; cycle?: string; resetDay?: number; budget?: number }) {
    return getDb()
      .insert(subscriptions)
      .values({ ...data, updatedAt: now() })
      .returning()
      .get();
  },

  update(id: number, data: Partial<{ name: string; cycle: string; resetDay: number; budget: number; currentUsed: number }>) {
    return getDb()
      .update(subscriptions)
      .set({ ...data, updatedAt: now() })
      .where(eq(subscriptions.id, id))
      .returning()
      .get();
  },

  delete(id: number) {
    return getDb().delete(subscriptions).where(eq(subscriptions.id, id)).run();
  },
};
