import { useState, useCallback, CSSProperties } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePerson } from "@/contexts/PersonContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar } from "@/components/design";
import { isDemoMode } from "@/lib/demoMode";

// ── UserSelectButton ─────────────────────────────────────────────

interface UserSelectButtonProps {
  who: "yigit" | "arzu";
  person: "Benim" | "Esim";
  name: string;
  selected: boolean;
  onClick: () => void;
}

function UserSelectButton({
  who,
  name,
  selected,
  onClick,
}: UserSelectButtonProps) {
  const ownerColor = `var(--owner-${who})`;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: 18,
        borderRadius: 16,
        border: selected ? `2px solid ${ownerColor}` : "2px solid transparent",
        background: selected
          ? `color-mix(in oklch, ${ownerColor} 14%, var(--bg-elevated))`
          : "var(--bg-elevated)",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        transition: "all 200ms",
        boxShadow: selected ? `0 8px 18px -8px ${ownerColor}` : "none",
        width: "100%",
      }}
    >
      <div style={{ position: "relative" }}>
        <Avatar who={who} size={56} />
        {selected && (
          <div
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "var(--accent-green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2.5px solid var(--bg-surface)",
              color: "oklch(0.15 0.03 155)",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            ✓
          </div>
        )}
      </div>
      <div
        style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}
      >
        {name}
      </div>
    </button>
  );
}

// ── Demo profile button ────────────────────────────────────────
interface DemoProfileButtonProps {
  who: "yigit" | "arzu";
  name: string;
  emoji: string;
  selected: boolean;
  onClick: () => void;
}

function DemoProfileButton({
  who,
  name,
  emoji,
  selected,
  onClick,
}: DemoProfileButtonProps) {
  const ownerColor = `var(--owner-${who})`;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: 18,
        borderRadius: 16,
        border: selected ? `2px solid ${ownerColor}` : "2px solid transparent",
        background: selected
          ? `color-mix(in oklch, ${ownerColor} 14%, var(--bg-elevated))`
          : "var(--bg-elevated)",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        transition: "all 200ms",
        boxShadow: selected ? `0 8px 18px -8px ${ownerColor}` : "none",
        width: "100%",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: `color-mix(in oklch, ${ownerColor} 24%, var(--bg-surface))`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 30,
        }}
        aria-hidden
      >
        {emoji}
      </div>
      <div
        style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}
      >
        {name}
      </div>
    </button>
  );
}

// ── Login ────────────────────────────────────────────────────────

export default function Login() {
  const [, setLocation] = useLocation();
  const { person1Name, person2Name } = usePerson();
  const { theme, toggleTheme } = useTheme();
  const utils = trpc.useUtils();
  const demo = isDemoMode();

  // Demo profiles loaded only on demo subdomain
  const demoProfilesQuery = trpc.familyAuth.getDemoProfiles.useQuery(
    undefined,
    {
      enabled: demo,
      retry: false,
    }
  );
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);
  const demoLoginMutation = trpc.familyAuth.loginAsDemoProfile.useMutation({
    onSuccess: async () => {
      await utils.familyAuth.me.invalidate();
      setLocation("/");
    },
    onError: err => {
      toast.error(err.message || "Demo girişi başarısız");
    },
  });

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<"Benim" | "Esim" | null>(
    null
  );

  const loginMutation = trpc.familyAuth.login.useMutation({
    onSuccess: async () => {
      await utils.familyAuth.me.invalidate();
      setLocation("/");
    },
    onError: err => {
      toast.error(err.message || "Şifre hatalı");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson) {
      toast.error("Lütfen kim olduğunuzu seçin");
      return;
    }
    if (!password) {
      toast.error("Lütfen şifreyi girin");
      return;
    }
    loginMutation.mutate({ password, person: selectedPerson });
  };

  const isLoading = loginMutation.isPending || demoLoginMutation.isPending;

  const handleDemoSubmit = (profileId: string) => {
    setSelectedDemoId(profileId);
    demoLoginMutation.mutate({ profileId });
  };

  // Parallax — desktop only
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(max-width: 768px)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width - 0.5;
    const my = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.setProperty("--mx", String(mx));
    e.currentTarget.style.setProperty("--my", String(my));
  }, []);

  const isDark = theme === "dark";

  const containerStyle: CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    background: isDark
      ? "radial-gradient(ellipse at 50% 0%, oklch(0.25 0.02 265) 0%, oklch(0.16 0.018 265) 60%)"
      : "radial-gradient(ellipse at 50% 0%, oklch(0.98 0.012 80) 0%, oklch(0.93 0.012 80) 60%)",
    position: "relative",
    overflow: "hidden",
  };

  const cardStyle: CSSProperties = {
    background: "var(--bg-surface)",
    borderRadius: "var(--r-lg)",
    boxShadow: "var(--shadow-card)",
    padding: 24,
  };

  const selectedName =
    selectedPerson === "Benim"
      ? person1Name
      : selectedPerson === "Esim"
        ? person2Name
        : null;

  return (
    <div style={containerStyle} onMouseMove={handleMouseMove}>
      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          padding: 8,
          borderRadius: "50%",
          background: "var(--bg-elevated)",
          border: "none",
          cursor: "pointer",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Tema değiştir"
      >
        {isDark ? (
          <Sun
            style={{ width: 18, height: 18, color: "var(--status-warning)" }}
          />
        ) : (
          <Moon
            style={{ width: 18, height: 18, color: "var(--text-tertiary)" }}
          />
        )}
      </button>

      {/* Floating orbs */}
      <div
        className="login-orb"
        style={{
          width: 280,
          height: 280,
          top: -40,
          left: -60,
          background: "var(--owner-yigit)",
          animation: "orb-drift-1 14s ease-in-out infinite",
        }}
      />
      <div
        className="login-orb"
        style={{
          width: 320,
          height: 320,
          bottom: -80,
          right: -80,
          background: "var(--owner-arzu)",
          animation: "orb-drift-2 18s ease-in-out infinite",
        }}
      />
      <div
        className="login-orb"
        style={{
          width: 240,
          height: 240,
          top: -60,
          right: -40,
          background: "var(--owner-ev)",
          animation: "orb-drift-3 16s ease-in-out infinite",
        }}
      />
      <div
        className="login-orb"
        style={{
          width: 260,
          height: 260,
          bottom: -60,
          left: -40,
          background: "var(--owner-tumu)",
          animation: "orb-drift-4 20s ease-in-out infinite",
        }}
      />

      {/* Ambient particles drifting upward */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="login-particle"
          style={{
            left: `${(i * 13 + 7) % 100}%`,
            bottom: `-${10 + ((i * 7) % 30)}px`,
            animation: `particle-rise ${22 + (i % 5) * 2}s linear ${i * 2.3}s infinite`,
          }}
        />
      ))}

      {/* Main card group — parallax layer */}
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          position: "relative",
          zIndex: 2,
          transform:
            "translate(calc(var(--mx,0) * 8px), calc(var(--my,0) * 8px))",
          transition: "transform 200ms cubic-bezier(0.2,0,0,1)",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        {/* Brand block */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              background:
                "linear-gradient(135deg, var(--accent-green), var(--owner-yigit))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              margin: "0 auto 16px",
              boxShadow:
                "0 12px 32px -8px var(--accent-green-soft), 0 4px 12px rgba(0,0,0,0.25)",
              transform:
                "translate(calc(var(--mx,0) * 4px), calc(var(--my,0) * 4px))",
              transition: "transform 200ms cubic-bezier(0.2,0,0,1)",
            }}
          >
            🐼
          </div>
          <h1
            style={{
              fontSize: 30,
              margin: 0,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "var(--text-primary)",
            }}
          >
            {demo ? "Kerem & Yağmur Bütçesi" : "ÜK Ailesi Bütçe"}
          </h1>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-tertiary)",
              marginTop: 6,
            }}
          >
            {demo
              ? "Demo profil seçin — şifre gerekmez"
              : "Hoş geldiniz, lütfen giriş yapın"}
          </div>
        </div>

        {/* Avatar select card */}
        <div style={cardStyle}>
          <div className="section-label" style={{ marginBottom: 12 }}>
            {demo ? "DEMO PROFİL SEÇ" : "KİM GİRİŞ YAPIYOR?"}
          </div>
          {demo ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {demoProfilesQuery.data?.map((p, i) => (
                  <DemoProfileButton
                    key={p.id}
                    who={i === 0 ? "yigit" : "arzu"}
                    name={p.name}
                    emoji={p.emoji}
                    selected={selectedDemoId === p.id}
                    onClick={() => handleDemoSubmit(p.id)}
                  />
                ))}
                {demoProfilesQuery.isLoading && (
                  <>
                    <div
                      style={{
                        height: 130,
                        borderRadius: 16,
                        background: "var(--bg-elevated)",
                      }}
                    />
                    <div
                      style={{
                        height: 130,
                        borderRadius: 16,
                        background: "var(--bg-elevated)",
                      }}
                    />
                  </>
                )}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-tertiary)",
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                Profil tıklayarak demo'ya gir
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <UserSelectButton
                  who="yigit"
                  person="Benim"
                  name={person1Name}
                  selected={selectedPerson === "Benim"}
                  onClick={() => setSelectedPerson("Benim")}
                />
                <UserSelectButton
                  who="arzu"
                  person="Esim"
                  name={person2Name}
                  selected={selectedPerson === "Esim"}
                  onClick={() => setSelectedPerson("Esim")}
                />
              </div>
              {selectedName && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    marginTop: 12,
                    textAlign: "center",
                  }}
                >
                  <strong style={{ color: "var(--text-secondary)" }}>
                    {selectedName}
                  </strong>{" "}
                  olarak giriş yapacaksınız
                </div>
              )}
            </>
          )}
        </div>

        {/* Password card — hidden in demo mode (login on profile click) */}
        {!demo && (
          <form onSubmit={handleSubmit} style={cardStyle}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                marginBottom: 8,
              }}
            >
              Aile Şifresi
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 14px",
                background: "var(--bg-elevated)",
                borderRadius: 12,
                border: "1px solid var(--border-faint)",
                marginBottom: 16,
              }}
            >
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Şifrenizi girin"
                autoComplete="current-password"
                disabled={isLoading}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text-primary)",
                  fontSize: 15,
                  fontFamily: "inherit",
                  letterSpacing: showPassword ? "normal" : "0.2em",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-tertiary)",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? (
                  <EyeOff style={{ width: 16, height: 16 }} />
                ) : (
                  <Eye style={{ width: 16, height: 16 }} />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !selectedPerson || !password}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px 20px",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "inherit",
                border: "none",
                cursor:
                  isLoading || !selectedPerson || !password
                    ? "not-allowed"
                    : "pointer",
                background:
                  isLoading || !selectedPerson || !password
                    ? "var(--bg-tint)"
                    : "var(--accent-green)",
                color:
                  isLoading || !selectedPerson || !password
                    ? "var(--text-muted)"
                    : "oklch(0.15 0.03 155)",
                transition: "all 180ms",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2
                    style={{
                      width: 18,
                      height: 18,
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Giriş yapılıyor...
                </>
              ) : (
                <>Giriş Yap →</>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <p
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            textAlign: "center",
            lineHeight: 1.5,
            padding: "0 12px",
          }}
        >
          {demo
            ? "🎭 Demo gösterimi · Veriler örnektir, kaydedilmez. Tüm yazma işlemleri kapalıdır."
            : "🔒 Bu uygulamaya sadece aile üyeleri erişebilir. Şifre bilmiyorsanız aile üyelerinden birine sorun."}
        </p>
      </div>
    </div>
  );
}
