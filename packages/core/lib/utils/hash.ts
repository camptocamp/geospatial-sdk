export function getHash(input: unknown, ignoreKeys: string[] = []): string {
  if (input instanceof Object) {
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
