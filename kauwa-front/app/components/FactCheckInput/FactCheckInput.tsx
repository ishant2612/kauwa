"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface FactCheckInputProps {
  onFactCheck: (query: string) => void;
}

export default function FactCheckInput({ onFactCheck }: FactCheckInputProps) {
  const [query, setQuery] = useState("");

  const handleFactCheck = () => {
    if (query.trim()) {
      onFactCheck(query);
      setQuery("");
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>Fact Check Input</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <Tabs defaultValue="text" className="w-full flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
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
          <TabsContent value="audio" className="flex-grow">
            <div className="h-full flex items-center justify-center border rounded-md">
              Audio upload coming soon
            </div>
          </TabsContent>
          <TabsContent value="image" className="flex-grow">
            <div className="h-full flex items-center justify-center border rounded-md">
              Image upload coming soon
            </div>
          </TabsContent>
        </Tabs>
        <Button className="w-full mt-auto" onClick={handleFactCheck}>
          Fact Check
        </Button>
      </CardContent>
    </Card>
  );
}
