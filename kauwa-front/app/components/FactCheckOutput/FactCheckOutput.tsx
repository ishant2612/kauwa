import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Spinner } from "../Spinner/Spinner";

interface FactCheckResult {
  query: string;
  result: boolean;
  confidence: number;
  type: "text" | "video";
}

interface FactCheckOutputProps {
  output: FactCheckResult | null;
  isProcessing: boolean;
}

export default function FactCheckOutput({
  output,
  isProcessing,
}: FactCheckOutputProps) {
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>
          {output?.type === "video"
            ? "Deepfake Detection Result"
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
                  {output.type === "video" ? "Video" : "Query"}:
                </h3>
                <p className="text-muted-foreground">{output.query}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Result:</h3>
                <div
                  className={`flex items-center ${
                    output.result ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {output.type === "video" ? (
                    output.result ? (
                      <CheckCircle className="w-6 h-6 mr-2" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 mr-2" />
                    )
                  ) : output.result ? (
                    <CheckCircle className="w-6 h-6 mr-2" />
                  ) : (
                    <XCircle className="w-6 h-6 mr-2" />
                  )}
                  <span className="text-2xl font-bold">
                    {output.type === "video"
                      ? output.result
                        ? "Authentic"
                        : "Likely Deepfake"
                      : output.result
                      ? "True"
                      : "False"}
                  </span>
                </div>
              </div>
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
              No output yet. Submit a query or video to see results.
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
