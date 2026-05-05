import { Dashboard } from "@/components/Dashboard";
import { useBudgetData } from "@/hooks/useBudgetData";
import { useCloudSync } from "@/hooks/useCloudSync";

// Cloud sync'i burada yonet - tum uygulama icin tek noktadan
export function CloudSyncProvider() {
  const budgetHook = useBudgetData();
  useCloudSync({
    budgetData: budgetHook.budgetData,
    setBudgetData: budgetHook.setBudgetData,
    isLoaded: budgetHook.isLoaded,
  });
  return null;
}

export default function Home() {
  return (
    <div>
      <Dashboard />
    </div>
  );
}
