"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b"
    >
      <div className="container mx-auto px-9 py-6 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center space-x-2 p-2 bg-[#DFE2E5] text-[#020817] rounded-xl"
        >
          {/* <motion.svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <path d="M16 2L2 16L16 30L30 16L16 2Z" fill="currentColor" />
            <circle cx="16" cy="16" r="6" fill="var(--background)" />
          </motion.svg> */}
          <Image src="/logo.png" alt="Logo" width={22} height={22} />
          <span className="text-l font-bold">Kauwa</span>
        </Link>
        <div className="flex items-center space-x-4 rounded-xl ">
          <Button variant="ghost" asChild>
            <Link href="/about" className="text-l">
              About
            </Link>
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
