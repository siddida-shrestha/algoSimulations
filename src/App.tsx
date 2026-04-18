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
          Clustering Simulation Playground
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Explore interactive clustering visualizations with reusable structure
          for future algorithms like KNN, DBSCAN, and more.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>K-Means Clustering</CardTitle>
            <CardDescription>
              Standard K-Means with controllable dataset size, stepping, and
              centroid movement logs.
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
            <CardTitle>K-Means++ Seeding + K-Means</CardTitle>
            <CardDescription>
              Step-by-step D(x)^2 weighted seeding with side-by-side comparison
              against random initialization.
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
