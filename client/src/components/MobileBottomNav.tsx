import { useLocation } from "wouter";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ClipboardList,
  Target,
  BarChart3,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";

const PRIMARY_NAV = [
  { icon: LayoutDashboard, label: "Ana Sayfa",       path: "/" },
  { icon: ArrowLeftRight,  label: "Gelir & Gider",   path: "/gelir-gider" },
  { icon: ClipboardList,   label: "Borç & Ödemeler", path: "/borc-odemeler" },
  { icon: Target,          label: "Hedef",            path: "/hedef" },
];

const MORE_NAV = [
  { icon: BarChart3, label: "Raporlar", path: "/raporlar" },
  { icon: Settings,  label: "Ayarlar",  path: "/ayarlar" },
];

interface RippleState {
  id: number;
  x: number;
  y: number;
}

function NavButton({
  icon: Icon,
  label,
  path,
  isActive,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const [bounceKey, setBounceKey] = useState(0);
  const wasActive = useRef(isActive);

  useEffect(() => {
    if (isActive && !wasActive.current) {
      setBounceKey(k => k + 1);
    }
    wasActive.current = isActive;
  }, [isActive]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    onClick(e);
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      className={`relative flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-[60px] overflow-hidden ${
        isActive ? "text-primary" : "text-muted-foreground"
      }`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {ripples.map(r => (
        <span
          key={r.id}
          className="nav-ripple absolute rounded-full bg-primary/20 pointer-events-none"
          style={{ width: 40, height: 40, left: r.x - 20, top: r.y - 20 }}
        />
      ))}
      <div
        key={bounceKey}
        className={`p-1.5 rounded-lg transition-colors ${isActive ? "bg-primary/10 nav-icon-active" : ""}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : ""}`}>
        {label}
      </span>
      {isActive && (
        <span className="nav-active-line absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary" />
      )}
    </button>
  );
}

export function MobileBottomNav() {
  const [location, navigate] = useLocation();
  const [showMore, setShowMore] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);

  const isMoreActive = MORE_NAV.some(item => item.path === location);

  const openDrawer = useCallback(() => {
    setDrawerClosing(false);
    setShowMore(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerClosing(true);
    setTimeout(() => {
      setShowMore(false);
      setDrawerClosing(false);
    }, 220);
  }, []);

  const handleMoreNavClick = useCallback((path: string) => {
    navigate(path);
    closeDrawer();
  }, [navigate, closeDrawer]);

  return (
    <>
      {showMore && (
        <div
          className={`fixed inset-0 bg-black/30 z-[9990] ${drawerClosing ? "" : "overlay-enter"}`}
          onClick={closeDrawer}
          style={drawerClosing ? { animation: "overlayFadeIn 0.22s ease-out reverse both" } : undefined}
        />
      )}

      {showMore && (
        <div
          className={`fixed bottom-16 left-0 right-0 z-[9991] bg-background border-t shadow-2xl rounded-t-2xl p-4 ${
            drawerClosing ? "drawer-exit" : "drawer-enter"
          }`}
        >
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
          <div className="grid grid-cols-2 gap-2">
            {MORE_NAV.map(item => {
              const isActive = location === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleMoreNavClick(item.path)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all active:scale-95 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary active:bg-secondary/80"
                  }`}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                  {isActive && <span className="w-1 h-1 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-[9992] bg-background/95 backdrop-blur border-t">
        <div className="flex items-center justify-around h-16 px-1">
          {PRIMARY_NAV.map(item => (
            <NavButton
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={location === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
          <NavButton
            icon={MoreHorizontal}
            label="Daha"
            path="__more__"
            isActive={isMoreActive || showMore}
            onClick={showMore ? closeDrawer : openDrawer}
          />
        </div>
      </div>
    </>
  );
}
