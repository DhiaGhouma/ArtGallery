import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center liquid-bg">
      <div className="text-center animate-fade-in">
        <h1 className="mb-4 text-8xl font-bold gradient-text">404</h1>
        <p className="mb-4 text-2xl text-foreground">Oops! Page not found</p>
        <p className="mb-8 text-muted-foreground">This artwork seems to have vanished</p>
        <a href="/">
          <Button className="glow-effect">Return to Home</Button>
        </a>
      </div>
    </div>
  );
};

export default NotFound;
