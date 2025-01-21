import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";

interface FactCheckResult {
  query: string;
  result: boolean;
  source: string;
  reasonToTrust: string;
  confidence: number;
}

interface PreviousOutputsProps {
  outputs: FactCheckResult[];
}

export default function PreviousOutputs({ outputs }: PreviousOutputsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Previous Outputs</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {outputs.map((output, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-secondary rounded-md"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold">{output.query}</span>
                {output.result ? (
                  <span className="flex items-center text-green-500">
                    <CheckCircle className="w-4 h-4 mr-1" /> True
                  </span>
                ) : (
                  <span className="flex items-center text-red-500">
                    <XCircle className="w-4 h-4 mr-1" /> False
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Confidence: {output.confidence}%
              </div>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
