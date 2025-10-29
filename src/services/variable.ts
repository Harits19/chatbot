import _ from "lodash";

export function replaceObject<T>(sourceData: object, replaceData: T) {
  let stringObject = JSON.stringify(replaceData);
  const matches = [...stringObject.matchAll(/{{.*?}}/g)].map((m) => m[0]);

  for (const key of matches) {
    const path = key.slice(2, -2).trim();
    const value = _.get(sourceData, path);
    const valueType = typeof value;

    switch (valueType) {
      case "string":
      case "number":
        stringObject = stringObject.replace(key, value.toString());
        break;
      default:
        throw new Error(`Unimplemented typeof ${valueType}`);
    }
  }

  return JSON.parse(stringObject) as T;
}
