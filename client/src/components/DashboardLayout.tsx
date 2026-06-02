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
  PersonFilterChips,
  type FilterValue,
} from "@/components/design/PersonFilterChips";
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
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { PorsukCat } from "@/components/PorsukCat";
import { GlobalSearch } from "@/components/GlobalSearch";
import {
  MobileFAB,
  NotificationsPanel,
  PageSkeleton,
  Avatar,
  type SkeletonPage,
  type AvatarWho,
} from "@/components/design";
import { DemoBanner } from "@/components/DemoBanner";
import { isDemoMode } from "@/lib/demoMode";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useBudget } from "@/contexts/BudgetContext";
import { Undo2, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/components/design/LanguageToggle";

const menuItems = [
  { icon: LayoutDashboard, labelKey: "nav.home", path: "/" },
  {
    icon: ArrowLeftRight,
    labelKey: "nav.income_expense",
    path: "/gelir-gider",
  },
  { icon: ClipboardList, labelKey: "nav.debt_payment", path: "/borc-odemeler" },
  { icon: Target, labelKey: "nav.savings_goal", path: "/hedef" },
  { icon: BarChart3, labelKey: "nav.reports", path: "/raporlar" },
  { icon: Settings, labelKey: "nav.settings", path: "/ayarlar" },
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
  const { t } = useTranslation();
  const { currentPerson, person1Name, person2Name } = usePerson();
  const utils = trpc.useUtils();
  const logoutMutation = trpc.familyAuth.logout.useMutation({
    onSuccess: async () => {
      await utils.familyAuth.me.invalidate();
      setLocation("/login");
    },
  });
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  // Aktif kişi bilgisi
  const activeName = currentPerson === "Benim" ? person1Name : person2Name;
  const activeEmoji = currentPerson === "Benim" ? "👨" : "👩";
  const activeWho: AvatarWho = currentPerson === "Benim" ? "yigit" : "arzu";

  const { filter: personFilter, setFilter: setPersonFilter } =
    usePersonFilter();
  const filterToValue = (f: PersonFilter): FilterValue =>
    f === "Tümü"
      ? "tumu"
      : f === "Benim"
        ? "yigit"
        : f === "Esim"
          ? "arzu"
          : "ev";
  const valueToFilter = (v: FilterValue): PersonFilter =>
    v === "tumu"
      ? "Tümü"
      : v === "yigit"
        ? "Benim"
        : v === "arzu"
          ? "Esim"
          : "Ev";

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
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, undo]);

  const demo = isDemoMode();
  const brandTitle = demo
    ? t("sidebar.brand_title.demo")
    : t("sidebar.brand_title.butce");
  const brandTagline = demo
    ? t("sidebar.brand_tagline.demo")
    : t("sidebar.brand_tagline.butce");

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          {/* Brand header — port of _design/nav.jsx:71-85 */}
          <SidebarHeader
            className="border-b"
            style={{ padding: isCollapsed ? "12px 8px" : "12px 14px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
              }}
            >
              <button
                onClick={toggleSidebar}
                aria-label={t("nav.toggle_sidebar")}
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-tertiary)",
                  flexShrink: 0,
                }}
              >
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed ? (
                <>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background:
                        "linear-gradient(135deg, var(--accent-green), var(--owner-yigit))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      flexShrink: 0,
                      boxShadow: "0 4px 12px -4px var(--accent-green-soft)",
                    }}
                  >
                    🐼
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        lineHeight: 1.25,
                        letterSpacing: "-0.01em",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "var(--text-primary)",
                      }}
                    >
                      {brandTitle}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-tertiary)",
                        marginTop: 2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {brandTagline}
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background:
                      "linear-gradient(135deg, var(--accent-green), var(--owner-yigit))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  🐼
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Aktif kullanıcı pill — port of _design/nav.jsx:87-104 */}
          {!isCollapsed && currentPerson && (
            <div style={{ padding: "0 14px 16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "var(--bg-elevated)",
                  borderRadius: 14,
                }}
              >
                <Avatar who={activeWho} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {activeName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                    Aktif kullanıcı
                  </div>
                </div>
                <button
                  onClick={handleSwitchPerson}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-tertiary)",
                    padding: 4,
                    borderRadius: 8,
                  }}
                  title={t("nav.logout")}
                >
                  <LogOut className="w-4 h-4" />
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
                      tooltip={t(item.labelKey)}
                      className={`h-9 transition-all font-normal text-sm`}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span>{t(item.labelKey)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t">
            {!isCollapsed ? (
              <div className="space-y-2">
                {/* Language toggle */}
                <div className="px-2 py-1">
                  <LanguageToggle />
                </div>
                {/* Dark/Light toggle butonu */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-accent/20 transition-colors text-sm font-medium"
                  aria-label={
                    theme === "dark" ? t("nav.light_mode") : t("nav.dark_mode")
                  }
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-muted-foreground text-xs">
                        {t("nav.light_mode")}
                      </span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="text-muted-foreground text-xs">
                        {t("nav.dark_mode")}
                      </span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setNotificationsOpen(true)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-accent/20 transition-colors text-sm font-medium"
                  aria-label={t("nav.notifications")}
                >
                  <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground text-xs">
                    {t("nav.notifications")}
                  </span>
                </button>
                {canUndo && (
                  <button
                    onClick={undo}
                    title={`${t("toast.undo")}: ${undoDescription}`}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/20 transition-colors text-sm text-amber-600 dark:text-amber-400"
                  >
                    <Undo2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs truncate">
                      {t("toast.undo")}: {undoDescription}
                    </span>
                  </button>
                )}
                <div className="flex items-center gap-2 px-2 py-1">
                  <Cloud className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {saveMutation.isPending
                      ? t("common.loading")
                      : t("nav.cloud_sync")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="h-8 w-8 flex items-center justify-center hover:bg-accent/20 rounded-lg transition-colors"
                  aria-label={
                    theme === "dark" ? t("nav.light_mode") : t("nav.dark_mode")
                  }
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-indigo-500" />
                  )}
                </button>
                <button
                  onClick={() => setNotificationsOpen(true)}
                  className="h-8 w-8 flex items-center justify-center hover:bg-accent/20 rounded-lg transition-colors"
                  aria-label={t("nav.notifications")}
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
      {isMobile && (
        <MobileFAB onNotifications={() => setNotificationsOpen(true)} />
      )}
      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        mobile={isMobile}
      />
      <SidebarInset>
        {demo && <DemoBanner />}
        {isMobile && (
          /* MobileHeader — line-by-line port of _design/nav.jsx:224-267 */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              background: "var(--bg-base)",
              borderBottom: "1px solid var(--border-faint)",
              position: "sticky",
              top: 0,
              zIndex: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              {/* Single 32x32 gradient panda box (NO duplicate emoji) */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background:
                    "linear-gradient(135deg, var(--accent-green), var(--owner-yigit))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                🐼
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: "var(--text-primary)",
                  }}
                >
                  {brandTitle}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-tertiary)",
                    marginTop: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {activeMenuItem ? t(activeMenuItem.labelKey) : t("nav.home")}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <LanguageToggle />
              <button
                onClick={toggleTheme}
                style={{
                  background: "var(--bg-surface)",
                  border: "none",
                  padding: 8,
                  borderRadius: 10,
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label={
                  theme === "dark" ? t("nav.light_mode") : t("nav.dark_mode")
                }
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-500" />
                )}
              </button>
              <button
                onClick={() => setNotificationsOpen(true)}
                style={{
                  background: "var(--bg-surface)",
                  border: "none",
                  padding: 8,
                  borderRadius: 10,
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label={t("nav.notifications")}
              >
                <Bell className="h-4 w-4" />
              </button>
              {/* Single Avatar — replaces raw 👨/👩 emoji */}
              {currentPerson && (
                <button
                  onClick={handleSwitchPerson}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title={t("nav.switch_person")}
                  aria-label={t("dashboard.view_as", { name: activeName })}
                >
                  <Avatar who={activeWho} size={32} />
                </button>
              )}
            </div>
          </div>
        )}
        {/* Global person filter */}
        <div className="px-3 md:px-6 pt-3 md:pt-4 pb-0">
          <PersonFilterChips
            value={filterToValue(personFilter)}
            onChange={v => setPersonFilter(valueToFilter(v))}
            labels={{ yigit: person1Name, arzu: person2Name }}
          />
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
