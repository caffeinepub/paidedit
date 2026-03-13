import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2, LogIn, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin } from "../hooks/useQueries";

export default function Navbar() {
  const { login, clear, loginStatus, identity, isLoggingIn } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: isAdmin } = useIsAdmin();
  const isAuthenticated = !!identity;
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (err: any) {
        if (err?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 group"
          data-ocid="nav.link"
        >
          <img
            src="/assets/generated/paidedit-logo-transparent.dim_200x200.png"
            alt="PAIDEDIT"
            className="w-8 h-8 rounded-lg"
          />
          <span className="font-display font-bold text-xl tracking-tight">
            <span className="gradient-text">PAID</span>
            <span className="text-foreground">EDIT</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="nav.link"
          >
            Home
          </Link>
          <Link
            to="/portfolio"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="portfolio.link"
          >
            Portfolio
          </Link>
          <Link
            to="/submit"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="submit.link"
          >
            Submit Video
          </Link>
          <Link
            to="/orders"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="orders.link"
          >
            My Orders
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="admin.link"
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Auth Button */}
        <div className="hidden md:flex items-center gap-3">
          {loginStatus === "initializing" ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Button
              onClick={handleAuth}
              disabled={isLoggingIn}
              variant={isAuthenticated ? "outline" : "default"}
              size="sm"
              className={
                isAuthenticated
                  ? ""
                  : "gradient-primary border-0 text-white hover:opacity-90"
              }
              data-ocid="nav.primary_button"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isAuthenticated ? (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </>
              )}
            </Button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3">
          <Link
            to="/"
            className="block text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMenuOpen(false)}
            data-ocid="mobile.nav.link"
          >
            Home
          </Link>
          <Link
            to="/portfolio"
            className="block text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMenuOpen(false)}
            data-ocid="mobile.portfolio.link"
          >
            Portfolio
          </Link>
          <Link
            to="/submit"
            className="block text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMenuOpen(false)}
            data-ocid="mobile.submit.link"
          >
            Submit Video
          </Link>
          <Link
            to="/orders"
            className="block text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMenuOpen(false)}
            data-ocid="mobile.orders.link"
          >
            My Orders
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="block text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMenuOpen(false)}
              data-ocid="mobile.admin.link"
            >
              Admin
            </Link>
          )}
          <Button
            onClick={() => {
              handleAuth();
              setMenuOpen(false);
            }}
            disabled={isLoggingIn}
            variant={isAuthenticated ? "outline" : "default"}
            size="sm"
            className={`w-full mt-2 ${!isAuthenticated ? "gradient-primary border-0 text-white" : ""}`}
            data-ocid="mobile.nav.primary_button"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isAuthenticated ? (
              "Logout"
            ) : (
              "Login"
            )}
          </Button>
        </div>
      )}
    </header>
  );
}
