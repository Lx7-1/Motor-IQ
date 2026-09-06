import { Link } from "wouter";
import { CarFront, Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 md:py-16 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-white">
              <div className="bg-primary p-1.5 rounded-lg">
                <CarFront className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">IQ Motor</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              {t('footer.description')}
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.quick_links')}</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/search" className="hover:text-primary transition-colors">{t('footer.browse_vehicles')}</Link></li>
              <li><Link href="/dealers" className="hover:text-primary transition-colors">{t('footer.find_dealer')}</Link></li>
              <li><Link href="/create-listing" className="hover:text-primary transition-colors">{t('footer.sell_your_bike')}</Link></li>
              <li><Link href="/sign-in" className="hover:text-primary transition-colors">{t('footer.sign_in_register')}</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.categories')}</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/search?type=motorcycle" className="hover:text-primary transition-colors">{t('footer.motorcycles')}</Link></li>
              <li><Link href="/search?type=scooter" className="hover:text-primary transition-colors">{t('footer.scooters')}</Link></li>
              <li><Link href="/search?type=atv" className="hover:text-primary transition-colors">{t('footer.atvs_quads')}</Link></li>
              <li><Link href="/search?type=ebike" className="hover:text-primary transition-colors">{t('footer.electric_bikes')}</Link></li>
              <li><Link href="/search?type=bicycle" className="hover:text-primary transition-colors">{t('footer.bicycles')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.contact_us')}</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: t('footer.address') }} />
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span dir="ltr">+964 750 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>support@iqmotor.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">{t('footer.terms_of_service')}</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">{t('footer.privacy_policy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
