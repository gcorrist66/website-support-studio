const DEFAULT_GA4_ID = "G-BQJ2J9K94D";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function readMeasurementId(): string {
  const env = (import.meta as { env?: { VITE_GA4_ID?: string } }).env ?? {};
  return env.VITE_GA4_ID?.trim() || DEFAULT_GA4_ID;
}

export function initAnalytics(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const measurementId = readMeasurementId();
  if (!measurementId || document.querySelector(`script[data-wss-ga4="${measurementId}"]`)) {
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtagShim() {
    window.dataLayer?.push(arguments);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.wssGa4 = measurementId;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", measurementId, { anonymize_ip: true, send_page_view: false });
}

export function trackPageView(path: string, title = document.title): void {
  if (typeof window === "undefined") {
    return;
  }
  initAnalytics();
  const measurementId = readMeasurementId();
  window.gtag?.("event", "page_view", {
    send_to: measurementId,
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  });
}

export function trackEvent(eventName: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || !eventName) {
    return;
  }
  initAnalytics();
  const measurementId = readMeasurementId();
  window.gtag?.("event", eventName, {
    send_to: measurementId,
    ...params,
  });
}
