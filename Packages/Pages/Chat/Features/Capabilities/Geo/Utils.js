/** fetch() wrapper that sets a User-Agent (required by Nominatim ToS). */
export async function nominatimJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ClaudeGeoTools/1.0 (claude.ai)' },
  });
  return res.json();
}

/** Haversine great-circle distance in kilometres. */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Initial compass bearing from point A → B (degrees, 0–360). */
export function bearingDeg(lat1, lon1, lat2, lon2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Cardinal direction label for a bearing. */
export function cardinalDir(bearing) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(bearing / 45) % 8];
}

// ── Geohash helpers ───────────────────────────────────────────────────────────
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encodeGeohash(lat, lon, precision = 9) {
  let idx = 0,
    bit = 0,
    evenBit = true,
    hash = '';
  let [minLat, maxLat, minLon, maxLon] = [-90, 90, -180, 180];
  while (hash.length < precision) {
    if (evenBit) {
      const mid = (minLon + maxLon) / 2;
      if (lon >= mid) {
        idx = idx * 2 + 1;
        minLon = mid;
      } else {
        idx *= 2;
        maxLon = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) {
        idx = idx * 2 + 1;
        minLat = mid;
      } else {
        idx *= 2;
        maxLat = mid;
      }
    }
    evenBit = !evenBit;
    if (++bit === 5) {
      hash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }
  return hash;
}

export function decodeGeohash(hash) {
  let evenBit = true;
  let [minLat, maxLat, minLon, maxLon] = [-90, 90, -180, 180];
  for (const c of hash) {
    const chr = BASE32.indexOf(c);
    if (chr === -1) throw new Error(`Invalid geohash character: ${c}`);
    for (let bits = 4; bits >= 0; bits--) {
      const bitN = (chr >> bits) & 1;
      if (evenBit) {
        const mid = (minLon + maxLon) / 2;
        bitN ? (minLon = mid) : (maxLon = mid);
      } else {
        const mid = (minLat + maxLat) / 2;
        bitN ? (minLat = mid) : (maxLat = mid);
      }
      evenBit = !evenBit;
    }
  }
  return {
    lat: (minLat + maxLat) / 2,
    lon: (minLon + maxLon) / 2,
    latErr: (maxLat - minLat) / 2,
    lonErr: (maxLon - minLon) / 2,
    bounds: { minLat, maxLat, minLon, maxLon },
  };
}
