import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { initAnalytics, trackEvent, trackPageView } from "../../analytics/ga4";

export function AppAnalytics() {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    trackPageView(path);
    if (location.pathname === "/login") {
      trackEvent("login_page_view");
    }
    if (location.search.includes("checkout=success")) {
      trackEvent("checkout_success_page_view");
    }
  }, [location.pathname, location.search]);

  return null;
}
