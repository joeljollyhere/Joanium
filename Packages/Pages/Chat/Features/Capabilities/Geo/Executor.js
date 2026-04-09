import { createExecutor } from '../Shared/createExecutor.js';
import { safeJson } from '../Shared/Utils.js';
import {
  nominatimJson,
  haversineKm,
  bearingDeg,
  cardinalDir,
  encodeGeohash,
  decodeGeohash,
} from './Utils.js';
import { toolsList } from './ToolsList.js';

export const { handles, execute } = createExecutor({
  name: 'GeoExecutor',
  tools: toolsList,
  handlers: {
    // ── Existing ──────────────────────────────────────────────────────────────
    get_ip_info: async (params, onStage) => {
      const { ip } = params;
      const target = ip?.trim() || '';
      onStage(`🌍 Looking up ${target || 'your IP'}…`);

      const url = target
        ? `http://ip-api.com/json/${encodeURIComponent(target)}?fields=status,message,query,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as`
        : `http://ip-api.com/json/?fields=status,message,query,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as`;

      const data = await safeJson(url);

      if (data.status === 'fail') {
        return `IP lookup failed: ${data.message ?? 'Invalid IP address'}. Try a valid IPv4 or IPv6 address.`;
      }

      return [
        `🌍 IP Geolocation — ${data.query}`,
        ``,
        `📍 Location: ${data.city}, ${data.regionName}, ${data.country} (${data.countryCode})`,
        `📮 ZIP: ${data.zip || 'N/A'}`,
        `🗺️ Coordinates: ${data.lat}, ${data.lon}`,
        `🕐 Timezone: ${data.timezone}`,
        ``,
        `🏢 ISP: ${data.isp}`,
        `🏛️ Organization: ${data.org || data.isp}`,
        `🔌 AS: ${data.as || 'N/A'}`,
        ``,
        `Source: ip-api.com`,
      ].join('\n');
    },

    // ── Reverse Geocode ───────────────────────────────────────────────────────
    reverse_geocode: async (params, onStage) => {
      const { lat, lon } = params;
      onStage(`📍 Reverse geocoding ${lat}, ${lon}…`);

      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;
      const data = await nominatimJson(url);

      if (data.error) return `Reverse geocode failed: ${data.error}`;

      const a = data.address || {};
      const city = a.city || a.town || a.village || a.hamlet || a.municipality || 'N/A';

      return [
        `📍 Reverse Geocode — ${lat}, ${lon}`,
        ``,
        `📌 Full address: ${data.display_name}`,
        `🏙️ City/Town:    ${city}`,
        `🏛️ State/Region: ${a.state || a.province || 'N/A'}`,
        `🌍 Country:      ${a.country} (${a.country_code?.toUpperCase() || 'N/A'})`,
        `📮 Postcode:     ${a.postcode || 'N/A'}`,
        `🏷️ Place type:   ${data.type || data.category || 'N/A'}`,
        ``,
        `Source: OpenStreetMap / Nominatim`,
      ].join('\n');
    },

    // ── Forward Geocode ───────────────────────────────────────────────────────
    forward_geocode: async (params, onStage) => {
      const { query, limit = 3 } = params;
      onStage(`🔍 Geocoding "${query}"…`);

      const cap = Math.min(Math.max(1, limit), 10);
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=${cap}&addressdetails=1`;
      const results = await nominatimJson(url);

      if (!results?.length) return `No geocoding results found for "${query}".`;

      const lines = [`🔍 Geocode Results for "${query}"`, ``];
      results.forEach((r, i) => {
        lines.push(
          `${i + 1}. ${r.display_name}`,
          `   📍 Lat/Lon: ${parseFloat(r.lat).toFixed(6)}, ${parseFloat(r.lon).toFixed(6)}`,
          `   🏷️  Type: ${r.type || r.category} | Importance: ${parseFloat(r.importance).toFixed(2)}`,
          `   📦 Bounding box: [${r.boundingbox?.join(', ')}]`,
          ``,
        );
      });
      lines.push(`Source: OpenStreetMap / Nominatim`);
      return lines.join('\n');
    },

    // ── Search Places ─────────────────────────────────────────────────────────
    search_places: async (params, onStage) => {
      const { query, country_code, limit = 5 } = params;
      onStage(`🗺️ Searching places for "${query}"…`);

      const cap = Math.min(Math.max(1, limit), 20);
      let url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=${cap}&addressdetails=1`;
      if (country_code) url += `&countrycodes=${country_code.toLowerCase()}`;

      const results = await nominatimJson(url);
      if (!results?.length)
        return `No places found for "${query}"${country_code ? ` in ${country_code.toUpperCase()}` : ''}.`;

      const lines = [`🗺️ Place Search — "${query}"`, ``];
      results.forEach((r, i) => {
        lines.push(
          `${i + 1}. ${r.display_name}`,
          `   📍 ${parseFloat(r.lat).toFixed(5)}, ${parseFloat(r.lon).toFixed(5)} | Type: ${r.type || r.category}`,
          ``,
        );
      });
      lines.push(`Source: OpenStreetMap / Nominatim`);
      return lines.join('\n');
    },

    // ── Elevation ─────────────────────────────────────────────────────────────
    get_elevation: async (params, onStage) => {
      const { locations } = params;
      if (!Array.isArray(locations) || !locations.length)
        return 'Provide at least one { lat, lon } location.';
      const capped = locations.slice(0, 100);
      onStage(`🏔️ Fetching elevation for ${capped.length} point(s)…`);

      const url = 'https://api.open-elevation.com/api/v1/lookup';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locations: capped.map(({ lat, lon }) => ({ latitude: lat, longitude: lon })),
        }),
      });
      const data = await res.json();

      if (!data.results?.length) return 'Elevation lookup failed. Check your coordinates.';

      const lines = [
        `🏔️ Elevation Results (${data.results.length} point${data.results.length > 1 ? 's' : ''})`,
        ``,
      ];
      data.results.forEach((r, i) => {
        lines.push(
          `${i + 1}. (${r.latitude}, ${r.longitude}) → ${r.elevation} m / ${(r.elevation * 3.28084).toFixed(1)} ft`,
        );
      });
      lines.push(``, `Source: open-elevation.com`);
      return lines.join('\n');
    },

    // ── Timezone by Coordinates ───────────────────────────────────────────────
    get_timezone_by_coords: async (params, onStage) => {
      const { lat, lon } = params;
      onStage(`🕐 Looking up timezone for ${lat}, ${lon}…`);

      // Open-Meteo returns timezone without a key
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto&forecast_days=1&daily=sunrise`;
      const data = await safeJson(url);

      if (data.error) return `Timezone lookup failed: ${data.reason || 'Unknown error'}`;

      const tz = data.timezone || 'N/A';
      const abbr = data.timezone_abbreviation || '';
      const offset =
        data.utc_offset_seconds != null
          ? `UTC${data.utc_offset_seconds >= 0 ? '+' : ''}${data.utc_offset_seconds / 3600}`
          : 'N/A';

      const now = new Date();
      const localTime = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        dateStyle: 'full',
        timeStyle: 'long',
      }).format(now);

      return [
        `🕐 Timezone — ${lat}, ${lon}`,
        ``,
        `🌐 IANA Timezone: ${tz}`,
        `🔤 Abbreviation: ${abbr}`,
        `⏱️ UTC Offset:   ${offset}`,
        `🗓️ Local time:   ${localTime}`,
        ``,
        `Source: Open-Meteo`,
      ].join('\n');
    },

    // ── Country Info ──────────────────────────────────────────────────────────
    get_country_info: async (params, onStage) => {
      const { query } = params;
      onStage(`🌍 Fetching country info for "${query}"…`);

      // Try by name first, fall back to alpha code
      const isCode = /^[a-zA-Z]{2,3}$/.test(query.trim());
      const url = isCode
        ? `https://restcountries.com/v3.1/alpha/${encodeURIComponent(query.trim())}`
        : `https://restcountries.com/v3.1/name/${encodeURIComponent(query.trim())}?fullText=true`;

      const data = await safeJson(url);
      if (data.status === 404 || !Array.isArray(data) || !data.length) {
        return `Country "${query}" not found. Use a full name (e.g. "Germany") or ISO code (e.g. "DE").`;
      }

      const c = data[0];
      const currencies =
        Object.values(c.currencies || {})
          .map((cur) => `${cur.name} (${cur.symbol || '?'})`)
          .join(', ') || 'N/A';
      const languages = Object.values(c.languages || {}).join(', ') || 'N/A';
      const capital = c.capital?.[0] || 'N/A';
      const pop = c.population?.toLocaleString() || 'N/A';
      const area = c.area?.toLocaleString() || 'N/A';
      const callingCode = (c.idd?.root || '') + (c.idd?.suffixes?.[0] || '');
      const timezones = c.timezones?.join(', ') || 'N/A';
      const region = [c.region, c.subregion].filter(Boolean).join(' › ');
      const flag = c.flag || '';

      return [
        `${flag} ${c.name?.common} (${c.cca2} / ${c.cca3})`,
        `Official name: ${c.name?.official}`,
        ``,
        `🏙️ Capital:      ${capital}`,
        `🌍 Region:       ${region}`,
        `👥 Population:   ${pop}`,
        `📐 Area:         ${area} km²`,
        `💰 Currency:     ${currencies}`,
        `🗣️ Languages:    ${languages}`,
        `📞 Calling code: ${callingCode || 'N/A'}`,
        `🕐 Timezones:    ${timezones}`,
        `🚗 Drives on:    ${c.car?.side || 'N/A'}`,
        `🌐 TLD:          ${c.tld?.join(', ') || 'N/A'}`,
        ``,
        `Source: restcountries.com`,
      ].join('\n');
    },

    // ── Country Neighbors ─────────────────────────────────────────────────────
    get_country_neighbors: async (params, onStage) => {
      const { query } = params;
      onStage(`🌍 Finding neighbors of "${query}"…`);

      const isCode = /^[a-zA-Z]{2,3}$/.test(query.trim());
      const url = isCode
        ? `https://restcountries.com/v3.1/alpha/${encodeURIComponent(query.trim())}`
        : `https://restcountries.com/v3.1/name/${encodeURIComponent(query.trim())}?fullText=true`;

      const data = await safeJson(url);
      if (!Array.isArray(data) || !data.length) return `Country "${query}" not found.`;

      const country = data[0];
      const borders = country.borders || [];
      if (!borders.length) {
        return `${country.flag || ''} ${country.name?.common} has no land borders (island nation or landlocked enclave).`;
      }

      onStage(`🗺️ Resolving ${borders.length} border countries…`);
      const borderUrl = `https://restcountries.com/v3.1/alpha?codes=${borders.join(',')}`;
      const neighborData = await safeJson(borderUrl);

      const lines = [
        `${country.flag || ''} Neighbors of ${country.name?.common} (${borders.length})`,
        ``,
      ];

      if (Array.isArray(neighborData)) {
        neighborData
          .sort((a, b) => a.name.common.localeCompare(b.name.common))
          .forEach((n) => {
            lines.push(`  ${n.flag || '🏳️'} ${n.name?.common} (${n.cca2} / ${n.cca3})`);
          });
      } else {
        borders.forEach((b) => lines.push(`  ${b}`));
      }

      lines.push(``, `Source: restcountries.com`);
      return lines.join('\n');
    },

    // ── Postal Code Info ──────────────────────────────────────────────────────
    get_postal_code_info: async (params, onStage) => {
      const { country_code, postal_code } = params;
      onStage(`📮 Looking up postal code ${postal_code} (${country_code.toUpperCase()})…`);

      const url = `https://api.zippopotam.us/${country_code.toLowerCase()}/${encodeURIComponent(postal_code)}`;
      const res = await fetch(url);
      if (!res.ok)
        return `Postal code "${postal_code}" not found in ${country_code.toUpperCase()}. Check the code and country.`;

      const data = await res.json();
      const lines = [
        `📮 Postal Code — ${data['post code']}, ${data['country']} (${data['country abbreviation']})`,
        ``,
      ];

      (data.places || []).forEach((p, i) => {
        lines.push(
          `${i + 1}. ${p['place name']}, ${p['state']} (${p['state abbreviation'] || p['state']})`,
          `   📍 ${p.latitude}, ${p.longitude}`,
        );
      });

      lines.push(``, `Source: zippopotam.us`);
      return lines.join('\n');
    },

    // ── Nearby Places (Overpass API) ──────────────────────────────────────────
    get_nearby_places: async (params, onStage) => {
      const { lat, lon, radius = 500, category, limit = 10 } = params;
      const r = Math.min(Math.max(50, radius), 5000);
      const cap = Math.min(Math.max(1, limit), 30);

      const tag = category
        ? `["amenity"="${category}"],["tourism"="${category}"],["shop"="${category}"],["leisure"="${category}"]`
        : '["amenity"],["tourism"],["shop"]';

      onStage(`📌 Searching nearby${category ? ` ${category}` : ''} places within ${r}m…`);

      // Build a union query for each tag
      const tagFilters = category
        ? [
            `node(around:${r},${lat},${lon})["amenity"="${category}"];`,
            `node(around:${r},${lat},${lon})["tourism"="${category}"];`,
            `node(around:${r},${lat},${lon})["shop"="${category}"];`,
            `node(around:${r},${lat},${lon})["leisure"="${category}"];`,
          ]
        : [
            `node(around:${r},${lat},${lon})["amenity"];`,
            `node(around:${r},${lat},${lon})["tourism"];`,
            `node(around:${r},${lat},${lon})["shop"];`,
          ];

      const query = `[out:json][timeout:15];\n(\n  ${tagFilters.join('\n  ')}\n);\nout body ${cap};`;

      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      const data = await res.json();

      const elements = (data.elements || []).slice(0, cap);
      if (!elements.length) {
        return `No places found within ${r}m of (${lat}, ${lon})${category ? ` for category "${category}"` : ''}.`;
      }

      const lines = [`📌 Nearby Places — ${lat}, ${lon} (within ${r}m)`, ``];
      elements.forEach((el, i) => {
        const name = el.tags?.name || el.tags?.['name:en'] || '(unnamed)';
        const type =
          el.tags?.amenity || el.tags?.tourism || el.tags?.shop || el.tags?.leisure || '?';
        const dist = haversineKm(lat, lon, el.lat, el.lon);
        lines.push(`${i + 1}. ${name} [${type}] — ${(dist * 1000).toFixed(0)}m away`);
        if (el.tags?.['addr:street'])
          lines.push(`   📍 ${el.tags['addr:housenumber'] || ''} ${el.tags['addr:street']}`.trim());
        if (el.tags?.opening_hours) lines.push(`   🕐 ${el.tags.opening_hours}`);
        if (el.tags?.phone) lines.push(`   📞 ${el.tags.phone}`);
        if (el.tags?.website) lines.push(`   🌐 ${el.tags.website}`);
        lines.push('');
      });

      lines.push(`Source: OpenStreetMap / Overpass API`);
      return lines.join('\n');
    },

    // ── Distance ──────────────────────────────────────────────────────────────
    get_distance: async (params) => {
      const { lat1, lon1, lat2, lon2 } = params;
      const km = haversineKm(lat1, lon1, lat2, lon2);
      const bearing = bearingDeg(lat1, lon1, lat2, lon2);
      const cardinal = cardinalDir(bearing);

      return [
        `📏 Distance Calculation`,
        ``,
        `  From: ${lat1}, ${lon1}`,
        `  To:   ${lat2}, ${lon2}`,
        ``,
        `  📐 Great-circle distance:`,
        `     ${km.toFixed(3)} km`,
        `     ${(km * 0.621371).toFixed(3)} miles`,
        `     ${(km * 0.539957).toFixed(3)} nautical miles`,
        ``,
        `  🧭 Bearing: ${bearing.toFixed(1)}° (${cardinal})`,
        ``,
        `Method: Haversine formula (assumes spherical Earth, R = 6 371 km)`,
      ].join('\n');
    },

    // ── Midpoint ──────────────────────────────────────────────────────────────
    get_midpoint: async (params) => {
      const { lat1, lon1, lat2, lon2 } = params;

      // Geographic midpoint (not simple average — uses 3D vectors)
      const toRad = (d) => (d * Math.PI) / 180;
      const toDeg = (r) => (r * 180) / Math.PI;

      const φ1 = toRad(lat1),
        λ1 = toRad(lon1);
      const φ2 = toRad(lat2),
        λ2 = toRad(lon2);

      const Bx = Math.cos(φ2) * Math.cos(λ2 - λ1);
      const By = Math.cos(φ2) * Math.sin(λ2 - λ1);
      const φm = Math.atan2(
        Math.sin(φ1) + Math.sin(φ2),
        Math.sqrt((Math.cos(φ1) + Bx) ** 2 + By ** 2),
      );
      const λm = λ1 + Math.atan2(By, Math.cos(φ1) + Bx);

      const midLat = parseFloat(toDeg(φm).toFixed(6));
      const midLon = parseFloat(toDeg(λm).toFixed(6));
      const distFromEach = haversineKm(lat1, lon1, midLat, midLon);

      return [
        `📍 Geographic Midpoint`,
        ``,
        `  Point A: ${lat1}, ${lon1}`,
        `  Point B: ${lat2}, ${lon2}`,
        ``,
        `  📍 Midpoint: ${midLat}, ${midLon}`,
        `  📏 ~${distFromEach.toFixed(1)} km from each endpoint`,
        ``,
        `Method: Spherical 3D vector midpoint`,
      ].join('\n');
    },

    // ── Point-in-Radius Check ─────────────────────────────────────────────────
    check_point_in_radius: async (params) => {
      const { centre_lat, centre_lon, point_lat, point_lon, radius_km } = params;
      const dist = haversineKm(centre_lat, centre_lon, point_lat, point_lon);
      const inside = dist <= radius_km;

      return [
        `🔵 Geofence Check`,
        ``,
        `  Centre:   ${centre_lat}, ${centre_lon}`,
        `  Point:    ${point_lat}, ${point_lon}`,
        `  Radius:   ${radius_km} km`,
        ``,
        `  📏 Distance: ${dist.toFixed(3)} km`,
        `  ${inside ? '✅ INSIDE  the radius' : '❌ OUTSIDE the radius'} (${inside ? '-' : '+'}${Math.abs(dist - radius_km).toFixed(3)} km ${inside ? 'margin' : 'over'})`,
      ].join('\n');
    },

    // ── DMS → DD ──────────────────────────────────────────────────────────────
    convert_dms_to_dd: async (params) => {
      const { degrees, minutes, seconds, direction } = params;
      const dir = direction.toUpperCase();
      if (!['N', 'S', 'E', 'W'].includes(dir))
        return `Invalid direction "${direction}". Use N, S, E, or W.`;

      const dd = degrees + minutes / 60 + seconds / 3600;
      const signed = ['S', 'W'].includes(dir) ? -dd : dd;

      return [
        `🔄 DMS → Decimal Degrees`,
        ``,
        `  Input:  ${degrees}° ${minutes}' ${seconds}" ${dir}`,
        `  Output: ${signed.toFixed(8)}°`,
        `  Axis:   ${['N', 'S'].includes(dir) ? 'Latitude' : 'Longitude'}`,
      ].join('\n');
    },

    // ── DD → DMS ──────────────────────────────────────────────────────────────
    convert_dd_to_dms: async (params) => {
      const { decimal, axis } = params;
      const ax = axis?.toLowerCase();
      if (!['lat', 'lon'].includes(ax)) return `Invalid axis "${axis}". Use "lat" or "lon".`;

      const abs = Math.abs(decimal);
      const deg = Math.floor(abs);
      const minF = (abs - deg) * 60;
      const min = Math.floor(minF);
      const sec = ((minF - min) * 60).toFixed(4);

      const dir = ax === 'lat' ? (decimal >= 0 ? 'N' : 'S') : decimal >= 0 ? 'E' : 'W';

      return [
        `🔄 Decimal Degrees → DMS`,
        ``,
        `  Input:  ${decimal}° (${ax === 'lat' ? 'Latitude' : 'Longitude'})`,
        `  Output: ${deg}° ${min}' ${sec}" ${dir}`,
      ].join('\n');
    },

    // ── Encode Geohash ────────────────────────────────────────────────────────
    encode_geohash: async (params) => {
      const { lat, lon, precision = 9 } = params;
      const prec = Math.min(Math.max(1, Math.round(precision)), 12);

      const hash = encodeGeohash(lat, lon, prec);
      // Decode back to show accuracy
      const decoded = decodeGeohash(hash);
      const errM = Math.max(decoded.latErr, decoded.lonErr) * 111320; // approx metres

      return [
        `🔷 Geohash Encode`,
        ``,
        `  Input:     ${lat}, ${lon}`,
        `  Precision: ${prec} chars`,
        `  Geohash:   ${hash}`,
        `  Accuracy:  ±${errM < 1 ? errM.toFixed(2) + ' m' : errM < 1000 ? errM.toFixed(1) + ' m' : (errM / 1000).toFixed(2) + ' km'}`,
      ].join('\n');
    },

    // ── Decode Geohash ────────────────────────────────────────────────────────
    decode_geohash: async (params) => {
      const { hash } = params;
      let decoded;
      try {
        decoded = decodeGeohash(hash.trim());
      } catch (e) {
        return `Invalid geohash: ${e.message}`;
      }

      const { lat, lon, latErr, lonErr, bounds } = decoded;
      const errM = Math.max(latErr, lonErr) * 111320;

      return [
        `🔷 Geohash Decode`,
        ``,
        `  Geohash:   ${hash.trim()} (${hash.trim().length} chars)`,
        `  Center:    ${lat.toFixed(8)}, ${lon.toFixed(8)}`,
        `  Accuracy:  ±${errM < 1 ? errM.toFixed(2) + ' m' : errM < 1000 ? errM.toFixed(1) + ' m' : (errM / 1000).toFixed(2) + ' km'}`,
        ``,
        `  Bounding box:`,
        `    SW: ${bounds.minLat.toFixed(6)}, ${bounds.minLon.toFixed(6)}`,
        `    NE: ${bounds.maxLat.toFixed(6)}, ${bounds.maxLon.toFixed(6)}`,
      ].join('\n');
    },

    // ── Map URL Generator ─────────────────────────────────────────────────────
    get_map_url: async (params) => {
      const { lat, lon, query, zoom = 14 } = params;
      const z = Math.min(Math.max(1, Math.round(zoom)), 19);

      if (!lat && !lon && !query) return 'Provide either lat/lon coordinates or a place query.';

      const lines = [`🗺️ Map URLs`, ``];

      if (lat != null && lon != null) {
        lines.push(
          `📍 Coordinates: ${lat}, ${lon} (zoom ${z})`,
          ``,
          `🌍 OpenStreetMap:`,
          `   https://www.openstreetmap.org/#map=${z}/${lat}/${lon}`,
          ``,
          `🗺️ Google Maps:`,
          `   https://maps.google.com/?q=${lat},${lon}&z=${z}`,
          ``,
          `🍎 Apple Maps:`,
          `   https://maps.apple.com/?ll=${lat},${lon}&z=${z}`,
        );
      }

      if (query) {
        const enc = encodeURIComponent(query);
        lines.push(
          ``,
          `🔍 Query: "${query}"`,
          ``,
          `🌍 OpenStreetMap search:`,
          `   https://www.openstreetmap.org/search?query=${enc}`,
          ``,
          `🗺️ Google Maps search:`,
          `   https://maps.google.com/?q=${enc}`,
          ``,
          `🍎 Apple Maps search:`,
          `   https://maps.apple.com/?q=${enc}`,
        );
      }

      return lines.join('\n');
    },
  },
});
