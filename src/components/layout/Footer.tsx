import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const footerLinks = {
  shop: [
    { href: '/brands', label: 'All Brands' },
    { href: '/products', label: 'All Products' },
    { href: '/categories', label: 'Categories' },
    { href: '/new-arrivals', label: 'New Arrivals' },
    { href: '/offers', label: 'Offers & Deals' },
  ],
  support: [
    { href: '/contact', label: 'Contact Us' },
    { href: '/shipping-returns', label: 'Shipping & Returns' },
    { href: '/faq', label: 'FAQ' },
    { href: '/track-order', label: 'Track Order' },
  ],
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/terms-conditions', label: 'Terms & Conditions' },
  ],
};

export function Footer() {
  const { user } = useAuth();
  
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-8 lg:py-10 px-4">
        <div className="grid gap-6 sm:gap-8 grid-cols-3 lg:grid-cols-5">
          {/* Brand & Newsletter */}
          <div className="col-span-3 lg:col-span-2">
            <Link to="/" className="inline-block">
              <h2 className="font-display text-xl sm:text-2xl font-bold">
                Tejas<span className="text-accent">Impex</span>
              </h2>
            </Link>
            <p className="mt-3 text-xs sm:text-sm lg:text-xs text-primary-foreground/80 max-w-sm lg:max-w-xs">
              Your trusted partner for premium imported gourmet products in India. 
              Discover world-class brands and quality products delivered to your doorstep.
            </p>
            
            <div className="mt-4 lg:mt-5">
              <h3 className="font-semibold text-sm sm:text-base mb-2">Subscribe to our newsletter</h3>
              <form className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 text-sm h-9 sm:h-10"
                />
                <Button variant="secondary" className="shrink-0 text-xs sm:text-sm h-9 sm:h-10">
                  Subscribe
                </Button>
              </form>
            </div>

            <div className="mt-4 sm:mt-6 flex gap-4">
              <a href="#" className="text-primary-foreground/80 hover:text-accent transition-colors">
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-accent transition-colors">
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-accent transition-colors">
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h3 className="font-semibold text-sm sm:text-base lg:text-sm mb-3 lg:mb-2">Shop</h3>
            <ul className="space-y-1.5 lg:space-y-1">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-xs sm:text-sm text-primary-foreground/80 hover:text-accent transition-colors block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h3 className="font-semibold text-sm sm:text-base lg:text-sm mb-3 lg:mb-2">Support</h3>
            <ul className="space-y-1.5 lg:space-y-1">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-xs sm:text-sm text-primary-foreground/80 hover:text-accent transition-colors block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm sm:text-base lg:text-sm mb-3 lg:mb-2">Contact</h3>
            <ul className="space-y-2 lg:space-y-1.5">
              <li className="flex items-start gap-2 text-xs sm:text-sm text-primary-foreground/80">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 shrink-0" />
                <span className="line-clamp-2">123 Trade Center, Mumbai, Maharashtra 400001, India</span>
              </li>
              <li className="flex items-center gap-2 text-xs sm:text-sm text-primary-foreground/80">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2 text-xs sm:text-sm text-primary-foreground/80">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="break-all">hello@tejasimpex.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 lg:mt-10 pt-4 lg:pt-5 border-t border-primary-foreground/20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-primary-foreground/60">
          <p className="text-center sm:text-left">© {new Date().getFullYear()} TejasImpex. All rights reserved.</p>
          <div className="flex items-center gap-3 sm:gap-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Visa_Logo.svg" alt="Visa" className="h-4 sm:h-6 opacity-80" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4 sm:h-6 opacity-80" />
            <span className="text-xs">UPI • COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
