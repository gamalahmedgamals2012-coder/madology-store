let addressMap;
let addressMarker;
let addressGeocoder;

const DEFAULT_MAP_CENTER = { lat: 29.0661, lng: 31.0994 };

// Loads the Google Maps JavaScript API after the page has defined the API key.
function loadGoogleMapsScript() {
  const mapElement = document.getElementById("addressMap");
  const apiKey = window.MADOLOGY_GOOGLE_MAPS_API_KEY;

  if (!mapElement) return;

  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY") {
    mapElement.textContent = "Add your Google Maps API key to enable address selection.";
    return;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=initAddressPicker`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

// Marks the current address as unconfirmed when the user edits the search text.
function resetSelectedAddress() {
  const addressInput = document.getElementById("address");
  const latitudeInput = document.getElementById("latitude");
  const longitudeInput = document.getElementById("longitude");

  if (!addressInput || !latitudeInput || !longitudeInput) return;

  addressInput.value = "";
  addressInput.dataset.locationSelected = "false";
  latitudeInput.value = "";
  longitudeInput.value = "";
}

// Saves the selected Google Maps location into the existing registration fields.
function setSelectedAddress(formattedAddress, location) {
  const addressInput = document.getElementById("address");
  const latitudeInput = document.getElementById("latitude");
  const longitudeInput = document.getElementById("longitude");

  if (!addressInput || !latitudeInput || !longitudeInput || !location) return;

  addressInput.value = formattedAddress || `${location.lat().toFixed(6)}, ${location.lng().toFixed(6)}`;
  addressInput.dataset.locationSelected = "true";
  latitudeInput.value = location.lat();
  longitudeInput.value = location.lng();
}

// Converts a clicked or dragged marker position into a formatted address.
function reverseGeocodeLocation(location) {
  addressGeocoder.geocode({ location }, (results, status) => {
    if (status === "OK" && results && results[0]) {
      setSelectedAddress(results[0].formatted_address, location);
      return;
    }

    setSelectedAddress("", location);
  });
}

// Initializes the map, Places autocomplete, marker dragging, and map click selection.
function initAddressPicker() {
  const searchInput = document.getElementById("addressSearch");
  const mapElement = document.getElementById("addressMap");

  if (!searchInput || !mapElement || !window.google) return;

  addressGeocoder = new google.maps.Geocoder();
  addressMap = new google.maps.Map(mapElement, {
    center: DEFAULT_MAP_CENTER,
    zoom: 13,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false
  });

  addressMarker = new google.maps.Marker({
    map: addressMap,
    position: DEFAULT_MAP_CENTER,
    draggable: true,
    visible: false
  });

  const autocomplete = new google.maps.places.Autocomplete(searchInput, {
    fields: ["formatted_address", "geometry", "name"]
  });

  autocomplete.bindTo("bounds", addressMap);

  searchInput.addEventListener("input", resetSelectedAddress);

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();

    if (!place.geometry || !place.geometry.location) {
      resetSelectedAddress();
      return;
    }

    const location = place.geometry.location;
    addressMap.panTo(location);
    addressMap.setZoom(16);
    addressMarker.setPosition(location);
    addressMarker.setVisible(true);
    setSelectedAddress(place.formatted_address || place.name, location);
  });

  addressMarker.addListener("dragend", () => {
    reverseGeocodeLocation(addressMarker.getPosition());
  });

  addressMap.addListener("click", (event) => {
    addressMarker.setPosition(event.latLng);
    addressMarker.setVisible(true);
    reverseGeocodeLocation(event.latLng);
  });
}

window.initAddressPicker = initAddressPicker;
document.addEventListener("DOMContentLoaded", loadGoogleMapsScript);
