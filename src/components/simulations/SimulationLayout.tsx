import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SimulationLayoutProps {
  title: string;
  controls: ReactNode;
  visualization: ReactNode;
  logs: ReactNode;
}

export function SimulationLayout({
  title,
  controls,
  visualization,
  logs,
}: SimulationLayoutProps) {
  return (
    <main className="flex h-screen w-screen flex-col gap-4 overflow-hidden px-4 py-4 md:px-6">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-2xl">
              {title}
            </h1>
          </div>

          <Link to="/">
            <Button variant="outline">Home</Button>
          </Link>
        </div>
      </header>

      <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="min-h-0 lg:col-span-3">
          <CardHeader>
            <CardTitle>Controls</CardTitle>
            <CardDescription>
              Configure inputs and drive each step.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 space-y-4 overflow-visible">
            {controls}
          </CardContent>
        </Card>

        <Card className="min-h-0 lg:col-span-6">
          <CardHeader>
            <CardTitle>Visualization</CardTitle>
            <CardDescription>
              Point cloud, centroid state, and transitions.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 overflow-auto">
            {visualization}
          </CardContent>
        </Card>

        <Card className="min-h-0 lg:col-span-3">
          <CardHeader>
            <CardTitle>Logs & Insights</CardTitle>
            <CardDescription>
              Step details, metrics, and convergence notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 space-y-3 overflow-auto">
            {logs}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
