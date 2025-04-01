// "use client";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { motion } from "framer-motion";
// import {
//   CheckCircle,
//   XCircle,
//   Link,
//   TrendingUp,
//   AlertTriangle,
//   Video,
//   ImageIcon,
// } from "lucide-react";

// interface DynamicStatsProps {
//   result: boolean;
//   confidence: number;
//   type: "text" | "video" | "image";
//   sourceLink: string;
//   reason?: string;
//   contentVerification?: boolean;
//   deepfakeDetection?: boolean;
// }

// export default function DynamicStats({
//   result,
//   confidence,
//   type,
//   reason,
//   sourceLink,
//   contentVerification,
//   deepfakeDetection,
// }: DynamicStatsProps) {
//   const stats = [
//     {
//       title: getTitle(type),
//       value: getValue(
//         type,
//         result,

//         contentVerification,
//         deepfakeDetection,
//         reason
//       ),
//       icon: getIcon(type, result, contentVerification, deepfakeDetection),
//     },
//     {
//       title: "Input Type",
//       value: type.charAt(0).toUpperCase() + type.slice(1),
//       icon: getInputTypeIcon(type),
//     },
//     {
//       title: "Confidence Level",
//       value: `${confidence}%`,
//       icon: <TrendingUp className="w-4 h-4 text-purple-500" />,
//     },
//     {
//       title: getSourceTitle(type),
//       value: getLink(sourceLink, type),
//       icon: <TrendingUp className="w-4 h-4 text-yellow-500" />,
//     },
//   ];

//   return (
//     <div className="space-y-4">
//       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
//         {stats.map((stat, index) => (
//           <motion.div
//             key={stat.title}
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: index * 0.1 }}
//           >
//             <Card className="flex flex-col h-full text-wrap">
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">
//                   {stat.title}
//                 </CardTitle>
//                 {stat.icon}
//               </CardHeader>
//               <CardContent className="flex-grow flex flex-col justify-between">
//                 <div className="text-sm">{stat.value}</div>
//                 {stat.title === "Confidence Level" && (
//                   <Progress
//                     value={confidence}
//                     className={`mt-2 ${getConfidenceColor(confidence)}`}
//                   />
//                 )}
//               </CardContent>
//             </Card>
//           </motion.div>
//         ))}
//       </div>
//       {reason && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.4 }}
//         >
//           <Card className="w-full">
//             <CardHeader>
//               <CardTitle className="text-sm font-medium">Explanation</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-sm">{reason}</div>
//             </CardContent>
//           </Card>
//         </motion.div>
//       )}
//     </div>
//   );
// }

// function getTitle(type: string): string {
//   switch (type) {
//     case "video":
//       return "Deepfake Detection";
//     case "image":
//       return "Image Analysis";
//     default:
//       return "Fact Check Result";
//   }
// }

// function getValue(
//   type: string,
//   result: boolean,
//   contentVerification?: boolean,
//   deepfakeDetection?: boolean,
//   reason?: string
// ): string {
//   if (type === "image") {
//     // If a reason is provided for image analysis, display it;
//     // otherwise, fall back to the content verification status.
//     return reason
//       ? reason
//       : `Content: ${contentVerification ? "True" : "False"}`;
//   }
//   return type === "video"
//     ? result
//       ? "Authentic"
//       : "Likely Deepfake"
//     : result
//     ? "True"
//     : "False";
// }

// function getIcon(
//   type: string,
//   result: boolean,
//   contentVerification?: boolean,
//   deepfakeDetection?: boolean
// ) {
//   if (type === "image") {
//     return contentVerification ? (
//       <CheckCircle className="w-4 h-4 text-green-500" />
//     ) : (
//       <AlertTriangle className="w-4 h-4 text-red-500" />
//     );
//   }
//   return type === "video" ? (
//     result ? (
//       <CheckCircle className="w-4 h-4 text-green-500" />
//     ) : (
//       <AlertTriangle className="w-4 h-4 text-red-500" />
//     )
//   ) : result ? (
//     <CheckCircle className="w-4 h-4 text-green-500" />
//   ) : (
//     <XCircle className="w-4 h-4 text-red-500" />
//   );
// }

// function getInputTypeIcon(type: string) {
//   switch (type) {
//     case "video":
//       return <Video className="w-4 h-4 text-blue-500" />;
//     case "image":
//       return <ImageIcon className="w-4 h-4 text-blue-500" />;
//     default:
//       return <Link className="w-4 h-4 text-blue-500" />;
//   }
// }

// function getSourceTitle(type: string): string {
//   switch (type) {
//     case "video":
//       return "Video Context Source Link";
//     case "image":
//       return "Image Analysis Model";
//     default:
//       return "Source Link";
//   }
// }

// function getLink(sourceLink: string, type: string): JSX.Element | string {
//   switch (type) {
//     case "video":
//       return (
//         <a
//           href={sourceLink}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="text-white-500 underline text-xs text-wrap"
//         >
//           {sourceLink}
//         </a>
//       );
//     case "image":
//       return "Image Analysis Model";
//     default:
//       return (
//         <a
//           href={sourceLink}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="text-white-500 underline text-xs text-wrap"
//         >
//           {sourceLink}
//         </a>
//       );
//   }
// }

// function getConfidenceColor(confidence: number): string {
//   if (confidence >= 80) return "bg-green-500";
//   if (confidence >= 60) return "bg-yellow-500";
//   if (confidence >= 40) return "bg-orange-500";
//   return "bg-red-500";
// }

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  LinkIcon,
  TrendingUp,
  AlertTriangle,
  Video,
  ImageIcon,
  FileText,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DynamicStatsProps {
  result: boolean;
  confidence: number;
  type: "text" | "video" | "image";
  // Image analysis fields
  contentVerification?: boolean;
  deepfakeDetection?: boolean;
  imageVerification?: boolean;
  textVerification?: boolean;
  // Video analysis fields
  videoDeepfake?: boolean;
  audioDeepfake?: boolean;
  audioContextVerification?: boolean;
  // Source links (would be fetched from backend)
  sourceLink?: string;
  allSources?: string[];
}

export default function DynamicStats({
  result,
  confidence,
  type,
  contentVerification,
  deepfakeDetection,
  imageVerification,
  textVerification,
  videoDeepfake,
  audioDeepfake,
  audioContextVerification,
  sourceLink,
  allSources,
}: DynamicStatsProps) {
  const [showAllSources, setShowAllSources] = useState(false);

  // Base stats that are always shown
  const baseStats = [
    {
      title: getTitle(type),
      value: getValue(type, result),
      icon: getIcon(type, result),
      colSpan: 1,
    },
    {
      title: "Input Type",
      value: type.charAt(0).toUpperCase() + type.slice(1),
      icon: getInputTypeIcon(type),
      colSpan: 1,
    },
    {
      title: "Confidence Level",
      value: `${confidence}%`,
      icon: <TrendingUp className="w-4 h-4 text-purple-500" />,
      colSpan: 1,
      showProgress: true,
    },
  ];

  // Source link stat (replaces Fact Check Strength)
  const sourceLinkStat = {
    title: "Source Link",
    value: sourceLink,
    icon: <ExternalLink className="w-4 h-4 text-blue-500" />,
    colSpan: 1,
    isSourceLink: true,
    allSources: allSources,
  };

  // Additional stats for image analysis
  // const imageStats =
  //   type === "image"
  //     ? [
  //         {
  //           title: "Image Verification",
  //           value: imageVerification ? "No Manipulation" : "Manipulated",
  //           icon: imageVerification ? (
  //             <CheckCircle className="w-4 h-4 text-green-500" />
  //           ) : (
  //             <XCircle className="w-4 h-4 text-red-500" />
  //           ),
  //           colSpan: 1,
  //         },
  //         {
  //           title: "Text Verification",
  //           value: textVerification ? "Accurate" : "Misleading",
  //           icon: textVerification ? (
  //             <CheckCircle className="w-4 h-4 text-green-500" />
  //           ) : (
  //             <XCircle className="w-4 h-4 text-red-500" />
  //           ),
  //           colSpan: 1,
  //         },
  //       ]
  //     : [];

  // Additional stats for video analysis
  // const videoStats =
  //   type === "video"
  //     ? [
  //         {
  //           title: "Video Deepfake",
  //           value: videoDeepfake ? "Detected" : "Not Detected",
  //           icon: videoDeepfake ? (
  //             <AlertTriangle className="w-4 h-4 text-red-500" />
  //           ) : (
  //             <CheckCircle className="w-4 h-4 text-green-500" />
  //           ),
  //           colSpan: 1,
  //         },
  //         {
  //           title: "Audio Deepfake",
  //           value: audioDeepfake ? "Detected" : "Not Detected",
  //           icon: audioDeepfake ? (
  //             <AlertTriangle className="w-4 h-4 text-red-500" />
  //           ) : (
  //             <CheckCircle className="w-4 h-4 text-green-500" />
  //           ),
  //           colSpan: 1,
  //         },
  //         {
  //           title: "Audio Context",
  //           value: audioContextVerification ? "Matches" : "Mismatched",
  //           icon: audioContextVerification ? (
  //             <CheckCircle className="w-4 h-4 text-green-500" />
  //           ) : (
  //             <XCircle className="w-4 h-4 text-red-500" />
  //           ),
  //           colSpan: 1,
  //         },
  //       ]
  //     : [];

  // Combine stats based on type
  const stats = [
    ...baseStats,
    sourceLinkStat,
    // ...(type === "image" ? imageStats : []),
    // ...(type === "video" ? videoStats : []),
  ];

  // Determine grid columns based on number of stats
  const gridCols = stats.length <= 4 ? "lg:grid-cols-4" : "lg:grid-cols-7";

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${gridCols} auto-rows-fr`}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`md:col-span-${stat.colSpan}`}
        >
          <Card
            className={`flex flex-col h-full ${
              showAllSources && stat.isSourceLink ? "h-auto" : ""
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              {stat.isSourceLink ? (
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-blue-500 hover:underline">
                    <LinkIcon className="w-3 h-3 mr-1 inline" />
                    <a
                      href={stat.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate"
                    >
                      {stat.value}
                    </a>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs w-full flex items-center justify-center mt-2"
                    onClick={() => setShowAllSources(!showAllSources)}
                  >
                    {showAllSources ? "Hide Sources" : "All Sources"}
                    <ChevronDown
                      className={`ml-1 h-3 w-3 transition-transform ${
                        showAllSources ? "rotate-180" : ""
                      }`}
                    />
                  </Button>

                  <AnimatePresence>
                    {showAllSources && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 border-t border-border mt-2 space-y-2">
                          {"allSources" in stat &&
                            stat.allSources?.map((source, idx) => (
                              <div
                                key={idx}
                                className="flex items-center text-xs text-blue-500 hover:underline"
                              >
                                <LinkIcon className="w-3 h-3 mr-1 inline flex-shrink-0" />
                                <a
                                  href={source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate"
                                >
                                  {source}
                                </a>
                              </div>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-sm">{stat.value}</div>
              )}

              {stat.showProgress && (
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

function getTitle(type: string): string {
  switch (type) {
    case "video":
      return "Overall Verification";
    case "image":
      return "Overall Verification";
    default:
      return "Fact Check Result";
  }
}

function getValue(type: string, result: boolean): string {
  return type === "video" || type === "image"
    ? result
      ? "Authentic"
      : "Manipulated"
    : result
    ? "True"
    : "False";
}

function getIcon(type: string, result: boolean) {
  return type === "video" || type === "image" ? (
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
      return <FileText className="w-4 h-4 text-blue-500" />;
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "bg-green-500";
  if (confidence >= 60) return "bg-yellow-500";
  if (confidence >= 40) return "bg-orange-500";
  return "bg-red-500";
}
