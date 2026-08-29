const asyncHandler = require("../middleware/async.middleware");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLatitude(value) {
  const latitude = Number(value);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw createError("Latitude must be a number between -90 and 90.", 400);
  }

  return latitude;
}

function normalizeLongitude(value) {
  const longitude = Number(value);

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw createError("Longitude must be a number between -180 and 180.", 400);
  }

  return longitude;
}

function normalizeAddressDetails(addressDetails) {
  if (addressDetails === undefined || addressDetails === null) {
    return undefined;
  }

  if (!addressDetails || typeof addressDetails !== "object" || Array.isArray(addressDetails)) {
    throw createError("Address details must be an object.", 400);
  }

  const city = normalizeText(addressDetails.city);
  const state = normalizeText(addressDetails.state);
  const country = normalizeText(addressDetails.country);
  const postalCode = normalizeText(addressDetails.postalCode);

  if (!city && !state && !country && !postalCode) {
    return undefined;
  }

  return {
    city,
    state,
    country,
    postalCode
  };
}

function summarizeLocation(result) {
  const address = result.address || {};
  const latitude = Number(result.lat ?? result.latitude);
  const longitude = Number(result.lon ?? result.longitude);

  return {
    id: String(result.place_id ?? `${latitude},${longitude}`),
    displayName: normalizeText(result.display_name),
    formattedAddress: normalizeText(result.display_name),
    latitude,
    longitude,
    addressDetails: {
      city: normalizeText(address.city || address.town || address.village || address.county),
      state: normalizeText(address.state || address.region || address.province),
      country: normalizeText(address.country),
      postalCode: normalizeText(address.postcode)
    }
  };
}

async function fetchNominatim(path, params) {
  const baseUrl = "https://nominatim.openstreetmap.org";
  const url = `${baseUrl}${path}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      "User-Agent": "MADOLOGY/1.0"
    }
  });

  if (!response.ok) {
    throw createError("Location service is temporarily unavailable.", 502);
  }

  try {
    return await response.json();
  } catch (error) {
    throw createError("Location service returned an invalid response.", 502);
  }
}

const searchLocations = asyncHandler(async (req, res) => {
  const query = normalizeText(req.query.q);

  if (query.length < 3) {
    throw createError("Enter at least 3 characters to search.", 400);
  }

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "5"
  });

  const results = await fetchNominatim("/search", params);

  res.json({
    success: true,
    results: Array.isArray(results) ? results.map(summarizeLocation) : []
  });
});

const reverseLocation = asyncHandler(async (req, res) => {
  const latitude = normalizeLatitude(req.query.lat);
  const longitude = normalizeLongitude(req.query.lon);

  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "jsonv2",
    addressdetails: "1"
  });

  const result = await fetchNominatim("/reverse", params);

  if (!result || !result.display_name) {
    throw createError("No address found for that location.", 404);
  }

  res.json({
    success: true,
    location: summarizeLocation(result)
  });
});

module.exports = {
  searchLocations,
  reverseLocation,
  normalizeLatitude,
  normalizeLongitude,
  normalizeAddressDetails
};
