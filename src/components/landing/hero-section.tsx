"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, CheckCircle } from "lucide-react";
import { useState } from "react";

export const HeroSection = () => {
  // Remove video modal logic

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center pt-8 pb-8 md:pt-16 md:pb-16 overflow-hidden mt-14">
      {/* Dotted SVG Background Pattern (always visible, behind everything) */}
      <svg
        className="absolute inset-0 w-full h-full z-0 pointer-events-none"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="dotPattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#3b82f6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotPattern)" />
      </svg>
      {/* Dotted Background Pattern */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #3b82f6 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px'
        }}
      />
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/90 to-purple-50/80 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
          {/* Floating Cards */}
          <div className="hidden lg:block">
            {/* Sticky Note - Top Left */}
            <div className="absolute -top-20 -left-20 animate-float max-w-xs">
              <div className="bg-yellow-200 p-4 rounded-lg shadow-lg transform -rotate-6 border border-yellow-300">
                <div className="w-3 h-3 bg-red-400 rounded-full mb-2 ml-2" />
                <p className="text-sm text-gray-800 font-medium leading-tight">
                  Take notes to keep<br />
                  track of crucial details,<br />
                  and accomplish more<br />
                  tasks with ease.
                </p>
                <div className="absolute -bottom-4 left-6">
                  <div className="w-8 h-8 bg-white rounded-xl shadow-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Reminders Card - Top Right */}
            <div className="absolute -top-16 -right-20 animate-float min-w-[200px] max-w-xs">
              <div className="bg-white p-4 rounded-xl shadow-lg transform rotate-3 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-900">Reminders</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">Today's Meeting</p>
                <p className="text-xs text-gray-500">Call with marketing team</p>
                <div className="mt-2">
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
                    13:00 - 13:45
                  </span>
                </div>
              </div>
            </div>

            {/* Tasks Card - Bottom Left */}
            <div className="absolute -bottom-20 -left-16 animate-float min-w-[240px] max-w-xs">
              <div className="bg-white p-4 rounded-xl shadow-lg transform -rotate-2 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-3">Today's tasks</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-400 rounded-full" />
                    <span className="text-sm text-gray-700">New ideas for campaign</span>
                    <span className="text-xs text-gray-500 ml-auto">60%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-400 rounded-full" />
                    <span className="text-sm text-gray-700">Design PPT #4</span>
                    <span className="text-xs text-gray-500 ml-auto">100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full w-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Integrations Card - Bottom Right */}
            <div className="absolute -bottom-16 -right-16 animate-float max-w-xs">
              <div className="bg-white p-4 rounded-xl shadow-lg transform rotate-2 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-3">100+ Integrations</h4>
                <div className="flex gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center space-y-8">
            {/* App Icon */}
            <div className="flex justify-center animate-bounce-slow">
              <Image 
                src="/logo.png" 
                alt="Scrumty Logo" 
                width={80} 
                height={80} 
                className="rounded-2xl shadow-xl border border-gray-100 bg-white p-2"
                priority
              />
            </div>

            {/* Headlines with animations */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight animate-fade-in-up">
                <span className="text-gray-900">Think, plan, and track</span>
              </h1>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight animate-fade-in-up text-gray-400" style={{ animationDelay: '0.2s' }}>
                all in one place
              </h2>
            </div>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              Efficiently manage your tasks and boost productivity with our modern project management platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-blue-200 hover:shadow-xl transition-all duration-300 group"
                asChild
              >
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 group"
                onClick={() => {
                  const demoVideoSection = document.getElementById('demo-video-title');
                  if (demoVideoSection) {
                    demoVideoSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>


          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(var(--rotate)); }
          50% { transform: translateY(-10px) rotate(var(--rotate)); }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes gentle-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-gentle-float {
          animation: gentle-float 4s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </section>
  );
}
