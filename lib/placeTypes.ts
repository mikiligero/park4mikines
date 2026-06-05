import type { IconName } from "@/components/Icon";

export interface PlaceType {
  id: string;
  label: string;
  short: string;
  color: string;
  icon: IconName;
}

export const PLACE_TYPES: Record<string, PlaceType> = {
  NATURE:      { id: "NATURE",      label: "En plena naturaleza",              short: "Naturaleza",   color: "#1F7A52", icon: "tree" },
  AC_FREE:     { id: "AC_FREE",     label: "Área de AC gratuita",              short: "AC gratis",    color: "#2E9E63", icon: "camper" },
  AC_PAID:     { id: "AC_PAID",     label: "Área de AC de pago",               short: "AC de pago",   color: "#C2552E", icon: "camper" },
  PARKING_DN:  { id: "PARKING_DN",  label: "Aparcamiento día y noche",         short: "Aparcamiento", color: "#3D5A98", icon: "parking" },
  PARKING_DAY: { id: "PARKING_DAY", label: "Aparcamiento solo día",            short: "Parking día",  color: "#3DA5C4", icon: "parkingDay" },
  REST_AREA:   { id: "REST_AREA",   label: "Área de descanso",                 short: "Descanso",     color: "#2B7FE0", icon: "road" },
  PICNIC:      { id: "PICNIC",      label: "Zona de picnic",                   short: "Picnic",       color: "#7A5A3A", icon: "picnic" },
  CAMPING:     { id: "CAMPING",     label: "Camping",                          short: "Camping",      color: "#1F2937", icon: "tent" },
  SERVICE:     { id: "SERVICE",     label: "Área de servicios",                short: "Servicios",    color: "#5B4636", icon: "dump" },
  OFFROAD:     { id: "OFFROAD",     label: "Off-road (4×4)",                   short: "Off-road",     color: "#E0A21A", icon: "offroad" },
  CANDIDATO:   { id: "CANDIDATO",   label: "Sin clasificar / Candidato",       short: "Candidato",    color: "#E2562A", icon: "questionMark" },
};

export function getPlaceType(category: string): PlaceType {
  return PLACE_TYPES[category] ?? PLACE_TYPES.NATURE;
}

// Spot status derived from category (until a proper status field exists in the DB)
export type SpotStatus = "verificado" | "candidato";

export function getSpotStatus(category: string): SpotStatus {
  return category === "CANDIDATO" ? "candidato" : "verificado";
}

// Cover photo helper — always returns a URL (falls back to the default illustration)
export const DEFAULT_PHOTO = "/default-place.png";

export function coverPhoto(images?: { url: string }[]): string {
  return images?.[0]?.url ?? DEFAULT_PHOTO;
}

// Service name → Icon name mapping
const SERVICE_ICON_MAP: [string, IconName][] = [
  ["agua potable",             "faucet"],
  ["agua",                     "faucet"],
  ["aguas grises",             "greywater"],
  ["aguas negras",             "toilet"],
  ["basura",                   "trash"],
  ["baños",                    "restroom"],
  ["baño",                     "restroom"],
  ["ducha",                    "shower"],
  ["electricidad",             "plug"],
  ["wifi",                     "wifi"],
  ["5g",                       "signal"],
  ["cobertura",                "signal"],
  ["piscina",                  "pool"],
  ["lavandería",               "laundry"],
  ["lavanderia",               "laundry"],
  ["lavado",                   "camperwash"],
  ["mascota",                  "pet"],
  ["sombra",                   "parasol"],
  ["panadería",                "bread"],
  ["panaderia",                "bread"],
  ["vistas",                   "view"],
];

export function getServiceIcon(serviceName: string): IconName {
  const lower = serviceName.toLowerCase();
  for (const [key, icon] of SERVICE_ICON_MAP) {
    if (lower.includes(key)) return icon;
  }
  return "info";
}
