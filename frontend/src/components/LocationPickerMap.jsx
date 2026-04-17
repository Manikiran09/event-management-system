import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const defaultCenter = { lat: 20.5937, lng: 78.9629 };
const institutionHintTerms = ["college", "university", "institute", "school", "company", "organization", "office", "campus"];
const geocodeLanguage = "en";

const rankSuggestion = (displayName = "") => {
  const value = displayName.toLowerCase();
  return institutionHintTerms.reduce((score, term) => (value.includes(term) ? score + 1 : score), 0);
};

const buildEnglishAddressLabel = (item) => {
  const address = item?.address || {};
  const labelParts = [
    address.road,
    address.suburb,
    address.city || address.town || address.village || address.county,
    address.state,
    address.country,
  ].filter(Boolean);

  return labelParts.join(", ") || item?.display_name || "Unknown place";
};

const normalizeNominatimItem = (item) => ({
  place_id: `n-${item.place_id}`,
  display_name: buildEnglishAddressLabel(item),
  lat: Number(item.lat),
  lon: Number(item.lon),
});

const normalizePhotonItem = (feature) => {
  const props = feature.properties || {};
  const coords = feature.geometry?.coordinates || [];
  const labelParts = [props.name, props.city, props.state, props.country].filter(Boolean);

  return {
    place_id: `p-${props.osm_id || `${coords[1]}-${coords[0]}`}`,
    display_name: labelParts.join(", ") || props.name || "Unknown place",
    lat: Number(coords[1]),
    lon: Number(coords[0]),
  };
};

const MapClickSelector = ({ onSelect }) => {
  useMapEvents({
    async click(event) {
      const lat = event.latlng.lat;
      const lng = event.latlng.lng;

      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=${geocodeLanguage}&lat=${lat}&lon=${lng}`;
        const response = await fetch(url);
        const payload = await response.json();
        const label = buildEnglishAddressLabel(payload) || `Pinned (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        onSelect({ label, lat, lng });
      } catch {
        onSelect({ label: `Pinned (${lat.toFixed(5)}, ${lng.toFixed(5)})`, lat, lng });
      }
    },
  });

  return null;
};

const LocationPickerMap = ({ locationValue, coordinates, onLocationChange, onCoordinatesChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const query = locationValue.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    const fetchSuggestions = async () => {
      setSearching(true);
      try {
        const genericUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&accept-language=${geocodeLanguage}&limit=8&q=${encodeURIComponent(query)}`;
        const institutionUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&accept-language=${geocodeLanguage}&limit=8&q=${encodeURIComponent(`${query} ${institutionHintTerms.join(" ")}`)}`;
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=${geocodeLanguage}&limit=8`;

        const [genericResponse, institutionResponse, photonResponse] = await Promise.allSettled([
          fetch(genericUrl, { signal: controller.signal }),
          fetch(institutionUrl, { signal: controller.signal }),
          fetch(photonUrl, { signal: controller.signal }),
        ]);

        const genericPayload = genericResponse.status === "fulfilled"
          ? await genericResponse.value.json()
          : [];

        const institutionPayload = institutionResponse.status === "fulfilled"
          ? await institutionResponse.value.json()
          : [];

        const photonPayload = photonResponse.status === "fulfilled"
          ? await photonResponse.value.json()
          : { features: [] };

        const nominatimItems = [
          ...(Array.isArray(genericPayload) ? genericPayload : []),
          ...(Array.isArray(institutionPayload) ? institutionPayload : []),
        ].map(normalizeNominatimItem);

        const photonItems = (Array.isArray(photonPayload.features) ? photonPayload.features : [])
          .map(normalizePhotonItem)
          .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));

        const merged = [...nominatimItems, ...photonItems];
        const unique = Array.from(new Map(merged.map((item) => [item.display_name.toLowerCase(), item])).values());
        unique.sort((a, b) => rankSuggestion(b.display_name) - rankSuggestion(a.display_name));
        setSuggestions(unique.slice(0, 8));
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [locationValue]);

  const activeCoordinates = useMemo(() => {
    if (coordinates?.lat != null && coordinates?.lng != null) {
      return { lat: Number(coordinates.lat), lng: Number(coordinates.lng) };
    }
    return defaultCenter;
  }, [coordinates]);

  const handleSuggestionSelect = (suggestion) => {
    onLocationChange(suggestion.display_name || "");
    onCoordinatesChange({
      lat: Number(suggestion.lat),
      lng: Number(suggestion.lon),
    });
    setSuggestions([]);
  };

  return (
    <div className="space-y-3 md:col-span-2">
      <input
        className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
        name="location"
        placeholder="Type location and choose from map"
        value={locationValue}
        onChange={(event) => onLocationChange(event.target.value)}
        required
      />

      {(searching || suggestions.length > 0) ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {searching ? <p className="px-2 py-2 text-sm text-slate-500">Searching location...</p> : null}
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              className="block w-full rounded-xl px-2 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              {suggestion.display_name}
            </button>
          ))}
        </div>
      ) : null}

      {!searching && locationValue.trim().length >= 2 && suggestions.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          No results yet. Try adding city/state or click map to pin exact location.
        </p>
      ) : null}

      <div className="h-64 overflow-hidden rounded-2xl border border-slate-200">
        <MapContainer center={[activeCoordinates.lat, activeCoordinates.lng]} zoom={coordinates ? 13 : 4} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='Tiles &copy; Esri, HERE, Garmin, FAO, NOAA, USGS, OpenStreetMap contributors'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          />
          <MapClickSelector
            onSelect={({ label, lat, lng }) => {
              onLocationChange(label);
              onCoordinatesChange({ lat, lng });
            }}
          />
          {coordinates?.lat != null && coordinates?.lng != null ? (
            <Marker position={[Number(coordinates.lat), Number(coordinates.lng)]} />
          ) : null}
        </MapContainer>
      </div>
      <p className="text-xs text-slate-500">Click on map to pin location or pick a suggested place.</p>
    </div>
  );
};

export default LocationPickerMap;
