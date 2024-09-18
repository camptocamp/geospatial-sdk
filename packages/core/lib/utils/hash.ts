function isGeoJsonGeometry(object: object) {
  return "type" in object && "coordinates" in object;
}

export function getHash(input: unknown, ignoreKeys: string[] = []): string {
  if (input instanceof Object && isGeoJsonGeometry(input)) {
    return JSON.stringify(input); // do not compute an actual hash as it will take too long
  } else if (input instanceof Object) {
    const obj: Record<string, string> = {};
    const keys = Object.keys(input).sort();
    for (const key of keys) {
      if (ignoreKeys.includes(key)) continue;
      obj[key] = getHash(input[key as keyof typeof input]);
    }
    const hash = JSON.stringify(obj)
      .split("")
      .reduce((prev, curr) => (prev << 5) - prev + curr.charCodeAt(0), 0);
    return (hash >>> 0).toString();
  } else {
    return JSON.stringify(input);
  }
}
