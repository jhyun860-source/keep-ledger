import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { CircleAlert, Plus, RefreshCw, Trash2, UsersRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export default function Team() {
  const [name, setName] = useState("");
  const utils = trpc.useUtils();
  const employeesQuery = trpc.employees.active.useQuery();
  const addEmployee = trpc.employees.add.useMutation({
    onSuccess: async () => { setName(""); await utils.employees.active.invalidate(); toast.success("직원을 목록에 추가했습니다."); },
    onError: error => toast.error(error.message),
  });
  const deactivateEmployee = trpc.employees.deactivate.useMutation({
    onSuccess: async () => { await utils.employees.active.invalidate(); toast.success("직원을 선택 목록에서 제거했습니다."); },
    onError: error => toast.error(error.message),
  });
  const submit = (event: FormEvent) => { event.preventDefault(); if (!name.trim()) return toast.error("직원 이름을 입력해 주세요."); addEmployee.mutate({ name }); };

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <section className="flex flex-col justify-between gap-5 rounded-[1.75rem] bg-[#211c17] px-6 py-7 text-[#f7f0e5] sm:flex-row sm:items-end sm:px-8"><div><p className="font-display text-xs tracking-[0.2em] text-[#d2b57d]">PEOPLE DIRECTORY</p><h1 className="mt-2 font-display text-3xl font-medium">직원 관리</h1><p className="mt-2 text-sm leading-6 text-[#c9bdac]">킵 장부의 작성자와 반출 담당자로 선택할 직원 목록입니다.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#c6a66a]/20 bg-[#c6a66a]/10 px-3.5 py-2 text-sm text-[#e7cd96]"><UsersRound className="h-4 w-4" />{employeesQuery.data?.length || 0}명 등록</span></section>
      <section className="surface-card p-5 sm:p-6"><p className="font-display text-xs tracking-[0.17em] text-[#a27f4e]">ADD TEAM MEMBER</p><h2 className="mt-1 text-lg font-semibold text-[#332a21]">직원 이름 추가</h2><form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row"><Input value={name} onChange={event => setName(event.target.value)} placeholder="직원 이름을 입력하세요" className="h-11 border-[#d8ccbd] bg-[#fffdf9]" maxLength={80} /><Button type="submit" disabled={addEmployee.isPending} className="h-11 shrink-0 rounded-lg bg-[#b6925f] px-5 text-[#281f16] hover:bg-[#c5a46f]"><Plus className="mr-1.5 h-4 w-4" />{addEmployee.isPending ? "추가 중" : "직원 추가"}</Button></form><p className="mt-3 text-xs leading-5 text-[#8a7c6b]">추가한 이름은 킵 장부의 작성자 및 반출 담당 직원 선택 목록에 즉시 반영됩니다.</p></section>
      <section className="surface-card overflow-hidden"><div className="border-b border-[#e3d9ca] px-5 py-5 sm:px-6"><p className="font-display text-xs tracking-[0.17em] text-[#a27f4e]">ACTIVE TEAM</p><h2 className="mt-1 text-lg font-semibold text-[#332a21]">선택 가능한 직원</h2></div>{employeesQuery.isLoading ? <div className="space-y-3 p-6"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div> : employeesQuery.isError ? <div className="px-6 py-16 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8e8e1] text-[#a54d36]"><CircleAlert className="h-6 w-6" /></span><h3 className="mt-4 font-display text-xl text-[#382e24]">직원 목록을 불러오지 못했습니다</h3><p className="mt-2 text-sm text-[#817465]">네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p><Button variant="outline" onClick={() => void employeesQuery.refetch()} className="mt-5 border-[#d8cab8] bg-transparent"><RefreshCw className="mr-1.5 h-4 w-4" />다시 시도</Button></div> : employeesQuery.data?.length ? <div className="divide-y divide-[#ede5da]">{employeesQuery.data.map(employee => <div key={employee.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><Avatar className="h-10 w-10 border border-[#ddcfbe]"><AvatarFallback className="bg-[#eee3d4] text-sm font-semibold text-[#80633c]">{employee.name.slice(0, 1)}</AvatarFallback></Avatar><div><p className="font-medium text-[#382e24]">{employee.name}</p><p className="mt-0.5 text-xs text-[#8b7c6c]">킵 장부 작성 · 반출 담당 가능</p></div></div><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-[#a04d3b] hover:bg-[#f9e8e3] hover:text-[#8a3f2d]" aria-label={`${employee.name} 삭제`}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent className="border-[#ded4c6] bg-[#fcf9f3]"><AlertDialogHeader><AlertDialogTitle className="font-display text-xl text-[#32281f]">직원 선택 목록에서 제거할까요?</AlertDialogTitle><AlertDialogDescription className="leading-6 text-[#756b60]">{employee.name} 님은 이후 작성자와 담당 직원 선택 목록에서 제외됩니다. 기존 장부 및 반출 이력은 보존됩니다.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-[#ddd1c1] bg-transparent">취소</AlertDialogCancel><AlertDialogAction onClick={() => deactivateEmployee.mutate({ employeeId: employee.id })} className="bg-[#9c4a38] text-white hover:bg-[#863c2d]">제거</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>)}</div> : <div className="px-6 py-16 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e8db] text-[#967243]"><UsersRound className="h-6 w-6" /></span><h3 className="mt-4 font-display text-xl text-[#382e24]">등록된 직원이 없습니다</h3><p className="mt-2 text-sm text-[#817465]">위 입력란에서 첫 번째 직원 이름을 추가해 주세요.</p></div>}</section>
    </div>
  );
}
