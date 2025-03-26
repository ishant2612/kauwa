"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Spinner } from "../Spinner/Spinner";

interface FactCheckResult {
  query: string;
  result: boolean;
  confidence: number;
  type: "text" | "video" | "image";
  contentVerification?: boolean;
  deepfakeDetection?: boolean;
  imageVerification?: boolean;
  textVerification?: boolean;
  // sourceLink?: string;
}

interface FactCheckOutputProps {
  output: FactCheckResult | null;
  isProcessing: boolean;
}
export default function FactCheckOutput({
  output,
  isProcessing,
}: FactCheckOutputProps) {
  // console.log("outputtttt", output);
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
                          {output.textVerification ? "Accurate" : "Misleading"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <ResultItem
                  title="Result"
                  result={output.result}
                  trueText={output.type === "video" ? "Authentic" : "True"}
                  falseText={
                    output.type === "video" ? "Likely Deepfake" : "False"
                  }
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
