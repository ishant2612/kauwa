// "use client";

// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { ResponsiveBar } from "@nivo/bar";
// import Navbar from "../components/Navbar/Navbar";
// import FactCheckInput from "../components/FactCheckInput/FactCheckInput";
// import FactCheckOutput from "../components/FactCheckOutput/FactCheckOutput";
// import Metrics from "../components/Metrics/Metrics";
// import PreviousOutputs from "../components/PreviousOutputs/PreviousOutputs";
// import DynamicStats from "../components/DynamicStats/DynamicStats";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// interface FactCheckResult {
//   query: string;
//   result: boolean;
//   source: string;
//   reasonToTrust: string;
//   confidence: number;
//   type: "text" | "video";
// }

// export default function Dashboard() {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [barData, setBarData] = useState<{ tag: string; count: number }[]>([]);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [previousOutputs, setPreviousOutputs] = useState<FactCheckResult[]>([]);
//   const [currentOutput, setCurrentOutput] = useState<FactCheckResult | null>(
//     null
//   );

//   const handleFactCheck = async (
//     query: string,
//     type: "text" | "video",
//     file?: File
//   ) => {
//     setIsExpanded(true);
//     setIsProcessing(true);
//     setCurrentOutput(null);

//     try {
//       const response = await fetch("http://127.0.0.1:5000/verify", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ query }),
//       });

//       if (!response.ok) {
//         throw new Error("Failed to fetch data from the API");
//       }

//       const data = await response.json();

//       let confidence = data.result[1]; // Default confidence from the API
//       const reasonToTrust = data.result[2];

//       // Check if the reason to trust is "Retrieved from knowledge graph"
//       if (reasonToTrust === "Retrieved from knowledge graph") {
//         confidence = 100; // Set confidence to 100%
//       }

//       const result: FactCheckResult = {
//         query,
//         result: data.result[0], // Using the result from the API
//         source: "https://example.com/fact-check", // Dummy data
//         reasonToTrust,
//         confidence,
//         type,
//       };

//       setCurrentOutput(result);
//       setPreviousOutputs((prev) => [result, ...prev]);

//       // Update bar graph data
//       const newTag = data.result[3][0];
//       setBarData((prev) => {
//         const existingTag = prev.find((item) => item.tag === newTag);
//         if (existingTag) {
//           // Increment count for the existing tag
//           return prev.map((item) =>
//             item.tag === newTag ? { ...item, count: item.count + 1 } : item
//           );
//         }
//         // Add a new tag with count 1
//         return [...prev, { tag: newTag, count: 1 }];
//       });
//     } catch (error) {
//       console.error("Error during API call:", error);
//     } finally {
//       setIsProcessing(false);
//     }
//   };
//   return (
//     <div className="min-h-screen bg-background flex flex-col">
//       <Navbar />
//       <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
//         {/* Input Section */}
//         <div className="flex flex-col md:flex-row gap-6 mb-6">
//           <motion.div
//             initial={{ width: "100%" }}
//             animate={{
//               width: isExpanded ? "50%" : "100%", // Adjust width dynamically
//             }}
//             transition={{ duration: 0.5 }}
//             className="w-full md:w-1/2"
//           >
//             <FactCheckInput onFactCheck={handleFactCheck} />
//           </motion.div>
//           {/* Output Section */}
//           <AnimatePresence>
//             {isExpanded && (
//               <motion.div
//                 initial={{ opacity: 0, width: 0 }}
//                 animate={{ opacity: 1, width: "50%" }}
//                 exit={{ opacity: 0, width: 0 }}
//                 transition={{ duration: 0.5 }}
//                 className="w-full"
//               >
//                 <FactCheckOutput
//                   output={currentOutput}
//                   isProcessing={isProcessing}
//                 />
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>

//         {/* Stats and Metrics Section */}
//         <AnimatePresence>
//           {isExpanded && currentOutput && (
//             <motion.div
//               initial={{ opacity: 0, y: 50 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: 50 }}
//               transition={{ duration: 0.5 }}
//               className="mt-6"
//             >
//               <DynamicStats
//                 result={currentOutput.result}
//                 sourceLink={currentOutput.source}
//                 confidence={currentOutput.confidence}
//                 reasonToTrust={currentOutput.reasonToTrust}
//                 type={currentOutput.type}
//               />
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Bar Graph Section */}
//         <AnimatePresence>
//           {isExpanded && (
//             <motion.div
//               initial={{ opacity: 0, y: 50 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: 50 }}
//               transition={{ duration: 0.5, delay: 0.2 }}
//               className="mt-6"
//             >
//               <Card>
//                 <CardHeader className="pb-4">
//                   <CardTitle className="text-xl font-bold">
//                     Tag Distribution
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="h-64">
//                     <ResponsiveBar
//                       data={barData}
//                       keys={["count"]}
//                       indexBy="tag"
//                       margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
//                       padding={0.3}
//                       colors={{ scheme: "set2" }}
//                       axisBottom={{
//                         tickSize: 5,
//                         tickPadding: 5,
//                         tickRotation: 0,
//                         legend: "Tags",
//                         legendPosition: "middle",
//                         legendOffset: 40,
//                       }}
//                       axisLeft={{
//                         tickSize: 5,
//                         tickPadding: 5,
//                         tickRotation: 0,
//                         legend: "Count",
//                         legendPosition: "middle",
//                         legendOffset: -40,
//                       }}
//                       tooltip={({ id, value, color }) => (
//                         <div
//                           style={{
//                             backgroundColor: "white",
//                             color: "black",
//                             padding: "8px",
//                             borderRadius: "4px",
//                             boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
//                             fontSize: "14px",
//                             fontWeight: "bold",
//                           }}
//                         >
//                           <strong style={{ color }}>{`${id}: ${value}`}</strong>
//                         </div>
//                       )}
//                     />
//                   </div>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           )}
//         </AnimatePresence>
//         <AnimatePresence>
//           {isExpanded && (
//             <motion.div
//               initial={{ opacity: 0, y: 50 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: 50 }}
//               transition={{ duration: 0.5, delay: 0.2 }}
//               className="mt-6"
//             >
//               <PreviousOutputs outputs={previousOutputs} />
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </main>
//     </div>
//   );
// }
// ###############################################################################################################################################################
// Added video functionality to the dashboard

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

interface FactCheckResult {
  query: string;
  result: boolean;
  confidence: number;
  type: "text" | "video";
  source?: string;
  reasonToTrust?: string;
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
    type: "text" | "video",
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

        const data = await response.json();
        // Assuming your text verification API returns an array:
        // data.result: [boolean, confidence, reasonToTrust, labels]
        let confidence = data.result[1];
        const reasonToTrust = data.result[2];

        if (reasonToTrust === "Retrieved from knowledge graph") {
          confidence = 100;
        }

        const result: FactCheckResult = {
          query,
          result: data.result[0],
          confidence,
          source: "https://example.com/fact-check",
          reasonToTrust,
          type,
        };

        setCurrentOutput(result);
        setPreviousOutputs((prev) => [result, ...prev.slice(0, 4)]);

        const newTag = data.result[3][0];
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
    } else if (type === "video") {
      // For video, use FormData to upload the file
      if (!file) {
        console.error("No video file provided.");
        setIsProcessing(false);
        return;
      }
      try {
        const formData = new FormData();
        formData.append("video", file);
        // Optionally, you can also include a query string if needed:
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
        // Map deepfake result into FactCheckResult shape
        const result: FactCheckResult = {
          query,
          result: videoResult.label === "Real", // True if Real, false if Deepfake
          confidence: videoResult.probability * 100, // Convert probability to percentage if needed
          type,
          source: "Deepfake Model",
          reasonToTrust: "Deepfake detection",
        };

        setCurrentOutput(result);
        setPreviousOutputs((prev) => [result, ...prev.slice(0, 4)]);
        // Optionally, you might update barData if you wish to reflect video results too.
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
                reasonToTrust={currentOutput.reasonToTrust}
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
