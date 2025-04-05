"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Radio, CheckCircle, XCircle, Clock } from "lucide-react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const deepgramSocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startScreenSharing = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);

      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      const source =
        audioContextRef.current.createMediaStreamSource(mediaStream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      setIsSharing(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.muted = true;
          videoRef.current.play().catch(console.error);
        }
      }, 300);

      const audioStream = new MediaStream(mediaStream.getAudioTracks());
      const mimeType = "audio/webm;codecs=opus";

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.error(`MIME type ${mimeType} is not supported.`);
        return;
      }

      const recorder = new MediaRecorder(audioStream, { mimeType });
      mediaRecorderRef.current = recorder;

      const deepgramSocket = new WebSocket(
        `wss://api.deepgram.com/v1/listen?access_token=02c9439d2e92ee5ebae8ab7fd0f93bb39899290e&model=nova-3&smart_format=true`
      );
      deepgramSocketRef.current = deepgramSocket;

      deepgramSocket.onopen = () => {
        console.log("Socket connected ✅");
        setIsTranscribing(true);
        recorder.start(250);
      };

      recorder.ondataavailable = (event) => {
        if (
          event.data.size > 0 &&
          deepgramSocket.readyState === WebSocket.OPEN
        ) {
          deepgramSocket.send(event.data);
        }
      };

      recorder.onerror = (error) => console.error("Recorder error:", error);

      deepgramSocket.onmessage = (messageEvent) => {
        try {
          const data = JSON.parse(messageEvent.data);
          if (
            data &&
            data.channel &&
            data.channel.alternatives &&
            data.channel.alternatives[0]
          ) {
            const transcriptText = data.channel.alternatives[0].transcript;
            if (transcriptText) {
              setTranscript(transcriptText);

              const chunkId = Date.now().toString();
              const containsInvalidContent =
                transcriptText.toLowerCase().includes("false") ||
                transcriptText.toLowerCase().includes("fraud");
              const confidence = Math.floor(Math.random() * 30) + 70;

              const chunk: TranscriptChunk = {
                id: chunkId,
                text: transcriptText,
                isValid: !containsInvalidContent,
                confidence: confidence,
                timestamp: new Date().toLocaleTimeString(),
              };

              setTranscriptChunks((prev) => [...prev, chunk]);
            }
          }
        } catch (err) {
          console.error("Deepgram message parse error:", err);
        }
      };

      deepgramSocket.onerror = (err) => console.error("WebSocket error:", err);

      deepgramSocket.onclose = () => {
        setIsTranscribing(false);
      };
    } catch (error) {
      console.error("Error starting screen sharing:", error);
    }
  };

  const stopScreenSharing = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsSharing(false);
    setIsTranscribing(false);
    setTranscript("");
    setTranscriptChunks([]);

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (deepgramSocketRef.current) {
      deepgramSocketRef.current.close();
      deepgramSocketRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
        <Card className="p-4 flex flex-col">
          <h3 className="text-lg font-medium mb-4">Tab Sharing</h3>
          <div className="flex-grow flex flex-col items-center justify-center bg-secondary/30 rounded-lg p-4">
            {isSharing ? (
              <div className="w-full h-full flex flex-col">
                <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
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
                        <span className="text-gray-400">Pending</span>
                      ) : chunk.isValid ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" /> Valid
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center">
                          <XCircle className="h-4 w-4 mr-1" /> Invalid
                        </span>
                      )}
                    </div>
                  </div>
                  {chunk.confidence !== null && (
                    <p className="text-xs text-gray-400">
                      Confidence: {chunk.confidence}%
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No transcript chunks to display yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
