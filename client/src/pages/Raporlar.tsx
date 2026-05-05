import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MonthArchive from "./MonthArchive";
import Analytics from "./Analytics";

export default function Raporlar() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Raporlar</h1>
        <p className="text-sm text-muted-foreground">Aylık karşılaştırma ve analitik raporlar</p>
      </div>
      <Tabs defaultValue="arsiv" className="w-full">
        <TabsList className="bg-card border rounded-xl p-1 h-auto w-full justify-start gap-1">
          <TabsTrigger
            value="arsiv"
            className="rounded-lg py-2 px-4 font-medium text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground hover:bg-accent transition-colors"
          >
            Aylık Karşılaştırma
          </TabsTrigger>
          <TabsTrigger
            value="analitik"
            className="rounded-lg py-2 px-4 font-medium text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground hover:bg-accent transition-colors"
          >
            Analitik
          </TabsTrigger>
        </TabsList>
        <TabsContent value="arsiv" className="mt-4">
          <MonthArchive />
        </TabsContent>
        <TabsContent value="analitik" className="mt-4">
          <Analytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
