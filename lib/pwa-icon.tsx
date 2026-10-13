import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const BRAND_YELLOW = "#ffd23f";
// Logo ocupa ~88% do tile: margem para os cantos arredondados do iOS.
const LOGO_RATIO = 0.88;

/**
 * Icone opaco (logo sobre amarelo da marca). iOS pinta transparencia de preto,
 * entao o fundo precisa ser solido.
 */
export async function renderPwaIcon(size: number) {
  const logo = await readFile(join(process.cwd(), "public/logo.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  const inner = Math.round(size * LOGO_RATIO);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_YELLOW,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={inner} height={inner} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
