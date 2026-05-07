import { usePerson } from "@/contexts/PersonContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function PersonSelectScreen() {
  const { person1Name, person2Name, setCurrentPerson } = usePerson();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Tema butonu */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-accent transition-colors"
        aria-label="Tema degistir"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : (
          <Moon className="w-5 h-5 text-slate-600" />
        )}
      </button>

      {/* Logo ve baslik */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4" role="img" aria-label="panda">
          🐼
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          ÜK Ailesi Bütçe Sistemi
        </h1>
        <p className="text-muted-foreground text-lg">
          Hoş geldiniz! Devam etmek için kim olduğunuzu seçin.
        </p>
      </div>

      {/* Kisi secim kartlari */}
      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-md">
        {/* Kisi 1 - Yigit */}
        <button
          onClick={() => setCurrentPerson("Benim")}
          className="group flex-1 flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-200">
            👨
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{person1Name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Kendi bütçeni yönet
            </p>
          </div>
          <div className="w-full py-2 px-4 rounded-lg bg-blue-500 text-white text-sm font-medium text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {person1Name} olarak gir
          </div>
        </button>

        {/* Kisi 2 - Arzu */}
        <button
          onClick={() => setCurrentPerson("Esim")}
          className="group flex-1 flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-200">
            👩
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{person2Name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Kendi bütçeni yönet
            </p>
          </div>
          <div className="w-full py-2 px-4 rounded-lg bg-purple-500 text-white text-sm font-medium text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {person2Name} olarak gir
          </div>
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-8 text-center max-w-sm">
        Seçiminiz bu cihazda hatırlanır. İstediğiniz zaman sol menüden
        değiştirebilirsiniz.
      </p>
    </div>
  );
}
