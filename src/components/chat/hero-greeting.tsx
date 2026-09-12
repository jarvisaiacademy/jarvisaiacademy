"use client";

import { motion } from "motion/react";

interface HeroGreetingProps {
  name?: string;
}

export function HeroGreeting({ name = "suga" }: HeroGreetingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex items-center justify-center gap-2 mb-6 select-none"
    >
      <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white flex items-center gap-2">
        <span>Tell me about yourself</span>
        <span className="font-medium text-white">{name}</span>
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#7c3aed] text-white text-sm shadow-sm leading-none"
          title="Dharmachakra"
        >
          ☸
        </span>
        <span className="text-white">.</span>
      </h1>
    </motion.div>
  );
}
