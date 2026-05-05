import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Debts from "./Debts";
import Installments from "./Installments";
import AnnualPayments from "./AnnualPayments";

export default function BorcOdemeler() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Borç &amp; Ödemeler</h1>
        <p className="text-sm text-muted-foreground">Borç, taksit ve yıllık ödemelerinizi takip edin</p>
      </div>
      <Tabs defaultValue="borclar" className="w-full">
        <TabsList className="bg-card border rounded-xl p-1 h-auto w-full justify-start gap-1">
          <TabsTrigger
            value="borclar"
            className="rounded-lg py-2 px-4 font-medium text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground hover:bg-accent transition-colors"
          >
            Borçlar
          </TabsTrigger>
          <TabsTrigger
            value="taksitler"
            className="rounded-lg py-2 px-4 font-medium text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground hover:bg-accent transition-colors"
          >
            Taksitler
          </TabsTrigger>
          <TabsTrigger
            value="yillik"
            className="rounded-lg py-2 px-4 font-medium text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground hover:bg-accent transition-colors"
          >
            Yıllık Ödemeler
          </TabsTrigger>
        </TabsList>
        <TabsContent value="borclar" className="mt-4">
          <Debts />
        </TabsContent>
        <TabsContent value="taksitler" className="mt-4">
          <Installments />
        </TabsContent>
        <TabsContent value="yillik" className="mt-4">
          <AnnualPayments />
        </TabsContent>
      </Tabs>
    </div>
  );
}
