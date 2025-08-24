// server/utils/geocode.js
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

async function reverseGeocode(lat, lng) {
  const token = process.env.MAPBOX_TOKEN;
  if (!token || lat == null || lng == null) return "";

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=es&limit=1`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    return data?.features?.[0]?.place_name || "";
  } catch (_e) {
    return "";
  }
}

module.exports = { reverseGeocode };
