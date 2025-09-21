"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-hidden mt-10">
      {/* Background dotted grid and glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Dotted grid pattern */}
        <div className="absolute inset-0 bg-[url('/grid-dots.svg')] bg-repeat opacity-60" />
        
        {/* Multiple gradient glows for better effect */}
        <div className="absolute left-1/2 top-[40%] -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-200/40 via-blue-100/20 to-transparent opacity-60 rounded-full blur-3xl" />
        <div className="absolute left-1/2 top-[60%] -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-purple-200/30 via-purple-100/15 to-transparent opacity-50 rounded-full blur-2xl" />

        <div className="absolute top-20 left-10 text-blue-400 text-2xl font-light">+</div>
        <div className="absolute top-32 right-20 text-purple-400 text-2xl font-light">+</div>
        <div className="absolute bottom-40 left-20 text-blue-400 text-2xl font-light">+</div>
        <div className="absolute bottom-20 right-10 text-purple-400 text-2xl font-light">+</div>
        <div className="absolute top-1/2 left-1/4 text-blue-300 text-xl font-light">+</div>
        <div className="absolute top-1/3 right-1/3 text-purple-300 text-xl font-light">+</div>
        <div className="absolute top-2/3 right-1/4 text-blue-300 text-xl font-light">+</div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-16 pb-8 px-4">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          {/* Highlight box for "Management" */}
          <div className="relative inline-block">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Simplifying Task{" "}
              <span className="relative inline-block align-middle">
                <span className="relative z-10 text-blue-700 italic font-bold px-3 py-1">Management</span>
                <span className="absolute inset-0 bg-blue-100 rounded-md" />
                <span className="absolute inset-0 border-2 border-blue-300 rounded-md" />
              </span>
              <br />
              for Growing Teams
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Empower your team with tools that simplify task management, improve coordination, and ensure nothing slips through the cracks as your business expands
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button 
              size="default" 
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 text-base font-medium rounded-md shadow-md transition-all duration-300"
              asChild
            >
              <Link href="/sign-up">
                Get Started
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="default" 
              className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-6 py-3 text-base font-medium rounded-md transition-all duration-300"
              onClick={() => {
                const demoVideoSection = document.getElementById('demo-video-title');
                if (demoVideoSection) {
                  demoVideoSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Preview Image */}
      <div className="relative z-10 px-4 pb-12">
        <div className="max-w-xl mx-auto">
          <div className="relative flex flex-col items-center gap-4">
            {/* Main dashboard mockup */}
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-full">
              <Image 
                src="/heroimg.jpg" 
                alt="Scrumpty Dashboard Preview" 
                width={640} 
                height={384} 
                className="w-full h-auto object-cover max-h-80 mx-auto" // Increased height and width
                priority
              />
            </div>
            <div className="hidden lg:block">
              {/* Profile card - top left */}
              <div className="absolute -top-6 -left-6 bg-white rounded-lg shadow-md border border-gray-200 p-3 w-44">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-xs">JM</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs">Julia Mayastha</p>
                    <p className="text-gray-500 text-xs">Project Manager</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
