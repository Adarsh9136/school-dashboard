import React from 'react';
import { Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg border-2 border-primary grid place-items-center">
              <span className="font-serif text-lg font-bold text-primary">R</span>
            </div>
            <div>
              <p className="font-serif text-base font-semibold">Resonance</p>
              <p className="overline">International School</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground max-w-xs leading-relaxed">
            A boutique international school in Mumbai — where academic depth meets global perspective, since 1989.
          </p>
        </div>
        <div>
          <p className="overline mb-4">Explore</p>
          <ul className="space-y-3 text-sm">
            <li><Link to="/" className="link-underline">Home</Link></li>
            <li><Link to="/admission" className="link-underline">Admissions</Link></li>
            <li><Link to="/login" className="link-underline">Portal Login</Link></li>
          </ul>
        </div>
        <div>
          <p className="overline mb-4">Reach Us</p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2"><MapPin size={14} className="mt-1 text-primary" /> Andheri West, Mumbai 400058</li>
            <li className="flex items-center gap-2"><Phone size={14} className="text-primary" /> +91 22 2634 1200</li>
            <li className="flex items-center gap-2"><Mail size={14} className="text-primary" /> connect@resonance.edu.in</li>
          </ul>
        </div>
        <div>
          <p className="overline mb-4">Follow</p>
          <div className="flex gap-3">
            <a href="#" className="h-10 w-10 rounded-full border border-border grid place-items-center hover:border-primary hover:text-primary transition-colors" data-testid="social-instagram"><Instagram size={16} /></a>
          </div>
          <p className="mt-6 text-xs text-muted-foreground mono">© 2026 Resonance International School. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
