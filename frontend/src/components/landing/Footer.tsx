import { motion } from "framer-motion";
import CTA from "./CTA";
import {
  BabyFootprints,
  BabyCloud,
  BabyStar,
  BabyHeart,
  BabyMoon,
  BabyBottle,
  BabyRattle,
  BabyPacifier,
  BabyDuck,
  BabyTeddy,
  BabyOnesie,
  BabyStroller,
  BabyBalloon,
  BabySocks,
  BabyBib,
  BabyMobile,
} from "./BabyIcons";

const footerLinks = {
  Sitemap: ["Home", "Features", "Pricing"],
  Resources: ["Support", "Documentation"],
  Social: [
    { name: "Instagram", icon: "📸" },
    { name: "Twitter", icon: "🐦" },
  ],
};

// More scattered decorative elements
const scatteredIcons = [
  // Top area
  { Icon: BabyCloud, top: "5%", left: "5%", size: "w-20 h-12", color: "text-soft-blue/20", rotate: 5 },
  { Icon: BabyStar, top: "8%", right: "8%", size: "w-8 h-8", color: "text-coral/25", rotate: 15 },
  { Icon: BabyBalloon, top: "3%", right: "25%", size: "w-10 h-14", color: "text-coral/15", rotate: -8 },
  { Icon: BabyMoon, top: "12%", left: "20%", size: "w-10 h-10", color: "text-soft-blue/15", rotate: -10 },

  // Left side
  { Icon: BabyBottle, top: "25%", left: "3%", size: "w-8 h-12", color: "text-soft-green/20", rotate: 15 },
  { Icon: BabyTeddy, top: "45%", left: "5%", size: "w-12 h-12", color: "text-coral/15", rotate: -5 },
  { Icon: BabySocks, top: "65%", left: "4%", size: "w-14 h-10", color: "text-soft-blue/18", rotate: 8 },

  // Right side
  { Icon: BabyRattle, top: "22%", right: "4%", size: "w-10 h-14", color: "text-soft-green/18", rotate: -12 },
  { Icon: BabyDuck, top: "40%", right: "6%", size: "w-14 h-12", color: "text-coral/20", rotate: 5 },
  { Icon: BabyOnesie, top: "58%", right: "3%", size: "w-12 h-12", color: "text-soft-blue/15", rotate: -8 },
  { Icon: BabyPacifier, top: "75%", right: "8%", size: "w-12 h-10", color: "text-soft-green/15", rotate: 10 },

  // Bottom area
  { Icon: BabyStroller, bottom: "20%", left: "15%", size: "w-14 h-12", color: "text-soft-blue/15", rotate: 3 },
  { Icon: BabyBib, bottom: "25%", right: "18%", size: "w-10 h-12", color: "text-coral/12", rotate: -5 },
  { Icon: BabyHeart, bottom: "12%", left: "30%", size: "w-8 h-8", color: "text-coral/18", rotate: 12 },
  { Icon: BabyMobile, bottom: "18%", right: "30%", size: "w-14 h-12", color: "text-soft-green/12", rotate: -3 },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ice-blue/40">
      {/* Soft gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, 
            rgba(229, 243, 255, 0.3) 0%,
            rgba(229, 243, 255, 0.5) 30%,
            rgba(229, 243, 255, 0.7) 100%
          )`,
        }}
      />

      {/* Scattered playful icons */}
      {scatteredIcons.map((item, idx) => (
        <motion.div
          key={idx}
          className={`absolute ${item.size} ${item.color} pointer-events-none`}
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
          }}
          initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
          whileInView={{ opacity: 1, scale: 1, rotate: item.rotate }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.05, duration: 0.4, type: "spring" }}>
          <item.Icon className="w-full h-full" />
        </motion.div>
      ))}

      <div className="relative z-10">
        {/* CTA Section - using the CTA component */}
        <CTA />

        {/* Footer Links - Clean 3-column Layout */}
        <div className="py-14 border-t border-charcoal/5">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-10">
              {/* Brand Column */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col gap-3">
                <a href="#" className="flex items-center gap-2 no-underline">
                  <img src="/logo.svg" alt="BabyWatcher Logo" className="w-7 h-7" />
                  <span className="text-lg font-bold text-charcoal tracking-tight">
                    Baby<span className="text-coral">Watcher</span>
                  </span>
                </a>
                <p className="text-sm text-mid-gray max-w-xs leading-relaxed">
                  Real-time baby monitoring built with love for modern parents.
                </p>
                <p className="text-xs text-light-gray mt-1">© {new Date().getFullYear()} BabyWatcher</p>
              </motion.div>

              {/* Links Column - Grouped */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex gap-16">
                <div>
                  <h4 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-4">Navigate</h4>
                  <ul className="flex flex-col gap-2 list-none p-0 m-0">
                    {footerLinks.Sitemap.map((link) => (
                      <li key={link}>
                        <a href="#" className="text-sm text-mid-gray hover:text-coral no-underline transition-colors">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-4">Help</h4>
                  <ul className="flex flex-col gap-2 list-none p-0 m-0">
                    {footerLinks.Resources.map((link) => (
                      <li key={link}>
                        <a href="#" className="text-sm text-mid-gray hover:text-coral no-underline transition-colors">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Social Column */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-col gap-4">
                <h4 className="text-xs font-semibold text-charcoal uppercase tracking-wider">Connect</h4>
                <div className="flex items-center gap-3">
                  {footerLinks.Social.map((social) => (
                    <a
                      key={social.name}
                      href="#"
                      className="w-10 h-10 rounded-full bg-white/70 border border-charcoal/5 flex items-center justify-center text-lg hover:bg-coral/10 hover:border-coral/30 hover:scale-105 transition-all duration-200 no-underline shadow-sm"
                      title={social.name}>
                      {social.icon}
                    </a>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Large playful brand watermark with baby footprints */}
        <div className="relative h-32 overflow-hidden flex items-center justify-center">
          <div className="flex items-center gap-4">
            <span className="text-[3rem] md:text-[5rem] font-bold tracking-wider text-charcoal/5 select-none">
              Baby
            </span>
            <BabyFootprints className="w-16 h-10 md:w-24 md:h-16 text-coral/25" />
            <span className="text-[3rem] md:text-[5rem] font-bold tracking-wider text-charcoal/5 select-none">
              Watcher
            </span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-charcoal/10 py-4">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-2">
            <span className="text-xs text-light-gray">Built at HTC 2026 Hackathon</span>
            <span className="text-xs text-light-gray">Designed with 💛 for parents who care</span>
          </div>
        </div>

        {/* Scroll to top button */}
        <motion.button
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-coral/90 backdrop-blur-sm flex items-center justify-center text-white hover:bg-coral shadow-lg shadow-coral/30 transition-all duration-300 z-50"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </motion.button>
      </div>
    </footer>
  );
}
