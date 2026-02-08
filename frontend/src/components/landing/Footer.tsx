import { motion } from "framer-motion";
import CTA from "./CTA";
import { BabyFootprints } from "./BabyIcons";

const footerLinks = {
  left: [
    { label: "About Us", href: "/about" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Features", href: "/#features" },
  ],
  right: [
    { label: "Our Team", href: "/about" },
    { label: "Events", href: "#" },
    { label: "Contact Us", href: "mailto:hello@lullalink.com" },
  ],
};

const socialIcons = [
  { name: "Facebook", icon: "📘" },
  { name: "Instagram", icon: "📸" },
  { name: "Twitter", icon: "🐦" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* CTA Section */}
      <CTA />

      {/* Main Footer */}
      <div className="bg-soft-yellow/60 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          {/* Centered Logo & Links */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-12">
            {/* Left Links */}
            <motion.nav
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-wrap justify-center gap-6">
              {footerLinks.left.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-charcoal hover:text-coral no-underline transition-colors">
                  {link.label}
                </a>
              ))}
            </motion.nav>

            {/* Center Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">👶</span>
                <span className="text-2xl font-extrabold text-charcoal tracking-tight">
                  Lulla<span className="text-coral">link</span>
                </span>
              </div>
              <p className="text-mid-gray text-sm md:text-base mb-6 max-w-sm">
                AI-powered peace of mind for modern parents. Watch over your little ones with love and technology.
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-4 mt-4">
                {socialIcons.map((social) => (
                  <a
                    key={social.name}
                    href="#"
                    className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center text-base hover:bg-coral/20 transition-colors no-underline"
                    title={social.name}>
                    {social.icon}
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Right Links */}
            <motion.nav
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap justify-center gap-6">
              {footerLinks.right.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-charcoal hover:text-coral no-underline transition-colors">
                  {link.label}
                </a>
              ))}
            </motion.nav>
          </div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-md mx-auto text-center mb-10">
            <h4 className="text-sm font-semibold text-charcoal mb-4">Subscribe to Our Newsletter</h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-full bg-white border border-charcoal/10 text-sm focus:outline-none focus:border-coral transition-colors"
              />
              <button className="bg-charcoal text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-charcoal/90 transition-colors">
                Submit
              </button>
            </div>
          </motion.div>

          {/* Bottom Bar */}
          <div className="border-t border-charcoal/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-mid-gray/80">© {new Date().getFullYear()} Lullalink. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <BabyFootprints className="w-6 h-4 text-coral/50" />
              <span className="text-xs text-mid-gray">Designed for parents who care</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
