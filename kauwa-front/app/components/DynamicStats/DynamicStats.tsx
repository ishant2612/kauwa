import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Link,
  TrendingUp,
  AlertTriangle,
  Video,
} from "lucide-react";

interface DynamicStatsProps {
  query: string;
  result: boolean;
  confidence: number;
  sourceLink: string;
  reasonToTrust: string;
  type: "text" | "video";
}

export default function DynamicStats({
  result,
  confidence,
  type,
}: DynamicStatsProps) {
  const stats = [
    {
      title: type === "video" ? "Deepfake Detection" : "Fact Check Result",
      value:
        type === "video"
          ? result
            ? "Authentic"
            : "Likely Deepfake"
          : result
          ? "True"
          : "False",
      icon:
        type === "video" ? (
          result ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )
        ) : result ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        ),
    },
    {
      title: "Input Type",
      value: type === "video" ? "Video" : "Text",
      icon:
        type === "video" ? (
          <Video className="w-4 h-4 text-blue-500" />
        ) : (
          <Link className="w-4 h-4 text-blue-500" />
        ),
    },
    {
      title: "Confidence Level",
      value: `${confidence}%`,
      icon: <TrendingUp className="w-4 h-4 text-purple-500" />,
    },
    {
      title: type === "video" ? "Detection Strength" : "Fact Check Strength",
      value: getStrength(confidence),
      icon: <TrendingUp className="w-4 h-4 text-yellow-500" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <div className="text-sm">{stat.value}</div>
              {stat.title === "Confidence Level" && (
                <Progress
                  value={confidence}
                  className={`mt-2 ${getConfidenceColor(confidence)}`}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function getStrength(confidence: number): string {
  if (confidence >= 90) return "Very Strong";
  if (confidence >= 70) return "Strong";
  if (confidence >= 50) return "Moderate";
  if (confidence >= 30) return "Weak";
  return "Very Weak";
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "bg-green-500";
  if (confidence >= 60) return "bg-yellow-500";
  if (confidence >= 40) return "bg-orange-500";
  return "bg-red-500";
}
