"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const plans = [
	{
		name: "Free",
		price: 0,
		description: "Perfect for small teams getting started",
		features: ["Up to 10 users", "Basic task management", "1GB storage", "Email support"],
		buttonText: "Get Started",
		buttonVariant: "outline" as const,
		popular: false,
		icon: Shield,
	},
	{
		name: "Pro",
		price: 12,
		description: "For growing teams that need more features",
		features: [
			"Unlimited users",
			"Advanced workflows",
			"100GB storage",
			"Analytics & reporting",
			"Priority support",
			"Custom integrations",
		],
		buttonText: "Start Free Trial",
		buttonVariant: "primary" as const,
		popular: true,
		icon: Star,
	},
	{
		name: "Enterprise",
		price: null,
		description: "For large organizations with custom needs",
		features: [
			"Everything in Pro",
			"Custom integrations",
			"Advanced security",
			"SLA guarantee",
			"Dedicated support",
			"Custom training",
		],
		buttonText: "Contact Sales",
		buttonVariant: "outline" as const,
		popular: false,
		icon: Zap,
	},
];

export const PricingSection = () => {
	const [isVisible, setIsVisible] = useState(false);
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

	return (
		<section
			ref={sectionRef}
			id="pricing"
			className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-x-hidden"
		>
			<div className="container mx-auto">
				<div className="max-w-6xl mx-auto">
					{/* Header */}
					<div className="text-center mb-16">
						<div className={`space-y-4 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
							<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
								Simple, transparent pricing
							</h2>
							<p className="text-xl text-gray-600 max-w-2xl mx-auto">
								Choose the plan that works best for your team. All plans include a 14-day free trial.
							</p>
						</div>
					</div>

					{/* Pricing Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
						{plans.map((plan, index) => {
							const Icon = plan.icon;
							return (
								<Card
									key={plan.name}
									className={`
                    relative border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group
                    ${plan.popular ? "ring-2 ring-blue-500 scale-105 bg-gradient-to-br from-blue-50 to-white" : "hover:scale-105"}
                    ${isVisible ? "animate-slide-up opacity-100" : "opacity-0 translate-y-8"}
                  `}
									style={{ animationDelay: `${index * 150}ms` }}
								>
									{plan.popular && (
										<div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
											<div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1">
												<Star className="w-4 h-4" />
												Most Popular
											</div>
										</div>
									)}

									<CardContent className="p-8 relative">
										{/* Plan Icon */}
										<div
											className={`
                      w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-all duration-300
                      ${plan.popular ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}
                      group-hover:scale-110 group-hover:rotate-3
                    `}
										>
											<Icon className="h-6 w-6" />
										</div>

										{/* Plan Name */}
										<div className="flex items-center justify-between mb-2">
											<h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
										</div>

										{/* Plan Description */}
										<p className="text-gray-600 mb-6">{plan.description}</p>

										{/* Price */}
										<div className="mb-8">
											{plan.price !== null ? (
												<div className="flex items-baseline">
													<span className="text-4xl font-bold text-gray-900">${plan.price}</span>
													<span className="text-gray-600 ml-2">/user/month</span>
												</div>
											) : (
												<div className="text-4xl font-bold text-gray-900">Custom</div>
											)}
										</div>

										{/* Features */}
										<ul className="space-y-4 mb-8">
											{plan.features.map((feature, featureIndex) => (
												<li
													key={featureIndex}
													className={`
                            flex items-center transition-all duration-300
                            ${isVisible ? "animate-fade-in opacity-100" : "opacity-0"}
                          `}
													style={{ animationDelay: `${(index * 150) + (featureIndex * 100)}ms` }}
												>
													<CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
													<span className="text-gray-700">{feature}</span>
												</li>
											))}
										</ul>

										{/* CTA Button */}
										<Button
											variant={plan.buttonVariant}
											className={`
                        w-full transition-all duration-300 group-hover:shadow-lg
                        ${plan.popular ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200" : ""}
                      `}
											asChild
										>
											<Link href={plan.name === "Enterprise" ? "/contact" : "/sign-up"}>
												{plan.buttonText}
											</Link>
										</Button>

										{/* Background decoration */}
										<div
											className={`
                      absolute top-0 right-0 w-32 h-32 rounded-full transform translate-x-16 -translate-y-16 transition-all duration-700
                      ${plan.popular ? "bg-gradient-to-br from-blue-100 to-transparent" : "bg-gradient-to-br from-gray-100 to-transparent"}
                      group-hover:scale-150 opacity-50
                    `}
										/>
									</CardContent>
								</Card>
							);
						})}
					</div>

					{/* Additional Info */}
					<div
						className={`
            text-center mt-12 space-y-4
            ${isVisible ? "animate-fade-in-up opacity-100" : "opacity-0"}
          `}
						style={{ animationDelay: "800ms" }}
					>
						<p className="text-gray-600">
							All plans include SSL security, 99.9% uptime guarantee, and 24/7 support.
						</p>
						<div className="flex justify-center items-center gap-6 text-sm text-gray-500">
							<div className="flex items-center gap-2">
								<CheckCircle className="w-4 h-4 text-green-500" />
								<span>No setup fees</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle className="w-4 h-4 text-green-500" />
								<span>Cancel anytime</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle className="w-4 h-4 text-green-500" />
								<span>14-day free trial</span>
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
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
		</section>
	);
};
