import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createKeepEntry,
  createOrReactivateEmployee,
  createWithdrawal,
  deactivateEmployee,
  getActiveEmployeeById,
  getKeepEntryById,
  listActiveEmployees,
  listKeepEntries,
  listWithdrawals,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const employeeNameSchema = z.string().trim().min(1, "직원 이름을 입력해 주세요.").max(80, "직원 이름은 80자 이하여야 합니다.");
export const createEmployeeInputSchema = z.object({ name: employeeNameSchema });
export const employeeIdInputSchema = z.object({ employeeId: z.number().int().positive() });
export const createKeepEntryInputSchema = z.object({
  keptOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다."),
  liquorName: z.string().trim().min(1, "술 종류를 입력해 주세요.").max(120),
  remainingPercent: z.number().int().min(0, "잔량은 0% 이상이어야 합니다.").max(100, "잔량은 100% 이하여야 합니다."),
  authorEmployeeId: z.number().int().positive("작성 직원을 선택해 주세요."),
});
export const ledgerFilterInputSchema = z
  .object({
    keptOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    liquorQuery: z.string().trim().max(120).optional(),
    authorEmployeeId: z.number().int().positive().optional(),
  })
  .optional();
export const withdrawalListInputSchema = z.object({ keepEntryId: z.number().int().positive() });
export const createWithdrawalInputSchema = z.object({
  keepEntryId: z.number().int().positive(),
  customerName: z.string().trim().min(1, "손님 이름을 입력해 주세요.").max(100),
  employeeId: z.number().int().positive("담당 직원을 선택해 주세요."),
});

async function requireActiveEmployee(employeeId: number) {
  const employee = await getActiveEmployeeById(employeeId);
  if (!employee) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "현재 선택할 수 없는 직원입니다." });
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  employees: router({
    active: protectedProcedure.query(() => listActiveEmployees()),
    add: protectedProcedure.input(createEmployeeInputSchema).mutation(async ({ input }) => {
      const id = await createOrReactivateEmployee(input.name);
      return { id, success: true } as const;
    }),
    deactivate: protectedProcedure.input(employeeIdInputSchema).mutation(async ({ input }) => {
      await deactivateEmployee(input.employeeId);
      return { success: true } as const;
    }),
  }),
  ledger: router({
    list: protectedProcedure.input(ledgerFilterInputSchema).query(({ input }) => listKeepEntries(input ?? {})),
    create: protectedProcedure.input(createKeepEntryInputSchema).mutation(async ({ input }) => {
      await requireActiveEmployee(input.authorEmployeeId);
      await createKeepEntry(input);
      return { success: true } as const;
    }),
    withdrawals: protectedProcedure.input(withdrawalListInputSchema).query(({ input }) => listWithdrawals(input.keepEntryId)),
    addWithdrawal: protectedProcedure.input(createWithdrawalInputSchema).mutation(async ({ input }) => {
      const keepEntry = await getKeepEntryById(input.keepEntryId);
      if (!keepEntry) throw new TRPCError({ code: "NOT_FOUND", message: "킵 항목을 찾을 수 없습니다." });
      await requireActiveEmployee(input.employeeId);
      await createWithdrawal(input);
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
