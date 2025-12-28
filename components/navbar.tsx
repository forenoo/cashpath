"use client";

import {
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  Sparkles,
  Target,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const { data: session } = authClient.useSession();
  const user = session?.user;

  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("mobile-nav-open");
      setIsVisible(true);
      setIsAnimating(false);
    } else {
      document.body.classList.remove("mobile-nav-open");
    }

    return () => {
      document.body.classList.remove("mobile-nav-open");
    };
  }, [mobileMenuOpen]);

  const handleCloseMenu = () => {
    setIsAnimating(true);
    // Wait for exit animation to complete before hiding
    setTimeout(() => {
      setMobileMenuOpen(false);
      setIsVisible(false);
      setIsAnimating(false);
    }, 250);
  };

  const handleNavItemClick = () => {
    handleCloseMenu();
  };

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
    <>
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
                    <AvatarImage
                      src={user?.image || ""}
                      alt={`@${user?.name}`}
                    />
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
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="size-4 text-destructive" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
              className="lg:hidden"
              onClick={() => {
                if (mobileMenuOpen) {
                  handleCloseMenu();
                } else {
                  setMobileMenuOpen(true);
                }
              }}
              size="sm"
              variant="ghost"
            >
              {mobileMenuOpen && !isAnimating ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {isVisible && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden",
              isAnimating ? "backdrop-exit" : "backdrop-enter",
            )}
            onClick={handleCloseMenu}
            onKeyDown={(e) => {
              if (e.key === "Escape") handleCloseMenu();
            }}
            aria-hidden="true"
          />

          {/* Mobile Navigation Panel */}
          <div
            className={cn(
              "fixed inset-x-0 top-16 z-50 bg-background/95 backdrop-blur-md lg:hidden",
              isAnimating ? "mobile-nav-exit" : "mobile-nav-enter",
            )}
          >
            <div className="mx-auto space-y-1 px-4 py-4">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    href={item.href as "/dashboard"}
                    key={item.href}
                    onClick={handleNavItemClick}
                    className={cn(
                      "block",
                      isAnimating
                        ? "mobile-nav-item-exit"
                        : "mobile-nav-item-enter",
                    )}
                    style={{
                      animationDelay: isAnimating
                        ? `${(navItems.length - 1 - index) * 30}ms`
                        : `${index * 50 + 100}ms`,
                    }}
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
              <div
                className={cn(
                  "mt-2 border-t pt-2",
                  isAnimating
                    ? "mobile-nav-item-exit"
                    : "mobile-nav-item-enter",
                )}
                style={{
                  animationDelay: isAnimating
                    ? "0ms"
                    : `${navItems.length * 50 + 100}ms`,
                }}
              >
                <Button
                  className="w-full justify-start gap-3 text-destructive"
                  onClick={() => {
                    handleCloseMenu();
                    handleSignOut();
                  }}
                  variant="ghost"
                >
                  <LogOut className="size-5" />
                  <span>Keluar</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
