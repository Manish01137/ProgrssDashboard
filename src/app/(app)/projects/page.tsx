"use client";

import { ProjectTracker } from "@/components/ProjectTracker";

export default function ProjectsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Freelance Projects</h1>
        <p className="text-sm text-neutral-500">
          Track gigs, deadlines, hours, and earnings.
        </p>
      </div>
      <ProjectTracker />
    </div>
  );
}
