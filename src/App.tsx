import { Link, Navigate, Route, Routes } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KMeansPage } from "@/pages/simulations/kmeans";
import { KMeansPlusPlusPage } from "@/pages/simulations/kmeans-plus-plus";

function SimulationsHome() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-6">
      <header className="space-y-2">
        <Badge variant="secondary">Algorithm Lab</Badge>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Simulation Playground
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Explore interactive algorithm simulations. This structure is designed
          for easy additions like K-Means++, KNN, and DBSCAN.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>K-Means Clustering</CardTitle>
            <CardDescription>
              Visualize assignment and centroid update steps with iteration
              tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/simulations/kmeans">
              <Button>Open Simulation</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>K-Means++ Initialization</CardTitle>
            <CardDescription>
              Step-by-step probabilistic centroid seeding with random-vs-K++
              comparison.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/simulations/kmeans-plus-plus">
              <Button>Open Simulation</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<SimulationsHome />} />
      <Route path="/simulations/kmeans" element={<KMeansPage />} />
      <Route
        path="/simulations/kmeans-plus-plus"
        element={<KMeansPlusPlusPage />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
