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
    <main className="min-h-screen w-full px-4 py-6 md:px-8 md:py-8">
      <header className="space-y-3">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          AlgoSimulation{" "}
        </h1>
        <p className="max-w-4xl text-muted-foreground md:text-base">
          Select the algo you want to explore.
        </p>
      </header>

      <section className="mt-6 grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
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
