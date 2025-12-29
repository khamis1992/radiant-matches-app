import { useState } from "react";
import { FileText, Calendar, TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";

const AdminReports = () => {
  const { t, isRTL } = useLanguage();
  const [reportType, setReportType] = useState<"bookings" | "revenue" | "artists" | "customers">("bookings");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "amount" | "count">("date");

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      toast.success(t.reports.reportGenerated);
    }, 2000);
  };

  const handleExport = (format: "csv" | "pdf" | "excel") => {
    toast.success(t.reports.exportSuccess);
  };

  return (
    <div className="min-h-screen bg-background flex" dir={isRTL ? "rtl" : "ltr"}>
      <AdminSidebar />
      <main className={cn("flex-1 p-8", isRTL ? "mr-64" : "ml-64")}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t.reports.title}
        </h1>
        <p className="text-muted-foreground">
          {t.reports.overview}
        </p>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="bookings">
            <FileText className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
            {t.reports.bookingsReport}
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
            {t.reports.revenueReport}
          </TabsTrigger>
          <TabsTrigger value="artists">
            <Users className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
            {t.reports.artistsReport}
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Activity className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
            {t.reports.usersReport}
          </TabsTrigger>
        </TabsList>

        {/* Bookings Report */}
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.reports.bookingsReport}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.reports.dateRange}</Label>
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>{t.reports.applyFilters}</Label>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm">{t.adminBookings.status}</Label>
                      <Select value={status.length > 0 ? status[0] : undefined}>
                        <SelectTrigger>
                          {status.length > 0 ? status[0] : t.adminBookings.filterByStatus}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">{t.adminBookings.pending}</SelectItem>
                          <SelectItem value="confirmed">{t.adminBookings.confirmed}</SelectItem>
                          <SelectItem value="completed">{t.adminBookings.completed}</SelectItem>
                          <SelectItem value="cancelled">{t.adminBookings.cancelled}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t.artistsListing.sortBy}</Label>
                  <Select value={sortBy}>
                    <SelectTrigger>
                      {sortBy === "date" ? t.adminBookings.date : sortBy === "amount" ? t.adminBookings.amount : t.reports.totalBookings}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">{t.adminBookings.date}</SelectItem>
                      <SelectItem value="amount">{t.adminBookings.amount}</SelectItem>
                      <SelectItem value="count">{t.reports.totalBookings}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.reports.exportFormat}</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("csv")}
                  >
                    {t.reports.csv}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("pdf")}
                  >
                    {t.reports.pdf}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("excel")}
                  >
                    {t.reports.excel}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="min-w-[200px]"
                >
                  {isGenerating ? t.reports.generatingReport : t.reports.generateReport}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Report */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.reports.revenueReport}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-accent/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-foreground">
                      QAR 0
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t.reports.totalRevenue}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-accent/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-foreground">
                      QAR 0
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t.reports.thisMonthRevenue}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-accent/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-foreground">
                      +0%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t.reports.growth}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="min-w-[200px]"
                >
                  {isGenerating ? t.reports.generatingReport : t.reports.generateReport}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Artists Report */}
        <TabsContent value="artists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.reports.artistsReport}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRTL ? "أعلى الفنانات تقييماً" : "Top Rated Artists"}</Label>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                          {i}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{isRTL ? `فنانة ${i}` : `Artist Name ${i}`}</div>
                          <div className="text-sm text-muted-foreground">{t.adminArtists.rating}: 5.{Math.floor(Math.random() * 3)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>{t.reports.activeArtists}</Label>
                  <div className="text-3xl font-bold text-primary">
                    0
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isRTL ? "إجمالي الفنانات النشطات" : "Total active artists"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="min-w-[200px]"
                >
                  {isGenerating ? t.reports.generatingReport : t.reports.downloadReport}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Report */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.reports.usersReport}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-accent/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-foreground">
                      0
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isRTL ? "إجمالي العملاء" : "Total Customers"}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-accent/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-foreground">
                      0
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t.reports.newCustomers}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-accent/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-foreground">
                      0
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t.reports.returningCustomers}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="min-w-[200px]"
                >
                  {isGenerating ? t.reports.generatingReport : t.reports.downloadReport}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </main>
    </div>
  );
};

export default AdminReports;
