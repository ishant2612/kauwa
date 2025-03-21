"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
export default function Header() {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="border-b-2"
    >
      <div className="container flex items-center justify-between h-10 px-5 py-5 border-b-white border-b-2">
        <div className="flex items-center gap-4">
          <Image src={"/logo.png"} alt="Logo" width={28} height={28} />
          <h1 className="text-xl font-semibold font-sans">Kauwa</h1>
        </div>
      </div>
    </motion.header>
  );
}
