import { Navigate, useLocation } from "react-router-dom";

/**
 * Redirects old /games/* routes to /hub/games/*
 * Preserves the full path including sub-routes
 */
export function GameRouteRedirect() {
  const location = useLocation();
  // Extract the path after /games/ and redirect to /hub/games/[same path]
  const newPath = `/hub${location.pathname}`;
  return <Navigate to={newPath} replace />;
}

