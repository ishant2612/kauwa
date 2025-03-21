// "use client";

// import Link from "next/link";
// import { motion } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import Navbar from "./components/Navbar/Navbar";
// import Features from "./components/Features/Features";
// import { useEffect, useRef } from "react";
// import { ChevronDown } from "lucide-react";

// export default function LandingPage() {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const featuresRef = useRef<HTMLDivElement>(null);

//   // Autoplay video when component mounts
//   useEffect(() => {
//     const video = videoRef.current;
//     if (video) {
//       setTimeout(() => {
//         video.play().catch((err) => {
//           console.error("Error playing video:", err);
//         });
//       }, 500);
//     }
//   }, []);

//   const scrollToFeatures = () => {
//     featuresRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   return (
//     <div className="min-h-screen bg-background flex flex-col">
//       <Navbar />

//       {/* Hero Section with Video Background */}
//       <section className="relative flex flex-col justify-center items-center min-h-screen overflow-hidden">
//         {/* Video Background */}
//         <div className="absolute inset-0 z-0 overflow-hidden">
//           <video
//             ref={videoRef}
//             autoPlay
//             muted
//             loop
//             playsInline
//             className="w-full h-full object-cover"
//           >
//             <source src="frontend.mp4" type="video/mp4" />
//             {/* Fallback for browsers that don't support video */}
//             Your browser does not support the video tag.
//           </video>
//           {/* Overlay to match the current background color */}
//           <div className="absolute inset-0 bg-background/90 "></div>
//         </div>

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

//         {/* Centered Scroll indicator */}
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

//       {/* Call to Action Section */}
//       {/* <section className="py-16 bg-gradient-to-b from-background to-secondary/20">
//         <div className="container mx-auto px-4 text-center">
//           <motion.h2
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//             viewport={{ once: true }}
//             className="text-2xl md:text-3xl font-bold mb-4"
//           >
//             Ready to Discover the Truth?
//           </motion.h2>
//           <motion.p
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.2 }}
//             viewport={{ once: true }}
//             className="text-base text-muted-foreground mb-8 max-w-2xl mx-auto"
//           >
//             Join thousands of users who rely on our platform for accurate
//             information verification.
//           </motion.p>
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.4 }}
//             viewport={{ once: true }}
//           >
//             <Link href="/dashboard">
//               <Button
//                 size="default"
//                 className="text-base px-6 py-2 rounded-full"
//               >
//                 Start Fact-Checking Now
//               </Button>
//             </Link>
//           </motion.div>
//         </div>
//       </section> */}

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
import Features from "./components/Features/Features";
import { useRef } from "react";
import { ChevronDown } from "lucide-react";

export default function LandingPage() {
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Section without Video Background */}
      <section className="relative flex flex-col justify-center items-center min-h-screen overflow-hidden bg-background">
        {/* Hero Content */}
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600"
          >
            Kauwa Fact-Checker
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-base md:text-lg mb-10 text-muted-foreground leading-relaxed"
          >
            Uncover the truth with our advanced AI-powered fact-checking tool.
            Verify claims, analyze sources, and make informed decisions in
            real-time.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/dashboard">
              <Button
                size="default"
                className="text-base px-6 py-2 rounded-full"
              >
                Get Started
              </Button>
            </Link>
            <Button
              variant="outline"
              size="default"
              className="text-base px-6 py-2 rounded-full"
              onClick={scrollToFeatures}
            >
              Learn More
            </Button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          onClick={scrollToFeatures}
        >
          <div className="flex flex-col items-center cursor-pointer">
            <span className="text-xs text-muted-foreground mb-1">
              Scroll to explore
            </span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
            >
              <ChevronDown className="h-5 w-5 text-primary" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <div ref={featuresRef}>
        <Features />
      </div>

      {/* Footer */}
      <footer className="py-8 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center">
            <div className="text-xs text-muted-foreground">
              © 2023 Kauwa Fact-Checker. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
