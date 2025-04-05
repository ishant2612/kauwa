"use client";

import { useEffect, useRef, useState } from "react";
import Groq, { toFile } from "groq-sdk";
import React from "react";
import ReactMarkdown from "react-markdown";

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
  let groq: Groq;
  const astream = new MediaStream();
  const arecorder = new MediaRecorder(astream);

  /////////////////////////////////////////////////////////////////////////////////////
  async function verifyClaim(claim: string) {
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
  
    const messages: Array<{ role: "system" | "user"; content: string; name?: string }> = [
      { role: "system", content: "You are a precise fact verification system. You only give single word verdicy(true/false)" },
      { role: "user", content: prompt }
    ];
  
    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", // or other models as needed
        messages: messages,
        temperature: 0.6,
        top_p: 0.95
      });
  
      const responseText = response.choices[0].message?.content?.trim() || "";
      console.log("Response text--->",responseText)
      return responseText === "true";  // Only return true/false
    } catch (error) {
      console.error("Error verifying claim:", error);
      return false;  // If an error occurs, return false by default
    }
  }
  
  /////////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      groq = new Groq({
        apiKey: "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",
        dangerouslyAllowBrowser: true,
      });

      
      for (const track of stream.getAudioTracks()) {
        astream.addTrack(track);
      }

      
      arecorder.ondataavailable = (e) => {
        transcribe(e.data, groq);
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
  }

  const handleShareButton = () => {
    stopCapture();
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((cs) => setStream(cs))
      .catch((err: any) => console.error(err));
  };

  async function transcribe(blob: Blob, groq: Groq) {
    const startTime = performance.now();
    const response = await groq.audio.translations.create({
      file: await toFile(blob, "audio.webm"),
      model: "whisper-large-v3",
      prompt: "",
      response_format: "json",
      temperature: 0,
    });
    const newTranscriptText = response.text;
  
    // Update the transcript state with the transcribed text
    setTranscript((prevText) => {
      return prevText + newTranscriptText;
    });

    // Verify the claim (transcription)
    const isVerified = await verifyClaim(transcript);

    if (!isVerified) {
      // Flag the text as incorrect and color it red
      setIncorrectTexts((prev) => [
        ...prev,
        { txt: newTranscriptText, txt2: "This claim was found to be "+isVerified+"." },
      ]);
    }
  
    return response;
  }
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [transcript]);

  return (
    <div className="fullWrapper">
      <div className="leftSide">
        <div>
          <button
            onClick={handleShareButton}
            className="shareButton"
            type="submit"
          >
            <span>{stream ? "Change" : "Share"} Tab</span>
          </button>
        </div>
        <div className="videoBox">
          <video
            ref={videoRef}
            autoPlay
            className="w-full h-full rounded-xl"
            onPlay={() => {
              if (arecorder.state === "paused") {
                arecorder.resume();
              } else {
                arecorder.start();
              }
            }}
            onPause={() => {
              arecorder.pause();
            }}
            onEnded={() => {
              arecorder.stop();
            }}
          />
        </div>
        <div className="ErrorTexts">
          <div className="text-lg font-medium">Error Checking</div>
          <div>
            {incorrectTexts.map((text, index) => (
              <div key={index}>
                <div>Erroneous Statement: {text.txt}</div>
                <p>{text.txt2}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rightSide">
        <div className="TranscriptBox">
          <div className="text-lg font-medium">Transcript</div>
          <div>
            <p>{transcript}</p>
            <div ref={endOfMessagesRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
