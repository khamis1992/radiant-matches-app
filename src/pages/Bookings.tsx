import { useMemo, useState } from "react";
import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from "date-fns";
import { ar, enUS, type Locale } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  CalendarCheck,
  CalendarPlus,
  CaretRight,
  ChatCircleDots,
  CheckCircle,
  Clock,
  ClockCounterClockwise,
  HourglassMedium,
  MapPin,
  Receipt,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { type Booking, useUserBookings } from "@/hooks/useBookings";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConversations } from "@/hooks/useConversations";
import { formatBookingTime, formatQAR } from "@/lib/locale";
import { toast } from "sonner";

type BookingTab = "upcoming" | "past";

const statusStyles: Record<
  Booking["status"],
  {
    icon: React.ElementType;
    surface: string;
    tone: string;
  }
> = {
  pending: {
    icon: HourglassMedium,
    surface: "bg-[color-mix(in_srgb,var(--glam-warning)_10%,transparent)]",
    tone: "text-[var(--glam-warning)]",
  },
  confirmed: {
    icon: CheckCircle,
    surface: "bg-[color-mix(in_srgb,var(--glam-success)_10%,transparent)]",
    tone: "text-glam-success",
  },
  completed: {
    icon: CheckCircle,
    surface: "bg-[color-mix(in_srgb,var(--glam-info)_10%,transparent)]",
    tone: "text-[var(--glam-info)]",
  },
  cancelled: {
    icon: XCircle,
    surface: "bg-[color-mix(in_srgb,var(--glam-error)_10%,transparent)]",
    tone: "text-[var(--glam-error)]",
  },
};

const StatusBadge = ({
  status,
  label,
}: {
  status: Booking["status"];
  label: string;
}) => {
  const config = statusStyles[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold ${config.surface} ${config.tone}`}
    >
      <Icon size={14} weight="bold" aria-hidden="true" />
      {label}
    </span>
  );
};

const ArtistIdentity = ({ booking, large = false }: { booking: Booking; large?: boolean }) => {
  const artistName = booking.artist?.profile?.full_name || "GLAM Artist";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className={`${large ? "h-14 w-14" : "h-12 w-12"} shrink-0 rounded-2xl border border-glam-border`}>
        <AvatarImage
          src={booking.artist?.featured_image || booking.artist?.profile?.avatar_url || undefined}
          alt={artistName}
          className="object-cover"
        />
        <AvatarFallback className="rounded-2xl bg-glam-blush-soft font-semibold text-glam-ink">
          {artistName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 text-start">
        <p className="truncate text-[15px] font-bold text-glam-ink">{artistName}</p>
        <p className="mt-0.5 truncate text-xs text-glam-secondary">
          {booking.service?.name || "Beauty service"}
        </p>
      </div>
    </div>
  );
};

const DateTile = ({ date, locale }: { date: Date; locale: Locale }) => (
  <div className="flex h-[72px] w-[64px] shrink-0 flex-col items-center justify-center rounded-2xl bg-glam-ink text-white">
    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-glam-blush-soft rtl:tracking-normal">
      {format(date, "MMM", { locale })}
    </span>
    <span className="mt-0.5 text-2xl font-bold tabular-nums leading-none">{format(date, "d")}</span>
    <span className="mt-1 text-[9px] text-white/70">{format(date, "EEE", { locale })}</span>
  </div>
);

const BookingMoment = ({ date, locale, language }: { date: Date; locale: Locale; language: string }) => {
  let label = formatDistanceToNow(date, { addSuffix: true, locale });
  let Icon = CalendarBlank;
  let tone = "text-glam-secondary";

  if (isToday(date)) {
    label = language === "ar" ? "موعدك اليوم" : "Your appointment is today";
    Icon = CheckCircle;
    tone = "text-glam-success";
  } else if (isTomorrow(date)) {
    label = language === "ar" ? "موعدك غداً" : "Your appointment is tomorrow";
    Icon = Clock;
    tone = "text-[var(--glam-warning)]";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${tone}`}>
      <Icon size={15} weight="bold" aria-hidden="true" />
      {label}
    </span>
  );
};

const FeaturedBookingCard = ({
  booking,
  language,
  locale,
  labels,
  onDetails,
  onChat,
  chatLoading,
}: {
  booking: Booking;
  language: string;
  locale: Locale;
  labels: ReturnType<typeof getLabels>;
  onDetails: () => void;
  onChat: () => void;
  chatLoading: boolean;
}) => {
  const bookingDate = parseISO(booking.booking_date);

  return (
    <article
      data-testid="featured-booking-card"
      className="overflow-hidden rounded-[28px] border border-glam-border bg-white shadow-[0_22px_54px_-40px_var(--glam-ink)]"
    >
      <div className="border-b border-glam-border bg-glam-porcelain px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <BookingMoment date={bookingDate} locale={locale} language={language} />
          <StatusBadge status={booking.status} label={labels.status[booking.status]} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-4">
          <DateTile date={bookingDate} locale={locale} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-glam-rose">
              {labels.nextAppointment}
            </p>
            <h2 className="mt-1 truncate text-lg font-bold text-glam-ink">
              {booking.service?.name || labels.beautyService}
            </h2>
            <p className="mt-1 text-xs text-glam-secondary">
              {format(bookingDate, "EEEE, d MMMM", { locale })}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-glam-surface p-3.5">
          <ArtistIdentity booking={booking} large />
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-glam-border pt-3">
            <span className="flex items-center gap-2 text-xs text-glam-secondary">
              <Clock size={17} className="shrink-0 text-glam-ink" aria-hidden="true" />
              {formatBookingTime(booking.booking_time)}
            </span>
            <span className="flex min-w-0 items-center gap-2 text-xs text-glam-secondary">
              <MapPin size={17} className="shrink-0 text-glam-ink" aria-hidden="true" />
              <span className="truncate">
                {booking.location_type === "client_home" ? labels.atHome : labels.atStudio}
              </span>
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-start">
            <p className="text-[10px] text-glam-muted">{labels.total}</p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-glam-ink">
              {formatQAR(booking.total_price, language === "ar" ? "ar" : "en")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onChat}
              disabled={chatLoading}
              aria-label={labels.chat}
              className="grid h-12 w-12 place-items-center rounded-full border border-glam-border bg-white text-glam-ink transition-colors hover:bg-glam-surface active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-rose"
            >
              <ChatCircleDots size={21} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onDetails}
              className="flex h-12 items-center gap-2 rounded-full bg-glam-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-glam-ink-pressed active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-rose focus-visible:ring-offset-2"
            >
              {labels.details}
              <ArrowRight size={17} weight="bold" className="rtl:-scale-x-100" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const CompactBookingCard = ({
  booking,
  language,
  locale,
  labels,
  showChat,
  onDetails,
  onChat,
  chatLoading,
}: {
  booking: Booking;
  language: string;
  locale: Locale;
  labels: ReturnType<typeof getLabels>;
  showChat: boolean;
  onDetails: () => void;
  onChat: () => void;
  chatLoading: boolean;
}) => {
  const bookingDate = parseISO(booking.booking_date);

  return (
    <article className="rounded-3xl border border-glam-border bg-white p-4 shadow-[0_16px_40px_-36px_var(--glam-ink)]">
      <div className="flex items-start justify-between gap-3">
        <ArtistIdentity booking={booking} />
        <StatusBadge status={booking.status} label={labels.status[booking.status]} />
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-glam-surface px-3 py-3">
        <CalendarBlank size={19} className="shrink-0 text-glam-rose" aria-hidden="true" />
        <div className="min-w-0 flex-1 text-start">
          <p className="truncate text-xs font-semibold text-glam-ink">
            {format(bookingDate, "EEEE, d MMMM", { locale })}
          </p>
          <p className="mt-0.5 text-[11px] text-glam-muted">
            {formatBookingTime(booking.booking_time)} · {booking.location_type === "client_home" ? labels.atHome : labels.atStudio}
          </p>
        </div>
        <p className="shrink-0 text-xs font-bold tabular-nums text-glam-ink">
          {formatQAR(booking.total_price, language === "ar" ? "ar" : "en")}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onDetails}
          className="flex h-11 flex-1 items-center justify-between rounded-full border border-glam-border px-4 text-xs font-semibold text-glam-ink transition-colors hover:bg-glam-surface active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-rose"
        >
          {labels.details}
          <CaretRight size={16} weight="bold" className="rtl:-scale-x-100" aria-hidden="true" />
        </button>
        {showChat && (
          <button
            type="button"
            onClick={onChat}
            disabled={chatLoading}
            aria-label={labels.chat}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-glam-ink text-white transition-colors hover:bg-glam-ink-pressed active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-rose focus-visible:ring-offset-2"
          >
            <ChatCircleDots size={19} aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
};

const TabButton = ({
  active,
  label,
  count,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  icon: React.ElementType;
  onClick: () => void;
}) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-rose ${
      active ? "bg-glam-ink text-white shadow-sm" : "text-glam-secondary hover:bg-white"
    }`}
  >
    <Icon size={18} weight={active ? "bold" : "regular"} aria-hidden="true" />
    <span>{label}</span>
    <span
      className={`grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
        active ? "bg-white/15 text-white" : "bg-white text-glam-rose"
      }`}
    >
      {count}
    </span>
  </button>
);

const EmptyState = ({
  type,
  labels,
  onExplore,
}: {
  type: BookingTab;
  labels: ReturnType<typeof getLabels>;
  onExplore: () => void;
}) => {
  const isUpcoming = type === "upcoming";

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative mb-6 grid h-28 w-28 place-items-center rounded-[32px] border border-glam-border bg-white shadow-[0_20px_48px_-38px_var(--glam-ink)]">
        <CalendarPlus size={48} weight="light" className="text-glam-ink" aria-hidden="true" />
        <span className="absolute bottom-3 h-1.5 w-10 rounded-full bg-glam-blush" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold text-glam-ink">
        {isUpcoming ? labels.emptyUpcomingTitle : labels.emptyPastTitle}
      </h2>
      <p className="mt-2 max-w-[280px] text-sm leading-6 text-glam-secondary">
        {isUpcoming ? labels.emptyUpcomingDescription : labels.emptyPastDescription}
      </p>
      {isUpcoming && (
        <button
          type="button"
          onClick={onExplore}
          className="mt-6 flex h-12 items-center gap-2 rounded-full bg-glam-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-glam-ink-pressed active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-rose focus-visible:ring-offset-2"
        >
          {labels.explore}
          <ArrowRight size={17} weight="bold" className="rtl:-scale-x-100" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

const BookingsSkeleton = ({ labels, isRTL }: { labels: ReturnType<typeof getLabels>; isRTL: boolean }) => (
  <div dir={isRTL ? "rtl" : "ltr"} className="min-h-[100dvh] bg-glam-porcelain pb-32">
    <header className="safe-area-top bg-white px-5 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-11 w-11 rounded-full" />
        <Skeleton className="h-11 w-11 rounded-2xl" />
      </div>
      <p className="mt-6 text-xs font-semibold text-glam-rose">{labels.schedule}</p>
      <Skeleton className="mt-2 h-8 w-40" />
      <Skeleton className="mt-2 h-4 w-64" />
    </header>
    <main className="px-5 py-4">
      <Skeleton className="h-12 w-full rounded-full" />
      <Skeleton className="mt-5 h-[354px] w-full rounded-[28px]" />
    </main>
    <BottomNavigation />
  </div>
);

const getLabels = (language: string) =>
  language === "ar"
    ? {
        title: "حجوزاتي",
        schedule: "جدولك",
        subtitle: "تابعي مواعيدك وتفاصيل كل خدمة بسهولة",
        upcoming: "القادمة",
        past: "السابقة",
        nextAppointment: "الموعد الأقرب",
        beautyService: "خدمة تجميل",
        atHome: "في منزلك",
        atStudio: "في الاستوديو",
        total: "الإجمالي",
        details: "عرض التفاصيل",
        chat: "محادثة مع الفنانة",
        moreAppointments: "مواعيد قادمة أخرى",
        pastAppointments: "سجل الحجوزات",
        emptyUpcomingTitle: "موعدك القادم يبدأ من هنا",
        emptyUpcomingDescription: "اكتشفي الفنانات والخدمات المتاحة واحجزي الوقت الذي يناسبك.",
        emptyPastTitle: "لا يوجد سجل حجوزات بعد",
        emptyPastDescription: "بعد اكتمال أول موعد سيظهر هنا مع كل التفاصيل.",
        explore: "استكشفي الفنانات",
        loadErrorTitle: "تعذر تحميل الحجوزات",
        loadErrorDescription: "تحققي من اتصالك ثم حاولي مرة أخرى.",
        retry: "إعادة المحاولة",
        status: {
          pending: "بانتظار التأكيد",
          confirmed: "مؤكد",
          completed: "مكتمل",
          cancelled: "ملغي",
        },
      }
    : {
        title: "My Bookings",
        schedule: "Your schedule",
        subtitle: "Keep every appointment and service detail in one place",
        upcoming: "Upcoming",
        past: "Past",
        nextAppointment: "Next appointment",
        beautyService: "Beauty service",
        atHome: "At your home",
        atStudio: "At the studio",
        total: "Total",
        details: "View details",
        chat: "Chat with artist",
        moreAppointments: "More upcoming appointments",
        pastAppointments: "Booking history",
        emptyUpcomingTitle: "Your next appointment starts here",
        emptyUpcomingDescription: "Discover artists and services, then choose a time that works for you.",
        emptyPastTitle: "No booking history yet",
        emptyPastDescription: "Your completed appointments will appear here with all their details.",
        explore: "Explore artists",
        loadErrorTitle: "Bookings could not be loaded",
        loadErrorDescription: "Check your connection and try again.",
        retry: "Try again",
        status: {
          pending: "Awaiting confirmation",
          confirmed: "Confirmed",
          completed: "Completed",
          cancelled: "Cancelled",
        },
      };

const getBookingTimestamp = (booking: Booking) =>
  new Date(`${booking.booking_date}T${booking.booking_time}`).getTime();

const Bookings = () => {
  const [activeTab, setActiveTab] = useState<BookingTab>("upcoming");
  const { data: bookings, isLoading, isError, refetch } = useUserBookings();
  const { t, language } = useLanguage();
  const { getOrCreateBookingConversation } = useConversations();
  const navigate = useNavigate();
  const isRTL = language === "ar";
  const locale = isRTL ? ar : enUS;
  const labels = getLabels(language);

  const sortedUpcoming = useMemo(
    () =>
      [...(bookings?.upcoming || [])].sort(
        (a, b) => getBookingTimestamp(a) - getBookingTimestamp(b),
      ),
    [bookings?.upcoming],
  );

  const sortedPast = useMemo(
    () =>
      [...(bookings?.past || [])].sort(
        (a, b) => getBookingTimestamp(b) - getBookingTimestamp(a),
      ),
    [bookings?.past],
  );

  const openChat = async (booking: Booking) => {
    try {
      const conversationId = await getOrCreateBookingConversation.mutateAsync({
        artistId: booking.artist_id,
        bookingId: booking.id,
      });
      navigate(`/chat/${conversationId}`);
    } catch {
      toast.error(t.errors.somethingWrong);
    }
  };

  if (isLoading) {
    return <BookingsSkeleton labels={labels} isRTL={isRTL} />;
  }

  const activeBookings = activeTab === "upcoming" ? sortedUpcoming : sortedPast;
  const featuredBooking = activeTab === "upcoming" ? activeBookings[0] : undefined;
  const remainingBookings = featuredBooking ? activeBookings.slice(1) : activeBookings;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-[100dvh] bg-glam-porcelain pb-32 text-glam-ink">
      <header className="safe-area-top border-b border-glam-border bg-white px-5 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={isRTL ? "رجوع" : "Back"}
            className="grid h-11 w-11 place-items-center rounded-full border border-glam-border bg-white text-glam-ink transition-colors hover:bg-glam-surface active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-rose"
          >
            <ArrowLeft size={20} className="rtl:-scale-x-100" aria-hidden="true" />
          </button>
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-glam-surface text-glam-rose">
            <CalendarCheck size={23} weight="duotone" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-6 text-start">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-glam-rose rtl:tracking-normal">{labels.schedule}</p>
          <h1 className="mt-1.5 text-[28px] font-bold leading-tight text-glam-ink">{labels.title}</h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-glam-secondary">{labels.subtitle}</p>
        </div>
      </header>

      <main className="px-5 py-4">
        <div role="tablist" aria-label={labels.title} className="flex gap-1 rounded-full bg-glam-surface p-1">
          <TabButton
            active={activeTab === "upcoming"}
            label={labels.upcoming}
            count={sortedUpcoming.length}
            icon={CalendarBlank}
            onClick={() => setActiveTab("upcoming")}
          />
          <TabButton
            active={activeTab === "past"}
            label={labels.past}
            count={sortedPast.length}
            icon={ClockCounterClockwise}
            onClick={() => setActiveTab("past")}
          />
        </div>

        {isError ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--glam-error)_10%,transparent)] text-[var(--glam-error)]">
              <WarningCircle size={38} weight="light" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-glam-ink">{labels.loadErrorTitle}</h2>
            <p className="mt-2 max-w-[270px] text-sm leading-6 text-glam-secondary">{labels.loadErrorDescription}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-6 h-12 rounded-full bg-glam-ink px-6 text-sm font-semibold text-white hover:bg-glam-ink-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-rose focus-visible:ring-offset-2"
            >
              {labels.retry}
            </button>
          </div>
        ) : activeBookings.length === 0 ? (
          <EmptyState type={activeTab} labels={labels} onExplore={() => navigate("/makeup-artists")} />
        ) : (
          <div key={activeTab} className="animate-fade-in pt-5 motion-reduce:animate-none">
            {featuredBooking && (
              <FeaturedBookingCard
                booking={featuredBooking}
                language={language}
                locale={locale}
                labels={labels}
                onDetails={() => navigate(`/bookings/${featuredBooking.id}`)}
                onChat={() => openChat(featuredBooking)}
                chatLoading={getOrCreateBookingConversation.isPending}
              />
            )}

            {remainingBookings.length > 0 && (
              <section className={featuredBooking ? "mt-7" : "mt-1"}>
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2">
                    {activeTab === "upcoming" ? (
                      <CalendarPlus size={19} className="text-glam-rose" aria-hidden="true" />
                    ) : (
                      <Receipt size={19} className="text-glam-rose" aria-hidden="true" />
                    )}
                    <h2 className="text-sm font-bold text-glam-ink">
                      {activeTab === "upcoming" ? labels.moreAppointments : labels.pastAppointments}
                    </h2>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-glam-muted">{remainingBookings.length}</span>
                </div>

                <div className="space-y-3">
                  {remainingBookings.map((booking, index) => (
                    <div
                      key={booking.id}
                      className="animate-fade-in motion-reduce:animate-none"
                      style={{ animationDelay: `${Math.min(index, 4) * 70}ms` }}
                    >
                      <CompactBookingCard
                        booking={booking}
                        language={language}
                        locale={locale}
                        labels={labels}
                        showChat={activeTab === "upcoming" && booking.status !== "cancelled"}
                        onDetails={() => navigate(`/bookings/${booking.id}`)}
                        onChat={() => openChat(booking)}
                        chatLoading={getOrCreateBookingConversation.isPending}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Bookings;
