import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ArchiveRestore, CalendarDays, ChevronRight, CircleAlert, ClipboardList, GlassWater, History, Plus, RefreshCw, Search, SlidersHorizontal, UserRound, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type Employee = { id: number; name: string };
type LedgerEntry = {
  id: number;
  keptOn: string;
  liquorName: string;
  remainingPercent: number;
  authorEmployeeId: number;
  authorName: string;
  createdAt: Date;
};

const today = () => new Date().toLocaleDateString("en-CA");

function formattedDate(value: string | Date) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(new Date(value));
}

function formattedTime(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function PercentBadge({ value }: { value: number }) {
  const style = value <= 25 ? "border-[#c9775f]/35 bg-[#fbebe5] text-[#9e432d]" : value <= 60 ? "border-[#c5a36a]/35 bg-[#fbf3df] text-[#8f6b2e]" : "border-[#789f82]/30 bg-[#eaf3ea] text-[#3c774b]";
  return <Badge variant="outline" className={cn("min-w-14 justify-center rounded-full px-2.5 py-1 text-xs font-semibold", style)}>{value}%</Badge>;
}

function WithdrawalDialog({ entry, employees, open, onOpenChange }: { entry: LedgerEntry | null; employees: Employee[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const utils = trpc.useUtils();
  const [customerName, setCustomerName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const historyQuery = trpc.ledger.withdrawals.useQuery({ keepEntryId: entry?.id ?? 0 }, { enabled: open && Boolean(entry) });
  const addWithdrawal = trpc.ledger.addWithdrawal.useMutation({
    onSuccess: async () => {
      setCustomerName("");
      setEmployeeId("");
      if (entry) await utils.ledger.withdrawals.invalidate({ keepEntryId: entry.id });
      toast.success("반출 기록을 저장했습니다.");
    },
    onError: error => toast.error(error.message),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!entry || !employeeId) return toast.error("손님 이름과 담당 직원을 확인해 주세요.");
    addWithdrawal.mutate({ keepEntryId: entry.id, customerName, employeeId: Number(employeeId) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto border-[#ded4c6] bg-[#fcf9f3] p-0 sm:rounded-[1.5rem]">
        <div className="border-b border-[#e2d8ca] px-6 py-6">
          <DialogHeader>
            <p className="font-display text-xs tracking-[0.18em] text-[#a27f4e]">WITHDRAWAL LOG</p>
            <DialogTitle className="mt-1 font-display text-2xl font-medium text-[#2b231b]">{entry?.liquorName || "킵 항목"}</DialogTitle>
            <DialogDescription className="text-[#756b60]">반출한 손님과 해당 병을 테이블로 가져간 담당 직원을 기록합니다.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-6 px-6 pb-6 pt-5">
          <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-[#e2d8ca] bg-[#f7f2e9] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="customer-name" className="text-xs text-[#5f554b]">반출한 손님</Label>
              <Input id="customer-name" value={customerName} onChange={event => setCustomerName(event.target.value)} placeholder="손님 이름" className="h-10 border-[#d8ccbd] bg-[#fffdf9]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-employee" className="text-xs text-[#5f554b]">담당 직원</Label>
              <select id="withdrawal-employee" value={employeeId} onChange={event => setEmployeeId(event.target.value)} className="h-10 w-full rounded-md border border-[#d8ccbd] bg-[#fffdf9] px-3 text-sm outline-none focus:ring-2 focus:ring-[#b69460]/40">
                <option value="">직원 선택</option>
                {employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
              </select>
            </div>
            <Button type="submit" disabled={addWithdrawal.isPending || employees.length === 0} className="h-10 rounded-lg bg-[#2d261f] px-4 text-[#f8f0e4] hover:bg-[#483a2d]">
              <ArchiveRestore className="mr-1.5 h-4 w-4" /> {addWithdrawal.isPending ? "저장 중" : "반출 기록"}
            </Button>
          </form>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#332a21]">반출 이력</h3>
              <span className="text-xs text-[#897c6d]">총 {historyQuery.data?.length || 0}건</span>
            </div>
            {historyQuery.isLoading ? <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : historyQuery.isError ? (
              <div className="rounded-xl border border-[#e8c9bc] bg-[#fff4ef] px-4 py-6 text-center">
                <CircleAlert className="mx-auto h-5 w-5 text-[#a24d38]" />
                <p className="mt-2 text-sm font-medium text-[#7e3d2c]">반출 이력을 불러오지 못했습니다.</p>
                <Button type="button" variant="outline" size="sm" onClick={() => void historyQuery.refetch()} className="mt-3 border-[#dfb4a5] bg-transparent text-[#7e3d2c]"><RefreshCw className="mr-1.5 h-3.5 w-3.5" />다시 시도</Button>
              </div>
            ) : historyQuery.data?.length ? (
              <div className="overflow-hidden rounded-xl border border-[#e2d8ca] bg-[#fffdf9]">
                {historyQuery.data.map((record, index) => (
                  <div key={record.id} className={cn("flex items-center gap-3 px-4 py-3", index > 0 && "border-t border-[#eee6db]")}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#efe5d4] text-[#8a6a3b]"><UserRound className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium text-[#362c22]">{record.customerName}</p><p className="mt-0.5 text-xs text-[#837668]">담당 {record.employeeName}</p></div>
                    <time className="text-right text-xs text-[#837668]">{formattedTime(record.withdrawnAt)}</time>
                  </div>
                ))}
              </div>
            ) : <div className="rounded-xl border border-dashed border-[#d9ccbc] bg-[#fbf8f2] px-4 py-7 text-center text-sm text-[#817464]">아직 등록된 반출 기록이 없습니다.</div>}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewEntryDialog({ employees, open, onOpenChange }: { employees: Employee[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const utils = trpc.useUtils();
  const [keptOn, setKeptOn] = useState(today);
  const [liquorName, setLiquorName] = useState("");
  const [remainingPercent, setRemainingPercent] = useState("100");
  const [authorEmployeeId, setAuthorEmployeeId] = useState("");
  const createEntry = trpc.ledger.create.useMutation({
    onSuccess: async () => {
      setLiquorName("");
      setRemainingPercent("100");
      setAuthorEmployeeId("");
      await utils.ledger.list.invalidate();
      onOpenChange(false);
      toast.success("새 킵 항목을 등록했습니다.");
    },
    onError: error => toast.error(error.message),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!authorEmployeeId) return toast.error("작성 직원을 선택해 주세요.");
    createEntry.mutate({ keptOn, liquorName, remainingPercent: Number(remainingPercent), authorEmployeeId: Number(authorEmployeeId) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-[#ded4c6] bg-[#fcf9f3] p-0 sm:rounded-[1.5rem]">
        <div className="border-b border-[#e2d8ca] px-6 py-6"><DialogHeader><p className="font-display text-xs tracking-[0.18em] text-[#a27f4e]">NEW KEEP ENTRY</p><DialogTitle className="mt-1 font-display text-2xl font-medium text-[#2b231b]">새 킵 항목 등록</DialogTitle><DialogDescription className="text-[#756b60]">기본 정보를 정확히 기록하면 매장 인수인계가 쉬워집니다.</DialogDescription></DialogHeader></div>
        <form onSubmit={submit} className="space-y-5 px-6 pb-7 pt-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="kept-on" className="text-sm text-[#51463b]">날짜</Label><Input id="kept-on" type="date" value={keptOn} onChange={event => setKeptOn(event.target.value)} className="h-11 border-[#d8ccbd] bg-[#fffdf9]" required /></div>
            <div className="space-y-2"><Label htmlFor="remaining-percent" className="text-sm text-[#51463b]">남은 잔량 <span className="text-[#a38252]">(%)</span></Label><Input id="remaining-percent" type="number" min="0" max="100" value={remainingPercent} onChange={event => setRemainingPercent(event.target.value)} className="h-11 border-[#d8ccbd] bg-[#fffdf9]" required /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="liquor-name" className="text-sm text-[#51463b]">술 종류</Label><Input id="liquor-name" value={liquorName} onChange={event => setLiquorName(event.target.value)} placeholder="예: 맥캘란 12년 더블캐스크" className="h-11 border-[#d8ccbd] bg-[#fffdf9]" required /></div>
          <div className="space-y-2"><Label htmlFor="author-employee" className="text-sm text-[#51463b]">작성자</Label><select id="author-employee" value={authorEmployeeId} onChange={event => setAuthorEmployeeId(event.target.value)} className="h-11 w-full rounded-md border border-[#d8ccbd] bg-[#fffdf9] px-3 text-sm outline-none focus:ring-2 focus:ring-[#b69460]/40" required><option value="">직원 선택</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select>{employees.length === 0 && <p className="text-xs text-[#9a4e3b]">먼저 직원 관리에서 직원 이름을 추가해 주세요.</p>}</div>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-[#64574b]">취소</Button><Button type="submit" disabled={createEntry.isPending || employees.length === 0} className="h-11 rounded-lg bg-[#b6925f] px-5 text-[#281f16] hover:bg-[#c5a46f]"><Plus className="mr-1.5 h-4 w-4" />{createEntry.isPending ? "등록 중" : "킵 항목 등록"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [filters, setFilters] = useState({ keptOn: "", liquorQuery: "", authorEmployeeId: "" });
  const employeesQuery = trpc.employees.active.useQuery();
  const activeFilters = useMemo(() => ({ keptOn: filters.keptOn || undefined, liquorQuery: filters.liquorQuery || undefined, authorEmployeeId: filters.authorEmployeeId ? Number(filters.authorEmployeeId) : undefined }), [filters]);
  const ledgerQuery = trpc.ledger.list.useQuery(activeFilters);
  const employees = employeesQuery.data || [];
  const entries = (ledgerQuery.data || []) as LedgerEntry[];
  const averagePercent = entries.length ? Math.round(entries.reduce((sum, entry) => sum + entry.remainingPercent, 0) / entries.length) : 0;
  const lowStock = entries.filter(entry => entry.remainingPercent <= 25).length;
  const filterActive = Boolean(filters.keptOn || filters.liquorQuery || filters.authorEmployeeId);
  const clearFilters = () => setFilters({ keptOn: "", liquorQuery: "", authorEmployeeId: "" });

  return (
    <div className="mx-auto max-w-[1440px] space-y-7">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-[#211c17] px-6 py-7 text-[#f7f0e5] shadow-[0_12px_35px_rgba(65,45,24,0.14)] sm:px-8 sm:py-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border border-[#c6a66a]/15" /><div className="absolute -right-6 -top-8 h-40 w-40 rounded-full border border-[#c6a66a]/10" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div><p className="font-display text-xs tracking-[0.2em] text-[#d2b57d]">VELLUM · DAILY CONTROL</p><h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">킵 장부</h1><p className="mt-2 max-w-md text-sm leading-6 text-[#c9bdac]">병의 흐름을 선명하게 기록하고, 매장의 신뢰를 오래 지켜보세요.</p></div>
          <Button onClick={() => setNewEntryOpen(true)} className="h-11 rounded-xl bg-[#c6a66a] px-5 font-semibold text-[#251e17] shadow-sm hover:bg-[#d5ba80]"><Plus className="mr-2 h-4 w-4" />새 킵 등록</Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card flex items-center gap-4 p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#efe3cf] text-[#966f36]"><ClipboardList className="h-5 w-5" /></span><div><p className="text-xs font-medium tracking-wide text-[#827467]">현재 조회 항목</p><p className="mt-1 font-display text-2xl text-[#2b231b]">{ledgerQuery.isLoading ? "—" : entries.length}<span className="ml-1 text-sm font-sans text-[#837668]">건</span></p></div></div>
        <div className="surface-card flex items-center gap-4 p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f1e8] text-[#477954]"><GlassWater className="h-5 w-5" /></span><div><p className="text-xs font-medium tracking-wide text-[#827467]">평균 남은 잔량</p><p className="mt-1 font-display text-2xl text-[#2b231b]">{ledgerQuery.isLoading ? "—" : averagePercent}<span className="ml-0.5 text-sm font-sans text-[#837668]">%</span></p></div></div>
        <div className="surface-card flex items-center gap-4 p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8e8e1] text-[#a54d36]"><History className="h-5 w-5" /></span><div><p className="text-xs font-medium tracking-wide text-[#827467]">잔량 확인 필요</p><p className="mt-1 font-display text-2xl text-[#2b231b]">{ledgerQuery.isLoading ? "—" : lowStock}<span className="ml-1 text-sm font-sans text-[#837668]">건</span></p></div></div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[#e3d9ca] px-5 py-5 sm:px-6"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><p className="font-display text-xs tracking-[0.17em] text-[#a27f4e]">KEEP BOTTLE LIST</p><h2 className="mt-1 text-lg font-semibold text-[#332a21]">킵 장부 목록</h2></div><div className="flex items-center gap-2 text-xs text-[#837668]"><CalendarDays className="h-4 w-4" />기록일 · 주종 · 작성자 기준 조회</div></div>
          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(170px,0.85fr)_minmax(200px,1.25fr)_minmax(150px,0.8fr)_auto]">
            <div className="relative"><CalendarDays className="absolute left-3 top-3 h-4 w-4 text-[#958676]" /><Input type="date" value={filters.keptOn} onChange={event => setFilters(current => ({ ...current, keptOn: event.target.value }))} className="h-10 border-[#ddd1c1] bg-[#fcfaf6] pl-9 text-sm" /></div>
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-[#958676]" /><Input value={filters.liquorQuery} onChange={event => setFilters(current => ({ ...current, liquorQuery: event.target.value }))} placeholder="술 종류로 검색" className="h-10 border-[#ddd1c1] bg-[#fcfaf6] pl-9 text-sm" /></div>
            <select value={filters.authorEmployeeId} onChange={event => setFilters(current => ({ ...current, authorEmployeeId: event.target.value }))} className="h-10 w-full rounded-md border border-[#ddd1c1] bg-[#fcfaf6] px-3 text-sm outline-none focus:ring-2 focus:ring-[#b69460]/40"><option value="">전체 작성자</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select>
            {filterActive ? <Button type="button" variant="ghost" onClick={clearFilters} className="h-10 justify-center text-[#7b6250] hover:bg-[#f1e8dc]"><X className="mr-1 h-4 w-4" />초기화</Button> : <div className="hidden lg:block" />}
          </div>
        </div>

        {ledgerQuery.isLoading ? <div className="space-y-3 p-6"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div> : ledgerQuery.isError || employeesQuery.isError ? (
          <div className="flex flex-col items-center px-6 py-16 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8e8e1] text-[#a54d36]"><CircleAlert className="h-6 w-6" /></span><h3 className="mt-4 font-display text-xl text-[#382e24]">장부를 불러오지 못했습니다</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#817465]">네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p><Button variant="outline" onClick={() => { void employeesQuery.refetch(); void ledgerQuery.refetch(); }} className="mt-5 border-[#d8cab8] bg-transparent"><RefreshCw className="mr-1.5 h-4 w-4" />다시 시도</Button></div>
        ) : entries.length ? (
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-[#f7f2ea] text-[11px] font-semibold tracking-[0.11em] text-[#857767]"><tr><th className="px-6 py-3.5">날짜</th><th className="px-6 py-3.5">술 종류</th><th className="px-6 py-3.5">남은 잔량</th><th className="px-6 py-3.5">작성자</th><th className="px-6 py-3.5 text-right">반출 / 이력</th></tr></thead><tbody className="divide-y divide-[#ede5da] bg-[#fffdf9]">{entries.map(entry => <tr key={entry.id} className="transition-colors hover:bg-[#fcf8f1]"><td className="whitespace-nowrap px-6 py-4 text-sm text-[#5d5044]">{formattedDate(entry.keptOn)}</td><td className="px-6 py-4"><p className="font-medium text-[#332a21]">{entry.liquorName}</p><p className="mt-1 text-xs text-[#9a8b7b]">#{String(entry.id).padStart(4, "0")}</p></td><td className="px-6 py-4"><PercentBadge value={entry.remainingPercent} /></td><td className="px-6 py-4"><span className="inline-flex items-center gap-2 text-sm text-[#5d5044]"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eee3d4] text-[10px] font-semibold text-[#80633c]">{entry.authorName.slice(0, 1)}</span>{entry.authorName}</span></td><td className="px-6 py-4 text-right"><Button onClick={() => setSelectedEntry(entry)} variant="outline" className="h-9 rounded-lg border-[#ded2c2] bg-transparent px-3 text-xs text-[#5e4934] hover:bg-[#f2e8da]"><ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />반출 기록<ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></td></tr>)}</tbody></table></div>
        ) : <div className="flex flex-col items-center px-6 py-16 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e8db] text-[#967243]"><SlidersHorizontal className="h-6 w-6" /></span><h3 className="mt-4 font-display text-xl text-[#382e24]">표시할 킵 항목이 없습니다</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#817465]">{filterActive ? "필터 조건을 조정하거나 초기화해 보세요." : "첫 킵 항목을 등록하여 매장 기록을 시작해 보세요."}</p>{filterActive ? <Button variant="outline" onClick={clearFilters} className="mt-5 border-[#d8cab8]">필터 초기화</Button> : <Button onClick={() => setNewEntryOpen(true)} className="mt-5 bg-[#2d261f] text-[#f8f0e4] hover:bg-[#483a2d]"><Plus className="mr-1.5 h-4 w-4" />첫 킵 등록</Button>}</div>}
      </section>

      {employees.length === 0 && !employeesQuery.isLoading && <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-[#e3c985] bg-[#fff7e4] px-5 py-4 sm:flex-row sm:items-center"><div><p className="font-medium text-[#745722]">직원 목록이 아직 비어 있습니다.</p><p className="mt-1 text-sm text-[#8d7650]">킵 장부를 등록하려면 작성자와 담당 직원을 먼저 추가해 주세요.</p></div><Link href="/team" className="inline-flex shrink-0 items-center rounded-lg bg-[#2d261f] px-3.5 py-2 text-sm font-medium text-[#f8f0e4] hover:bg-[#483a2d]">직원 관리 <ChevronRight className="ml-1 h-4 w-4" /></Link></div>}

      <NewEntryDialog employees={employees} open={newEntryOpen} onOpenChange={setNewEntryOpen} />
      <WithdrawalDialog entry={selectedEntry} employees={employees} open={Boolean(selectedEntry)} onOpenChange={open => !open && setSelectedEntry(null)} />
    </div>
  );
}
