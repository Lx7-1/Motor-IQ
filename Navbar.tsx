import { Link, useLocation } from "wouter";
import { Search, Heart, MessageSquare, PlusCircle, User, LogOut, Menu, X, CarFront, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <CarFront className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block text-primary dark:text-primary-foreground">
              {t('nav.iq_motor')}
            </span>
          </Link>

          <div className="hidden md:flex gap-6">
            <Link 
              href="/search" 
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/search') ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {t('nav.browse')}
            </Link>
            <Link 
              href="/dealers" 
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/dealers') ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {t('nav.dealers')}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <LanguageSwitcher />

          {/* Quick Actions */}
          <Link href="/search" className="md:hidden">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/sign-in" className="hidden sm:flex">
            <Button variant="ghost" className="font-medium">{t('nav.sign_in')}</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="font-medium">{t('nav.sign_up')}</Button>
          </Link>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t p-4 bg-background shadow-lg absolute w-full left-0 top-16">
          <div className="flex flex-col space-y-4">
            <Link 
              href="/search" 
              className="flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.browse_vehicles')}
            </Link>
            <Link 
              href="/dealers" 
              className="flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.dealers_directory')}
            </Link>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">{t('nav.sign_in')}</Button>
              </Link>
              <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">{t('nav.sign_up')}</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
