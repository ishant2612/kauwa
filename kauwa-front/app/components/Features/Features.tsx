"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Video, ImageIcon, ArrowDown } from "lucide-react";

interface FeatureContent {
  title: string;
  description: string;
  icon: React.ReactNode;
  flowChart: React.ReactNode;
}

export default function Features() {
  const [activeTab, setActiveTab] = useState("text");

  // Auto-rotate tabs every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((current) => {
        if (current === "text") return "deepfake";
        if (current === "deepfake") return "image";
        return "text";
      });
    }, 50000);

    return () => clearInterval(interval);
  }, []);

  const features: Record<string, FeatureContent> = {
    text: {
      title: "Text Fact Checking",
      description:
        "Our advanced AI technology identifies misleading or fabricated text by analyzing language patterns, semantic meaning, and contextual integrity. The system detects manipulated claims and AI-generated text, ensuring reliable verification. We employ natural language processing (NLP) models trained on vast datasets to recognize subtle inconsistencies, detect bias, and cross-check facts with credible sources.",
      icon: <FileText className="h-6 w-6" />,
      flowChart: (
        <div className="w-full">
          <div className="flex flex-col items-center justify-between relative">
            {/* Vertical flow chart for text fact checking */}
            {[
              { title: "Input", desc: "User submits text claim" },
              {
                title: "Semantic Analysis",
                desc: "AI agent evaluates the structure, sentiment, and coherence of the text.",
              },
              {
                title: "Fact-Checking",
                desc: "System cross-references claims with verified databases and news sources",
              },
              {
                title: "Result",
                desc: "Accuracy score and verification status",
              },
            ].map((step, index) => (
              <div key={index} className="relative z-10 w-full">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-secondary/30 backdrop-blur-sm p-3 rounded-lg"
                >
                  <h4 className="font-semibold text-base mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </motion.div>
                {index < 3 && (
                  <div className="flex justify-center my-2">
                    <ArrowDown className="text-primary/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    deepfake: {
      title: "Deepfake Detection",
      description:
        "Our state-of-the-art deep learning model detects manipulated videos by leveraging a combination of spatial and temporal analysis. The system processes video frames using EfficientNet for feature extraction and utilizes LSTM/GRU networks to capture sequential inconsistencies over time. This dual-network approach enables the detection of deepfake anomalies such as unnatural facial expressions, inconsistent blinking patterns, and subtle frame-to-frame artifacts.",
      icon: <Video className="h-6 w-6" />,
      flowChart: (
        <div className="w-full">
          <div className="flex flex-col items-center justify-between relative">
            {/* Vertical flow chart for deepfake detection */}
            {[
              {
                title: "Video Upload",
                desc: "User submits video for analysis",
              },
              {
                title: "Frame Analysis",
                desc: "EfficeintNet extracts key spatial features from each frames, detecting inconsistencies in texture, lighting, and facial expressions",
              },
              {
                title: "Temporal Pattern Detection",
                desc: "LSTM/GRU networks analyze movement patterns and blinking irregularities, and unnatural transition bertween frames, identifying deepfake artifacts",
              },
              {
                title: "Authentication",
                desc: "Determine if video is authentic or manipulated",
              },
            ].map((step, index) => (
              <div key={index} className="relative z-10 w-full">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-secondary/30 backdrop-blur-sm p-3 rounded-lg"
                >
                  <h4 className="font-semibold text-base mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </motion.div>
                {index < 3 && (
                  <div className="flex justify-center my-2">
                    <ArrowDown className="text-purple-500/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    image: {
      title: "Image Analysis",
      description:
        "Our AI-driven system analyzes images to detect manipulation, AI generation, and deepfake alterations. By examining metadata, pixel inconsistencies, and contextual alignment, the system can identify tampered images that might mislead viewers. Advanced deep learning models scan millions of reference images to provide accurate verification.",
      icon: <ImageIcon className="h-6 w-6" />,
      flowChart: (
        <div className="w-full">
          <div className="flex flex-col items-center justify-between relative">
            {/* Vertical flow chart for image analysis */}
            {[
              {
                title: "Image Input",
                desc: "User uploads image for verification",
              },
              {
                title: "Metadata Scan",
                desc: "System extracts EXIF data and performs a reverse image search.",
              },
              {
                title: "Pixel & Pattern Analysis",
                desc: "AI scans for lighting inconsistencies, unnatural textures, and cloning artifacts.",
              },
              {
                title: "Verification Report",
                desc: "Image is classified as original or AI-generated.",
              },
            ].map((step, index) => (
              <div key={index} className="relative z-10 w-full">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-secondary/30 backdrop-blur-sm p-3 rounded-lg"
                >
                  <h4 className="font-semibold text-base mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </motion.div>
                {index < 3 && (
                  <div className="flex justify-center my-2">
                    <ArrowDown className="text-blue-500/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ),
    },
  };

  return (
    <section className="py-20" id="features">
      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-xl md:text-3xl font-bold mb-6 text-center"
        >
          FEATURES
        </motion.h2>

        {/* Custom subtle tab design with reduced spacing */}
        <div className="flex justify-center mb-4">
          <div className="flex space-x-12 border-b border-muted">
            {["text", "deepfake", "image"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-1 text-base font-medium transition-all relative ${
                  activeTab === tab
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary/70"
                }`}
              >
                {tab.toUpperCase()}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary flex items-center justify-center"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-background/50 backdrop-blur-sm rounded-xl p-5 md:p-8 border border-muted shadow-lg"
            >
              <div className="grid md:grid-cols-8 gap-6 items-start">
                <div className="md:col-span-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-full bg-secondary/50">
                      {features[activeTab].icon}
                    </div>
                    <h3 className="text-xl font-bold">
                      {features[activeTab].title}
                    </h3>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm md:text-xl text-muted-foreground leading-relaxed mb-6 mt-20 text-balance ">
                      {features[activeTab].description}
                    </p>
                  </div>
                </div>
                <div className="md:col-span-3">
                  {features[activeTab].flowChart}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
