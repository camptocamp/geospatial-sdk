// Mocks spatialreference.org so that tests never rely on actual HTTP requests
// when looking up CRS definitions. Other requests go through untouched.
const CRS_DEFINITIONS: Record<string, string> = {
  "epsg/2154":
    "+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
  "epsg/32631": "+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs",
};

const originalFetch = globalThis.fetch;

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const match = url.match(
    /^https?:\/\/spatialreference\.org\/ref\/(.+?)\/ogcwkt\/?$/,
  );
  if (!match) return originalFetch(input, init);
  const def = CRS_DEFINITIONS[match[1]];
  return def
    ? new Response(def, { status: 200 })
    : new Response("Not found", { status: 404 });
}) as typeof fetch;
