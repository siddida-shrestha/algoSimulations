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
  description: string;
  controls: ReactNode;
  visualization: ReactNode;
  logs: ReactNode;
}

export function SimulationLayout({
  title,
  description,
  controls,
  visualization,
  logs,
}: SimulationLayoutProps) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:py-8">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {title}
            </h1>
            <p className="max-w-3xl text-muted-foreground">{description}</p>
          </div>

          <Link to="/">
            <Button variant="outline">Home</Button>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Controls</CardTitle>
            <CardDescription>
              Configure inputs and drive each step.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">{controls}</CardContent>
        </Card>

        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle>Visualization</CardTitle>
            <CardDescription>
              Point cloud, centroid state, and transitions.
            </CardDescription>
          </CardHeader>
          <CardContent>{visualization}</CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Logs & Insights</CardTitle>
            <CardDescription>
              Step details, metrics, and convergence notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">{logs}</CardContent>
        </Card>
      </section>
    </main>
  );
}
