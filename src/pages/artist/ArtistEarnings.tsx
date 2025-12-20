import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentArtist, useArtistBookings, useArtistEarnings } from "@/hooks/useArtistDashboard";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Star } from "lucide-react";

const ArtistEarnings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const { data: bookings } = useArtistBookings();
  const { data: earnings, isLoading: earningsLoading } = useArtistEarnings();

  const { upcoming = [] } = bookings || {};

  if (authLoading || artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="px-5 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user || !artist) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">Earnings</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Not an Artist</h2>
          <p className="text-muted-foreground mb-6">You don't have an artist profile yet</p>
          <Button onClick={() => navigate("/home")}>Go Home</Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="px-5 py-4">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{upcoming.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Upcoming</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <p className="text-2xl font-bold text-foreground">{artist.rating || 0}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{artist.total_reviews || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Reviews</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {earningsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Revenue Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  ${earnings?.totalEarnings.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {earnings?.completedBookings || 0} completed bookings
                </p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  ${earnings?.pendingEarnings.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Confirmed bookings
                </p>
              </div>
            </div>

            {/* Monthly Comparison */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3">This Month</h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    ${earnings?.thisMonthEarnings.toFixed(2) || "0.00"}
                  </p>
                  {earnings && earnings.lastMonthEarnings > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {earnings.thisMonthEarnings >= earnings.lastMonthEarnings ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-500">
                            +{(((earnings.thisMonthEarnings - earnings.lastMonthEarnings) / earnings.lastMonthEarnings) * 100).toFixed(0)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 text-destructive" />
                          <span className="text-sm text-destructive">
                            {(((earnings.thisMonthEarnings - earnings.lastMonthEarnings) / earnings.lastMonthEarnings) * 100).toFixed(0)}%
                          </span>
                        </>
                      )}
                      <span className="text-sm text-muted-foreground">vs last month</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Last month</p>
                  <p className="text-lg font-medium text-muted-foreground">
                    ${earnings?.lastMonthEarnings.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </div>

            {/* Earnings Chart */}
            {earnings && earnings.monthlyTrend.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <h3 className="font-semibold text-foreground mb-4">Revenue Trend</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={earnings.monthlyTrend}>
                      <defs>
                        <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, "Earnings"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="earnings"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#earningsGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Service Breakdown */}
            {earnings && earnings.serviceBreakdown.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <h3 className="font-semibold text-foreground mb-3">Top Services</h3>
                <div className="space-y-3">
                  {earnings.serviceBreakdown.slice(0, 5).map((service) => (
                    <div key={service.name} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.count} bookings</p>
                      </div>
                      <p className="font-semibold text-foreground">${service.earnings.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {earnings && earnings.completedBookings === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No earnings yet</p>
                <p className="text-sm mt-1">Complete your first booking to see earnings</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ArtistEarnings;
