"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
// import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CustomWalletConnect } from "../ui/CustomWalletConnect";
import Image from "next/image";
import HedgehogLogo from "/public/images/Hedgehog.svg";

const navItems = [
  { label: "Markets", href: "/", disabled: false },
  { label: "Portfolio", href: "/portfolio", disabled: false },
  { label: "Lend", href: "/lend", disabled: false },
  { label: "Borrow", href: "/borrow", disabled: false },
  { label: "Docs", href: "https://hedgehog-2.gitbook.io/hedgehog", disabled: false }, 
  { label: "Faucet", href: "/faucet", disabled: false },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  return (
    <header className="border-b border-[var(--border-color)]">
      <div className="max-w-[1280px] w-full mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold">
              {/* <span className="text-[var(--primary)]">Hedge</span>
              <span>hog</span> */}
              <Image src={HedgehogLogo} alt="Hedgehog Logo" width={125} height={32} />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-[var(--primary)]",
                  (pathname === item.href || (item.href === "/" && pathname.startsWith("/asset")))
                    ? "text-[var(--primary)]"
                    : "text-[var(--foreground)]",
                  item.disabled && "pointer-events-none opacity-50"
                )}
                {...(item.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center">
            <div className="hidden md:flex items-center">
              <CustomWalletConnect />
            </div>
            

            {/* Mobile menu button */}
            <button
              className="block md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 py-4 bg-[var(--card-bg)] border-b border-[var(--border-color)]">
          <nav className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-[var(--primary)]",
                  (pathname === item.href || (item.href === "/" && pathname.startsWith("/asset")))
                    ? "text-[var(--primary)]"
                    : "text-[var(--foreground)]",
                  item.disabled && "pointer-events-none opacity-50"
                )}
                onClick={() => setMobileMenuOpen(false)}
                {...(item.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {item.label}
              </Link>
            ))}
            <CustomWalletConnect />
          </nav>
        </div>
      )}
    </header>
  );
}
