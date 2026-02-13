import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-warm-white flex">
      <Sidebar />

      <main className="flex-1 lg:ml-32 min-h-screen p-4 md:p-8 lg:p-10 transition-all duration-300 lg:peer-hover:ml-80">
        <div className="max-w-7xl mx-auto">
          {(title || subtitle) && (
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 md:mb-12 mt-16 lg:mt-0">
              {title && <h1 className="text-3xl md:text-4xl font-extrabold text-charcoal mb-2">{title}</h1>}
              {subtitle && <p className="text-mid-gray text-lg">{subtitle}</p>}
            </motion.header>
          )}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
