import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePerson } from "@/contexts/PersonContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function Login() {
  const [, setLocation] = useLocation();
  const { person1Name, person2Name } = usePerson();
  const { theme, toggleTheme } = useTheme();
  const utils = trpc.useUtils();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<"Benim" | "Esim" | null>(null);

  const loginMutation = trpc.familyAuth.login.useMutation({
    onSuccess: async () => {
      await utils.familyAuth.me.invalidate();
      setLocation("/");
    },
    onError: (err) => {
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

  const isLoading = loginMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Tema butonu */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-accent transition-colors"
        aria-label="Tema değiştir"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : (
          <Moon className="w-5 h-5 text-slate-600" />
        )}
      </button>

      {/* Logo ve başlık */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4" role="img" aria-label="panda">🐼</div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          ÜK Ailesi Bütçe Planlayıcısı
        </h1>
        <p className="text-muted-foreground">
          Devam etmek için kim olduğunuzu seçin ve şifreyi girin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        {/* Kişi seçimi */}
        <div className="flex gap-4">
          {/* Kişi 1 */}
          <button
            type="button"
            onClick={() => setSelectedPerson("Benim")}
            className={`group flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
              selectedPerson === "Benim"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                : "border-border bg-card hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-transform duration-200 ${
                selectedPerson === "Benim"
                  ? "bg-blue-100 dark:bg-blue-900/40 scale-110"
                  : "bg-blue-50 dark:bg-blue-900/20 group-hover:scale-105"
              }`}
            >
              👨
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground">{person1Name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Kendi bütçeni yönet</p>
            </div>
            {selectedPerson === "Benim" && (
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </button>

          {/* Kişi 2 */}
          <button
            type="button"
            onClick={() => setSelectedPerson("Esim")}
            className={`group flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
              selectedPerson === "Esim"
                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md"
                : "border-border bg-card hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-transform duration-200 ${
                selectedPerson === "Esim"
                  ? "bg-purple-100 dark:bg-purple-900/40 scale-110"
                  : "bg-purple-50 dark:bg-purple-900/20 group-hover:scale-105"
              }`}
            >
              👩
            </div>
            <div className="text-center">
              <p className="font-bold text-foreground">{person2Name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Kendi bütçeni yönet</p>
            </div>
            {selectedPerson === "Esim" && (
              <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </button>
        </div>

        {/* Şifre alanı */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            Aile Şifresi
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Aile şifresini girin"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Giriş butonu */}
        <button
          type="submit"
          disabled={isLoading || !selectedPerson || !password}
          className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Giriş yapılıyor...
            </>
          ) : (
            "Giriş Yap"
          )}
        </button>
      </form>

      <p className="text-xs text-muted-foreground mt-8 text-center max-w-sm">
        Bu uygulama sadece aile üyelerine özeldir. Şifreyi bilmiyorsanız aile üyelerinizden birinden alın.
      </p>
    </div>
  );
}
