import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Link, TrendingUp } from "lucide-react";

interface DynamicStatsProps {
  result: boolean;
  sourceLink: string;
  confidence: number;
  reasonToTrust: string;
}

export default function DynamicStats({
  result,
  sourceLink,
  confidence,
  reasonToTrust,
}: DynamicStatsProps) {
  const stats = [
    {
      title: "Fact Check Result",
      value: reasonToTrust,
      icon: result ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      ),
    },
    {
      title: "Source Reliability",
      value: getSourceReliability(sourceLink),
      icon: <Link className="w-4 h-4 text-blue-500" />,
    },
    {
      title: "Confidence Level",
      value: `${confidence}%`,
      icon: <TrendingUp className="w-4 h-4 text-purple-500" />,
    },
    {
      title: "Fact Check Strength",
      value: getFactCheckStrength(confidence),
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

function getSourceReliability(sourceLink: string): string {
  // This is a placeholder function. In a real-world scenario, you'd want to
  // implement a more sophisticated method to determine source reliability.
  const domain = new URL(sourceLink).hostname;
  const reliableDomains = ["gov", "edu", "org"];
  const tld = domain.split(".").pop();
  return reliableDomains.includes(tld || "") ? "High" : "Medium";
}

function getFactCheckStrength(confidence: number): string {
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
