"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
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
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2 p-2 bg-[#DFE2E5] text-[#020817] rounded-xl"
        >
          <Image src="/logo.png" alt="Logo" width={22} height={22} />
          <span className="text-l font-bold">Kauwa</span>
        </Link>

        {/* Navbar Links */}
        <div className="flex items-center space-x-4 rounded-xl">
          <Button variant="ghost" asChild>
            <Link href="/about" className="text-l">
              About
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/script-verification">
              <FileText className="mr-2 h-4 w-4" />
              Script Verification
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/community" className="text-l">
              Community
            </Link>
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
