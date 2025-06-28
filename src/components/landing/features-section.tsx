"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Users, Calendar, BarChart3, Shield, Zap, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const features = [
  {
    icon: CheckCircle,
    title: "Task Management",
    description: "Create, assign, and track tasks with powerful workflows and custom fields.",
    color: "blue",
    delay: 0
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together seamlessly with real-time updates and team workspaces.",
    color: "green",
    delay: 100
  },
  {
    icon: Calendar,
    title: "Timeline Views",
    description: "Visualize project timelines with Gantt charts and calendar views.",
    color: "purple",
    delay: 200
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Get insights into team performance and project progress with detailed reports.",
    color: "yellow",
    delay: 300
  },
  {
    icon: Shield,
    title: "Security",
    description: "Enterprise-grade security with role-based access control and encryption.",
    color: "red",
    delay: 400
  },
  {
    icon: Zap,
    title: "Automation",
    description: "Automate repetitive tasks and workflows to save time and reduce errors.",
    color: "indigo",
    delay: 500
  }
];

const colorVariants = {
  blue: "bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
  green: "bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white",
  purple: "bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
  yellow: "bg-yellow-100 text-yellow-600 group-hover:bg-yellow-600 group-hover:text-white",
  red: "bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white",
  indigo: "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
};

export const FeaturesSection = () => {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate cards one by one
            features.forEach((_, index) => {
              setTimeout(() => {
                setVisibleCards(prev => [...prev, index]);
              }, index * 150);
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Dashboard Preview Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                See ChronoTask in Action
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Experience the intuitive dashboard that makes project management effortless
              </p>
            </div>
            
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 hover:shadow-3xl transition-all duration-500 group">
              <div className="aspect-video bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl flex items-center justify-center border border-gray-100 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0">
                  <div className="absolute top-4 left-4 w-32 h-24 bg-white rounded-lg shadow-md animate-pulse" />
                  <div className="absolute top-4 right-4 w-40 h-20 bg-blue-50 rounded-lg animate-pulse" style={{ animationDelay: '1s' }} />
                  <div className="absolute bottom-4 left-4 w-48 h-28 bg-purple-50 rounded-lg animate-pulse" style={{ animationDelay: '2s' }} />
                  <div className="absolute bottom-4 right-4 w-36 h-32 bg-green-50 rounded-lg animate-pulse" style={{ animationDelay: '3s' }} />
                </div>
                
                {/* Center Content */}
                <div className="text-center z-10 bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Interactive Dashboard</h3>
                  <p className="text-gray-600 mb-4">Real-time insights and beautiful visualizations</p>
                  <button className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group">
                    Explore Features
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section ref={sectionRef} id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything you need to manage projects
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                From planning to delivery, our platform provides all the tools your team needs to succeed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isVisible = visibleCards.includes(index);
                
                return (
                  <Card 
                    key={index}
                    className={`
                      border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group cursor-pointer
                      transform hover:-translate-y-2 hover:scale-105
                      ${isVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0 translate-y-8'}
                    `}
                    style={{ 
                      animationDelay: `${feature.delay}ms`,
                      transitionDelay: `${feature.delay}ms`
                    }}
                  >
                    <CardContent className="p-8 relative overflow-hidden">
                      {/* Background decoration */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-transparent rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500" />
                      
                      <div className={`
                        w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-all duration-300 relative z-10
                        ${colorVariants[feature.color as keyof typeof colorVariants]}
                      `}>
                        <Icon className="h-6 w-6 transition-all duration-300" />
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                      
                      {/* Hover arrow */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <ArrowRight className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
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
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </>
  );
}
