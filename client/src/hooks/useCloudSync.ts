import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { BudgetData } from "./useBudgetData";
import { toast } from "sonner";

interface UseCloudSyncOptions {
  budgetData: BudgetData;
  setBudgetData: (data: BudgetData) => void;
  isLoaded: boolean;
}

// Veriyi JSON string olarak karsilastir - sadece asil icerigi
function getDataHash(data: {
  incomes: unknown;
  expenses: unknown;
  debts: unknown;
  savingsGoals: unknown;
  annualPayments: unknown;
  budgetLimits: unknown;
  installments?: unknown;
}): string {
  return JSON.stringify({
    incomes: data.incomes,
    expenses: data.expenses,
    debts: data.debts,
    savingsGoals: data.savingsGoals,
    annualPayments: data.annualPayments,
    budgetLimits: data.budgetLimits,
    installments: data.installments,
  });
}

export function useCloudSync({
  budgetData,
  setBudgetData,
  isLoaded,
}: UseCloudSyncOptions) {
  // Son kaydedilen verinin hash'i - kaydetme dongusunu onlemek icin
  const lastSavedHashRef = useRef<string>("__INIT__");
  // Son sunucudan alinan verinin hash'i - gereksiz guncellemeyi onlemek icin
  const lastCloudHashRef = useRef<string>("__INIT__");
  // Ilk yukleme yapildi mi?
  const initialLoadDoneRef = useRef(false);
  // Kaydetme timer'i
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Simdi kayit yapiliyor mu? (polling'in bunu ezmesini engelle)
  const isSavingRef = useRef(false);
  // Son bilinen sunucu updatedAt - optimistic locking icin
  const lastKnownUpdatedAtRef = useRef<string | null>(null);

  // Auth durumunu kontrol et - sadece giris yapilmissa sorgula
  const { data: familySession } = trpc.familyAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const isAuthenticated = !!familySession;

  const utils = trpc.useUtils();

  // 5 saniyede bir polling - her zaman cagrilir ama enabled flag ile kontrol edilir
  const { data: cloudData } = trpc.familyBudget.get.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    retry: 1,
    staleTime: 0,
  });

  const saveMutation = trpc.familyBudget.save.useMutation({
    onSuccess: result => {
      // Sunucudan donen yeni updatedAt'i kaydet
      if (result && "updatedAt" in result && result.updatedAt) {
        lastKnownUpdatedAtRef.current = new Date(
          result.updatedAt
        ).toISOString();
      }
    },
    onError: error => {
      if (error.data?.code === "CONFLICT") {
        toast.warning("Veriler başka cihazdan değişti, yeniden yükleniyor...", {
          description: "Son değişikliklerinizi tekrar girmeniz gerekebilir.",
          duration: 5000,
        });
        // Sunucudan taze veriyi cek
        utils.familyBudget.get.invalidate();
        // lastSavedHash'i sifirla ki bir sonraki polling'de veriyi yuklesin
        lastSavedHashRef.current = "__CONFLICT__";
      } else {
        console.error("[CloudSync] Save failed:", error);
      }
    },
  });

  // Buluttan veriyi parse et
  const parseCloudData = useCallback(
    (raw: typeof cloudData): BudgetData | null => {
      if (!raw) return null;
      try {
        return {
          month: budgetData.month,
          year: budgetData.year,
          incomes: JSON.parse(raw.incomes || "[]"),
          expenses: JSON.parse(raw.expenses || "[]"),
          debts: JSON.parse(raw.debts || "[]"),
          savingsGoals: JSON.parse(raw.savingsGoals || "[]"),
          annualPayments: JSON.parse(raw.annualPayments || "[]"),
          budgetLimits: JSON.parse(raw.budgetLimits || "[]"),
          installments: JSON.parse((raw as any).installments || "[]"),
        };
      } catch (e) {
        console.error("[CloudSync] Parse error:", e);
        return null;
      }
    },
    [budgetData.month, budgetData.year]
  );

  // Buluttan veri geldiginde: updatedAt'i guncelle + ilk yukleme veya farkli veri varsa guncelle
  useEffect(() => {
    if (!cloudData || !isLoaded) return;
    // Kayit yapiliyorsa polling'i atla (race condition onleme)
    if (isSavingRef.current) return;

    // updatedAt'i her zaman guncelle (optimistic locking icin)
    if (cloudData.updatedAt) {
      lastKnownUpdatedAtRef.current = new Date(
        cloudData.updatedAt
      ).toISOString();
    }

    const parsed = parseCloudData(cloudData);
    if (!parsed) return;

    const cloudHash = getDataHash(parsed);

    // Ilk yukleme: sunucuda veri varsa yukle
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;

      if (cloudData.updatedAt) {
        // Sunucuda kayitli veri var - yukle
        setBudgetData(parsed);
        lastSavedHashRef.current = cloudHash;
        lastCloudHashRef.current = cloudHash;
        console.log("[CloudSync] Initial load from cloud");
      } else {
        // Sunucuda veri yok - yerel veriyi kullan
        const localHash = getDataHash(budgetData);
        lastSavedHashRef.current = localHash;
        lastCloudHashRef.current = cloudHash;
        lastKnownUpdatedAtRef.current = null; // ilk save icin null
        console.log("[CloudSync] No cloud data, using local");
      }
      return;
    }

    // Polling: bulut verisi degistiyse guncelle
    if (cloudHash !== lastCloudHashRef.current) {
      lastCloudHashRef.current = cloudHash;

      // Yerel veriden farkli mi?
      const localHash = getDataHash(budgetData);
      if (cloudHash !== localHash) {
        setBudgetData(parsed);
        lastSavedHashRef.current = cloudHash;
        console.log("[CloudSync] Updated from cloud polling");
      }
    }
  }, [cloudData, isLoaded]);

  // Yerel veri degisince buluta kaydet (debounce: 1.5 saniye)
  useEffect(() => {
    if (!isLoaded || !initialLoadDoneRef.current) return;

    const currentHash = getDataHash(budgetData);
    // Zaten kaydedilmis veriyle ayni ise kaydetme
    if (currentHash === lastSavedHashRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      // Kaydetme sirasinda polling'in uzerine yazmamasi icin flag
      isSavingRef.current = true;
      try {
        await saveMutation.mutateAsync({
          incomes: JSON.stringify(budgetData.incomes),
          expenses: JSON.stringify(budgetData.expenses),
          debts: JSON.stringify(budgetData.debts),
          annualPayments: JSON.stringify(budgetData.annualPayments),
          budgetLimits: JSON.stringify(budgetData.budgetLimits),
          savingsGoals: JSON.stringify(budgetData.savingsGoals),
          installments: JSON.stringify(budgetData.installments || []),
          expectedUpdatedAt: lastKnownUpdatedAtRef.current,
        });
        lastSavedHashRef.current = currentHash;
        lastCloudHashRef.current = currentHash;
        console.log("[CloudSync] Saved to cloud");
      } catch (e) {
        // CONFLICT hatasi onError'da handle ediliyor
        // Diger hatalar icin log yeterli
        if ((e as any)?.data?.code !== "CONFLICT") {
          console.error("[CloudSync] Save failed:", e);
        }
      } finally {
        isSavingRef.current = false;
      }
    }, 1500);
  }, [budgetData, isLoaded]);

  return {
    isSaving: saveMutation.isPending,
    isInitialized: initialLoadDoneRef.current,
  };
}
