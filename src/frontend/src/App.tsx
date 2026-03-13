import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from "@tanstack/react-router";
import { Component, type ReactNode } from "react";
import ChatbotWidget from "./components/ChatbotWidget";
import DiamondRain from "./components/DiamondRain";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import SupportChat from "./components/SupportChat";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";
import Admin from "./pages/Admin";
import Landing from "./pages/Landing";
import Orders from "./pages/Orders";
import Portfolio from "./pages/Portfolio";
import Submit from "./pages/Submit";
import Terms from "./pages/Terms";

function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">Oops, kuch galat ho gaya</h1>
        <p className="text-muted-foreground mb-6">
          App load nahi ho payi. Please page reload karo.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
        >
          Reload App
        </button>
      </div>
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

function RootLayout() {
  const routerState = useRouterState();
  const isAdmin = routerState.location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DiamondRain />
      {!isAdmin && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isAdmin && <Footer />}
      <Toaster richColors position="top-right" />
      {!isAdmin && <ChatbotWidget />}
      {!isAdmin && <SupportChat />}
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
  errorComponent: ErrorFallback,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Landing,
  errorComponent: ErrorFallback,
});

const submitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/submit",
  component: Submit,
  errorComponent: ErrorFallback,
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: Orders,
  errorComponent: ErrorFallback,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: Admin,
  errorComponent: ErrorFallback,
});

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portfolio",
  component: Portfolio,
  errorComponent: ErrorFallback,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: Terms,
  errorComponent: ErrorFallback,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  submitRoute,
  ordersRoute,
  adminRoute,
  portfolioRoute,
  termsRoute,
]);

const router = createRouter({
  routeTree,
  defaultErrorComponent: ErrorFallback,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <InternetIdentityProvider>
        <RouterProvider router={router} />
      </InternetIdentityProvider>
    </AppErrorBoundary>
  );
}
