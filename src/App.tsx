import { Link, Navigate, Route, Routes } from "react-router-dom";

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
import { KNNPage } from "@/pages/simulations/knn";
import { WeightedKNNPage } from "@/pages/simulations/weighted-knn";
import { AssociationAnalysisPage } from "@/pages/simulations/association-analysis";
import { SimpleNNPage } from "@/pages/simulations/neural-network-simple";

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

        <Card>
          <CardHeader>
            <CardTitle>K-Nearest Neighbors Classification</CardTitle>
            <CardDescription>
              Interactive visualization of 1-NN, K-NN, and n-NN algorithms with
              draggable query points and voting explanations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/simulations/knn">
              <Button>Open Simulation</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weighted K-Nearest Neighbors Classification</CardTitle>
            <CardDescription>
              Compare uniform KNN with distance-weighted variants. Demonstrates
              why inverse distance weighting is preferred over flawed assignment
              weighting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/simulations/weighted-knn">
              <Button>Open Simulation</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Association Analysis</CardTitle>
            <CardDescription>
              Explore support, confidence, and lift for item combinations using
              alphabet-based transaction datasets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/simulations/association-analysis">
              <Button>Open Simulation</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Neural Network (Forward Pass)</CardTitle>
            <CardDescription>
              Step-by-step visualization of single and multi-layer neural
              networks. Understand how data flows through hidden layers with
              different activation functions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/simulations/neural-network-simple">
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
      <Route path="/simulations/knn" element={<KNNPage />} />
      <Route path="/simulations/weighted-knn" element={<WeightedKNNPage />} />
      <Route
        path="/simulations/association-analysis"
        element={<AssociationAnalysisPage />}
      />
      <Route
        path="/simulations/neural-network-simple"
        element={<SimpleNNPage />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
