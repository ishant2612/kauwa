"use client";

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
  ImageIcon,
} from "lucide-react";

interface DynamicStatsProps {
  result: boolean;
  confidence: number;
  type: "text" | "video" | "image";
  sourceLink: string;
  reason?: string;
  contentVerification?: boolean;
  deepfakeDetection?: boolean;
}

export default function DynamicStats({
  result,
  confidence,
  type,
  reason,
  sourceLink,
  contentVerification,
  deepfakeDetection,
}: DynamicStatsProps) {
  const stats = [
    {
      title: getTitle(type),
      value: getValue(
        type,
        result,

        contentVerification,
        deepfakeDetection,
        reason
      ),
      icon: getIcon(type, result, contentVerification, deepfakeDetection),
    },
    {
      title: "Input Type",
      value: type.charAt(0).toUpperCase() + type.slice(1),
      icon: getInputTypeIcon(type),
    },
    {
      title: "Confidence Level",
      value: `${confidence}%`,
      icon: <TrendingUp className="w-4 h-4 text-purple-500" />,
    },
    {
      title: getSourceTitle(type),
      value: getLink(sourceLink, type),
      icon: <TrendingUp className="w-4 h-4 text-yellow-500" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="flex flex-col h-full text-wrap">
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
      {reason && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">{reason}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function getTitle(type: string): string {
  switch (type) {
    case "video":
      return "Deepfake Detection";
    case "image":
      return "Image Analysis";
    default:
      return "Fact Check Result";
  }
}

function getValue(
  type: string,
  result: boolean,
  contentVerification?: boolean,
  deepfakeDetection?: boolean,
  reason?: string
): string {
  if (type === "image") {
    // If a reason is provided for image analysis, display it;
    // otherwise, fall back to the content verification status.
    return reason
      ? reason
      : `Content: ${contentVerification ? "True" : "False"}`;
  }
  return type === "video"
    ? result
      ? "Authentic"
      : "Likely Deepfake"
    : result
    ? "True"
    : "False";
}

function getIcon(
  type: string,
  result: boolean,
  contentVerification?: boolean,
  deepfakeDetection?: boolean
) {
  if (type === "image") {
    return contentVerification ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-red-500" />
    );
  }
  return type === "video" ? (
    result ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-red-500" />
    )
  ) : result ? (
    <CheckCircle className="w-4 h-4 text-green-500" />
  ) : (
    <XCircle className="w-4 h-4 text-red-500" />
  );
}

function getInputTypeIcon(type: string) {
  switch (type) {
    case "video":
      return <Video className="w-4 h-4 text-blue-500" />;
    case "image":
      return <ImageIcon className="w-4 h-4 text-blue-500" />;
    default:
      return <Link className="w-4 h-4 text-blue-500" />;
  }
}

function getSourceTitle(type: string): string {
  switch (type) {
    case "video":
      return "Video Context Source Link";
    case "image":
      return "Image Analysis Model";
    default:
      return "Source Link";
  }
}

function getLink(sourceLink: string, type: string): JSX.Element | string {
  switch (type) {
    case "video":
      return (
        <a
          href={sourceLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white-500 underline text-xs text-wrap"
        >
          {sourceLink}
        </a>
      );
    case "image":
      return "Image Analysis Model";
    default:
      return (
        <a
          href={sourceLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white-500 underline text-xs text-wrap"
        >
          {sourceLink}
        </a>
      );
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "bg-green-500";
  if (confidence >= 60) return "bg-yellow-500";
  if (confidence >= 40) return "bg-orange-500";
  return "bg-red-500";
}
