// // "use client";

// // import Link from "next/link";
// // import { motion } from "framer-motion";
// // import { Button } from "@/components/ui/button";
// // import Navbar from "./components/Navbar/Navbar";
// // import Features from "./components/Features/Features";
// // import { useEffect, useRef } from "react";
// // import { ChevronDown } from "lucide-react";

// // export default function LandingPage() {
// //   const videoRef = useRef<HTMLVideoElement>(null);
// //   const featuresRef = useRef<HTMLDivElement>(null);

// //   // Autoplay video when component mounts
// //   useEffect(() => {
// //     const video = videoRef.current;
// //     if (video) {
// //       setTimeout(() => {
// //         video.play().catch((err) => {
// //           console.error("Error playing video:", err);
// //         });
// //       }, 500);
// //     }
// //   }, []);

// //   const scrollToFeatures = () => {
// //     featuresRef.current?.scrollIntoView({ behavior: "smooth" });
// //   };

// //   return (
// //     <div className="min-h-screen bg-background flex flex-col">
// //       <Navbar />

// //       {/* Hero Section with Video Background */}
// //       <section className="relative flex flex-col justify-center items-center min-h-screen overflow-hidden">
// //         {/* Video Background */}
// //         <div className="absolute inset-0 z-0 overflow-hidden">
// //           <video
// //             ref={videoRef}
// //             autoPlay
// //             muted
// //             loop
// //             playsInline
// //             className="w-full h-full object-cover"
// //           >
// //             <source src="frontend.mp4" type="video/mp4" />
// //             {/* Fallback for browsers that don't support video */}
// //             Your browser does not support the video tag.
// //           </video>
// //           {/* Overlay to match the current background color */}
// //           <div className="absolute inset-0 bg-background/90 "></div>
// //         </div>

// //         {/* Hero Content */}
// //         <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
// //           <motion.h1
// //             initial={{ opacity: 0, y: -20 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             transition={{ duration: 0.5, delay: 0.2 }}
// //             className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600"
// //           >
// //             Kauwa Fact-Checker
// //           </motion.h1>
// //           <motion.p
// //             initial={{ opacity: 0, y: -20 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             transition={{ duration: 0.5, delay: 0.4 }}
// //             className="text-base md:text-lg mb-10 text-muted-foreground leading-relaxed"
// //           >
// //             Uncover the truth with our advanced AI-powered fact-checking tool.
// //             Verify claims, analyze sources, and make informed decisions in
// //             real-time.
// //           </motion.p>
// //           <motion.div
// //             initial={{ opacity: 0, y: 20 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             transition={{ duration: 0.5, delay: 0.6 }}
// //             className="flex flex-col sm:flex-row items-center justify-center gap-4"
// //           >
// //             <Link href="/dashboard">
// //               <Button
// //                 size="default"
// //                 className="text-base px-6 py-2 rounded-full"
// //               >
// //                 Get Started
// //               </Button>
// //             </Link>
// //             <Button
// //               variant="outline"
// //               size="default"
// //               className="text-base px-6 py-2 rounded-full"
// //               onClick={scrollToFeatures}
// //             >
// //               Learn More
// //             </Button>
// //           </motion.div>
// //         </div>

// //         {/* Centered Scroll indicator */}
// //         <motion.div
// //           className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
// //           initial={{ opacity: 0 }}
// //           animate={{ opacity: 1 }}
// //           transition={{ delay: 1, duration: 0.5 }}
// //           onClick={scrollToFeatures}
// //         >
// //           <div className="flex flex-col items-center cursor-pointer">
// //             <span className="text-xs text-muted-foreground mb-1">
// //               Scroll to explore
// //             </span>
// //             <motion.div
// //               animate={{ y: [0, 10, 0] }}
// //               transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
// //             >
// //               <ChevronDown className="h-5 w-5 text-primary" />
// //             </motion.div>
// //           </div>
// //         </motion.div>
// //       </section>

// //       {/* Features Section */}
// //       <div ref={featuresRef}>
// //         <Features />
// //       </div>

// //       {/* Call to Action Section */}
// //       {/* <section className="py-16 bg-gradient-to-b from-background to-secondary/20">
// //         <div className="container mx-auto px-4 text-center">
// //           <motion.h2
// //             initial={{ opacity: 0, y: 20 }}
// //             whileInView={{ opacity: 1, y: 0 }}
// //             transition={{ duration: 0.5 }}
// //             viewport={{ once: true }}
// //             className="text-2xl md:text-3xl font-bold mb-4"
// //           >
// //             Ready to Discover the Truth?
// //           </motion.h2>
// //           <motion.p
// //             initial={{ opacity: 0, y: 20 }}
// //             whileInView={{ opacity: 1, y: 0 }}
// //             transition={{ duration: 0.5, delay: 0.2 }}
// //             viewport={{ once: true }}
// //             className="text-base text-muted-foreground mb-8 max-w-2xl mx-auto"
// //           >
// //             Join thousands of users who rely on our platform for accurate
// //             information verification.
// //           </motion.p>
// //           <motion.div
// //             initial={{ opacity: 0, y: 20 }}
// //             whileInView={{ opacity: 1, y: 0 }}
// //             transition={{ duration: 0.5, delay: 0.4 }}
// //             viewport={{ once: true }}
// //           >
// //             <Link href="/dashboard">
// //               <Button
// //                 size="default"
// //                 className="text-base px-6 py-2 rounded-full"
// //               >
// //                 Start Fact-Checking Now
// //               </Button>
// //             </Link>
// //           </motion.div>
// //         </div>
// //       </section> */}

// //       {/* Footer */}
// //       <footer className="py-8 bg-secondary/10">
// //         <div className="container mx-auto px-4">
// //           <div className="flex flex-col md:flex-row justify-center items-center">
// //             <div className="text-xs text-muted-foreground">
// //               © 2023 Kauwa Fact-Checker. All rights reserved.
// //             </div>
// //           </div>
// //         </div>
// //       </footer>
// //     </div>
// //   );
// // }
// "use client";

// import Link from "next/link";
// import { motion } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import Navbar from "./components/Navbar/Navbar";
// import Features from "./components/Features/Features";
// import { useRef } from "react";
// import { ChevronDown } from "lucide-react";

// export default function LandingPage() {
//   const featuresRef = useRef<HTMLDivElement>(null);

//   const scrollToFeatures = () => {
//     featuresRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   return (
//     <div className="min-h-screen bg-background flex flex-col">
//       <Navbar />

//       {/* Hero Section without Video Background */}
//       <section className="relative flex flex-col justify-center items-center min-h-screen overflow-hidden bg-background">
//         {/* Hero Content */}
//         <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
//           <motion.h1
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.2 }}
//             className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600"
//           >
//             Kauwa Fact-Checker
//           </motion.h1>
//           <motion.p
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.4 }}
//             className="text-base md:text-lg mb-10 text-muted-foreground leading-relaxed"
//           >
//             Uncover the truth with our advanced AI-powered fact-checking tool.
//             Verify claims, analyze sources, and make informed decisions in
//             real-time.
//           </motion.p>
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.6 }}
//             className="flex flex-col sm:flex-row items-center justify-center gap-4"
//           >
//             <Link href="/dashboard">
//               <Button
//                 size="default"
//                 className="text-base px-6 py-2 rounded-full"
//               >
//                 Get Started
//               </Button>
//             </Link>
//             <Button
//               variant="outline"
//               size="default"
//               className="text-base px-6 py-2 rounded-full"
//               onClick={scrollToFeatures}
//             >
//               Learn More
//             </Button>
//           </motion.div>
//         </div>

//         {/* Scroll Indicator */}
//         <motion.div
//           className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 1, duration: 0.5 }}
//           onClick={scrollToFeatures}
//         >
//           <div className="flex flex-col items-center cursor-pointer">
//             <span className="text-xs text-muted-foreground mb-1">
//               Scroll to explore
//             </span>
//             <motion.div
//               animate={{ y: [0, 10, 0] }}
//               transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
//             >
//               <ChevronDown className="h-5 w-5 text-primary" />
//             </motion.div>
//           </div>
//         </motion.div>
//       </section>

//       {/* Features Section */}
//       <div ref={featuresRef}>
//         <Features />
//       </div>

//       {/* Footer */}
//       <footer className="py-8 bg-secondary/10">
//         <div className="container mx-auto px-4">
//           <div className="flex flex-col md:flex-row justify-center items-center">
//             <div className="text-xs text-muted-foreground">
//               © 2023 Kauwa Fact-Checker. All rights reserved.
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "./components/Navbar/Navbar";
import { CheckCircle, Image, Video, FileText, LineChart } from "lucide-react";

export default function LandingPage() {
  // Animation variants for scrolling sections
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  // Feature blocks data
  const features = [
    {
      icon: <FileText className="w-10 h-10 mb-4 text-purple-400" />,
      title: "Text Verification",
      description:
        "Verify textual claims and statements with our advanced natural language processing algorithms.",
    },
    {
      icon: <Image className="w-10 h-10 mb-4 text-purple-400" />,
      title: "Image Analysis",
      description:
        "Detect manipulated images and verify visual content authenticity with computer vision technology.",
    },
    {
      icon: <Video className="w-10 h-10 mb-4 text-purple-400" />,
      title: "Deepfake Detection",
      description:
        "Identify AI-generated or manipulated videos using our state-of-the-art deepfake detection system.",
    },
    {
      icon: <LineChart className="w-10 h-10 mb-4 text-purple-400" />,
      title: "Complex Content Analysis",
      description:
        "Perform comprehensive analysis on multi-modal content with advanced cross-reference verification.",
    },
  ];

  // Workflow steps
  const workflowSteps = [
    {
      number: "01",
      title: "Input Content",
      description: "Upload text, images, or videos that you want to verify.",
    },
    {
      number: "02",
      title: "Analysis Process",
      description:
        "Our AI analyzes the content using multiple verification algorithms.",
    },
    {
      number: "03",
      title: "Detailed Results",
      description:
        "Review comprehensive verification results with confidence scores and evidence.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center items-center p-4 pt-20 text-center mt-20 h-[90vh]">
        <div className="max-w-2xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600"
          >
            Kauwa Fact-Checker
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-xl mb-12 text-muted-foreground"
          >
            Uncover the truth with our advanced AI-powered fact-checking tool.
            Verify claims, analyze sources, and make informed decisions in
            real-time.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link href="/dashboard">
              <Button
                size="lg"
                className="text-sm px-8 py-6 bg-slate-400 rounded mt-10"
              >
                Get Started
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Scroll indicator */}
      <motion.div
        className="flex justify-center mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <div className="animate-bounce">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="M12 5v14"></path>
            <path d="m19 12-7 7-7-7"></path>
          </svg>
        </div>
      </motion.div>

      {/* Features Section */}
      <section className="py-20 px-10">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Our Key Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to help you verify information across
              different media types
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-secondary/80 rounded-lg p-6 text-center flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {feature.icon}
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-10 bg-secondary/30">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our simple three-step process makes fact-checking easy and
              efficient
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.title}
                className="rounded-lg p-8 border border-border relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="absolute -top-4 -left-4 bg-secondary/80 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-4 mt-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-20 px-15">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Why Choose Kauwa
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built with cutting-edge technology to ensure accurate and reliable
              verification
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            <motion.div
              className="flex gap-4 items-start px-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2">Advanced AI Models</h3>
                <p className="text-muted-foreground">
                  Our system uses state-of-the-art NLP and computer vision
                  models trained on vast datasets for high accuracy.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="flex gap-4 items-start px-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2">Multi-Modal Analysis</h3>
                <p className="text-muted-foreground">
                  Simultaneously analyze text, images, and videos to provide
                  comprehensive verification results.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="flex gap-4 items-start px-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2">Real-Time Processing</h3>
                <p className="text-muted-foreground">
                  Get verification results quickly with our optimized processing
                  pipeline designed for speed and efficiency.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="flex gap-4 items-start px-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold mb-2">Transparency</h3>
                <p className="text-muted-foreground">
                  We provide confidence scores and detailed explanations for all
                  verification results to ensure transparency.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-[150px] px-4 bg-[#020817] h-[76vh]">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Start Fact-Checking Today
            </h2>
            <p className="text-xl mb-10 text-muted-foreground">
              Join our platform and gain access to powerful verification tools
              to help combat misinformation.
            </p>
            <Link href="/dashboard">
              <Button
                size="lg"
                className="text-sm px-8 py-6 bg-slate-400 rounded"
              >
                Get Started
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="py-8 text-center text-sm text-muted-foreground"
      >
        © 2025 Kauwa Fact-Checker. Created By WeThePeople.
      </motion.footer>
    </div>
  );
}
