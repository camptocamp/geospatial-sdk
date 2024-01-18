export function deepFreeze<U>(obj: U): U {
  if (Array.isArray(obj)) {
    for (const elt of obj) {
      deepFreeze(elt);
    }
    return obj;
  } else if (obj instanceof Object) {
    for (const prop in obj) {
      deepFreeze((obj as Record<string, unknown>)[prop]);
    }
    return Object.freeze(obj);
  }
  return obj;
}
