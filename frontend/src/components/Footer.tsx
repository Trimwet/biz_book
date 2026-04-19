import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiFacebook, 
  FiTwitter, 
  FiInstagram, 
  FiLinkedin,
  FiArrowUp
} from 'react-icons/fi';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-neutral-900 text-neutral-300 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                <h3 className="text-2xl font-bold">
                  <span className="text-primary-400">BIZ</span>
                  <span className="text-white"> BOOK</span>
                </h3>
              </div>
              <p className="text-neutral-400 mb-6 leading-relaxed">
                Your trusted platform for smart shopping and vendor discovery. 
                Connecting businesses with quality and confidence.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center text-sm text-neutral-400">
                  <FiMail className="w-4 h-4 mr-3 text-primary-400" />
                  <span>hello@bizbook.com</span>
                </div>
                <div className="flex items-center text-sm text-neutral-400">
                  <FiPhone className="w-4 h-4 mr-3 text-primary-400" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center text-sm text-neutral-400">
                  <FiMapPin className="w-4 h-4 mr-3 text-primary-400" />
                  <span>San Francisco, CA</span>
                </div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">Product</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Browse Products', path: '/browse' },
                  { label: 'Advanced Search', path: '/search' },
                  { label: 'Price Comparison', path: '/compare' },
                  { label: 'Vendor Directory', path: '/vendors' }
                ].map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-neutral-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">Company</h4>
              <ul className="space-y-3">
                {[
                  'About Us',
                  'Our Story',
                  'Careers',
                  'Press Kit',
                  'Contact Us'
                ].map((link, index) => (
                  <li key={index}>
                    <a
                      href="#"
                      className="text-neutral-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Support */}
            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">Support</h4>
              <ul className="space-y-3">
                {[
                  'Help Center',
                  'Privacy Policy',
                  'Terms of Service',
                  'Cookie Policy',
                  'Security'
                ].map((link, index) => (
                  <li key={index}>
                    <a
                      href="#"
                      className="text-neutral-400 hover:text-primary-400 transition-colors duration-200 text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>

              {/* Newsletter Signup */}
              <div className="mt-8">
                <h5 className="text-white font-medium mb-3">Stay Updated</h5>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-l-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 transition-colors duration-200"
                  />
                  <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-r-lg text-sm font-medium transition-colors duration-200">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              {/* Copyright */}
              <div className="text-sm text-neutral-500 mb-4 md:mb-0">
                <p>&copy; {currentYear} BIZ BOOK. All rights reserved.</p>
              </div>

              {/* Social Links */}
              <div className="flex items-center space-x-4">
                <span className="text-sm text-neutral-500 mr-2">Follow us:</span>
                {[
                  { Icon: FiFacebook, href: '#', label: 'Facebook' },
                  { Icon: FiTwitter, href: '#', label: 'Twitter' },
                  { Icon: FiInstagram, href: '#', label: 'Instagram' },
                  { Icon: FiLinkedin, href: '#', label: 'LinkedIn' }
                ].map(({ Icon, href, label }, index) => (
                  <a
                    key={index}
                    href={href}
                    className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-primary-600 transition-all duration-200 hover:scale-110"
                    aria-label={label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>

              {/* Back to Top */}
              <button
                onClick={scrollToTop}
                className="hidden md:flex items-center text-sm text-neutral-400 hover:text-primary-400 transition-colors duration-200 group"
              >
                Back to top
                <FiArrowUp className="w-4 h-4 ml-2 group-hover:-translate-y-1 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating Back to Top Button for Mobile */}
        <button
          onClick={scrollToTop}
          className="md:hidden fixed bottom-6 right-6 w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-50"
          aria-label="Back to top"
        >
          <FiArrowUp className="w-5 h-5" />
        </button>
      </div>
    </footer>
  );
};

export default Footer;