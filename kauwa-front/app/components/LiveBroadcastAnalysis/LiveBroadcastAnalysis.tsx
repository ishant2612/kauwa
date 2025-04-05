// "use client";

// import { useState, useRef } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Mic, MicOff, Radio, CheckCircle, XCircle, Clock } from "lucide-react";
// import { Spinner } from "../Spinner/Spinner";
// import { motion } from "framer-motion";
// import React from "react";

// interface LiveBroadcastAnalysisProps {
//   onFactCheck: (
//     query: string,
//     type: "text" | "video" | "image" | "live-broadcast",
//     file?: File
//   ) => void;
// }

// interface TranscriptChunk {
//   id: string;
//   text: string;
//   isValid: boolean | null;
//   confidence: number | null;
//   timestamp: string;
//   explanation?: string;
// }

// export default function LiveBroadcastAnalysis({
//   onFactCheck,
// }: LiveBroadcastAnalysisProps) {
//   const [isSharing, setIsSharing] = useState(false);
//   const [isTranscribing, setIsTranscribing] = useState(false);
//   const [transcript, setTranscript] = useState("");
//   const [transcriptChunks, setTranscriptChunks] = useState<TranscriptChunk[]>(
//     []
//   );
//   const [stream, setStream] = useState<MediaStream | null>(null);
//   const recognitionRef = useRef<SpeechRecognition | null>(null);
//   const videoRef = useRef<HTMLVideoElement>(null);

//   // Start screen (or tab) sharing using getDisplayMedia and attach the stream to a video element
//   const startScreenSharing = async () => {
//     try {
//       // Request both video and audio from the user
//       const mediaStream = await navigator.mediaDevices.getDisplayMedia({
//         video: true,
//         audio: true,
//       });
//       setStream(mediaStream);
//       setIsSharing(true);

//       // Attach the shared stream to the video element so the user can see it
//       if (videoRef.current) {
//         videoRef.current.srcObject = mediaStream;
//         videoRef.current
//           .play()
//           .catch((err) =>
//             console.error("Error playing shared screen video:", err)
//           );
//       }

//       // Start transcription using Web Speech API (if supported)
//       // Note: Browser support may vary. You may need to include vendor prefixes.
//       const SpeechRecognition =
//         (window as any).SpeechRecognition ||
//         (window as any).webkitSpeechRecognition;
//       if (SpeechRecognition) {
//         const recognition = new SpeechRecognition();
//         recognition.continuous = true;
//         recognition.interimResults = true;
//         recognition.lang = "en-US";

//         recognition.onresult = (event: SpeechRecognitionEvent) => {
//           let interimTranscript = "";
//           for (let i = event.resultIndex; i < event.results.length; i++) {
//             const result = event.results[i];
//             interimTranscript += result[0].transcript;
//           }
//           setTranscript(interimTranscript);
//           // You can also split and validate transcript chunks as needed:
//           // e.g. call validateChunk on a chunk after a pause in speech.
//         };

//         recognition.onerror = (event: any) => {
//           console.error("Speech recognition error", event);
//         };

//         recognition.start();
//         recognitionRef.current = recognition;
//         setIsTranscribing(true);
//       } else {
//         console.warn("SpeechRecognition is not supported in this browser.");
//       }
//     } catch (error) {
//       console.error("Error starting screen sharing:", error);
//     }
//   };

//   // Stop screen sharing and transcription
//   const stopScreenSharing = () => {
//     if (stream) {
//       // Stop all tracks
//       stream.getTracks().forEach((track) => track.stop());
//     }
//     setStream(null);
//     setIsSharing(false);
//     setIsTranscribing(false);
//     setTranscript("");
//     setTranscriptChunks([]);
//     if (recognitionRef.current) {
//       recognitionRef.current.stop();
//       recognitionRef.current = null;
//     }
//   };

//   // Simulated function to validate transcript chunks (update as needed)
//   const validateChunk = (chunkId: string) => {
//     setTranscriptChunks((prev) =>
//       prev.map((chunk) => {
//         if (chunk.id === chunkId) {
//           const containsInvalidContent =
//             chunk.text.toLowerCase().includes("false") ||
//             chunk.text.toLowerCase().includes("fraud");
//           return {
//             ...chunk,
//             isValid: !containsInvalidContent,
//             confidence: Math.floor(Math.random() * 30) + 70, // Random confidence between 70-100%
//           };
//         }
//         return chunk;
//       })
//     );
//   };

//   // Optional: Simulate adding transcript chunks periodically
//   // In a real-world scenario, you might split the live transcription stream into chunks
//   const simulateChunking = () => {
//     // Your implementation to periodically split transcript into chunks,
//     // validate them, and update the transcriptChunks state.
//   };

//   return (
//     <div className="flex flex-col h-full gap-4">
//       {/* Top section with tab sharing and live transcription side by side */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
//         {/* Tab sharing section */}
//         <Card className="p-4 flex flex-col">
//           <h3 className="text-lg font-medium mb-4">Tab Sharing</h3>
//           <div className="flex-grow flex flex-col items-center justify-center bg-secondary/30 rounded-lg p-4">
//             {isSharing ? (
//               <div className="w-full h-full flex flex-col">
//                 {/* Display the shared screen in a video element */}
//                 <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
//                   <video
//                     ref={videoRef}
//                     className="w-full h-full object-cover"
//                     autoPlay
//                     playsInline
//                     muted
//                   />
//                   <div className="absolute top-4 left-4 text-white text-sm">
//                     Live Broadcast
//                   </div>
//                 </div>
//                 <Button
//                   variant="destructive"
//                   className="mt-4 self-center"
//                   onClick={stopScreenSharing}
//                 >
//                   <MicOff className="mr-2 h-4 w-4" /> Stop Sharing
//                 </Button>
//               </div>
//             ) : (
//               <div className="text-center">
//                 <Radio className="h-16 w-16 text-gray-400 mx-auto mb-4" />
//                 <p className="text-sm text-gray-500 mb-4">
//                   Share any browser tab for live transcription and
//                   fact-checking.
//                 </p>
//                 <Button onClick={startScreenSharing}>
//                   <Mic className="mr-2 h-4 w-4" /> Start Tab Sharing
//                 </Button>
//               </div>
//             )}
//           </div>
//         </Card>

//         {/* Live transcription section */}
//         <Card className="p-4 flex flex-col">
//           <h3 className="text-lg font-medium mb-4">Live Transcription</h3>
//           <div className="flex-grow overflow-y-auto bg-secondary/30 rounded-lg p-4 font-mono text-sm">
//             {isTranscribing ? (
//               <>
//                 {transcript}
//                 <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse"></span>
//               </>
//             ) : (
//               <div className="text-gray-500 h-full flex items-center justify-center">
//                 Transcription will appear here once sharing starts...
//               </div>
//             )}
//           </div>
//         </Card>
//       </div>

//       {/* Bottom section with validation output spanning full width */}
//       <Card className="p-4 flex-grow">
//         <h3 className="text-lg font-medium mb-4">Fact Check Results</h3>
//         <div className="max-h-64 overflow-y-auto">
//           {transcriptChunks.length > 0 ? (
//             <div className="space-y-3">
//               {transcriptChunks.map((chunk) => (
//                 <motion.div
//                   key={chunk.id}
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className="p-3 bg-secondary/30 rounded-lg"
//                 >
//                   <div className="flex justify-between items-start mb-2">
//                     <div className="flex-grow">
//                       <p className="text-sm font-medium">{chunk.text}</p>
//                       <div className="flex items-center text-xs text-gray-500 mt-1">
//                         <Clock className="h-3 w-3 mr-1" /> {chunk.timestamp}
//                       </div>
//                     </div>
//                     <div className="ml-4 flex-shrink-0">
//                       {chunk.isValid === null ? (
//                         <span className="flex items-center text-yellow-500 text-xs">
//                           <Spinner className="h-3 w-3 mr-1" /> Validating...
//                         </span>
//                       ) : chunk.isValid ? (
//                         <span className="flex items-center text-green-500 text-xs">
//                           <CheckCircle className="h-3 w-3 mr-1" /> Valid (
//                           {chunk.confidence}%)
//                         </span>
//                       ) : (
//                         <span className="flex items-center text-red-500 text-xs">
//                           <XCircle className="h-3 w-3 mr-1" /> Invalid (
//                           {chunk.confidence}%)
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                   {chunk.isValid !== null && (
//                     <div className="mt-2 text-xs border-t border-gray-200 pt-2">
//                       <span className="font-medium">Analysis: </span>
//                       {chunk.explanation}
//                     </div>
//                   )}
//                 </motion.div>
//               ))}
//             </div>
//           ) : (
//             <div className="text-gray-500 h-32 flex items-center justify-center">
//               Fact-check results will appear here as content is analyzed...
//             </div>
//           )}
//         </div>
//       </Card>
//     </div>
//   );
// }

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Radio, CheckCircle, XCircle, Clock } from "lucide-react";
import { Spinner } from "../Spinner/Spinner";
import { motion } from "framer-motion";
import React from "react";

interface LiveBroadcastAnalysisProps {
  onFactCheck: (
    query: string,
    type: "text" | "video" | "image" | "live-broadcast",
    file?: File
  ) => void;
}

interface TranscriptChunk {
  id: string;
  text: string;
  isValid: boolean | null;
  confidence: number | null;
  timestamp: string;
  explanation?: string;
}

export default function LiveBroadcastAnalysis({
  onFactCheck,
}: LiveBroadcastAnalysisProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [transcriptChunks, setTranscriptChunks] = useState<TranscriptChunk[]>(
    []
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Start screen (or tab) sharing using getDisplayMedia and attach the stream to a video element
  const startScreenSharing = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      setIsSharing(true);
      console.log("Media stream:", mediaStream);

      // Use setTimeout to ensure videoRef is mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.muted = true;
          videoRef.current
            .play()
            .then(() => console.log("Video is playing"))
            .catch((e) => console.error("Video play error:", e));
        } else {
          console.warn("Video ref is null after delay");
        }
      }, 300); // small delay ensures ref is attached

      // Speech Recognition Setup
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            interimTranscript += result[0].transcript;
          }
          setTranscript(interimTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsTranscribing(true);
      } else {
        console.warn("SpeechRecognition is not supported in this browser.");
      }
    } catch (error) {
      console.error("Error starting screen sharing:", error);
    }
  };

  // Stop screen sharing and transcription
  const stopScreenSharing = () => {
    if (stream) {
      // Stop all tracks
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsSharing(false);
    setIsTranscribing(false);
    setTranscript("");
    setTranscriptChunks([]);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  // Simulated function to validate transcript chunks (update as needed)
  const validateChunk = (chunkId: string) => {
    setTranscriptChunks((prev) =>
      prev.map((chunk) => {
        if (chunk.id === chunkId) {
          const containsInvalidContent =
            chunk.text.toLowerCase().includes("false") ||
            chunk.text.toLowerCase().includes("fraud");
          return {
            ...chunk,
            isValid: !containsInvalidContent,
            confidence: Math.floor(Math.random() * 30) + 70, // Random confidence between 70-100%
          };
        }
        return chunk;
      })
    );
  };

  // Optional: Simulate adding transcript chunks periodically
  // In a real-world scenario, you might split the live transcription stream into chunks
  const simulateChunking = () => {
    // Your implementation to periodically split transcript into chunks,
    // validate them, and update the transcriptChunks state.
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Top section with tab sharing and live transcription side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
        {/* Tab sharing section */}
        <Card className="p-4 flex flex-col">
          <h3 className="text-lg font-medium mb-4">Tab Sharing</h3>
          <div className="flex-grow flex flex-col items-center justify-center bg-secondary/30 rounded-lg p-4">
            {isSharing ? (
              <div className="w-full h-full flex flex-col">
                {/* Display the shared screen in a video element */}
                <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                  />
                  <div className="absolute top-4 left-4 text-white text-sm">
                    Live Broadcast
                  </div>
                </div>
                <Button
                  variant="destructive"
                  className="mt-4 self-center"
                  onClick={stopScreenSharing}
                >
                  <MicOff className="mr-2 h-4 w-4" /> Stop Sharing
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Radio className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500 mb-4">
                  Share any browser tab for live transcription and
                  fact-checking.
                </p>
                <Button onClick={startScreenSharing}>
                  <Mic className="mr-2 h-4 w-4" /> Start Tab Sharing
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Live transcription section */}
        <Card className="p-4 flex flex-col">
          <h3 className="text-lg font-medium mb-4">Live Transcription</h3>
          <div className="flex-grow overflow-y-auto bg-secondary/30 rounded-lg p-4 font-mono text-sm">
            {isTranscribing ? (
              <>
                {transcript}
                <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse"></span>
              </>
            ) : (
              <div className="text-gray-500 h-full flex items-center justify-center">
                Transcription will appear here once sharing starts...
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom section with validation output spanning full width */}
      <Card className="p-4 flex-grow">
        <h3 className="text-lg font-medium mb-4">Fact Check Results</h3>
        <div className="max-h-64 overflow-y-auto">
          {transcriptChunks.length > 0 ? (
            <div className="space-y-3">
              {transcriptChunks.map((chunk) => (
                <motion.div
                  key={chunk.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-secondary/30 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-grow">
                      <p className="text-sm font-medium">{chunk.text}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 mr-1" /> {chunk.timestamp}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {chunk.isValid === null ? (
                        <span className="flex items-center text-yellow-500 text-xs">
                          <Spinner className="h-3 w-3 mr-1" /> Validating...
                        </span>
                      ) : chunk.isValid ? (
                        <span className="flex items-center text-green-500 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" /> Valid (
                          {chunk.confidence}%)
                        </span>
                      ) : (
                        <span className="flex items-center text-red-500 text-xs">
                          <XCircle className="h-3 w-3 mr-1" /> Invalid (
                          {chunk.confidence}%)
                        </span>
                      )}
                    </div>
                  </div>
                  {chunk.isValid !== null && (
                    <div className="mt-2 text-xs border-t border-gray-200 pt-2">
                      <span className="font-medium">Analysis: </span>
                      {chunk.explanation}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 h-32 flex items-center justify-center">
              Fact-check results will appear here as content is analyzed...
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
