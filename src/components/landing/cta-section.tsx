"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const stats = [
	{ number: "10,000+", label: "Active Users", icon: Users },
	{ number: "98%", label: "Customer Satisfaction", icon: Sparkles },
	{ number: "500%", label: "Productivity Increase", icon: TrendingUp },
];

export const CTASection = () => {
	const [isVisible, setIsVisible] = useState(false);
	const [currentStat, setCurrentStat] = useState(0);
	const sectionRef = useRef<HTMLElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setIsVisible(true);
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

	// Rotate stats
	useEffect(() => {
		if (isVisible) {
			const interval = setInterval(() => {
				setCurrentStat((prev) => (prev + 1) % stats.length);
			}, 3000);

			return () => clearInterval(interval);
		}
	}, [isVisible]);

	return (
		<section
			ref={sectionRef}
			className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden overflow-x-hidden"
		>
			{/* Background Effects */}
			<div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800" />
			<div className="absolute inset-0 bg-black/20" />

			{/* Animated background elements */}
			<div className="absolute inset-0 hidden md:block">
				<div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" />
				<div
					className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse"
					style={{ animationDelay: "2s" }}
				/>
				<div
					className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-blue-400/5 rounded-full blur-3xl animate-pulse"
					style={{ animationDelay: "4s" }}
				/>
			</div>

			<div className="container mx-auto relative z-10">
				<div className="max-w-4xl mx-auto text-center">
					{/* Main Content */}
					<div
						className={`space-y-8 ${
							isVisible ? "animate-fade-in-up" : "opacity-0"
						}`}
					>
						{/* Sparkles icon */}
						<div className="flex justify-center">
							<div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
								<Sparkles className="w-8 h-8 text-white animate-pulse" />
							</div>
						</div>

						{/* Headline */}
						<h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
							Ready to transform your{" "}
							<span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
								project management?
							</span>
						</h2>

						{/* Subtitle */}
						<p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
							Join thousands of teams already using ChronoTask to deliver projects
							faster,
							<br className="hidden sm:block" />
							collaborate better, and achieve their goals.
						</p>

						{/* Rotating Stats */}
						<div className="py-8">
							<div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md mx-auto border border-white/20">
								{stats.map((stat, index) => {
									const Icon = stat.icon;
									return (
										<div
											key={index}
											className={`
                        flex items-center justify-center space-x-4 transition-all duration-500
                        ${currentStat === index ? "opacity-100 scale-100" : "opacity-0 scale-95 absolute"}
                      `}
										>
											<Icon className="w-8 h-8 text-yellow-300" />
											<div className="text-left">
												<div className="text-2xl font-bold text-white">
													{stat.number}
												</div>
												<div className="text-blue-200 text-sm">
													{stat.label}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{/* CTA Buttons */}
						<div
							className={`
              flex flex-col sm:flex-row gap-4 justify-center items-center
              ${isVisible ? "animate-fade-in-up" : "opacity-0"}
            `}
							style={{ animationDelay: "0.4s" }}
						>
							<Button
								size="lg"
								className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
								asChild
							>
								<Link href="/sign-up">
									Start Your Free Trial
									<ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
								</Link>
							</Button>

							<Button
								variant="outline"
								size="lg"
								className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl backdrop-blur-sm transition-all duration-300"
								asChild
							>
								<Link href="/demo">Schedule Demo</Link>
							</Button>
						</div>

						{/* Trust indicators */}
						<div
							className={`
              pt-8 space-y-4
              ${isVisible ? "animate-fade-in-up" : "opacity-0"}
            `}
							style={{ animationDelay: "0.6s" }}
						>
							<p className="text-blue-200 text-sm">
								Trusted by teams at leading companies worldwide
							</p>

							{/* Company logos placeholder */}
							<div className="flex justify-center items-center gap-8 opacity-60">
								{[1, 2, 3, 4].map((item) => (
									<div
										key={item}
										className="w-20 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white/60 text-xs font-medium"
									>
										Company
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

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
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
		</section>
	);
};
