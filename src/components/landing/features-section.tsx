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
   {/* Demo Video Section */}
   <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 overflow-x-hidden" aria-labelledby="demo-video-title">
	  <div className="container mx-auto">
		 <div className="max-w-4xl mx-auto">
			<div className="text-center mb-12">
			   <h2 id="demo-video-title" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				  See Fairlx in Action
			   </h2>
			   <p className="text-xl text-gray-600 max-w-2xl mx-auto">
				  Watch our demo video to experience the intuitive dashboard and features that make project management effortless.
			   </p>
			</div>
			<div className="bg-white rounded-3xl shadow-2xl p-4 md:p-8 flex flex-col items-center">
			   <div className="w-full aspect-video rounded-2xl overflow-hidden border border-gray-200 bg-black flex items-center justify-center">
				  <video
					 controls
					 poster="/Logo.png"
					 className="w-full h-full object-cover"
					 aria-label="Demo video showing Fairlx dashboard and features"
				  >
					 <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
					 Your browser does not support the video tag.
				  </video>
			   </div>
			</div>
		 </div>
	  </div>
   </section>

			{/* Features Grid Section */}
			<section ref={sectionRef} id="features" className="py-20 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
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
