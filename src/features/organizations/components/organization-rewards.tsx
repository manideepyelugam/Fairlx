"use client";

import { Gift, Star, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RedeemCouponCard } from "@/features/github-rewards/components/RedeemCouponCard";

interface OrganizationRewardsProps {
    organizationId: string;
}

export const OrganizationRewards = ({ organizationId }: OrganizationRewardsProps) => {
    return (
        <div className="flex flex-col gap-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Organization Rewards</h2>
                    <p className="text-sm text-muted-foreground">
                        Redeem reward coupons for your organization wallet
                    </p>
                </div>
                <Badge variant="secondary" className="gap-1.5">
                    <Gift className="h-3 w-3" />
                    Org Rewards
                </Badge>
            </div>
            <Separator />

            {/* Redeem Coupon Card */}
            <RedeemCouponCard
                workspaceId="organization-scope" // Scoped to org
                organizationId={organizationId}
            />

            {/* How to Get a Coupon */}
            <Card className="border shadow-none bg-muted/30">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        How to Get a Coupon
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Earn free credits by supporting Fairlx on GitHub
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                                1
                            </div>
                            <div>
                                <p className="text-xs font-medium">Visit the Star Reward page</p>
                                <p className="text-[10px] text-muted-foreground">
                                    Go to our landing page and start the reward flow
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                                2
                            </div>
                            <div>
                                <p className="text-xs font-medium">Connect GitHub & star the repo</p>
                                <p className="text-[10px] text-muted-foreground">
                                    Authenticate with GitHub and star our repository
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                                3
                            </div>
                            <div>
                                <p className="text-xs font-medium">Get your coupon & redeem here</p>
                                <p className="text-[10px] text-muted-foreground">
                                    Receive a FAIRLX-XXXXXXXX code and paste it above
                                </p>
                            </div>
                        </div>

                        <a
                            href="https://fairlx.com/star-reward"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                        >
                            <Button variant="outline" size="sm" className="w-full mt-2 gap-2 text-xs">
                                <Star className="h-3.5 w-3.5" />
                                Get Your Coupon
                                <ExternalLink className="h-3 w-3" />
                            </Button>
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
