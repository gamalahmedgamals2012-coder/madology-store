delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
const REGISTER_API_BASE_URL =
  window.MADOLOGY_GET_API_BASE_URL?.() || window.MADOLOGY_API_BASE_URL || "";

const mapElement = document.getElementById("addressMap");
const searchInput = document.getElementById("addressSearch");
const searchResults = document.getElementById("addressSearchResults");
const addressInput = document.getElementById("address");
const latitudeInput = document.getElementById("latitude");
const longitudeInput = document.getElementById("longitude");

const DEFAULT_MAP_CENTER = [29.0729812, 31.0982562];
const DEFAULT_ZOOM = 14;

let map = null;
let marker = null;
let debounceTimer = null;
let reverseDebounceTimer = null;
let requestToken = 0;
let activeController = null;
let resultsCache = [];
const searchCache = new Map();
const reverseCache = new Map();
let mapInitialized = false;

if (window.L?.Icon?.Default) {
  L.Icon.Default.mergeOptions({
    iconUrl:
      "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:
      "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setStatus(message) {
  if (typeof window.MADOLOGY_SET_ADDRESS_STATUS === "function") {
    window.MADOLOGY_SET_ADDRESS_STATUS(message);
  }
}

function clearResults() {
  resultsCache = [];

  if (searchResults) {
    searchResults.innerHTML = "";
    searchResults.hidden = true;
  }
}

function clearSelection() {
  window.MADOLOGY_SELECTED_LOCATION = null;

  if (addressInput) {
    addressInput.value = "";
    addressInput.dataset.locationSelected = "false";
  }

  if (latitudeInput) {
    latitudeInput.value = "";
  }

  if (longitudeInput) {
    longitudeInput.value = "";
  }

  if (marker) {
    marker.setOpacity(0);
  }

  setStatus("Search for an address or click on the map.");
}

function applySelection(location, focusMap = true) {
  if (!location || !map || !marker) {
    return;
  }

  clearResults();

  const addressDetails = location.addressDetails || {};

  window.MADOLOGY_SELECTED_LOCATION = {
    formattedAddress: location.formattedAddress,
    latitude: location.latitude,
    longitude: location.longitude,
    addressDetails: {
      city: addressDetails.city || "",
      state: addressDetails.state || "",
      country: addressDetails.country || "",
      postalCode: addressDetails.postalCode || "",
    },
  };

  if (addressInput) {
    addressInput.value = location.formattedAddress;
    addressInput.dataset.locationSelected = "true";
  }

  if (searchInput) {
    searchInput.value = location.formattedAddress;
  }

  if (latitudeInput) {
    latitudeInput.value = String(location.latitude);
  }

  if (longitudeInput) {
    longitudeInput.value = String(location.longitude);
  }

  marker.setLatLng([location.latitude, location.longitude]);
  marker.setOpacity(1);

  if (focusMap) {
    map.setView([location.latitude, location.longitude], 16);
  }

  setStatus("Location selected.");
}

function renderResults(results) {
  resultsCache = Array.isArray(results) ? results : [];

  if (!searchResults) {
    return;
  }

  if (!resultsCache.length) {
    searchResults.innerHTML = "";
    searchResults.hidden = true;
    return;
  }

  searchResults.innerHTML = resultsCache
    .map((result, index) => {
      const subtitle = [
        result.addressDetails?.city,
        result.addressDetails?.state,
        result.addressDetails?.country,
      ]
        .filter(Boolean)
        .join(", ");

      return `
        <button type="button" data-result-index="${index}">
          <span>${escapeHtml(result.formattedAddress)}</span>
          <small>${escapeHtml(subtitle)}</small>
        </button>
      `;
    })
    .join("");

  searchResults.hidden = false;
}

async function fetchJson(path) {
  if (activeController) {
    activeController.abort();
  }

  activeController = new AbortController();

  const response = await fetch(`${REGISTER_API_BASE_URL}${path}`, {
    signal: activeController.signal,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

async function searchAddresses(query) {
  const trimmedQuery = String(query || "").trim();

  if (trimmedQuery.length < 3) {
    clearResults();
    setStatus(
      trimmedQuery
        ? "Search for at least 3 characters."
        : "Search for an address or click on the map.",
    );
    return;
  }

  const currentRequest = ++requestToken;
  setStatus("Searching addresses...");

  try {
    if (searchCache.has(trimmedQuery)) {
      if (currentRequest !== requestToken) {
        return;
      }

      renderResults(searchCache.get(trimmedQuery));
      setStatus(
        searchCache.get(trimmedQuery).length
          ? "Select a result or click on the map."
          : "No matching address found.",
      );
      return;
    }

    const data = await fetchJson(
      `/location/search?q=${encodeURIComponent(trimmedQuery)}`,
    );

    if (currentRequest !== requestToken) {
      return;
    }

    const results = Array.isArray(data.results) ? data.results : [];
    searchCache.set(trimmedQuery, results);
    renderResults(results);

    if (!results.length) {
      setStatus("No matching address found.");
    } else {
      setStatus("Select a result or click on the map.");
    }
  } catch (error) {
    if (currentRequest !== requestToken) {
      return;
    }

    clearResults();
    setStatus(error.message || "Address search failed.");
  }
}

async function reverseGeocode(latitude, longitude) {
  const cacheKey = `${latitude},${longitude}`;
  const currentRequest = ++requestToken;
  setStatus("Resolving address...");

  try {
    if (reverseCache.has(cacheKey)) {
      if (currentRequest !== requestToken) {
        return;
      }

      const cachedLocation = reverseCache.get(cacheKey);
      if (cachedLocation) {
        applySelection(cachedLocation, false);
      } else {
        setStatus("No address found for that location.");
      }
      return;
    }

    const data = await fetchJson(
      `/location/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
    );

    if (currentRequest !== requestToken) {
      return;
    }

    if (data.location) {
      reverseCache.set(cacheKey, data.location);
      applySelection(data.location, false);
    } else {
      reverseCache.set(cacheKey, null);
      setStatus("No address found for that location.");
    }
  } catch (error) {
    if (currentRequest !== requestToken) {
      return;
    }

    if (error?.name === "AbortError") {
      return;
    }

    setStatus(error.message || "Could not resolve address.");
  }
}

function initMap() {
  if (mapInitialized) {
    return;
  }

  mapInitialized = true;

  if (!mapElement || !window.L) {
    if (mapElement) {
      mapElement.textContent = "Map is unavailable right now.";
    }
    setStatus("Map failed to load.");
    return;
  }

  map = L.map("addressMap", {
    zoomControl: true,
    scrollWheelZoom: true,
  }).setView(DEFAULT_MAP_CENTER, DEFAULT_ZOOM);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    keepBuffer: 8,
    updateWhenIdle: true,
    updateWhenZooming: false,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  marker = L.marker(DEFAULT_MAP_CENTER, {
    draggable: true,
    opacity: 0,
  }).addTo(map);

  map.whenReady(() => {
    requestAnimationFrame(() => {
      map.invalidateSize({ animate: false });
      setStatus("Search for an address or click on the map.");
    });
  });

  searchInput?.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      clearSelection();
      searchAddresses(searchInput.value || "");
    }, 300);
  });

  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      clearTimeout(debounceTimer);
      searchAddresses(searchInput.value || "");
    }
  });

  searchResults?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-result-index]");

    if (!button) {
      return;
    }

    const index = Number(button.dataset.resultIndex);
    const selected = resultsCache[index];

    if (selected) {
      searchInput.value = selected.formattedAddress;
      applySelection(selected);
      clearResults();
    }
  });

  marker.on("dragend", () => {
    const { lat, lng } = marker.getLatLng();
    clearTimeout(reverseDebounceTimer);
    reverseDebounceTimer = setTimeout(() => {
      reverseGeocode(lat, lng);
    }, 250);
  });

  map.on("click", (event) => {
    const { lat, lng } = event.latlng;
    marker.setOpacity(1);
    marker.setLatLng([lat, lng]);
    clearTimeout(reverseDebounceTimer);
    reverseDebounceTimer = setTimeout(() => {
      reverseGeocode(lat, lng);
    }, 250);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMap);
} else {
  initMap();
}
