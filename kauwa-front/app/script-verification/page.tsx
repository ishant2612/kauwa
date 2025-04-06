"use client";

import type React from "react";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "../components/Spinner/Spinner";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Upload,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Claim {
  id: string;
  text: string;
  isValid: boolean;
  confidence: number;
  reason: string;
  manualVerificationClaims?: Record<string, string>;
}

export default function ScriptVerificationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Function to trigger the hidden file input
  const triggerFileInput = () => {
    console.log("triggerFileInput called");
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const handleVerify = async () => {
    if (!file) return;

    setIsProcessing(true);
    setClaims([]);

    const formData = new FormData();
    formData.append("files", file);

    try {
      const response = await fetch("http://localhost:5000/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process file");
      }

      const data = await response.json();
      console.log("Response data:", data.claims_verification);
      console.log("Response data:", data.manual_verification_required);
      const verifiedClaims = data.claims_verification.map(
        (item: any, index: number) => ({
          id: String(index + 1),
          text: item.claim,
          isValid: item.verification.is_verified === "TRUE",
          confidence: item.verification.confidence,
          reason: item.verification.reasoning,
          manualVerificationClaims: data.manual_verification_required,
        })
      );

      // Optional: you can show the manually rejected claims too
      setClaims(verifiedClaims);
    } catch (error) {
      console.error("Error during verification:", error);
      alert("Something went wrong while verifying the script.");
    } finally {
      setIsProcessing(false);
    }
  };
  //   const handleVerify = () => {
  //     if (!file) return;

  //     setIsProcessing(true);
  //     setClaims([]);

  //     // Simulate API call to verify script
  //     setTimeout(() => {
  //       // Generate mock claims
  //       const mockClaims: Claim[] = [
  //         {
  //           id: "1",
  //           text: "The new climate bill will reduce carbon emissions by 50% by 2030.",
  //           isValid: false,
  //           confidence: 85,
  //           reason:
  //             "The bill targets a 30% reduction by 2030, not 50%. This is a significant overstatement of the bill's projected impact.",
  //         },
  //         {
  //           id: "2",
  //           text: "The unemployment rate has dropped to its lowest level in 50 years.",
  //           isValid: true,
  //           confidence: 92,
  //           reason:
  //             "Verified against Bureau of Labor Statistics data. The unemployment rate did reach a 50-year low before the pandemic.",
  //         },
  //         {
  //           id: "3",
  //           text: "The new healthcare plan will cover all pre-existing conditions.",
  //           isValid: true,
  //           confidence: 88,
  //           reason:
  //             "The plan explicitly includes provisions for covering all pre-existing conditions as stated in Section 4.2 of the proposal.",
  //         },
  //         {
  //           id: "4",
  //           text: "The government is planning to increase taxes by 20% across all income brackets.",
  //           isValid: false,
  //           confidence: 95,
  //           reason:
  //             "The proposed tax plan only increases rates for incomes above $400,000 and the increase is 2-4%, not 20%.",
  //         },
  //         {
  //           id: "5",
  //           text: "The new infrastructure bill allocates $100 billion for renewable energy projects.",
  //           isValid: false,
  //           confidence: 78,
  //           reason:
  //             "The bill allocates $65 billion for clean energy transmission and grid infrastructure, not $100 billion.",
  //         },
  //         {
  //           id: "6",
  //           text: "The education budget has increased by 15% compared to last year.",
  //           isValid: true,
  //           confidence: 90,
  //           reason:
  //             "Budget documents confirm a 15.3% increase in education funding compared to the previous fiscal year.",
  //         },
  //       ];

  //       setClaims(mockClaims);
  //       setIsProcessing(false);
  //     }, 3000);
  //   };

  const resetForm = () => {
    setFile(null);
    setClaims([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Filter claims that need manual verification (isValid === false)
  console.log("Claims:", claims);
  const manualVerificationClaims =
    claims.length > 0 && claims[0].manualVerificationClaims
      ? Object.entries(claims[0].manualVerificationClaims).map(
          ([text, reason], index) => ({
            id: `manual-${index + 1}`,
            text,
            isValid: false,
            confidence: 0,
            reason,
          })
        )
      : [];
  const validClaims = claims.filter((claim) => claim.isValid);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-24 pb-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8 text-center"
        >
          Script Verification
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Script</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {file ? (
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-4">{file.name}</p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={resetForm}>
                          Remove
                        </Button>
                        <Button onClick={handleVerify} disabled={isProcessing}>
                          {isProcessing ? (
                            <>
                              <Spinner className="mr-2 h-4 w-4" />
                              Verifying...
                            </>
                          ) : (
                            "Verify Script"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <Upload className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-500 mb-1">
                        Upload script document for verification
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Supported formats: .txt, .doc, .docx
                      </p>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={triggerFileInput}
                      >
                        Select File
                      </Button>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".txt,.doc,.docx"
                      />
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>
                    Upload your script document to verify claims and statements
                    for accuracy.
                  </p>
                  <p>
                    The system will analyze each claim and provide verification
                    results.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions Section */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Upload Your Script</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload your script document in .txt, .doc, or .docx
                      format.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Automated Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Our AI system identifies claims and verifies them against
                      trusted sources.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Review Results</h3>
                    <p className="text-sm text-muted-foreground">
                      Review verification results and address any claims that
                      require manual verification.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {claims.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Verification Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      {/* <TabsTrigger value="all">
                        All Claims ({claims.length})
                      </TabsTrigger> */}
                      <TabsTrigger value="valid">
                        Valid Claims ({validClaims.length})
                      </TabsTrigger>
                      <TabsTrigger value="manual">
                        Manual Verification Required (
                        {manualVerificationClaims.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4">
                      {claims.map((claim) => (
                        <ClaimCard key={claim.id} claim={claim} />
                      ))}
                    </TabsContent>

                    <TabsContent value="valid" className="space-y-4">
                      {validClaims.length > 0 ? (
                        validClaims.map((claim) => (
                          <ClaimCard key={claim.id} claim={claim} />
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No valid claims found.
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="manual" className="space-y-4">
                      {manualVerificationClaims.length > 0 ? (
                        manualVerificationClaims.map((claim) => (
                          <ClaimCard key={claim.id} claim={claim} />
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No claims requiring manual verification.
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

interface ClaimCardProps {
  claim: Claim;
}

function ClaimCard({ claim }: ClaimCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-secondary/30 rounded-lg"
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium flex-grow">{claim.text}</p>
        <div className="ml-4 flex-shrink-0">
          {claim.isValid ? (
            <span className="flex items-center text-green-500 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" /> Valid ({claim.confidence}
              %)
            </span>
          ) : (
            <span className="flex items-center text-red-500 text-sm">
              <XCircle className="h-4 w-4 mr-1" /> Invalid ({claim.confidence}%)
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
        <span className="font-medium">Reason: </span>
        {claim.reason}
      </div>
    </motion.div>
  );
}
