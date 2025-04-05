"use client";

import { useEffect, useRef, useState } from "react";
import Groq, { toFile } from "groq-sdk";
import React from "react";
import ReactMarkdown from "react-markdown";
import { useDebouncedCallback } from "use-debounce";

interface DoubleString {
  txt: string;
  txt2: string;
}

export default function ScreenShareTranscript() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [incorrectTexts, setIncorrectTexts] = useState<Array<DoubleString>>([]);
  const [stringBuffer, setBuffer] = useState<string>("");
  const [sentenceBuffer, setSentenceBuffer] = useState<string[]>([]);
  const seenSentences = new Set();
  // let groq: Groq;
  const groqRef = useRef<Groq | null>(null);
  const astream = new MediaStream();
  const arecorder = new MediaRecorder(astream);

  /////////////////////////////////////////////////////////////////////////////////////
  const verifyBufferedSentences = useDebouncedCallback((buffer: string[]) => {
    const paragraphSize = 4; // You can tweak this
    const chunks: string[][] = [];
  
    // Create chunks of sentences for context-rich verification
    for (let i = 0; i < buffer.length; i += paragraphSize) {
      chunks.push(buffer.slice(i, i + paragraphSize));
    }
  
    chunks.forEach((chunk) => {
      const paragraph = chunk.join(" ").trim();
  
      if (paragraph.length < 20 || !/[a-zA-Z]{3,}/.test(paragraph)) return;
  
      verifyClaim(paragraph).then((isVerified) => {
        if (!isVerified) {
          // Flag each sentence in the failed paragraph
          chunk.forEach((sentence) => {
            setIncorrectTexts((prev) => [
              ...prev,
              {
                txt: sentence,
                txt2: "This claim was found to be false.",
              },
            ]);
          });
        }
      });
    });
  }, 1500);

  /////////////////////////////////////////////////////////////////////////////////////
  async function verifyClaim(claim: string) {
    const groq = groqRef.current;
    if (!groq) {
      console.error("Groq client not initialized");
      return false;
    }
    const delimiter = "|||";

    const prompt = `
      Verify if this claim is supported by the source text.

      Claim: ${claim}

      Instructions:
      1. Analyze if the claim is true.
      2. If the claim is supported or incomplete or you're unsure, return "true".
      3. If you think the claim is incomplete, return "true". Only return false if you are certain.
      4. If the claim is strongly contradicted, return "false" else return "true" in most of the cases.
      5. Should be a single word answer(true/false).
    `;

    const messages: Array<{
      role: "system" | "user";
      content: string;
      name?: string;
    }> = [
      {
        role: "system",
        content:
          "You are a precise fact verification system. You only give single word verdicy(true/false)",
      },
      { role: "user", content: prompt },
    ];

    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", // or other models as needed
        messages: messages,
        temperature: 0.6,
        top_p: 0.95,
      });

      const responseText = response.choices[0].message?.content?.trim() || "";
      console.log("Response text--->", responseText, claim );
      return responseText === "true"; // Only return true/false
    } catch (error) {
      console.error("Error verifying claim:", error);
      return false; // If an error occurs, return false by default
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      groqRef.current = new Groq({
        apiKey: "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",
        dangerouslyAllowBrowser: true,
      });

      for (const track of stream.getAudioTracks()) {
        astream.addTrack(track);
      }

      arecorder.ondataavailable = (e) => {
        if (groqRef.current) {
          transcribe(e.data, groqRef.current);
        } else {
          console.error("Groq client is not initialized");
        }
      };

      setInterval(() => {
        if (!stream || stream.active === false) {
          stopCapture();
          return;
        }
        if (arecorder.state == "recording") {
          arecorder.stop();
          arecorder.start();
        }
      }, 3000);
    }
  }, [stream]);

  function stopCapture() {
    if (videoRef?.current?.srcObject) {
      let tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track: MediaStreamTrack) => track.stop());
      videoRef.current.srcObject = null;
    }
  
    // Reset buffers only (keep transcript + incorrect texts)
    setBuffer("");
    setSentenceBuffer([]);
  }

  const handleShareButton = () => {
    stopCapture();
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((cs) => setStream(cs))
      .catch((err: any) => console.error(err));
  };

  async function transcribe(blob: Blob, groq: Groq) {
    const response = await groq.audio.translations.create({
      file: await toFile(blob, "audio.webm"),
      model: "whisper-large-v3",
      prompt: "",
      response_format: "json",
      temperature: 0,
    });
  
    const newTranscriptText = response.text;
    const combined = stringBuffer + newTranscriptText;
  
    // 1. Extract full sentences and keep leftover
    const { sentences, remainder } = extractSentences(combined);
    setBuffer(remainder);
    setTranscript((prevText) => prevText + newTranscriptText);
  
    // 2. Add new sentences to the buffer
    setSentenceBuffer((prevBuffer) => {
      const updatedBuffer = [...prevBuffer, ...sentences];
      verifyBufferedSentences(updatedBuffer); // debounced processing
      return []; // clear buffer
    });
    
  
    return response;
  }

  // function extractSentences(text: string): { sentences: string[], remainder: string } {
  //   const sentenceEndRegex = /([.!?])\s+/g;
  //   let sentences: string[] = [];
  //   let lastIndex = 0;
  //   let match;
  
  //   while ((match = sentenceEndRegex.exec(text)) !== null) {
  //     const endIndex = match.index + match[0].length;
  //     const sentence = text.slice(lastIndex, endIndex).trim();
  //     if (sentence) sentences.push(sentence);
  //     lastIndex = endIndex;
  //   }
  
  //   const remainder = text.slice(lastIndex).trim(); // leftover text
  //   return { sentences, remainder };
  // }

  // BETTER VERSION BELOW
  function extractSentences(text: string): { sentences: string[], remainder: string } {
    if (typeof Intl === "undefined" || typeof Intl.Segmenter === "undefined") {
      // fallback to basic regex if Intl.Segmenter isn't available
      const sentenceEndRegex = /([.!?])\s+/g;
      let sentences: string[] = [];
      let lastIndex = 0;
      let match;
  
      while ((match = sentenceEndRegex.exec(text)) !== null) {
        const endIndex = match.index + match[0].length;
        const sentence = text.slice(lastIndex, endIndex).trim();
        if (sentence) sentences.push(sentence);
        lastIndex = endIndex;
      }
  
      const remainder = text.slice(lastIndex).trim(); // leftover text
      return { sentences, remainder };
    }
  
    // Better sentence segmentation using Intl.Segmenter
    const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
    const segments = Array.from(segmenter.segment(text));
  
    const sentences: string[] = [];
    let remainder = "";
  
    for (let i = 0; i < segments.length; i++) {
      const { segment, isWordLike } = segments[i];
  
      if (segment.trim().length === 0) continue;
  
      if (/[.?!]["']?$/.test(segment.trim())) {
        sentences.push(segment.trim());
      } else {
        remainder += segment;
      }
    }
  
    return {
      sentences,
      remainder: remainder.trim(),
    };
  }

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // const scrollToBottom = () => {
  //   if (!containerRef.current) return;

  //   const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
  //   const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

  //   if (isNearBottom) {
  //     endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  //   }
  // };

  // useEffect(() => {
  //   scrollToBottom();
  // }, [transcript]);

  return (
    <div className="min-h-screen bg-background p-6 font-sans flex gap-6">
  {/* Left Panel */}
  <div className="w-1/2 space-y-6">
    {/* Share Button */}
    <div>
      <button
        onClick={handleShareButton}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow hover:bg-primary/90 transition"
        type="submit"
      >
        <span>{stream ? "Change" : "Share"} Tab</span>
      </button>
    </div>

    {/* Video Card */}
    <div className="rounded-xl overflow-hidden border border-dashed border-border shadow-lg bg-card">
      <video
      ref={videoRef}
      autoPlay
      muted
      className="w-full h-80 object-cover"
      onPlay={() => {
        if (arecorder.state === "paused") {
        arecorder.resume();
        } else {
        arecorder.start();
        }
      }}
      onPause={() => arecorder.pause()}
      onEnded={() => arecorder.stop()}
      />
    </div>

    {/* Error Checking */}
    <div className="rounded-xl bg-destructive/10 border border-destructive p-4 space-y-3 text-destructive-foreground">
      <h2 className="text-lg font-semibold">Incorrect Claims Detected</h2>
      {incorrectTexts.length === 0 ? (
        <p className="text-muted-foreground">No false claims detected yet.</p>
      ) : (
        incorrectTexts.map((text, index) => (
          <div
            key={index}
            className="border-l-4 border-destructive pl-3 py-1"
          >
            <p className="font-medium">{text.txt}</p>
            <p className="text-sm text-muted-foreground">{text.txt2}</p>
          </div>
        ))
      )}
    </div>
  </div>

  {/* Right Panel - Transcript */}
  <div className="w-1/2 rounded-xl border border-border bg-card p-6 shadow-lg overflow-y-auto max-h-[calc(100vh-3rem)]" ref={containerRef}>
    <h2 className="text-lg font-semibold mb-4 text-foreground">Transcript</h2>
    <div className="space-y-2 text-foreground">
      <ReactMarkdown>{transcript}</ReactMarkdown>
      <div ref={endOfMessagesRef} />
    </div>
  </div>
</div>

  );
}

// "use client";

// import { useEffect, useRef, useState } from "react";
// import Groq, { toFile } from "groq-sdk";
// import React from "react";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Mic, MicOff, CheckCircle, XCircle, Clock } from "lucide-react";
// import { motion } from "framer-motion";

// interface DoubleString {
//   txt: string;
//   txt2: string;
// }

// export default function ScreenShareTranscript() {
//   const videoRef = useRef<HTMLVideoElement | null>(null);
//   const [stream, setStream] = useState<MediaStream | null>(null);
//   const [transcript, setTranscript] = useState<string>("");
//   const [incorrectTexts, setIncorrectTexts] = useState<Array<DoubleString>>([]);
//   const [isSharing, setIsSharing] = useState(false);
//   const [isTranscribing, setIsTranscribing] = useState(false);
//   const groqRef = useRef<Groq>();
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);

//   // Initialize Groq SDK instance
//   useEffect(() => {
//     groqRef.current = new Groq({
//       apiKey: "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",
//       dangerouslyAllowBrowser: true,
//     });
//   }, []);

//   // Set up video stream and media recorder when the stream is available
//   useEffect(() => {
//     if (videoRef.current && stream) {
//       videoRef.current.srcObject = stream;
//       videoRef.current.muted = true;
//       videoRef.current.play();

//       // Create an audio-only stream from the screen sharing stream
//       const audioStream = new MediaStream(stream.getAudioTracks());
//       const mimeType = MediaRecorder.isTypeSupported("audio/webm; codecs=opus")
//         ? "audio/webm; codecs=opus"
//         : "audio/webm";
//       const recorder = new MediaRecorder(audioStream, { mimeType });
//       mediaRecorderRef.current = recorder;

//       // When audio data is available, transcribe it and verify its correctness
//       recorder.ondataavailable = async (event) => {
//         if (event.data && event.data.size > 1000) {
//           await transcribe(event.data);
//         }
//       };

//       recorder.start(3000);
//       setIsSharing(true);
//       setIsTranscribing(true);

//       // Restart recording slices every 3000ms to capture continuous audio
//       intervalRef.current = setInterval(() => {
//         if (!stream.active) {
//           stopSharing();
//           return;
//         }
//         if (recorder.state === "recording") {
//           recorder.stop();
//           recorder.start();
//         }
//       }, 3000);
//     }
//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//     };
//   }, [stream]);

//   // Verify the transcribed claim using the Groq chat API
//   async function verifyClaim(claim: string): Promise<boolean> {
//     const prompt = `
//       Verify if this claim is supported by the source text.

//       Claim: ${claim}

//       Instructions:
//       1. Analyze if the claim is true.
//       2. Return "true" if supported or if unsure.
//       3. Only return "false" if the claim is strongly contradicted.
//       Answer with a single word: true or false.
//     `;
//     try {
//       const response = await groqRef.current!.chat.completions.create({
//         model: "llama-3.3-70b-versatile",
//         messages: [
//           {
//             role: "system",
//             content:
//               "You are a precise fact verification system. You only give a single word verdict (true/false).",
//           },
//           { role: "user", content: prompt },
//         ],
//         temperature: 0.6,
//         top_p: 0.95,
//       });
//       const responseText = response.choices[0].message?.content?.trim() || "";
//       return responseText === "true";
//     } catch (error) {
//       console.error("Error verifying claim:", error);
//       return false;
//     }
//   }

//   // Transcribe the audio blob and update the transcript, flagging any incorrect texts
//   async function transcribe(blob: Blob) {
//     try {
//       const response = await groqRef.current!.audio.translations.create({
//         file: await toFile(blob, "audio.webm"),
//         model: "whisper-large-v3",
//         prompt: "",
//         response_format: "json",
//         temperature: 0,
//       });
//       const newTranscriptText = response.text;
//       setTranscript((prev) => prev + newTranscriptText);

//       // Verify the newly transcribed text
//       const isVerified = await verifyClaim(newTranscriptText);
//       if (!isVerified) {
//         setIncorrectTexts((prev) => [
//           ...prev,
//           {
//             txt: newTranscriptText,
//             txt2: "This claim was found to be false.",
//           },
//         ]);
//       }
//     } catch (error) {
//       console.error("Transcription error:", error);
//     }
//   }

//   // Stop the stream and clear intervals
//   function stopSharing() {
//     if (stream) {
//       stream.getTracks().forEach((track) => track.stop());
//       setStream(null);
//     }
//     setIsSharing(false);
//     setIsTranscribing(false);
//     if (
//       mediaRecorderRef.current &&
//       mediaRecorderRef.current.state !== "inactive"
//     ) {
//       mediaRecorderRef.current.stop();
//       mediaRecorderRef.current = null;
//     }
//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//       intervalRef.current = null;
//     }
//   }

//   // Trigger screen sharing
//   const handleShareButton = async () => {
//     try {
//       const mediaStream = await navigator.mediaDevices.getDisplayMedia({
//         video: true,
//         audio: true,
//       });
//       setStream(mediaStream);
//     } catch (error) {
//       console.error("Error starting screen sharing:", error);
//     }
//   };

//   return (
//     <div className="flex flex-col h-full gap-4">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
//         {/* Left Card: Screen Sharing and Error Checking */}
//         <Card className="p-4 flex flex-col">
//           <h3 className="text-lg font-medium mb-4">Tab Sharing</h3>
//           <div className="flex-grow flex flex-col items-center justify-center bg-secondary/30 rounded-lg p-4">
//             {isSharing ? (
//               <div className="w-full h-full flex flex-col">
//                 <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
//                   <video
//                     ref={videoRef}
//                     className="w-full h-full object-contain"
//                     autoPlay
//                     playsInline
//                   />
//                   <div className="absolute top-4 left-4 text-white text-sm">
//                     Live Broadcast
//                   </div>
//                 </div>
//                 <Button
//                   variant="destructive"
//                   className="mt-4 self-center"
//                   onClick={stopSharing}
//                 >
//                   <MicOff className="mr-2 h-4 w-4" /> Stop Sharing
//                 </Button>
//               </div>
//             ) : (
//               <div className="text-center">
//                 <Mic className="h-16 w-16 text-gray-400 mx-auto mb-4" />
//                 <p className="text-sm text-gray-500 mb-4">
//                   Share any browser tab for live transcription and
//                   fact-checking.
//                 </p>
//                 <Button onClick={handleShareButton}>
//                   <Mic className="mr-2 h-4 w-4" /> Share Tab
//                 </Button>
//               </div>
//             )}
//           </div>
//           <div className="mt-4">
//             <h3 className="text-lg font-medium mb-2">Error Checking</h3>
//             {incorrectTexts.length > 0 ? (
//               <div className="space-y-3">
//                 {incorrectTexts.map((item, index) => (
//                   <motion.div
//                     key={index}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     className="p-3 bg-secondary/30 rounded-lg"
//                   >
//                     <p className="text-sm font-medium">{item.txt}</p>
//                     <div className="flex items-center text-xs text-gray-500 mt-1">
//                       <XCircle className="h-4 w-4 text-red-500 mr-1" />
//                       {item.txt2}
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-sm text-gray-500 text-center">
//                 No errors detected.
//               </div>
//             )}
//           </div>
//         </Card>

//         {/* Right Card: Transcript */}
//         <Card className="p-4 flex flex-col">
//           <h3 className="text-lg font-medium mb-4">Transcript</h3>
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
//     </div>
//   );
// }
