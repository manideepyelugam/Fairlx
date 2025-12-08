"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/Separator";
import { Rocket, Building2, Users, Workflow, ShieldCheck, Sparkle, LucideIcon } from "lucide-react";

type Step = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

const steps: Step[] = [
  {
    title: "Create a Space",
    description: "Name it for a department, product line, or client and set a short key like ENG or MKT.",
    icon: Building2,
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Add Projects",
    description: "Group initiatives inside the space. Project keys inherit the space prefix automatically.",
    icon: Workflow,
    accent: "bg-sky-100 text-sky-700",
  },
  {
    title: "Invite Your Team",
    description: "Assign members and set permissions so the right people see the right work.",
    icon: Users,
    accent: "bg-amber-100 text-amber-700",
  },
  {
    title: "Work Together",
    description: "Create work items, track progress, and link related tasks across projects.",
    icon: ShieldCheck,
    accent: "bg-indigo-100 text-indigo-700",
  },
];

const useCases = [
  "Multiple departments (ENG, MKT, CS, HR)",
  "Separate product lines or client accounts",
  "Different workflows or reporting needs",
  "50+ people needing clear boundaries",
];

const avoidCases = [
  "Single small team on one product",
  "Temporary one-off initiatives",
  "When project-level separation is enough",
];

export const SpacesGuide = () => {
  return (
    <div className="space-y-4">
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-slate-50">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Sparkle className="h-4 w-4 text-amber-300" />
              What is a Space?
            </CardTitle>
            <p className="mt-1 text-sm text-slate-200/80">
              A high-level container for a department, product line, or client. Spaces keep projects, teams, and workflows neatly separated.
            </p>
          </div>
          <Badge className="bg-white/10 text-amber-200 border-amber-200/30">Prefixes items (ENG-123)</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <p className="font-semibold text-white">Great for</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {[
                "Departments",
                "Product lines",
                "Client pods",
              ].map((item) => (
                <Badge key={item} variant="outline" className="border-white/30 text-white/90">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <p className="font-semibold text-white">What it does</p>
            <ul className="mt-2 space-y-1 text-slate-100/80">
              <li>• Prefixes all work (ENG-123)</li>
              <li>• Groups related projects</li>
              <li>• Scopes permissions & visibility</li>
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <p className="font-semibold text-white">When to pick</p>
            <ul className="mt-2 space-y-1 text-slate-100/80">
              <li>• Different teams/processes</li>
              <li>• Separate reporting</li>
              <li>• Clear ownership lines</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How to set up (4 quick steps)</CardTitle>
            <p className="text-sm text-muted-foreground">Launch a new space and get your team productive in minutes.</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-lg border bg-muted/40 p-3 shadow-sm">
                    <div className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold ${step.accent}`}>
                      <Icon className="h-4 w-4" />
                      {step.title}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Is a Space right for this?</CardTitle>
            <p className="text-sm text-muted-foreground">Quick guidance before you create one.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-600">Use a Space when</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {useCases.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-semibold uppercase text-rose-600">Skip it when</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {avoidCases.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">How Spaces organize your work</CardTitle>
          <p className="text-sm text-muted-foreground">A quick, visual map for new users.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-xl border bg-muted/40 p-4">
              <div className="text-xs font-semibold text-muted-foreground">Workspace</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {["ENG", "MKT", "CS", "HR"].map((spaceKey, idx) => (
                  <div key={spaceKey} className="rounded-lg border bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">Space {spaceKey}</p>
                        <p className="text-xs text-muted-foreground">Dept/Product/Client</p>
                      </div>
                      <Badge variant="secondary" className="text-[11px]">{spaceKey}-123</Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {["Project A", "Project B", "Project C"].slice(0, idx % 3 + 2).map((project) => (
                        <div key={project} className="rounded-md border bg-muted/40 px-2 py-1 text-xs">
                          {project}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4">
              <div className="flex items-center gap-2 rounded-lg border bg-white p-3 shadow-sm">
                <Rocket className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-semibold">Spaces speed up onboarding</p>
                  <p className="text-xs text-muted-foreground">New teammates instantly see which work belongs where.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-white p-3 shadow-sm">
                <Workflow className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold">Workflows stay scoped</p>
                  <p className="text-xs text-muted-foreground">Each space can have its own workflow rules and reporting.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-white p-3 shadow-sm">
                <ShieldCheck className="h-5 w-5 text-sky-600" />
                <div>
                  <p className="text-sm font-semibold">Permissioned visibility</p>
                  <p className="text-xs text-muted-foreground">Limit access to sensitive areas without blocking collaboration.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-white p-3 shadow-sm">
                <Users className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold">Cross-team alignment</p>
                  <p className="text-xs text-muted-foreground">Spaces keep shared terminology and keys consistent.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 rounded-lg bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Ready to create a Space?</p>
            <p className="text-xs text-muted-foreground">Pick a clear name, choose a short key, and invite your team.</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">Examples: ENG, MKT, CLIENT-A</Badge>
            <Badge variant="secondary" className="text-xs">Prefixes work items automatically</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
