"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Upload, Video } from "lucide-react";

interface FactCheckInputProps {
  onFactCheck: (query: string, type: "text" | "video", file?: File) => void;
}

export default function FactCheckInput({ onFactCheck }: FactCheckInputProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"text" | "video">("text");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFactCheck = () => {
    if (activeTab === "text" && query.trim()) {
      onFactCheck(query, "text");
      setQuery("");
    } else if (activeTab === "video" && videoFile) {
      onFactCheck(videoFile.name, "video", videoFile);
      setVideoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>Fact Check Input</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <Tabs
          defaultValue="text"
          className="w-full flex-grow flex flex-col"
          onValueChange={(value) => setActiveTab(value as "text" | "video")}
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="flex-grow flex flex-col">
            <Textarea
              placeholder="Enter text to fact-check"
              className="flex-grow min-h-[150px] mb-4"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </TabsContent>
          <TabsContent value="video" className="flex-grow flex flex-col">
            <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
              {videoFile ? (
                <div className="text-center">
                  <Video className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">{videoFile.name}</p>
                  <Button
                    variant="outline"
                    onClick={() => setVideoFile(null)}
                    className="mt-2"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    MP4, WebM or OGG (MAX. 100MB)
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".mp4,.webm,.ogg"
                  />
                </label>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <Button className="w-full mt-auto" onClick={handleFactCheck}>
          {activeTab === "text" ? "Fact Check" : "Detect Deepfake"}
        </Button>
      </CardContent>
    </Card>
  );
}
