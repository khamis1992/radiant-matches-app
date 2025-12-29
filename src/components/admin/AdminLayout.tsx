import { useLanguage } from "@/contexts/LanguageContext";
import { AdminSidebar } from "./AdminSidebar";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <AdminSidebar />
      <main className={cn(
        "p-8",
        isRTL ? "mr-64" : "ml-64"
      )}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
