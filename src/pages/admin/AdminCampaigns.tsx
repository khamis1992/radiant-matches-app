import { useState } from "react";
import { 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit2, 
  BarChart3, 
  Target, 
  Calendar,
  Percent,
  Tag,
  Users,
  TrendingUp,
  Eye,
  MousePointer,
  ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketingCampaigns, CreateCampaignInput, MarketingCampaign } from "@/hooks/useMarketingCampaigns";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import AdminSidebar from "@/components/admin/AdminSidebar";

const AdminCampaigns = () => {
  const { t, isRTL } = useLanguage();
  const {
    campaigns,
    isLoading,
    createCampaign,
    activateCampaign,
    pauseCampaign,
    deleteCampaign,
    isCreating,
    getActiveCampaigns,
    getDraftCampaigns,
    getScheduledCampaigns,
    getTotalStats,
  } = useMarketingCampaigns();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState<CreateCampaignInput>({
    title: "",
    type: "discount",
    target_audience: "all",
  });

  const stats = getTotalStats();

  const handleCreateCampaign = () => {
    if (!newCampaign.title.trim()) return;
    createCampaign(newCampaign);
    setIsCreateOpen(false);
    setNewCampaign({ title: "", type: "discount", target_audience: "all" });
  };

  const getStatusColor = (status: MarketingCampaign["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "scheduled":
        return "bg-blue-500";
      case "paused":
        return "bg-yellow-500";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getTypeIcon = (type: MarketingCampaign["type"]) => {
    switch (type) {
      case "discount":
        return <Percent className="w-4 h-4" />;
      case "promo_code":
        return <Tag className="w-4 h-4" />;
      case "banner":
        return <Eye className="w-4 h-4" />;
      case "push_notification":
        return <Target className="w-4 h-4" />;
      case "email":
        return <Users className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <AdminSidebar />

      <main className={`flex-1 p-6 ${isRTL ? "mr-64" : "ml-64"}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                {t.admin?.campaigns?.title || "Marketing Campaigns"}
              </h1>
              <p className="text-muted-foreground">
                {t.admin?.campaigns?.description || "Create and manage promotional campaigns"}
              </p>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t.admin?.campaigns?.create || "Create Campaign"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t.admin?.campaigns?.createNew || "Create New Campaign"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t.admin?.campaigns?.campaignTitle || "Campaign Title"}</Label>
                    <Input
                      value={newCampaign.title}
                      onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                      placeholder="Summer Sale 2025"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t.admin?.campaigns?.description || "Description"}</Label>
                    <Textarea
                      value={newCampaign.description || ""}
                      onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                      placeholder="Campaign description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t.admin?.campaigns?.type || "Type"}</Label>
                      <Select
                        value={newCampaign.type}
                        onValueChange={(v) => setNewCampaign({ ...newCampaign, type: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="promo_code">Promo Code</SelectItem>
                          <SelectItem value="banner">Banner</SelectItem>
                          <SelectItem value="push_notification">Push Notification</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t.admin?.campaigns?.audience || "Target Audience"}</Label>
                      <Select
                        value={newCampaign.target_audience}
                        onValueChange={(v) => setNewCampaign({ ...newCampaign, target_audience: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="new_users">New Users</SelectItem>
                          <SelectItem value="returning_users">Returning Users</SelectItem>
                          <SelectItem value="inactive_users">Inactive Users</SelectItem>
                          <SelectItem value="high_value">High Value</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {(newCampaign.type === "discount" || newCampaign.type === "promo_code") && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t.admin?.campaigns?.discountPercent || "Discount %"}</Label>
                        <Input
                          type="number"
                          value={newCampaign.discount_percent || ""}
                          onChange={(e) => setNewCampaign({ ...newCampaign, discount_percent: parseInt(e.target.value) })}
                          placeholder="20"
                        />
                      </div>

                      {newCampaign.type === "promo_code" && (
                        <div className="space-y-2">
                          <Label>{t.admin?.campaigns?.promoCode || "Promo Code"}</Label>
                          <Input
                            value={newCampaign.promo_code || ""}
                            onChange={(e) => setNewCampaign({ ...newCampaign, promo_code: e.target.value.toUpperCase() })}
                            placeholder="SUMMER25"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t.admin?.campaigns?.startDate || "Start Date"}</Label>
                      <Input
                        type="datetime-local"
                        value={newCampaign.start_date || ""}
                        onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t.admin?.campaigns?.endDate || "End Date"}</Label>
                      <Input
                        type="datetime-local"
                        value={newCampaign.end_date || ""}
                        onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    {t.common?.cancel || "Cancel"}
                  </Button>
                  <Button onClick={handleCreateCampaign} disabled={isCreating}>
                    {isCreating ? "Creating..." : (t.admin?.campaigns?.create || "Create")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Impressions</p>
                    <p className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MousePointer className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Clicks</p>
                    <p className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="text-2xl font-bold">{stats.totalConversions.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">QAR {stats.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t.admin?.campaigns?.allCampaigns || "All Campaigns"}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    {getActiveCampaigns().length} Active
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {getScheduledCampaigns().length} Scheduled
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    {getDraftCampaigns().length} Draft
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : campaigns.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div className="font-medium">{campaign.title}</div>
                          {campaign.promo_code && (
                            <Badge variant="secondary" className="mt-1">
                              {campaign.promo_code}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(campaign.type)}
                            <span className="capitalize">{campaign.type.replace("_", " ")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(campaign.status)} text-white`}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {campaign.target_audience.replace("_", " ")}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{campaign.impressions.toLocaleString()} views</div>
                            <div className="text-muted-foreground">
                              {campaign.conversions} conversions
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {campaign.start_date && (
                              <div>{format(new Date(campaign.start_date), "MMM d")}</div>
                            )}
                            {campaign.end_date && (
                              <div className="text-muted-foreground">
                                to {format(new Date(campaign.end_date), "MMM d")}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {campaign.status === "active" ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => pauseCampaign(campaign.id)}
                              >
                                <Pause className="w-4 h-4" />
                              </Button>
                            ) : campaign.status === "draft" || campaign.status === "paused" ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => activateCampaign(campaign.id)}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteCampaign(campaign.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No campaigns yet</p>
                  <p className="text-muted-foreground mb-4">
                    Create your first marketing campaign to boost engagement
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Campaign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminCampaigns;

