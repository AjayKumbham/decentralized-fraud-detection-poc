
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center max-w-md">
        <div className="text-9xl font-bold text-blue mb-2">404</div>
        <h1 className="text-3xl font-bold mb-4 text-navy">Page Not Found</h1>
        <p className="text-lg text-slate-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/">
            <Button size="lg">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
