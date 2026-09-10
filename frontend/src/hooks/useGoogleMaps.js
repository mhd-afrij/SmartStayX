// useGoogleMaps — Lazily injects the Google Maps JavaScript API once and
// exposes { isLoaded, error, load }. The live map key comes only from
// import.meta.env.VITE_GOOGLE_MAPS_API_KEY (gitignored); the backend never
// shares its server key with the browser.
import { useCallback, useState } from "react";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

let sharedLoad = null;

const injectLoader = (key) =>
  new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve(window.google.maps);
      return;
    }
    const onReady = () => {
      window.removeEventListener("tripMapsReady", onReady);
      window.removeEventListener("tripMapsError", onError);
      resolve(window.google.maps);
    };
    const onError = () => {
      window.removeEventListener("tripMapsReady", onReady);
      window.removeEventListener("tripMapsError", onError);
      reject(new Error("Google Maps failed to load."));
    };
    window.addEventListener("tripMapsReady", onReady);
    window.addEventListener("tripMapsError", onError);

    if (document.getElementById("trip-planner-google-maps")) {
      return;
    }
    window.__gmReady = () => {
      const evt = new Event("tripMapsReady");
      window.dispatchEvent(evt);
    };
    window.__gmError = () => {
      const evt = new Event("tripMapsError");
      window.dispatchEvent(evt);
    };

    const script = document.createElement("script");
    script.async = true;
    script.id = "trip-planner-google-maps";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=places,geometry,directions&callback=__gmReady`;
    script.onerror = () => {
      const evt = new Event("tripMapsError");
      window.dispatchEvent(evt);
    };
    document.head.appendChild(script);
  });

const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (force = false) => {
    if (!MAPS_KEY) {
      setError("maps-key-missing");
      return false;
    }
    if (force) {
      sharedLoad = null;
      document.getElementById("trip-planner-google-maps")?.remove();
      delete window.__gmReady;
      delete window.__gmError;
    }
    if (!sharedLoad) sharedLoad = injectLoader(MAPS_KEY);
    try {
      await sharedLoad;
      setIsLoaded(true);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  return { isLoaded, error, load };
};

export default useGoogleMaps;
export { MAPS_KEY };