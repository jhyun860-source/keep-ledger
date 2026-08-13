import { describe, expect, it } from "vitest";
import {
  createEmployeeInputSchema,
  createKeepEntryInputSchema,
  createWithdrawalInputSchema,
} from "./routers";

describe("킵장부 입력 규칙", () => {
  it("직원 이름의 앞뒤 공백을 제거하고 이름을 허용한다", () => {
    expect(createEmployeeInputSchema.parse({ name: "  서윤  " })).toEqual({ name: "서윤" });
  });

  it("0%부터 100%까지의 정수 잔량만 허용한다", () => {
    expect(createKeepEntryInputSchema.safeParse({
      keptOn: "2026-08-13",
      liquorName: "싱글 몰트 위스키",
      remainingPercent: 100,
      authorEmployeeId: 1,
    }).success).toBe(true);

    expect(createKeepEntryInputSchema.safeParse({
      keptOn: "2026-08-13",
      liquorName: "싱글 몰트 위스키",
      remainingPercent: 101,
      authorEmployeeId: 1,
    }).success).toBe(false);
  });

  it("반출 기록에는 손님과 담당 직원이 모두 필요하다", () => {
    expect(createWithdrawalInputSchema.safeParse({
      keepEntryId: 1,
      customerName: "",
      employeeId: 2,
    }).success).toBe(false);
    expect(createWithdrawalInputSchema.safeParse({
      keepEntryId: 1,
      customerName: "김고객",
      employeeId: 2,
    }).success).toBe(true);
  });
});
