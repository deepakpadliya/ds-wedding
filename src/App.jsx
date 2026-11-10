import { Component, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "@/App.css";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import { Toaster } from "@/components/ui/sonner";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ivory px-6 text-center">
          <div>
            <p className="font-script text-4xl text-gold-deep">Something went astray</p>
            <p className="mt-3 text-sm text-brown/70">Please refresh the page to return to the celebration.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.__lenis = lenis;
    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);
  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Always open at the top (Hero) — don't let the browser restore an old scroll position on reload.
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);
  useEffect(() => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SmoothScroll />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Navigate to="/groom" replace />} />
          <Route path="/all" element={<Home key="all" />} />
          <Route path="/bride" element={<Home key="bride" side="bride" />} />
          <Route path="/groom" element={<Home key="groom" side="groom" />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/groom" replace />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
