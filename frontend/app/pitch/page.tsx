"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Target, 
  Zap, 
  Lock, 
  Layers, 
  Cpu, 
  ArrowRight, 
  ArrowLeft, 
  Github, 
  Globe, 
  Trophy, 
  Users, 
  TrendingUp,
  AlertCircle,
  LucideIcon
} from "lucide-react";

interface Slide {
  id: number;
  title: string;
  tagline?: string;
  content: React.ReactNode;
  icon?: LucideIcon;
  bgColor: string;
}

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const slides: Slide[] = [
    {
      id: 0,
      title: "ChainSniper",
      tagline: "Autonomous, Intent-Based Trading on Uniswap V4",
      bgColor: "from-blue-900 to-black",
      icon: Target,
      content: (
        <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="relative">
            <Target className="w-24 h-24 text-blue-400 animate-pulse" />
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl -z-10 rounded-full" />
          </div>
          <h1 className="text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600 tracking-tight">
            ChainSniper
          </h1>
          <p className="text-2xl text-slate-400 font-medium max-w-2xl">
            The cross-chain intent engine for the next generation of decentralized markets on Unichain.
          </p>
          <div className="mt-8 px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 font-bold uppercase tracking-widest text-sm">
            UHI8 Hackathon Presentation
          </div>
        </div>
      ),
    },
    {
      id: 1,
      title: "The Problem",
      bgColor: "from-red-950 to-black",
      icon: AlertCircle,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-red-400">Limit Orders are Broken.</h2>
            <ul className="space-y-4">
              {[
                { title: "Centralization", text: "Reliance on off-chain bots or centralized keepers." },
                { title: "Trust Gap", text: "Users must grant custodial permissions to third-party bots." },
                { title: "Execution Risk", text: "Bots go offline; gas spikes prevent timely execution." },
                { title: "Fragmentation", text: "L2 trades lack high-integrity L1 price feeds natively." },
              ].map((item, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <div>
                    <span className="font-bold text-red-200">{item.title}:</span>{" "}
                    <span className="text-slate-400">{item.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-red-500/20 blur-2xl group-hover:bg-red-500/30 transition-all rounded-3xl" />
            <div className="relative bg-slate-900/50 border border-red-500/20 p-8 rounded-3xl shadow-2xl">
               <pre className="text-xs text-red-400/80 font-mono leading-relaxed">
                  {`// Today's Risks
if (bot.isOffline()) {
  user.loss += 100%
}
if (trust.isBroken()) {
  funds = STOLEN;
}`}
               </pre>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: "The Solution",
      bgColor: "from-emerald-950 to-black",
      icon: Zap,
      content: (
        <div className="space-y-12 text-center">
          <h2 className="text-5xl font-black text-emerald-400">Autonomous Intent Fulfillment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Reactive Automation", text: "Real-time L1 monitoring with cross-chain triggers." },
              { icon: Lock, title: "Non-Custodial", text: "Intents are managed natively by Uniswap V4 Hooks." },
              { icon: Target, title: "Precision", text: "Zero-latency sniping when target conditions are met." },
            ].map((item, i) => (
              <div key={i} className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-2xl hover:border-emerald-500/30 transition-all">
                <item.icon className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
        id: 3,
        title: "Key Features",
        bgColor: "from-slate-900 to-black",
        icon: Trophy,
        content: (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              "L1 Price Monitoring -> L2 Execution",
              "Chainlink-Powered Accuracy",
              "Slippage & Staleness Protection",
              "Integrated ERC20 Approval Flow",
              "Real-time Order Dashboard",
              "Manual Refund Safeguards",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <TrendingUp className="text-emerald-400 w-6 h-6" />
                <span className="text-lg font-medium text-slate-200">{feature}</span>
              </div>
            ))}
          </div>
        ),
      },
    {
      id: 4,
      title: "How it Works",
      bgColor: "from-indigo-950 to-black",
      icon: Cpu,
      content: (
        <div className="flex flex-col items-center space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-4xl gap-8">
            <div className="flex-1 text-center bg-indigo-500/10 p-6 rounded-2xl border border-indigo-500/20">
              <span className="block text-xs font-bold text-indigo-400 uppercase mb-2">Step 1</span>
              <h4 className="font-bold text-white">Create Intent</h4>
              <p className="text-xs text-slate-400">Escrow funds in v4 Hook on Unichain</p>
            </div>
            <ArrowRight className="w-8 h-8 text-indigo-400 hidden md:block" />
            <div className="flex-1 text-center bg-indigo-500/10 p-6 rounded-2xl border border-indigo-500/20">
              <span className="block text-xs font-bold text-indigo-400 uppercase mb-2">Step 2</span>
              <h4 className="font-bold text-white">Monitor L1</h4>
              <p className="text-xs text-slate-400">Reactive Network watches Chainlink</p>
            </div>
            <ArrowRight className="w-8 h-8 text-indigo-400 hidden md:block" />
            <div className="flex-1 text-center bg-indigo-500/10 p-6 rounded-2xl border border-indigo-500/20">
              <span className="block text-xs font-bold text-indigo-400 uppercase mb-2">Step 3</span>
              <h4 className="font-bold text-white">Trigger L2</h4>
              <p className="text-xs text-slate-400">Executor calls Hook to swap</p>
            </div>
          </div>
          <div className="mt-8 bg-slate-900 border border-white/5 p-8 rounded-3xl w-full max-w-2xl text-center">
            <p className="text-slate-400 text-sm">"The result is a completely autonomous trade that executes based on L1 market truth but settles with L2 efficiency."</p>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: "The Tech Stack",
      bgColor: "from-blue-950 to-black",
      icon: Layers,
      content: (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { img: "https://cryptologos.cc/logos/uniswap-uni-logo.png", name: "Uniswap V4", desc: "Hooks Layer" },
            { img: "https://cryptologos.cc/logos/chainlink-link-logo.png", name: "Chainlink", desc: "L1 Price Feeds" },
            { name: "Unichain", desc: "Settlement Layer", icon: Globe },
            { name: "Reactive Network", desc: "Cross-Chain Brain", icon: Zap },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
              {item.img ? (
                <img src={item.img} alt={item.name} className="w-16 h-16 mb-4 object-contain filter grayscale invert brightness-200" />
              ) : item.icon ? (
                <item.icon className="w-16 h-16 mb-4 text-blue-400" />
              ) : null}
              <h4 className="font-bold text-lg text-white">{item.name}</h4>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 6,
      title: "ChainSniper 2.0",
      bgColor: "from-purple-950 to-black",
      icon: TrendingUp,
      content: (
        <div className="space-y-8">
          <h2 className="text-4xl font-black text-purple-400 text-center">The Agentic Intent Marketplace</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-purple-500/10 rounded-2xl border border-purple-500/20">
              <h4 className="text-xl font-bold text-purple-200 mb-2">Reputation-Based Priority</h4>
              <p className="text-sm text-slate-400">Prioritizing orders from trusted agents to eliminate anonymous toxic MEV.</p>
            </div>
            <div className="p-6 bg-purple-500/10 rounded-2xl border border-purple-500/20">
              <h4 className="text-xl font-bold text-purple-200 mb-2">Priority Boosting (x402)</h4>
              <p className="text-sm text-slate-400">Enable agents to bid for execution priority via L1 micropayments.</p>
            </div>
            <div className="p-6 bg-purple-500/10 rounded-2xl border border-purple-500/20">
              <h4 className="text-xl font-bold text-purple-200 mb-2">Piggyback Sniping</h4>
              <p className="text-xl font-medium text-slate-400">Zero-gas execution by piggybacking on large existing pool volume.</p>
            </div>
            <div className="p-6 bg-purple-500/10 rounded-2xl border border-purple-500/20">
              <h4 className="text-xl font-bold text-purple-200 mb-2">Multi-Oracle Support</h4>
              <p className="text-sm text-slate-400">Aggregating multiple L1 feeds for extreme price resilience.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 7,
      title: "The Team",
      bgColor: "from-slate-900 to-black",
      icon: Users,
      content: (
        <div className="flex flex-col items-center justify-center space-y-12">
          <div className="flex gap-12">
            {[
              { name: "dev.uche", role: "Smart Contract Engineering", x: "@dev_uche" },
              { name: "ogazboiz", role: "Full-Stack Development", x: "@ogazboiz" },
            ].map((member, i) => (
              <div key={i} className="text-center group">
                <div className="w-32 h-32 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 border-4 border-white/10 group-hover:scale-110 transition-all duration-300 shadow-xl" />
                <h4 className="text-2xl font-black text-white">{member.name}</h4>
                <p className="text-sm text-blue-400 font-medium mb-2">{member.role}</p>
                <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
                    <Github className="w-3 h-3" />
                    <span>{member.x}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 max-w-xl text-center">
            <p className="text-slate-400">"We are committed to building autonomous infrastructure that makes DeFi safe, accessible, and high-performance."</p>
          </div>
        </div>
      ),
    },
    {
      id: 8,
      title: "Join the Future",
      bgColor: "from-blue-900 to-black",
      icon: Target,
      content: (
        <div className="flex flex-col items-center justify-center space-y-12 text-center">
           <h2 className="text-6xl font-black text-white">Let's build on Unichain.</h2>
           <div className="flex flex-wrap justify-center gap-6">
              <Link href="/" className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                <Globe className="w-5 h-5" />
                Back to dApp
              </Link>
              <a href="https://github.com/uhi8/chainsniper" target="_blank" className="flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-all border border-white/10 active:scale-95">
                <Github className="w-5 h-5" />
                GitHub Repo
              </a>
           </div>
           <div className="mt-12 text-slate-500 flex flex-col items-center gap-4">
               <p className="uppercase tracking-widest font-bold text-xs">Contact us at</p>
               <span className="text-blue-400 font-mono">uchennahanson@gmail.com</span>
           </div>
        </div>
      ),
    },
  ];

  const goToNextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => prev + 1);
        setIsTransitioning(false);
      }, 300);
    }
  }, [currentSlide, slides.length]);

  const goToPrevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => prev - 1);
        setIsTransitioning(false);
      }, 300);
    }
  }, [currentSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNextSlide();
      if (e.key === "ArrowLeft") goToPrevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextSlide, goToPrevSlide]);

  const current = slides[currentSlide];

  return (
    <div className={`min-h-screen bg-black text-white flex flex-col overflow-hidden transition-all duration-1000`}>
      {/* Background Gradient */}
      <div className={`fixed inset-0 bg-gradient-to-b ${current.bgColor} opacity-40 -z-10 transition-colors duration-1000`} />
      
      {/* Top Header */}
      <nav className="flex items-center justify-between p-8 z-50">
        <Link href="/" className="flex items-center gap-3 group">
          <Target className="w-8 h-8 text-blue-400 group-hover:rotate-45 transition-transform" />
          <span className="text-xl font-black tracking-tighter">ChainSniper</span>
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            Slide {currentSlide + 1} of {slides.length}
          </span>
          <Link 
            href="/" 
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-all active:scale-95"
          >
            Exit Presentation
          </Link>
        </div>
      </nav>

      {/* Slide Container */}
      <main className="flex-1 relative flex items-center justify-center p-8 max-w-7xl mx-auto w-full">
        <div className={`w-full transition-all duration-300 ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
          <div className="flex flex-col items-center justify-center h-full">
            {current.content}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 z-50">
          <button
            onClick={goToPrevSlide}
            disabled={currentSlide === 0}
            className={`p-4 rounded-full border transition-all ${
              currentSlide === 0 
                ? "border-white/5 text-slate-700 pointer-events-none" 
                : "border-white/20 text-white hover:bg-white/10 hover:scale-110 active:scale-90"
            }`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                   setIsTransitioning(true);
                   setTimeout(() => {
                     setCurrentSlide(i);
                     setIsTransitioning(false);
                   }, 300);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentSlide ? "bg-blue-400 w-8" : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          <button
            onClick={goToNextSlide}
            disabled={currentSlide === slides.length - 1}
            className={`p-4 rounded-full border transition-all ${
              currentSlide === slides.length - 1 
                ? "border-white/5 text-slate-700 pointer-events-none" 
                : "border-white/20 text-white hover:bg-white/10 hover:scale-110 active:scale-90"
            }`}
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </main>

      {/* Decorative Blur */}
      <div className="fixed bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black to-transparent -z-10" />
    </div>
  );
}
