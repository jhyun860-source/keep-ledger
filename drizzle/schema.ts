import { boolean, date, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing the Manus authentication flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Staff names available for authorship and table-service assignment. */
export const employees = mysqlTable(
  "employees",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 80 }).notNull().unique(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("employees_active_idx").on(table.isActive)],
);

/** A bottle currently recorded in the keep ledger. */
export const keepEntries = mysqlTable(
  "keepEntries",
  {
    id: int("id").autoincrement().primaryKey(),
    keptOn: date("keptOn", { mode: "string" }).notNull(),
    liquorName: varchar("liquorName", { length: 120 }).notNull(),
    remainingPercent: int("remainingPercent").notNull(),
    authorEmployeeId: int("authorEmployeeId")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("keep_entries_date_idx").on(table.keptOn),
    index("keep_entries_author_idx").on(table.authorEmployeeId),
    index("keep_entries_liquor_idx").on(table.liquorName),
  ],
);

/** An event in which a kept bottle was delivered to a guest table. */
export const withdrawals = mysqlTable(
  "withdrawals",
  {
    id: int("id").autoincrement().primaryKey(),
    keepEntryId: int("keepEntryId")
      .notNull()
      .references(() => keepEntries.id, { onDelete: "cascade" }),
    customerName: varchar("customerName", { length: 100 }).notNull(),
    employeeId: int("employeeId")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),
    withdrawnAt: timestamp("withdrawnAt").defaultNow().notNull(),
  },
  table => [
    index("withdrawals_keep_entry_idx").on(table.keepEntryId),
    index("withdrawals_employee_idx").on(table.employeeId),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type KeepEntry = typeof keepEntries.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
