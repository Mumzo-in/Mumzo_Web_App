import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { SatoriOptions } from "satori";

const FONTS_DIR = fileURLToPath(
  new URL("../../../../assets/fonts", import.meta.url),
);

let cached: SatoriOptions["fonts"] | null = null;

/** Loaded once per process — satori needs raw font buffers, not CSS links. */
export async function loadOgFonts(): Promise<SatoriOptions["fonts"]> {
  if (cached) return cached;

  const [fraunces, frauncesBold, frauncesItalic, manrope, manropeBold] =
    await Promise.all([
      readFile(`${FONTS_DIR}/Fraunces-SemiBold.ttf`),
      readFile(`${FONTS_DIR}/Fraunces-Bold.ttf`),
      readFile(`${FONTS_DIR}/Fraunces-MediumItalic.ttf`),
      readFile(`${FONTS_DIR}/Manrope-Regular.ttf`),
      readFile(`${FONTS_DIR}/Manrope-Bold.ttf`),
    ]);

  cached = [
    { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
    { name: "Fraunces", data: frauncesBold, weight: 700, style: "normal" },
    { name: "Fraunces", data: frauncesItalic, weight: 500, style: "italic" },
    { name: "Manrope", data: manrope, weight: 400, style: "normal" },
    { name: "Manrope", data: manropeBold, weight: 700, style: "normal" },
  ];

  return cached;
}
