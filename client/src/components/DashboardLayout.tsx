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
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { useTheme } from "@/contexts/ThemeContext";
import { usePerson } from "@/contexts/PersonContext";
import { usePersonFilter, PersonFilter } from "@/contexts/PersonFilterContext";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ClipboardList,
  Target,
  BarChart3,
  Settings,
  PanelLeft,
  Cloud,
  Sun,
  Moon,
  LogOut,
  Search,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { PorsukCat } from "@/components/PorsukCat";
import { GlobalSearch } from "@/components/GlobalSearch";
import { MobileFAB, NotificationsPanel, PageSkeleton, type SkeletonPage } from "@/components/design";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useBudget } from "@/contexts/BudgetContext";
import { Undo2, Bell } from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Ana Sayfa",       path: "/" },
  { icon: ArrowLeftRight,  label: "Gelir & Gider",   path: "/gelir-gider" },
  { icon: ClipboardList,   label: "Borç & Ödemeler", path: "/borc-odemeler" },
  { icon: Target,          label: "Birikim & Hedef", path: "/hedef" },
  { icon: BarChart3,       label: "Raporlar",        path: "/raporlar" },
  { icon: Settings,        label: "Ayarlar",         path: "/ayarlar" },
];

const SKELETON_PAGE_BY_PATH: Record<string, SkeletonPage> = {
  "/": "ana",
  "/gelir-gider": "gelir",
  "/borc-odemeler": "borc",
  "/hedef": "birikim",
  "/raporlar": "rapor",
  "/ayarlar": "ayar",
};

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 180;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar, setOpenMobile } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { currentPerson, person1Name, person2Name } = usePerson();
  const utils = trpc.useUtils();
  const logoutMutation = trpc.familyAuth.logout.useMutation({
    onSuccess: async () => {
      await utils.familyAuth.me.invalidate();
      setLocation('/login');
    },
  });
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  // Aktif kişi bilgisi
  const activeName = currentPerson === 'Benim' ? person1Name : person2Name;
  const activeEmoji = currentPerson === 'Benim' ? '👨' : '👩';
  const activeColor = currentPerson === 'Benim'
    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30'
    : 'text-purple-600 bg-purple-50 dark:bg-purple-900/30';

  const { filter: personFilter, setFilter: setPersonFilter } = usePersonFilter();
  const personFilterOptions: { label: string; value: PersonFilter }[] = [
    { label: "Tümü", value: "Tümü" },
    { label: person1Name, value: "Benim" },
    { label: person2Name, value: "Esim" },
    { label: "Ev", value: "Ev" },
  ];

  // Sync durumu
  const saveMutation = trpc.familyBudget.save.useMutation();

  // Notifications panel state
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Loading skeleton state — derived per-route below from useBudget().isLoaded
  const skeletonPage = SKELETON_PAGE_BY_PATH[location];

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

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

  const handleNavClick = (path: string) => {
    setLocation(path);
    // Mobilde nav menusunu kapat
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleSwitchPerson = () => {
    logoutMutation.mutate();
  };

  const { undo, canUndo, undoDescription, isLoaded } = useBudget();

  // Ctrl+Z klavye kısayolu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, undo]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent/20 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Navigasyonu ac/kapat"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl" role="img" aria-label="panda">🐼</span>
                  <span className="font-bold text-sm tracking-tight truncate text-primary" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                    UK Ailesi Butce
                  </span>
                </div>
              ) : (
                <span className="text-lg" role="img" aria-label="panda">🐼</span>
              )}
            </div>
          </SidebarHeader>

          {/* Aktif kisi gostergesi */}
          {!isCollapsed && currentPerson && (
            <div className="px-3 py-2 border-b">
              <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${activeColor}`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{activeEmoji}</span>
                  <span className="text-sm font-semibold">{activeName}</span>
                </div>
                <button
                  onClick={handleSwitchPerson}
                  className="text-xs opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
                  title="Kisi degistir"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {isCollapsed && currentPerson && (
            <div className="flex justify-center py-2 border-b">
              <button
                onClick={handleSwitchPerson}
                className="text-base"
                title={`${activeName} - Kisi degistir`}
              >
                {activeEmoji}
              </button>
            </div>
          )}

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => handleNavClick(item.path)}
                      tooltip={item.label}
                      className={`h-9 transition-all font-normal text-sm`}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t">
            {!isCollapsed ? (
              <div className="space-y-2">
                {/* Dark/Light toggle butonu */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-accent/20 transition-colors text-sm font-medium"
                  aria-label="Tema degistir"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-muted-foreground text-xs">Aydinlik Mod</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="text-muted-foreground text-xs">Karanlik Mod</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setNotificationsOpen(true)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-accent/20 transition-colors text-sm font-medium"
                  aria-label="Bildirimler"
                >
                  <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground text-xs">Bildirimler</span>
                </button>
                {canUndo && (
                  <button
                    onClick={undo}
                    title={`Geri al: ${undoDescription}`}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/20 transition-colors text-sm text-amber-600 dark:text-amber-400"
                  >
                    <Undo2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs truncate">Geri Al: {undoDescription}</span>
                  </button>
                )}
                <div className="flex items-center gap-2 px-2 py-1">
                  <Cloud className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {saveMutation.isPending ? "Kaydediliyor..." : "Bulut Senkron"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="h-8 w-8 flex items-center justify-center hover:bg-accent/20 rounded-lg transition-colors"
                  aria-label="Tema degistir"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-indigo-500" />
                  )}
                </button>
                <button
                  onClick={() => setNotificationsOpen(true)}
                  className="h-8 w-8 flex items-center justify-center hover:bg-accent/20 rounded-lg transition-colors"
                  aria-label="Bildirimler"
                >
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </button>
                <Cloud className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <PorsukCat />
      <GlobalSearch />
      {isMobile && <MobileFAB onNotifications={() => setNotificationsOpen(true)} />}
      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        mobile={isMobile}
      />
      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-2">
                <span className="text-base" role="img" aria-label="panda">🐼</span>
                <span className="font-semibold text-sm text-foreground" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                  {activeMenuItem?.label ?? "UK Ailesi Butce"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobilde aktif kisi */}
              {currentPerson && (
                <button
                  onClick={handleSwitchPerson}
                  className="text-base"
                  title="Kisi degistir"
                >
                  {activeEmoji}
                </button>
              )}
              <button
                onClick={toggleTheme}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent/20 rounded-lg transition-colors"
                aria-label="Tema degistir"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-500" />
                )}
              </button>
              <Cloud className={`h-4 w-4 ${saveMutation.isPending ? "text-blue-500 animate-pulse" : "text-muted-foreground"}`} />
              <button
                onClick={() => setNotificationsOpen(true)}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent/20 rounded-lg transition-colors"
                aria-label="Bildirimler"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent/20 rounded-lg transition-colors"
                aria-label="Ara"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
        {/* Global person filter */}
        <div className="flex items-center gap-2 px-3 md:px-6 pt-3 md:pt-4 pb-0 flex-wrap">
          {personFilterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPersonFilter(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                personFilter === opt.value
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:bg-accent/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <main className="flex-1 p-3 md:p-6 pb-20 md:pb-6">
          <div key={location} className="page-enter">
            {!isLoaded && skeletonPage ? (
              <PageSkeleton page={skeletonPage} />
            ) : (
              children
            )}
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
