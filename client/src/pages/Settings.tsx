import { useTheme } from "@/contexts/ThemeContext";
import { usePerson } from "@/contexts/PersonContext";
import { useBudget } from "@/contexts/BudgetContext";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Moon, Sun, User, LogOut, Check, Download, Upload, Trash2, FileJson, Archive, KeyRound, Eye, EyeOff, History, RotateCcw } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { person1Name, person2Name, setPerson1Name, setPerson2Name, currentPerson, setCurrentPerson } = usePerson();
  const {
    exportData, importData,
    saveCurrentMonthToArchive, archive,
  } = useBudget();

  const [name1, setName1] = useState(person1Name);
  const [name2, setName2] = useState(person2Name);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sifre degistirme state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  // Yedek Gecmisi state
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<number | null>(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);

  const historyQuery = trpc.familyBudget.history.list.useQuery();
  const snapshotQuery = trpc.familyBudget.history.get.useQuery(
    { id: selectedSnapshotId! },
    { enabled: selectedSnapshotId !== null && showSnapshotModal }
  );

  const utils = trpc.useUtils();
  const currentBudgetQuery = trpc.familyBudget.get.useQuery();

  const restoreMutation = trpc.familyBudget.history.restore.useMutation({
    onSuccess: () => {
      toast.success('Yedek basariyla geri yuklendi!');
      utils.familyBudget.get.invalidate();
      utils.familyBudget.history.list.invalidate();
    },
    onError: (err) => {
      if (err.data?.code === 'CONFLICT') {
        toast.error('Veri baska cihazdan degisti, sayfa yenileniyor...');
        utils.familyBudget.get.invalidate();
      } else {
        toast.error(err.message);
      }
    },
  });

  const handleRestore = (id: number) => {
    const expectedUpdatedAt = currentBudgetQuery.data?.updatedAt
      ? new Date(currentBudgetQuery.data.updatedAt).toISOString()
      : null;
    restoreMutation.mutate({ id, expectedUpdatedAt });
  };

  const parseSnapshotSummary = (snapshot: string) => {
    try {
      const data = JSON.parse(snapshot);
      const incomes = JSON.parse(data.incomes ?? '[]');
      const expenses = JSON.parse(data.expenses ?? '[]');
      const debts = JSON.parse(data.debts ?? '[]');
      const savings = JSON.parse(data.savings ?? '[]');
      const installments = JSON.parse(data.installments ?? '[]');
      const totalIncome = incomes.reduce((s: number, i: { amount?: number }) => s + (i.amount ?? 0), 0);
      const totalExpense = expenses.reduce((s: number, i: { amount?: number }) => s + (i.amount ?? 0), 0);
      return { incomes: incomes.length, expenses: expenses.length, debts: debts.length, savings: savings.length, installments: installments.length, totalIncome, totalExpense };
    } catch {
      return null;
    }
  };

  const changePasswordMutation = trpc.familyAuth.changePassword.useMutation({
    onSuccess: () => {
      setPwSaved(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setPwSaved(false), 3000);
      toast.success("Sifre basariyla degistirildi!");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleChangePassword = () => {
    if (!currentPw || !newPw || !confirmPw) {
      toast.error("Tum alanlari doldurun");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Yeni sifreler eslemiyor");
      return;
    }
    if (newPw.length < 4) {
      toast.error("Yeni sifre en az 4 karakter olmali");
      return;
    }
    changePasswordMutation.mutate({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw });
  };

  const handleSaveNames = () => {
    if (name1.trim()) setPerson1Name(name1.trim());
    if (name2.trim()) setPerson2Name(name2.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      importData(text);
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">
          Uygulamanin tercihlerini ve yedeklerini yönetin
        </p>
      </div>

      {/* Kişi Ayarları */}
      <Card className="p-6">
        <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Kişi Ayarları
        </h2>

        {currentPerson && (
          <div className="mb-5 p-4 bg-secondary rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentPerson === 'Benim' ? '👨' : '👩'}</span>
              <div>
                <p className="font-medium">Aktif Kişi</p>
                <p className="text-sm text-muted-foreground">
                  {currentPerson === 'Benim' ? person1Name : person2Name} olarak giriş yapıldı
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentPerson(null)} className="gap-2">
              <LogOut className="w-4 h-4" />
              Değiştir
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <span className="text-blue-600">👨</span>
                Kişi 1 Adı (Benim)
              </Label>
              <Input value={name1} onChange={e => setName1(e.target.value)} placeholder="Yiğit" className="border-blue-200 focus:border-blue-400" />
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <span className="text-purple-600">👩</span>
                Kişi 2 Adı (Eşim)
              </Label>
              <Input value={name2} onChange={e => setName2(e.target.value)} placeholder="Arzu" className="border-purple-200 focus:border-purple-400" />
            </div>
          </div>
          <Button onClick={handleSaveNames} className="gap-2" disabled={!name1.trim() || !name2.trim()}>
            {saved ? <><Check className="w-4 h-4" />Kaydedildi!</> : 'İsimleri Kaydet'}
          </Button>
        </div>
      </Card>

      {/* Veri Yedekleme */}
      <Card className="p-6">
        <h2 className="text-lg font-display font-bold mb-1 flex items-center gap-2">
          <FileJson className="w-5 h-5 text-green-600" />
          Veri Yedekleme
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Tüm verilerinizi JSON dosyası olarak indirin veya yükleyin. Telefon değişikliği veya tarayıcı temizliği öncesinde mutlaka yedek alın.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button onClick={exportData} variant="outline" className="gap-2 border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">
            <Download className="w-4 h-4" />
            Verileri İndir (JSON)
          </Button>

          <Button
            variant="outline"
            className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            Yedekten Yükle
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>

        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <strong>Dikkat:</strong> Yedekten yükleme mevcut verilerin üzerine yazar. İşlem geri alınabilir (Ctrl+Z).
          </p>
        </div>
      </Card>

      {/* Ay Arşivi */}
      <Card className="p-6">
        <h2 className="text-lg font-display font-bold mb-1 flex items-center gap-2">
          <Archive className="w-5 h-5 text-indigo-600" />
          Ay Arşivi
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Bu ayın verilerini arşive kaydedin. Arşivlenen aylar "Ay Arşivi" sayfasından görüntülenebilir.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={saveCurrentMonthToArchive} variant="outline" className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
            <Archive className="w-4 h-4" />
            Bu Ayı Arşive Kaydet
          </Button>
          <span className="text-sm text-muted-foreground">
            {archive.length > 0 ? `${archive.length} ay arşivlendi` : 'Henüz arşiv yok'}
          </span>
        </div>

        {archive.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {archive.slice(0, 6).map(a => (
              <Badge key={a.key} variant="secondary" className="text-xs">
                {a.monthName} {a.year}
              </Badge>
            ))}
            {archive.length > 6 && (
              <Badge variant="outline" className="text-xs">+{archive.length - 6} daha</Badge>
            )}
          </div>
        )}
      </Card>

      {/* Sabit Gider Bilgisi */}
      <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          💡 <strong>Sabit giderler</strong> her ay otomatik olarak bir sonraki aya taşınır.
          Durdurmak için giderin tipini <strong>Değişken</strong> yapın veya silin (Gelir &amp; Gider → Giderler sekmesindeki &quot;Tek seferlik&quot; butonu).
        </p>
      </Card>

      {/* Sifreyi Degistir */}
      <Card className="p-6">
        <h2 className="text-lg font-display font-bold mb-1 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-rose-600" />
          Sifreyi Degistir
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Aile giris sifresini degistirin. Mevcut sifreyi dogrulamaniz gerekir.
        </p>

        <div className="space-y-4 max-w-sm">
          <div>
            <Label className="mb-1.5 block text-sm">Mevcut Sifre</Label>
            <div className="relative">
              <Input
                type={showCurrentPw ? "text" : "password"}
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                placeholder="Mevcut sifreyi girin"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">Yeni Sifre</Label>
            <div className="relative">
              <Input
                type={showNewPw ? "text" : "password"}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="En az 4 karakter"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">Yeni Sifre (Tekrar)</Label>
            <div className="relative">
              <Input
                type={showConfirmPw ? "text" : "password"}
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Yeni sifreyi tekrar girin"
                className="pr-10"
                onKeyDown={e => e.key === "Enter" && handleChangePassword()}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={changePasswordMutation.isPending || pwSaved}
            className="w-full gap-2"
          >
            {pwSaved ? (
              <><Check className="w-4 h-4" />Sifre Degistirildi!</>
            ) : changePasswordMutation.isPending ? (
              "Degistiriliyor..."
            ) : (
              <><KeyRound className="w-4 h-4" />Sifreyi Degistir</>
            )}
          </Button>
        </div>

        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <strong>Not:</strong> Sifre degisikligi sunucu yeniden baslayana kadar gecerlidir. Kalici olmasi icin Manus panelinden FAMILY_PASSWORD_HASH secretini guncelleyin.
          </p>
        </div>
      </Card>

      {/* Tema Ayarları */}
      <Card className="p-6">
        <h2 className="text-lg font-display font-bold mb-4">Tema Ayarları</h2>
        <div className="space-y-4">
          <div className="p-4 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Mevcut Tema</p>
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <><Moon className="w-6 h-6 text-slate-700" /><div><p className="font-display font-bold">Koyu Tema</p><p className="text-sm text-muted-foreground">Gece kullanimi icin optimize edilmis</p></div></>
              ) : (
                <><Sun className="w-6 h-6 text-yellow-500" /><div><p className="font-display font-bold">Acik Tema</p><p className="text-sm text-muted-foreground">Gun boyunca kullanim icin optimize edilmis</p></div></>
              )}
            </div>
          </div>
          <Button onClick={toggleTheme} className="w-full" variant="outline">
            {theme === "dark" ? <><Sun className="w-4 h-4 mr-2 text-yellow-500" />Acik Temaya Gec</> : <><Moon className="w-4 h-4 mr-2 text-slate-700" />Koyu Temaya Gec</>}
          </Button>
        </div>
      </Card>
      {/* Yedek Gecmisi */}
      <Card className="p-6">
        <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Yedek Gecmisi
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Her kayit isleminde otomatik yedek alinir. Son 30 yedek saklanir.
        </p>

        {historyQuery.isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : historyQuery.data && historyQuery.data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Archive className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Henuz yedek bulunmuyor. Veri kaydedildikce otomatik yedek olusur.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {historyQuery.data?.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30 hover:bg-secondary/60 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {new Date(item.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.savedBy ? `${item.savedBy === 'Yigit' || item.savedBy === 'Arzu' ? item.savedBy : item.savedBy} tarafindan` : 'Otomatik'}
                  </p>
                </div>
                <div className="flex gap-2 ml-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelectedSnapshotId(item.id); setShowSnapshotModal(true); }}
                  >
                    <Eye className="w-3 h-3 mr-1" /> Goruntule
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-50">
                        <RotateCcw className="w-3 h-3 mr-1" /> Geri Yukle
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Yedeği Geri Yukle</AlertDialogTitle>
                        <AlertDialogDescription>
                          {new Date(item.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} tarihli yedek yuklenecek.
                          Mevcut veriler otomatik olarak yedeklenecek (geri alabilirsiniz). Devam edilsin mi?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Iptal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRestore(item.id)}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          Evet, Geri Yukle
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Snapshot Goruntule Modal */}
      <Dialog open={showSnapshotModal} onOpenChange={setShowSnapshotModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Yedek Ozeti
            </DialogTitle>
          </DialogHeader>
          {snapshotQuery.isLoading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : snapshotQuery.data ? (() => {
            const summary = parseSnapshotSummary(snapshotQuery.data.snapshot);
            return summary ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {new Date(snapshotQuery.data.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {snapshotQuery.data.savedBy ? ` — ${snapshotQuery.data.savedBy}` : ''}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-muted-foreground">Gelir Kaydi</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">{summary.incomes}</p>
                    <p className="text-xs text-green-600 dark:text-green-500">{summary.totalIncome.toLocaleString('tr-TR')} ₺</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-muted-foreground">Gider Kaydi</p>
                    <p className="text-xl font-bold text-red-700 dark:text-red-400">{summary.expenses}</p>
                    <p className="text-xs text-red-600 dark:text-red-500">{summary.totalExpense.toLocaleString('tr-TR')} ₺</p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                    <p className="text-xs text-muted-foreground">Borc Kaydi</p>
                    <p className="text-xl font-bold text-orange-700 dark:text-orange-400">{summary.debts}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-muted-foreground">Birikim Kaydi</p>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{summary.savings}</p>
                  </div>
                  {summary.installments > 0 && (
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 col-span-2">
                      <p className="text-xs text-muted-foreground">Taksit Kaydi</p>
                      <p className="text-xl font-bold text-purple-700 dark:text-purple-400">{summary.installments}</p>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Net Durum</span>
                    <span className={`font-bold ${summary.totalIncome - summary.totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(summary.totalIncome - summary.totalExpense).toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Snapshot verisi okunamadi.</p>
            );
          })() : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
