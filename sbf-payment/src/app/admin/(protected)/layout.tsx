import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Building2,
    FileText,
    LogOut,
    Menu,
    FileCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/admin/login");
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar (Kurumsal Lacivert) */}
            <aside className="w-64 bg-[#152746] text-white border-r border-[#152746] hidden md:flex flex-col shadow-lg">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#cf9d34] flex items-center justify-center text-[#152746] text-xs shadow">AÜ</div>
                        SBF Yönetim
                    </h1>
                    <p className="text-xs text-gray-400 mt-1 pl-10">Ödeme Takip Sistemi</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavItem href="/admin" icon={<LayoutDashboard />}>Genel Bakış</NavItem>
                    <NavItem href="/admin/submissions" icon={<FileCheck />}>Ödeme Bildirimleri</NavItem>
                    <NavItem href="/admin/facilities" icon={<Building2 />}>Tesis Yönetimi</NavItem>
                    <NavItem href="/admin/forms" icon={<FileText />}>Form Ayarları</NavItem>
                </nav>

                <div className="p-4 border-t border-white/10 bg-[#0f1d36]">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-[#cf9d34] flex items-center justify-center text-[#152746] font-bold shadow-sm">
                            {session.user.name?.[0]?.toUpperCase() || "A"}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate text-white">{session.user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                        </div>
                    </div>
                    <form
                        action={async () => {
                            "use server";
                            await signOut({ redirectTo: "/admin/login" });
                        }}
                    >
                        <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-white/5 border-white/10 bg-transparent" size="sm">
                            <LogOut className="w-4 h-4 mr-2" />
                            Çıkış Yap
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-[#f8fafc]">
                {/* Mobile Header */}
                <header className="md:hidden h-16 border-b bg-[#152746] text-white flex items-center px-4 justify-between shadow-md">
                    <span className="font-bold flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#cf9d34] flex items-center justify-center text-[#152746] text-[10px]">AÜ</div>
                        SBF Yönetim
                    </span>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                        <Menu className="w-6 h-6" />
                    </Button>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                "text-gray-300 hover:bg-white/10 hover:text-white hover:pl-5",
                // Aktif state (basitçe her zaman inactive gibi duracak ama hover efekti ile canlı olacak)
            )}
        >
            <span className="w-5 h-5 mr-3 opacity-90">{icon}</span>
            {children}
        </Link>
    );
}
