import { useNavigate } from 'react-router-dom';
import {
  EnvelopeSimple,
  Phone,
  MapPin,
  ArrowUp,
  InstagramLogo,
  TwitterLogo,
  FacebookLogo,
  LinkedinLogo,
} from '@phosphor-icons/react';

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-5xl mx-auto px-5 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <span className="text-blue-400">biz</span>
              <span className="text-white">book</span>
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Your campus marketplace for smart shopping and vendor discovery.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-sm text-gray-500">
                <EnvelopeSimple size={14} className="text-blue-400 flex-shrink-0" />
                <span>hello@bizbook.com</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-gray-500">
                <Phone size={14} className="text-blue-400 flex-shrink-0" />
                <span>+234 800 000 0000</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-gray-500">
                <MapPin size={14} className="text-blue-400 flex-shrink-0" />
                <span>Lagos, Nigeria</span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Browse Products', path: '/browse' },
                { label: 'Search', path: '/search' },
                { label: 'Price Comparison', path: '/compare' },
              ].map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-sm text-gray-500 hover:text-blue-400 transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-2.5">
              {['About Us', 'Careers', 'Contact'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-5 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">
            © {currentYear} bizbook. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            {[
              { Icon: TwitterLogo, label: 'Twitter' },
              { Icon: InstagramLogo, label: 'Instagram' },
              { Icon: FacebookLogo, label: 'Facebook' },
              { Icon: LinkedinLogo, label: 'LinkedIn' },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 hover:text-white hover:bg-blue-600 transition-all duration-200"
                aria-label={label}
              >
                <Icon size={16} />
              </a>
            ))}
          </div>

          <button
            onClick={scrollToTop}
            className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 transition-colors group"
          >
            Back to top
            <ArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;