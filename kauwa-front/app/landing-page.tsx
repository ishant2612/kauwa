"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Navbar from "./components/Navbar/Navbar"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col justify-center items-center p-4 pt-20 text-center mt-20">
        <div className="max-w-2xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600"
          >
            Kauwa Fact-Checker
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-xl mb-12 text-muted-foreground"
          >
            Uncover the truth with our advanced AI-powered fact-checking tool. Verify claims, analyze sources, and make
            informed decisions in real-time.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link href="/dashboard">
              <Button size="lg" className="text-sm px-8 py-6 bg-slate-400 rounded mt-10">
                Get Started
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="py-8 text-center text-sm text-muted-foreground"
      >
        © 2025 Kauwa Fact-Checker. Created By Ishant Verma.
      </motion.footer>
    </div>
  )
}

