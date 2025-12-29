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
      toast.success("Report generated successfully");
    }, 2000);
  };

  const handleExport = (format: "csv" | "pdf" | "excel") => {
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="container mx-auto px-4 py-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t.adminNav.notificationLog}
        </h1>
        <p className="text-muted-foreground">
          Generate custom reports for your platform
        </p>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="bookings">
            <FileText className="w-4 h-4 mr-2" />
            {t.adminNav.bookings}
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="w-4 h-4 mr-2" />
            {t.adminNav.finance}
          </TabsTrigger>
          <TabsTrigger value="artists">
            <Users className="w-4 h-4 mr-2" />
            {t.adminNav.artists}
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Activity className="w-4 h-4 mr-2" />
            Customers
          </TabsTrigger>
        </TabsList>

        {/* Bookings Report */}
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.adminNav.bookings}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Filters</Label>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm">Status</Label>
                      <Select value={status.length > 0 ? status[0] : undefined}>
                        <SelectTrigger>
                          {status.length > 0 ? status[0] : "All Status"}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={sortBy}>
                    <SelectTrigger>
                      {sortBy === "date" ? "Date" : sortBy === "amount" ? "Amount" : "Count"}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="count">Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Export Format</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("csv")}
                  >
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("pdf")}
                  >
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("excel")}
                  >
                    Excel
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="min-w-[200px]"
                >
                  {isGenerating ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Report */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.adminNav.finance}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-accent/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-foreground">
                      QAR 0
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Revenue
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-accent/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-foreground">
                      QAR 0
                    </div>
                    <div className="text-sm text-muted-foreground">
                      This Month
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-accent/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-foreground">
                      +0%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      vs Last Month
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
                  {isGenerating ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Artists Report */}
        <TabsContent value="artists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Artist Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Top Rated Artists</Label>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                          {i}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Artist Name {i}</div>
                          <div className="text-sm text-muted-foreground">Rating: 5.{Math.floor(Math.random() * 3)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Active Artists</Label>
                  <div className="text-3xl font-bold text-primary">
                    0
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total active artists
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="min-w-[200px]"
                >
                  {isGenerating ? "Generating..." : "View Full Report"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Report */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-accent/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-foreground">
                      0
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Customers
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-accent/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-foreground">
                      0
                    </div>
                    <div className="text-sm text-muted-foreground">
                      New This Month
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-accent/50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-foreground">
                      0
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Repeat Customers
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
                  {isGenerating ? "Generating..." : "View Full Report"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;

