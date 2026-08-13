import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { BookOpenCheck, LogOut, PanelLeft, UsersRound } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: BookOpenCheck, label: "킵 장부", path: "/" },
  { icon: UsersRound, label: "직원 관리", path: "/team" },
];

const SIDEBAR_WIDTH_KEY = "keep-ledger-sidebar-width";
const DEFAULT_WIDTH = 264;
const MIN_WIDTH = 210;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? Number.parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#181512] px-5 py-8 text-[#f8f2e8] flex items-center justify-center">
        <div className="w-full max-w-md rounded-[2rem] border border-[#c6a66a]/20 bg-[#211c17] p-8 text-center shadow-2xl shadow-black/30">
          <p className="font-display text-sm tracking-[0.26em] text-[#c6a66a]">VELLUM</p>
          <h1 className="mt-5 font-display text-3xl">킵 장부에 오신 것을 환영합니다</h1>
          <p className="mt-3 text-sm leading-6 text-[#cfc5b5]">안전한 매장 기록 관리를 위해 로그인해 주세요.</p>
          <Button onClick={() => startLogin()} className="mt-8 h-12 w-full rounded-xl bg-[#c6a66a] text-[#201a14] hover:bg-[#d5ba80]">
            로그인하고 시작하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const activeMenuItem = menuItems.find(item => item.path === location);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = event.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div ref={sidebarRef} className="relative">
        <Sidebar collapsible="icon" className="border-r border-[#382f25] bg-[#181512] text-[#f7f0e5]">
          <SidebarHeader className="h-[104px] px-5 py-6 group-data-[collapsible=icon]:px-3">
            <button onClick={() => setLocation("/")} className="flex items-center gap-3 text-left group-data-[collapsible=icon]:justify-center" aria-label="킵 장부 홈으로 이동">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#c6a66a]/50 bg-[#c6a66a]/10 font-display text-lg text-[#e7cd96]">V</span>
              <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="block font-display text-sm tracking-[0.22em] text-[#d9bd84]">VELLUM</span>
                <span className="mt-1 block text-[11px] tracking-[0.12em] text-[#9c8f7e]">KEEP LEDGER</span>
              </span>
            </button>
          </SidebarHeader>

          <SidebarContent className="px-3">
            <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] text-[#817566] group-data-[collapsible=icon]:hidden">MANAGEMENT</p>
            <SidebarMenu className="gap-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-11 rounded-xl px-3 text-[#c7baaa] hover:bg-[#2d261f] hover:text-[#f7f0e5] data-[active=true]:bg-[#c6a66a] data-[active=true]:text-[#201a14] data-[active=true]:shadow-sm"
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl border border-[#382f25] bg-[#211c17] p-2 text-left transition-colors hover:bg-[#2d261f] group-data-[collapsible=icon]:justify-center" aria-label="사용자 메뉴">
                  <Avatar className="h-8 w-8 shrink-0 border border-[#c6a66a]/25">
                    <AvatarFallback className="bg-[#3a3026] text-xs text-[#e7cd96]">{user?.name?.slice(0, 1).toUpperCase() || "V"}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="block truncate text-xs font-medium text-[#eee4d5]">{user?.name || "운영자"}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-[#95897a]">매장 관리자</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border-[#d6c9b7] bg-[#fbf7f0]">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-[#923c2e] focus:text-[#923c2e]">
                  <LogOut className="mr-2 h-4 w-4" /> 로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="absolute inset-y-0 right-0 z-50 hidden w-1 cursor-col-resize bg-transparent hover:bg-[#c6a66a]/40 md:block" onMouseDown={() => setIsResizing(true)} />
      </div>

      <SidebarInset className="bg-[#f5f1e9]">
        {isMobile && (
          <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#ded4c6] bg-[#f8f4ed]/95 px-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <span className="font-display text-lg text-[#292119]">{activeMenuItem?.label || "킵 장부"}</span>
            </div>
            <span className="font-display text-xs tracking-[0.18em] text-[#9b7c4b]">VELLUM</span>
          </div>
        )}
        <main className="min-h-screen flex-1 px-4 py-6 sm:px-7 lg:px-10 lg:py-9">{children}</main>
      </SidebarInset>
    </>
  );
}
