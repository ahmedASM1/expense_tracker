import DevModeBanner from '@/components/DevModeBanner';
import DashboardSidebar from '@/components/DashboardSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <DevModeBanner />
      <div className="lg:flex">
        <DashboardSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
