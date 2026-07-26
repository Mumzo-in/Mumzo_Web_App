import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { loadOgFonts } from "./og-fonts";

const WIDTH = 1200;
const HEIGHT = 630;

const INK = "#1F1B3A";
const CREAM = "#FEF8F5";
const PEACH = "#FDE2CE";
const PRIMARY = "#C85277";

export interface OgCardInput {
  kicker: string;
  title: string;
  subtitle?: string;
  price?: string;
  image?: string | null;
}

/** satori takes a plain `{type, props}` tree (it types it as `ReactNode` but
 * only reads structural shape) — this tiny helper builds that tree without
 * pulling in React or fighting the app's Hono JSX pragma. */
type SatoriElement = { type: string; props: Record<string, unknown> };

function h(
  type: string,
  props: Record<string, unknown>,
  ...children: Array<SatoriElement | string | false | null | undefined>
): SatoriElement {
  return { type, props: { ...props, children: children.filter(Boolean) } };
}

/** Shared branded share-card layout — product/category/default all render
 * through this so a share link always looks like the same visual family. */
function card({ kicker, title, subtitle, price, image }: OgCardInput) {
  return h(
    "div",
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        background: CREAM,
        fontFamily: "Manrope",
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          width: image ? "58%" : "100%",
          gap: "20px",
        },
      },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "10px" } },
        h(
          "div",
          {
            style: {
              display: "flex",
              width: 44,
              height: 44,
              borderRadius: 14,
              background: PEACH,
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 26,
              color: INK,
            },
          },
          "m",
        ),
        h(
          "div",
          {
            style: {
              display: "flex",
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 26,
              color: INK,
            },
          },
          "mumzo",
        ),
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: PRIMARY,
          },
        },
        kicker,
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            fontFamily: "Fraunces",
            fontWeight: 600,
            fontSize: 56,
            lineHeight: 1.1,
            color: INK,
            letterSpacing: -1,
          },
        },
        title,
      ),
      subtitle &&
        h(
          "div",
          { style: { display: "flex", fontSize: 24, color: "#5B5568" } },
          subtitle,
        ),
      price &&
        h(
          "div",
          {
            style: {
              display: "flex",
              fontFamily: "Fraunces",
              fontWeight: 700,
              fontSize: 40,
              color: INK,
            },
          },
          price,
        ),
    ),
    image &&
      h(
        "div",
        {
          style: {
            display: "flex",
            width: "42%",
            height: "100%",
            position: "relative",
          },
        },
        h("img", {
          src: image,
          width: WIDTH * 0.42,
          height: HEIGHT,
          style: { objectFit: "cover" },
        }),
      ),
  );
}

export async function renderOgImage(
  input: OgCardInput,
): Promise<Uint8Array<ArrayBufferLike>> {
  const fonts = await loadOgFonts();

  // satori's public type says `ReactNode`, but it only ever reads the plain
  // {type, props} shape `h()` builds above — `as never` is the documented
  // escape hatch for a genuinely dynamic value the type system can't express,
  // without pulling React into a Hono/JSX server app just for this cast.
  const svg = await satori(card(input) as never, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  });

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
  return resvg.render().asPng();
}
