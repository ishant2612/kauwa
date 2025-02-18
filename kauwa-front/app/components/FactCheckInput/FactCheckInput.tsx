"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Video, ImageIcon } from "lucide-react";

interface FactCheckInputProps {
  onFactCheck: (
    query: string,
    type: "text" | "video" | "image",
    file?: File
  ) => void;
}

export default function FactCheckInput({ onFactCheck }: FactCheckInputProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"text" | "video" | "image">(
    "text"
  );
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFactCheck = () => {
    if (activeTab === "text" && query.trim()) {
      onFactCheck(query, "text");
      setQuery("");
    } else if ((activeTab === "video" || activeTab === "image") && file) {
      onFactCheck(file.name, activeTab, file);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
          onValueChange={(value) =>
            setActiveTab(value as "text" | "video" | "image")
          }
        >
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
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
            <FileUploadArea
              file={file}
              onFileChange={handleFileChange}
              onFileRemove={() => setFile(null)}
              accept=".mp4,.webm,.ogg"
              icon={<Video className="h-12 w-12 text-gray-400" />}
              text="Upload video for deepfake detection"
              fileType="Video"
            />
          </TabsContent>
          <TabsContent value="image" className="flex-grow flex flex-col">
            <FileUploadArea
              file={file}
              onFileChange={handleFileChange}
              onFileRemove={() => setFile(null)}
              accept=".jpg,.jpeg,.png,.gif"
              icon={<ImageIcon className="h-12 w-12 text-gray-400" />}
              text="Upload image for content verification and deepfake detection"
              fileType="Image"
            />
          </TabsContent>
        </Tabs>
        <Button className="w-full mt-auto" onClick={handleFactCheck}>
          {activeTab === "text" ? "Fact Check" : `Analyze ${activeTab}`}
        </Button>
      </CardContent>
    </Card>
  );
}

interface FileUploadAreaProps {
  file: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
  accept: string;
  icon: React.ReactNode;
  text: string;
  fileType: string;
}

function FileUploadArea({
  file,
  onFileChange,
  onFileRemove,
  accept,
  icon,
  text,
  fileType,
}: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
      {file ? (
        <div className="text-center">
          {icon}
          <p className="mt-2 text-sm text-gray-500">{file.name}</p>
          <Button variant="outline" onClick={onFileRemove} className="mt-2">
            Remove
          </Button>
        </div>
      ) : (
        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
          {icon}
          <p className="mt-2 text-sm text-gray-500">{text}</p>
          <p className="text-xs text-gray-500">
            Click to upload or drag and drop
          </p>
          <Input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={onFileChange}
            accept={accept}
          />
        </label>
      )}
    </div>
  );
}
