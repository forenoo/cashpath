"use client";

import {
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { cn, getUserInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const navItems = [
  {
    label: "Beranda",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Transaksi",
    href: "/transactions",
    icon: Receipt,
  },
  {
    label: "Tujuan",
    href: "/goals",
    icon: Target,
  },
  {
    label: "Simulasikan",
    href: "/time-machine",
    icon: Sparkles,
  },
  {
    label: "Pengaturan",
    href: "/settings",
    icon: Settings,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: session } = authClient.useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="maxContainer flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          href="/dashboard"
        >
          <Image alt="Cashpath" height={32} src="/logo.svg" width={32} />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link href={item.href as "/dashboard"} key={item.href}>
                <Button
                  className={cn(
                    "gap-2",
                    isActive ? "bg-accent text-accent-foreground" : "",
                  )}
                  variant={isActive ? "secondary" : "ghost"}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        {/* User Menu & Mobile Toggle */}
        <div className="flex items-center gap-2">
          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="px-0" size="sm" variant="ghost">
                <Avatar className="size-8">
                  <AvatarImage src={user?.image || ""} alt={`@${user?.name}`} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mt-2 w-48">
              {user ? (
                <>
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">{user.name || "User"}</div>
                    {user.email ? (
                      <div className="text-muted-foreground text-xs">
                        {user.email}
                      </div>
                    ) : null}
                  </div>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 size-4 text-destructive" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
          <Button
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            size="sm"
            variant="ghost"
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen ? (
        <div className="border-t bg-background md:hidden">
          <div className="container mx-auto space-y-1 px-4 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  href={item.href as "/dashboard"}
                  key={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive ? "bg-accent text-accent-foreground" : "",
                    )}
                    variant={isActive ? "secondary" : "ghost"}
                  >
                    <Icon className="size-5" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            <div className="mt-2 border-t pt-2">
              <Button
                className="w-full justify-start gap-3 text-destructive"
                onClick={handleSignOut}
                variant="ghost"
              >
                <LogOut className="size-5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
