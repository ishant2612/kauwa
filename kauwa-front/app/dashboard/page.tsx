"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveBar } from "@nivo/bar";
import Navbar from "../components/Navbar/Navbar";
import FactCheckInput from "../components/FactCheckInput/FactCheckInput";
import FactCheckOutput from "../components/FactCheckOutput/FactCheckOutput";
import Metrics from "../components/Metrics/Metrics";
import PreviousOutputs from "../components/PreviousOutputs/PreviousOutputs";
import DynamicStats from "../components/DynamicStats/DynamicStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FactCheckResult {
  query: string;
  result: boolean;
  source: string;
  reasonToTrust: string;
  confidence: number;
}
export default function Dashboard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [barData, setBarData] = useState<{ tag: string; count: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previousOutputs, setPreviousOutputs] = useState<FactCheckResult[]>([]);
  const [currentOutput, setCurrentOutput] = useState<FactCheckResult | null>(
    null
  );
  const stats = [
    { title: "Analyzed", value: "832" },
    { title: "Verified", value: "358" },
    { title: "Accuracy", value: "6.9%" },
    { title: "Confidence", value: "62.3%" },
  ];

  const handleFactCheck = (query: string) => {
    setIsExpanded(true);
    setIsProcessing(true);
    setCurrentOutput(null);

    // Simulate fetching data
    setTimeout(() => {
      const result: FactCheckResult = {
        query,
        result: Math.random() > 0.5,
        source: "https://example.com/fact-check",
        reasonToTrust:
          "This information has been verified by multiple reputable sources and aligns with current scientific consensus.",
        confidence: Math.floor(Math.random() * 100),
      };
      setCurrentOutput(result);
      setPreviousOutputs((prev) => [result, ...prev]);
      // Update bar graph data
      const newTag = ["News", "Sports", "Tech", "Politics"][
        Math.floor(Math.random() * 4)
      ];
      setBarData((prev) => {
        const existingTag = prev.find((item) => item.tag === newTag);
        if (existingTag) {
          // Increment count for the existing tag
          return prev.map((item) =>
            item.tag === newTag ? { ...item, count: item.count + 1 } : item
          );
        }
        // Add a new tag with count 1
        return [...prev, { tag: newTag, count: 1 }];
      });
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
        {/* Input Section */}

        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <motion.div
            initial={{ width: "100%" }}
            animate={{
              width: isExpanded ? "50%" : "100%", // Adjust width dynamically
            }}
            transition={{ duration: 0.5 }}
            className="w-full md:w-1/2"
          >
            <FactCheckInput onFactCheck={handleFactCheck} />
          </motion.div>
          {/* Output Section */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "50%" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                <FactCheckOutput
                  output={currentOutput}
                  isProcessing={isProcessing}
                  //   previousOutput={previousOutput}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats and Metrics Section */}
        <AnimatePresence>
          {isExpanded && currentOutput && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.5 }}
              className="mt-6"
            >
              <DynamicStats
                result={currentOutput.result}
                sourceLink={currentOutput.source}
                confidence={currentOutput.confidence}
                reasonToTrust={currentOutput.reasonToTrust}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bar Graph Section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6"
            >
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold">
                    Tag Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveBar
                      data={barData}
                      keys={["count"]}
                      indexBy="tag"
                      margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                      padding={0.3}
                      colors={{ scheme: "set2" }}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: "Tags",
                        legendPosition: "middle",
                        legendOffset: 40,
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: "Count",
                        legendPosition: "middle",
                        legendOffset: -40,
                      }}
                      tooltip={({ id, value, color }) => (
                        <div
                          style={{
                            backgroundColor: "white",
                            color: "black",
                            padding: "8px",
                            borderRadius: "4px",
                            boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
                            fontSize: "14px",
                            fontWeight: "bold",
                          }}
                        >
                          <strong style={{ color }}>{`${id}: ${value}`}</strong>
                        </div>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6"
            >
              <PreviousOutputs outputs={previousOutputs} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
