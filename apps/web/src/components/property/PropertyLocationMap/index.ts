export { PropertyLocationMap } from "./PropertyLocationMap";
export type { PropertyLocationValue } from "./PropertyLocationMap";
import type { PropertyLocationValue } from "./PropertyLocationMap";

export function emptyPropertyLocation(
  city = "Conakry",
): PropertyLocationValue {
  return {
    city,
    commune: "",
    quarter: "",
    landmark: "",
    latitude: null,
    longitude: null,
    locationLabel: null,
    locationDisplayName: null,
    locationConfirmed: false,
  };
}
