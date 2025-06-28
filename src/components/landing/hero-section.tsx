"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, CheckCircle } from "lucide-react";
import { useState } from "react";

export const HeroSection = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center pt-8 pb-8 md:pt-16 md:pb-16 overflow-hidden mt-14">
      {/* Dotted SVG Background Pattern (always visible, behind everything) */}
      <svg
        className="absolute inset-0 w-full h-full z-0"
        style={{ pointerEvents: 'none' }}
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
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, #3b82f6 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px'
        }}
      />
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/90 to-purple-50/80" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">
          {/* Floating Cards */}
          <div className="hidden lg:block">
            {/* Sticky Note - Top Left */}
            <div className="absolute -top-20 -left-20 animate-float" style={{ animationDelay: '0s' }}>
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
            <div className="absolute -top-16 -right-20 animate-float" style={{ animationDelay: '1s' }}>
              <div className="bg-white p-4 rounded-xl shadow-lg transform rotate-3 border border-gray-100 min-w-[200px]">
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
            <div className="absolute -bottom-20 -left-16 animate-float" style={{ animationDelay: '2s' }}>
              <div className="bg-white p-4 rounded-xl shadow-lg transform -rotate-2 border border-gray-100 min-w-[240px]">
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
            <div className="absolute -bottom-16 -right-16 animate-float" style={{ animationDelay: '3s' }}>
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
                onClick={() => setIsVideoPlaying(true)}
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>

            {/* Demo Video Modal */}
            {isVideoPlaying && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
                <div className="relative max-w-5xl w-full mx-4">
                  {/* Close Button */}
                  <button
                    onClick={() => setIsVideoPlaying(false)}
                    className="absolute -top-16 right-0 text-white/80 hover:text-white transition-all duration-300 hover:scale-110 z-10"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </button>

                  {/* Video Container */}
                  <div className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl animate-scale-in border border-gray-700">
                    {/* Video Header */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex items-center justify-between border-b border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="text-gray-300 text-sm font-medium">ChronoTask Demo</span>
                      </div>
                      <div className="text-gray-400 text-sm">2:43 / 4:12</div>
                    </div>

                    {/* Video Content */}
                    <div className="aspect-video bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 relative overflow-hidden">
                      {/* Animated background */}
                      <div className="absolute inset-0">
                        <div className="absolute top-4 left-4 w-32 h-20 bg-white/10 rounded-lg animate-pulse backdrop-blur-sm border border-white/20" />
                        <div className="absolute top-4 right-4 w-40 h-16 bg-blue-500/20 rounded-lg animate-pulse backdrop-blur-sm" style={{ animationDelay: '1s' }} />
                        <div className="absolute bottom-20 left-4 w-48 h-24 bg-purple-500/20 rounded-lg animate-pulse backdrop-blur-sm" style={{ animationDelay: '2s' }} />
                        <div className="absolute bottom-20 right-4 w-36 h-28 bg-green-500/20 rounded-lg animate-pulse backdrop-blur-sm" style={{ animationDelay: '3s' }} />
                        
                        {/* Floating elements */}
                        <div className="absolute top-1/3 left-1/3 w-16 h-16 bg-blue-500/30 rounded-full animate-float backdrop-blur-sm" />
                        <div className="absolute top-1/2 right-1/3 w-12 h-12 bg-purple-500/30 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
                        <div className="absolute bottom-1/3 left-1/2 w-20 h-20 bg-green-500/30 rounded-full animate-float" style={{ animationDelay: '2.5s' }} />
                      </div>

                      {/* Center Play Button and Content */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-6 bg-black/30 backdrop-blur-md rounded-3xl p-8 border border-white/10">
                          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto animate-pulse hover:scale-110 transition-transform duration-300 cursor-pointer border border-white/30">
                            <Play className="w-10 h-10 text-white ml-1" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-3xl font-bold text-white">See ChronoTask in Action</h3>
                            <p className="text-blue-200 text-lg">Discover how teams boost productivity by 500%</p>
                          </div>
                          <div className="flex items-center justify-center space-x-4 text-sm text-gray-300">
                            <span>✨ Interactive Demo</span>
                            <span>•</span>
                            <span>🚀 Real Features</span>
                            <span>•</span>
                            <span>📊 Live Dashboard</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gray-800/90 p-4">
                        <div className="flex items-center space-x-4">
                          <button className="text-white hover:text-blue-400 transition-colors">
                            <Play className="w-5 h-5" />
                          </button>
                          <div className="flex-1 bg-gray-600 rounded-full h-1">
                            <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '65%' }}></div>
                          </div>
                          <span className="text-gray-300 text-sm">HD</span>
                          <button className="text-white hover:text-blue-400 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="mt-6 text-center text-white/80">
                    <p className="text-sm">
                      🎬 This is a preview of our interactive demo. 
                      <button 
                        onClick={() => setIsVideoPlaying(false)}
                        className="ml-2 text-blue-400 hover:text-blue-300 underline"
                      >
                        Start your free trial
                      </button> 
                      to explore all features.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(var(--rotate)); }
          50% { transform: translateY(-10px) rotate(var(--rotate)); }
        }
        
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
