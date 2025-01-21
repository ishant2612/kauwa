import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mail } from "lucide-react";

interface TeamMemberCardProps {
  name: string;
  role: string;
  photo: string;
  contact: string;
}

export default function TeamMemberCard({
  name,
  role,
  photo,
  contact,
}: TeamMemberCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="relative aspect-square"
        >
          <Avatar className="w-full h-full rounded-none">
            <AvatarImage src={photo} alt={name} className="object-cover" />
            <AvatarFallback>
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
            <a
              href={`mailto:${contact}`}
              className="text-primary-foreground flex items-center space-x-2 bg-primary px-3 py-2 rounded-full"
            >
              <Mail size={16} />
              <span>Contact</span>
            </a>
          </div>
        </motion.div>
      </CardHeader>
      <CardContent className="p-4 text-center">
        <CardTitle className="mb-1">{name}</CardTitle>
        <p className="text-sm text-muted-foreground">{role}</p>
      </CardContent>
    </Card>
  );
}
