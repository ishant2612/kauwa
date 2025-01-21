"use client";

import { motion } from "framer-motion";
import Navbar from "../components/Navbar/Navbar";
import TeamMemberCard from "../components/TeamMemberCard/TeamMemberCard";

const teamMembers = [
  {
    name: "Ishant Verma",
    role: "Frontend / Database Engineer",
    photo: "/ishant.jpg",
    contact: "vishant448@gmail.com",
  },
  {
    name: "Gagan Sharma",
    role: "Backend / NLP Engineer",
    photo: "/gagan.jpg",
    contact: "gaganofficialwork@gmail.com",
  },
  {
    name: "Ronit Ranjan Tripathy",
    role: "Computer Vision Engineer",
    photo: "/ronit.jpg",
    contact: "ronitprofessional2912@gmail.com",
  },
  {
    name: "Varun Gupta",
    role: "Backend / System architecture Engineer",
    photo: "/varun.jpg",
    contact: "diana@example.com",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-24">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold text-center mb-12"
        >
          Meet Our Team
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-center text-muted-foreground mb-16 max-w-2xl mx-auto"
        >
          We are a dedicated group of professionals committed to bringing you
          the most accurate and reliable fact-checking experience.
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <TeamMemberCard {...member} />
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
