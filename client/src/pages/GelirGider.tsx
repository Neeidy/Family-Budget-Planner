import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Incomes from "./Incomes";
import Expenses from "./Expenses";
import BudgetLimits from "./BudgetLimits";

export default function GelirGider() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gelir &amp; Gider</h1>
        <p className="text-sm text-muted-foreground">Gelir, gider ve bütçe limitlerini yönetin</p>
      </div>
      <Tabs defaultValue="gelirler" className="w-full">
        <TabsList className="bg-card border rounded-xl p-1 h-auto w-full justify-start gap-1">
          <TabsTrigger
            value="gelirler"
            className="rounded-lg py-2 px-4 font-medium text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground hover:bg-accent transition-colors"
          >
            Gelirler
          </TabsTrigger>
          <TabsTrigger
            value="giderler"
            className="rounded-lg py-2 px-4 font-medium text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground hover:bg-accent transition-colors"
          >
            Giderler
          </TabsTrigger>
          <TabsTrigger
            value="limitler"
            className="rounded-lg py-2 px-4 font-medium text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground hover:bg-accent transition-colors"
          >
            Bütçe Limitleri
          </TabsTrigger>
        </TabsList>
        <TabsContent value="gelirler" className="mt-4">
          <Incomes />
        </TabsContent>
        <TabsContent value="giderler" className="mt-4">
          <Expenses />
        </TabsContent>
        <TabsContent value="limitler" className="mt-4">
          <BudgetLimits />
        </TabsContent>
      </Tabs>
    </div>
  );
}
