"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar/Navbar";
import FactCheckInput from "../components/FactCheckInput/FactCheckInput";
import FactCheckOutput from "../components/FactCheckOutput/FactCheckOutput";
import DynamicStats from "../components/DynamicStats/DynamicStats";
import PreviousOutputs from "../components/PreviousOutputs/PreviousOutputs";
import { ResponsiveBar } from "@nivo/bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Updated interface with 'reason' instead of reasonToTrust
interface FactCheckResult {
  query: string;
  result: boolean;
  confidence: number;
  type: "text" | "video" | "image";
  source?: string;
  reason?: string;
  contentVerification?: boolean;
  deepfakeDetection?: boolean;
}

export default function Dashboard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previousOutputs, setPreviousOutputs] = useState<FactCheckResult[]>([]);
  const [currentOutput, setCurrentOutput] = useState<FactCheckResult | null>(
    null
  );
  const [barData, setBarData] = useState<{ tag: string; count: number }[]>([]);

  const handleFactCheck = async (
    query: string,
    type: "text" | "video" | "image",
    file?: File
  ) => {
    setIsExpanded(true);
    setIsProcessing(true);
    setCurrentOutput(null);

    if (type === "text") {
      try {
        const response = await fetch("http://127.0.0.1:5000/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data from the API");
        }
        console.log("Response:", response);
        const data = await response.json();
        console.log("Text Result:", data);
        // data.result: [boolean, confidence, reason, labels]
        let confidence = data.result[1];
        const reason = data.result[2];
        // const label = data.result[4];
        if (reason === "Retrieved from knowledge graph") {
          confidence = 100;
        }

        const result: FactCheckResult = {
          query,
          result: data.result[0],
          confidence,
          // source: "https://example.com/fact-check",
          reason,
          type,
        };

        setCurrentOutput(result);
        setPreviousOutputs((prev) => [result, ...prev.slice(0, 4)]);

        const newTag = data.result[4];
        setBarData((prev) => {
          const existingTag = prev.find((item) => item.tag === newTag);
          if (existingTag) {
            return prev.map((item) =>
              item.tag === newTag ? { ...item, count: item.count + 1 } : item
            );
          }
          return [...prev, { tag: newTag, count: 1 }];
        });
      } catch (error) {
        console.error("Error during API call:", error);
      }
    } else if (type === "image") {
      if (!file) {
        console.error("No image file provided.");
        setIsProcessing(false);
        return;
      }
      try {
        const formData = new FormData();
        formData.append("image", file);
        const response = await fetch("http://127.0.0.1:5000/process", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          throw new Error("Failed to fetch data from the API");
        }
        const data = await response.json();
        // The API returns an object with key "deepfake_result" containing:
        // { "Extracted OCR Text": string,
        //   "Cropped image paths": string[],
        //   "Detected URLs": string[],
        //   "Similarity scores": [ [null|string, number], ... ],
        //   "Parsed Verdict": string,
        //   "Final Verdict": string }
        var imageResult = data.deepfake_result;
        imageResult = JSON.parse(imageResult);
        console.log("Image Result:", imageResult);
        // Compute average similarity score from the "Similarity scores" array,
        // considering all valid numeric scores.
        let sum = 0;
        let count = 0;
        if (
          Array.isArray(imageResult["Similarity scores"]) &&
          imageResult["Similarity scores"].length > 0
        ) {
          imageResult["Similarity scores"].forEach((pair: any[]) => {
            const score = Number(pair[1]);
            console.log("Score:", score);
            if (score > 0) {
              sum += score;
              count++;
            }
          });
        }
        console.log("Sum:", sum, "Count:", count);
        const avgScore = count > 0 ? Math.floor((sum / count) * 100) : 0;
        console.log("Average similarity score:", avgScore);
        // Determine content verification based on "Parsed Verdict"
        const verdict = imageResult["Parsed Verdict"];
        const contentVerified =
          verdict && verdict.toLowerCase() === "justified" ? true : false;

        const result: FactCheckResult = {
          query,
          result: contentVerified,
          confidence: avgScore,
          type,
          source: "Image Analysis Model",
          reason: imageResult["Final Verdict"],
          contentVerification: contentVerified,
        };

        setCurrentOutput(result);
        setPreviousOutputs((prev) => [result, ...prev.slice(0, 4)]);

        // Update barData using the verdict as the tag
        const newTag = verdict || "unknown";
        setBarData((prev) => {
          const existingTag = prev.find((item) => item.tag === newTag);
          if (existingTag) {
            return prev.map((item) =>
              item.tag === newTag ? { ...item, count: item.count + 1 } : item
            );
          }
          return [...prev, { tag: newTag, count: 1 }];
        });
      } catch (error) {
        console.error("Error during image processing:", error);
      }
    } else if (type === "video") {
      if (!file) {
        console.error("No video file provided.");
        setIsProcessing(false);
        return;
      }
      try {
        const formData = new FormData();
        formData.append("video", file);
        // Optionally, include the query if needed:
        // formData.append("query", query);

        const response = await fetch("http://127.0.0.1:5000/process", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data from the API");
        }

        const data = await response.json();
        // Expecting data.deepfake_result: { label: "Real" or "Deepfake", probability: number }
        const videoResult = data.deepfake_result;
        console.log("Video Result:", videoResult);
        const result: FactCheckResult = {
          query,
          result: videoResult.label === "REAL",
          confidence: videoResult.confidence * 100,
          type,
          source: "Deepfake Model",
          reason: "Deepfake detection", // You may expand on this if needed.
        };

        setCurrentOutput(result);
        setPreviousOutputs((prev) => [result, ...prev.slice(0, 4)]);
      } catch (error) {
        console.error("Error during API call:", error);
      }
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: isExpanded ? "50%" : "100%" }}
            transition={{ duration: 0.5 }}
            className="w-full md:w-1/2"
          >
            <FactCheckInput onFactCheck={handleFactCheck} />
          </motion.div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "50%" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full md:w-1/2"
              >
                <FactCheckOutput
                  output={currentOutput}
                  isProcessing={isProcessing}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
                confidence={currentOutput.confidence}
                type={currentOutput.type}
                sourceLink={currentOutput.source}
                reason={currentOutput.reason}
                contentVerification={currentOutput.contentVerification}
                deepfakeDetection={currentOutput.deepfakeDetection}
              />
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
                      labelTextColor={"black"}
                      theme={{
                        axis: {
                          ticks: {
                            text: {
                              fill: "#cdcdcd", // Change axis label color to white or any visible color
                              fontSize: 12,
                              fontWeight: "bold",
                              textTransform: "uppercase",
                            },
                          },
                        },
                      }}
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
