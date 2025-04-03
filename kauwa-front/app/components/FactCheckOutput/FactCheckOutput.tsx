"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
// import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Spinner } from "../Spinner/Spinner";

interface FactCheckResult {
  query: string;
  result: boolean;
  confidence: number;
  type: "text" | "video" | "image";
  contentVerification?: boolean;
  deepfakeDetection?: boolean;
  imageVerification?: boolean;
  textVerification?: string;
  // sourceLink?: string;
  videoDeepfake?: boolean;
  audioDeepfake?: boolean;
  audioContextVerification: string;
}

interface FactCheckOutputProps {
  output: FactCheckResult | null;
  isProcessing: boolean;
}
export default function FactCheckOutput({
  output,
  isProcessing,
}: FactCheckOutputProps) {
  console.log("outputtttt", output);
  console.log("Type============", output?.type);
  console.log("Audio", output?.audioDeepfake);
  console.log("video", output?.result);
  console.log("text", output?.audioContextVerification);
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>
          {output?.type === "video"
            ? "Video Analysis Result"
            : output?.type === "image"
            ? "Image Analysis Result"
            : "Fact Check Output"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-full min-h-[300px]"
            >
              <Spinner className="mb-4" />
              <p className="text-lg text-muted-foreground">
                Processing your request...
              </p>
            </motion.div>
          ) : output ? (
            <motion.div
              key={output.query}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-4 h-full"
            >
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  {output.type === "text" ? "Query" : "File"}:
                </h3>
                <p className="text-muted-foreground">{output.query}</p>
              </div>
              {output.type === "image" ? (
                <>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      Verification:
                    </h3>
                    <div
                      className={`flex items-center ${
                        output.result ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {output.result ? (
                        <CheckCircle className="w-6 h-6 mr-2" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 mr-2" />
                      )}
                      <span className="text-2xl font-bold">
                        {output.result ? "Authentic" : "Manipulated"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {/* Image Verification */}
                    <div className="bg-secondary/30 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">
                        Image Verification:
                      </h4>
                      <div
                        className={`flex items-center ${
                          output.imageVerification
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {output.imageVerification ? (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        <span className="text-base font-medium">
                          {output.imageVerification
                            ? "No Manipulation"
                            : "Manipulated"}
                        </span>
                      </div>
                    </div>

                    {/* Text Verification */}
                    <div className="bg-secondary/30 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">
                        Text Verification:
                      </h4>
                      <div
                        className={`flex items-center ${
                          output.textVerification
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {output.textVerification ? (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        <span className="text-base font-medium">
                          <p>{output.textVerification}</p>
                          {output.textVerification === "TRUE" ? "Accurate" : "Misleading"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : output.type === "video" ? (
                <>
                  {/* Main Verification Result for Video */}
                  {/* <div>
                    <h3 className="font-semibold text-lg mb-1">
                      Verification:
                    </h3>
                    <div
                      className={`flex items-center ${
                        output.result ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {output.result ? (
                        <CheckCircle className="w-6 h-6 mr-2" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 mr-2" />
                      )}
                      <span className="text-2xl font-bold">
                        {output.result ? "Authentic" : "Manipulated"}
                      </span>
                    </div>
                  </div> */}

                  {/* Additional Video Analysis Results */}
                  <div className="space-y-3 mt-4">
                    {/* Video Deepfake */}
                    <div className="bg-secondary/30 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">
                        Video Deepfake:
                      </h4>
                      <div
                        className={`flex items-center ${
                          output.result == false
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {output.result == false ? (
                          <AlertTriangle className="w-4 h-4 mr-1" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        <span className="text-base font-medium">
                          {output.result == false ? "Deepfake" : "Real"}
                        </span>
                      </div>
                    </div>

                    {/* Audio Deepfake */}
                    <div className="bg-secondary/30 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">
                        Audio Deepfake:
                      </h4>
                      <div
                        className={`flex items-center ${
                          output.audioDeepfake
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {output.audioDeepfake ? (
                          <AlertTriangle className="w-4 h-4 mr-1" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        <span className="text-base font-medium">
                          {output.audioDeepfake !== undefined
                          ? output.audioDeepfake ? 
                              "Real" 
                              : "Deepfake"
                            : "No Audio Found"}
                        </span>
                      </div>
                    </div>

                    {/* Audio Context Verification */}
                    <div className="bg-secondary/30 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">
                        Audio Context Verification:
                      </h4>
                      <div
                        className={`flex items-center ${
                          output.audioContextVerification === "TRUE"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {output.audioContextVerification === "TRUE" ? (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        <span className="text-base font-medium">
                          {output.audioContextVerification
                            ? output.audioContextVerification === "TRUE"
                              ? <p>Accurate</p>
                              : <p>Misleading</p>
                            : <p>No Audio Found</p>}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <ResultItem
                  title="Result"
                  result={output.result}
                  trueText="True"
                  falseText="False"
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center h-full min-h-[300px] bg-secondary rounded-md text-muted-foreground"
            >
              No output yet. Submit a query, video, or image to see results.
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

interface ResultItemProps {
  title: string;
  result: boolean | undefined;
  trueText: string;
  falseText: string;
  // sourceLink?: string;
  // sourceLink?: string;
}

function ResultItem({
  title,
  result,
  trueText,
  falseText,
}: // sourceLink,
ResultItemProps) {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-1">{title}:</h3>
      <div
        className={`flex items-center ${
          result ? "text-green-500" : "text-red-500"
        }`}
      >
        {result ? (
          <CheckCircle className="w-6 h-6 mr-2" />
        ) : (
          <AlertTriangle className="w-6 h-6 mr-2" />
        )}
        <span className="text-2xl font-bold">
          {result ? trueText : falseText}
        </span>
      </div>
    </div>
  );
}
