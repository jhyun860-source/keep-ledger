import { and, desc, eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  employees,
  keepEntries,
  type InsertUser,
  users,
  withdrawals,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export type LedgerFilters = {
  keptOn?: string;
  liquorQuery?: string;
  authorEmployeeId?: number;
};

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });

  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

function requireDatabase<T>(db: T | null): T {
  if (!db) throw new Error("데이터베이스에 연결할 수 없습니다.");
  return db;
}

export async function listActiveEmployees() {
  const db = requireDatabase(await getDb());
  return db
    .select({ id: employees.id, name: employees.name })
    .from(employees)
    .where(eq(employees.isActive, true))
    .orderBy(employees.name);
}

export async function getActiveEmployeeById(employeeId: number) {
  const db = requireDatabase(await getDb());
  const result = await db
    .select({ id: employees.id, name: employees.name })
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.isActive, true)))
    .limit(1);
  return result[0];
}

export async function createOrReactivateEmployee(name: string) {
  const db = requireDatabase(await getDb());
  const existing = await db.select().from(employees).where(eq(employees.name, name)).limit(1);

  if (existing[0]) {
    await db.update(employees).set({ isActive: true }).where(eq(employees.id, existing[0].id));
    return existing[0].id;
  }

  await db.insert(employees).values({ name, isActive: true });
  const created = await db.select({ id: employees.id }).from(employees).where(eq(employees.name, name)).limit(1);
  return created[0]?.id;
}

/** Soft deletion protects historic authorship and withdrawal accountability. */
export async function deactivateEmployee(employeeId: number) {
  const db = requireDatabase(await getDb());
  await db.update(employees).set({ isActive: false }).where(eq(employees.id, employeeId));
}

export async function listKeepEntries(filters: LedgerFilters) {
  const db = requireDatabase(await getDb());
  const conditions = [];
  if (filters.keptOn) conditions.push(eq(keepEntries.keptOn, filters.keptOn));
  if (filters.authorEmployeeId) conditions.push(eq(keepEntries.authorEmployeeId, filters.authorEmployeeId));
  if (filters.liquorQuery) conditions.push(like(keepEntries.liquorName, `%${filters.liquorQuery}%`));

  const query = db
    .select({
      id: keepEntries.id,
      keptOn: keepEntries.keptOn,
      liquorName: keepEntries.liquorName,
      remainingPercent: keepEntries.remainingPercent,
      authorEmployeeId: keepEntries.authorEmployeeId,
      authorName: employees.name,
      createdAt: keepEntries.createdAt,
    })
    .from(keepEntries)
    .innerJoin(employees, eq(keepEntries.authorEmployeeId, employees.id));

  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(keepEntries.keptOn), desc(keepEntries.createdAt));
  }
  return query.orderBy(desc(keepEntries.keptOn), desc(keepEntries.createdAt));
}

export async function createKeepEntry(input: {
  keptOn: string;
  liquorName: string;
  remainingPercent: number;
  authorEmployeeId: number;
}) {
  const db = requireDatabase(await getDb());
  await db.insert(keepEntries).values(input);
}

export async function getKeepEntryById(keepEntryId: number) {
  const db = requireDatabase(await getDb());
  const result = await db.select({ id: keepEntries.id }).from(keepEntries).where(eq(keepEntries.id, keepEntryId)).limit(1);
  return result[0];
}

export async function listWithdrawals(keepEntryId: number) {
  const db = requireDatabase(await getDb());
  return db
    .select({
      id: withdrawals.id,
      customerName: withdrawals.customerName,
      employeeName: employees.name,
      withdrawnAt: withdrawals.withdrawnAt,
    })
    .from(withdrawals)
    .innerJoin(employees, eq(withdrawals.employeeId, employees.id))
    .where(eq(withdrawals.keepEntryId, keepEntryId))
    .orderBy(desc(withdrawals.withdrawnAt));
}

export async function createWithdrawal(input: { keepEntryId: number; customerName: string; employeeId: number }) {
  const db = requireDatabase(await getDb());
  await db.insert(withdrawals).values(input);
}
