// Background HDR files in /public/bgs/
export const DEFAULT_BACKGROUND_ID = "sky4k";

export const BACKGROUNDS = [
  { id: "lakepier4k", name: "Lake Pier", path: "lakepier4k.hdr" },
  { id: "park4k", name: "Park", path: "park4k.hdr" },
  { id: "qwantani-noon4k", name: "Qwantani Noon", path: "qwantani-noon4k.hdr" },
  { id: "sky4k", name: "Sky", path: "sky4k.hdr" },
  { id: "traintrack4k", name: "Train Track", path: "traintrack4k.hdr" },
];

export function getDefaultBackground() {
  return (
    BACKGROUNDS.find((b) => b.id === DEFAULT_BACKGROUND_ID) || BACKGROUNDS[0]
  );
}
