// Major-city labels for the Sales Ops map. Each entry has a lat/lon so
// they project through the same geoAlbersUsa frame as the ZIP3 glow.
// `scope: 'US'` cities render at the national view; `scope: 'STATE'`
// cities only render when their state is drilled.

export interface CityLabel {
  name: string;
  abbr: string;
  lat: number;
  lon: number;
  scope: 'US' | 'STATE';
}

export const MAJOR_CITIES: CityLabel[] = [
  // US-level — anchors so the eye can orient across the country.
  { name: 'New York',     abbr: 'NY', lat: 40.7128, lon: -74.0060, scope: 'US' },
  { name: 'Los Angeles',  abbr: 'CA', lat: 34.0522, lon: -118.2437, scope: 'US' },
  { name: 'Chicago',      abbr: 'IL', lat: 41.8781, lon: -87.6298, scope: 'US' },
  { name: 'Houston',      abbr: 'TX', lat: 29.7604, lon: -95.3698, scope: 'US' },
  { name: 'Phoenix',      abbr: 'AZ', lat: 33.4484, lon: -112.0740, scope: 'US' },
  { name: 'Philadelphia', abbr: 'PA', lat: 39.9526, lon: -75.1652, scope: 'US' },
  { name: 'Dallas',       abbr: 'TX', lat: 32.7767, lon: -96.7970, scope: 'US' },
  { name: 'San Francisco',abbr: 'CA', lat: 37.7749, lon: -122.4194,scope: 'US' },
  { name: 'Seattle',      abbr: 'WA', lat: 47.6062, lon: -122.3321,scope: 'US' },
  { name: 'Denver',       abbr: 'CO', lat: 39.7392, lon: -104.9903,scope: 'US' },
  { name: 'Atlanta',      abbr: 'GA', lat: 33.7490, lon: -84.3880, scope: 'US' },
  { name: 'Miami',        abbr: 'FL', lat: 25.7617, lon: -80.1918, scope: 'US' },
  { name: 'Boston',       abbr: 'MA', lat: 42.3601, lon: -71.0589, scope: 'US' },
  { name: 'Detroit',      abbr: 'MI', lat: 42.3314, lon: -83.0458, scope: 'US' },
  { name: 'Minneapolis',  abbr: 'MN', lat: 44.9778, lon: -93.2650, scope: 'US' },
  { name: 'Portland',     abbr: 'OR', lat: 45.5152, lon: -122.6784,scope: 'US' },
  { name: 'Las Vegas',    abbr: 'NV', lat: 36.1699, lon: -115.1398,scope: 'US' },
  { name: 'Charlotte',    abbr: 'NC', lat: 35.2271, lon: -80.8431, scope: 'US' },

  // State-level secondaries — only render when their state is drilled.
  { name: 'Pittsburgh',   abbr: 'PA', lat: 40.4406, lon: -79.9959, scope: 'STATE' },
  { name: 'San Diego',    abbr: 'CA', lat: 32.7157, lon: -117.1611,scope: 'STATE' },
  { name: 'Sacramento',   abbr: 'CA', lat: 38.5816, lon: -121.4944,scope: 'STATE' },
  { name: 'San Jose',     abbr: 'CA', lat: 37.3382, lon: -121.8863,scope: 'STATE' },
  { name: 'Austin',       abbr: 'TX', lat: 30.2672, lon: -97.7431, scope: 'STATE' },
  { name: 'San Antonio',  abbr: 'TX', lat: 29.4241, lon: -98.4936, scope: 'STATE' },
  { name: 'Tucson',       abbr: 'AZ', lat: 32.2226, lon: -110.9747,scope: 'STATE' },
  { name: 'Grand Rapids', abbr: 'MI', lat: 42.9634, lon: -85.6681, scope: 'STATE' },
  { name: 'Ann Arbor',    abbr: 'MI', lat: 42.2808, lon: -83.7430, scope: 'STATE' },
  { name: 'Raleigh',      abbr: 'NC', lat: 35.7796, lon: -78.6382, scope: 'STATE' },
  { name: 'Wilmington',   abbr: 'NC', lat: 34.2104, lon: -77.8868, scope: 'STATE' },
  { name: 'Reno',         abbr: 'NV', lat: 39.5296, lon: -119.8138,scope: 'STATE' },
  { name: 'Bend',         abbr: 'OR', lat: 44.0582, lon: -121.3153,scope: 'STATE' },
  { name: 'Salem',        abbr: 'OR', lat: 44.9429, lon: -123.0351,scope: 'STATE' },
  { name: 'Eugene',       abbr: 'OR', lat: 44.0521, lon: -123.0868,scope: 'STATE' },
  { name: 'Augusta',      abbr: 'GA', lat: 33.4735, lon: -82.0105, scope: 'STATE' },
  { name: 'Columbus',     abbr: 'GA', lat: 32.4610, lon: -84.9877, scope: 'STATE' },
  { name: 'Aurora',       abbr: 'IL', lat: 41.7606, lon: -88.3201, scope: 'STATE' },
  { name: 'Hartford',     abbr: 'CT', lat: 41.7658, lon: -72.6734, scope: 'STATE' },
  { name: 'Newark',       abbr: 'NJ', lat: 40.7357, lon: -74.1724, scope: 'STATE' },
  { name: 'Baltimore',    abbr: 'MD', lat: 39.2904, lon: -76.6122, scope: 'STATE' },
  { name: 'Richmond',     abbr: 'VA', lat: 37.5407, lon: -77.4360, scope: 'STATE' },
  { name: 'Virginia Beach',abbr: 'VA', lat: 36.8529, lon: -75.9780,scope: 'STATE' },
  { name: 'Spokane',      abbr: 'WA', lat: 47.6588, lon: -117.4260,scope: 'STATE' },
  { name: 'Boulder',      abbr: 'CO', lat: 40.0150, lon: -105.2705,scope: 'STATE' },
  { name: 'Milwaukee',    abbr: 'WI', lat: 43.0389, lon: -87.9065, scope: 'STATE' },
];
