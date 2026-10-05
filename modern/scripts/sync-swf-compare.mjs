import { inflateSync } from "node:zlib";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "src/lib/swf-compare-catalog.json");
const outRoot = join(root, "public/swf-compare");
const piecesRoot = join(outRoot, "pieces");
const ORIGIN = process.env.SWF_COMPARE_ORIGIN ?? "https://static.nikart.co.uk";
const MAX_BYTES = 80 * 1024 * 1024;

const sources = JSON.parse(readFileSync(catalogPath, "utf8"));
const visibilityDefaultsPath = join(outRoot, "visibility-defaults.json");
const visibilityDefaults = existsSync(visibilityDefaultsPath)
  ? JSON.parse(readFileSync(visibilityDefaultsPath, "utf8"))
  : {};

function defaultVisible(id, player) {
  const page = visibilityDefaults[id];
  return page?.[player] ?? true;
}

function visFlagButton(id, player, label) {
  const on = defaultVisible(id, player);
  return `<button type="button" class="vis ${on ? "is-on" : "is-off"}" data-vis="${player}" aria-pressed="${on}">${label}</button>`;
}

function visPaneToggle(id, player) {
  const on = defaultVisible(id, player);
  return `<button type="button" class="vis-toggle" data-vis="${player}" aria-pressed="${on}">${on ? "Hide" : "Show"}</button>`;
}

const ASSET_EXT =
  /\.(?:swf|xml|jpg|jpeg|png|gif|dae|mp3|wav|flv|json|css|js|html|txt|obj|mtl|atf|csv|pdf|pat|dat)(?:$|[?#])/i;

const SWF_DIR_SEEDS = [
  "xml/config.xml",
  "xml/textos.xml",
  "xml/preguntas.xml",
  "xml/conexion_prueba.xml",
  "xml/mapa.xml",
  "xml/casos.xml",
  "xml/saber.xml",
  "xml/loaders.xml",
  "xml/en.xml",
  "xml/es.xml",
  "xml/de.xml",
  "swf/assets.swf",
  "swf/assets_general.swf",
  "swf/bienvenida.swf",
  "assets/flarConfig.xml",
  "assets/loading_mc.swf",
  "flarConfig.xml",
  "img/fin_del_juego.jpg",
  "images/get_flash_player.gif",
  "assets/logo_flash_player.jpg",
];

function hostPathFromHref(href, pageUrl) {
  try {
    const resolved = new URL(href, pageUrl);
    if (resolved.origin !== new URL(ORIGIN).origin && !resolved.pathname.startsWith("/")) {
      return null;
    }
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return null;
    }
    if (resolved.hostname && resolved.hostname !== new URL(ORIGIN).hostname) {
      return null;
    }
    return decodeURIComponent(resolved.pathname.replace(/^\//, "").split("#")[0] ?? "");
  } catch {
    return null;
  }
}

function findSwfMovies(html, pageUrl) {
  const movies = [];
  const add = (movie) => {
    if (!movie || movie.includes("<?") || /playerProductInstall/i.test(movie)) {
      return;
    }
    const path = hostPathFromHref(movie, pageUrl);
    if (!path?.toLowerCase().endsWith(".swf")) {
      return;
    }
    if (!movies.some((item) => item.path === path.split("?")[0])) {
      movies.push({ path: path.split("?")[0] ?? path, raw: movie });
    }
  };

  const urlMovie = html.match(/urlMovie\s*=\s*['"]([^'"]+\.swf)['"]/i);
  if (urlMovie?.[1]) {
    add(urlMovie[1]);
  }
  const embedSwf = html.match(/embedSWF\s*\(\s*['"]([^'"]+\.swf[^'"]*)['"]/i);
  if (embedSwf?.[1]) {
    add(embedSwf[1]);
  }
  const swfObject = html.match(/new\s+SWFObject\s*\(\s*['"]([^'"]+\.swf[^'"]*)['"]/i);
  if (swfObject?.[1]) {
    add(swfObject[1]);
  }
  for (const match of html.matchAll(/['"]src['"]\s*,\s*['"]([^'"]+)['"]/gi)) {
    const src = match[1];
    add(src?.toLowerCase().endsWith(".swf") ? src : `${src}.swf`);
  }
  for (const match of html.matchAll(/['"]([^'"]+\.swf[^'"]*)['"]/gi)) {
    add(match[1]);
  }
  return movies;
}

function dirUrl(path) {
  const trimmed = path.replace(/[^/]+$/, "");
  return `${ORIGIN}/${trimmed}`;
}

function looksLikeAsset(href) {
  if (!href || href.startsWith("data:") || href.startsWith("mailto:")) {
    return false;
  }
  if (href.startsWith("javascript:") || href.startsWith("#")) {
    return false;
  }
  return ASSET_EXT.test(href) || /^[.A-Za-z0-9_/-]+$/.test(href);
}

function resolveRef(href, fromPath, swfPath) {
  if (!looksLikeAsset(href)) {
    return [];
  }
  const bases = [dirUrl(fromPath), dirUrl(swfPath), `${ORIGIN}/`];
  const paths = new Set();
  for (const base of bases) {
    const resolved = hostPathFromHref(href, base);
    if (resolved) {
      paths.add(resolved.split("?")[0] ?? resolved);
    }
  }
  if (!ASSET_EXT.test(href)) {
    for (const extra of [".txt", ".dat", ".pat", ".xml", ".swf", ".jpg", ".png", ".gif"]) {
      for (const base of bases) {
        const resolved = hostPathFromHref(`${href}${extra}`, base);
        if (resolved) {
          paths.add(resolved.split("?")[0] ?? resolved);
        }
      }
    }
  }
  const baseName = href.split("/").pop();
  if (baseName && ASSET_EXT.test(baseName)) {
    const swfDir = swfPath.replace(/[^/]+$/, "");
    paths.add(`${swfDir}assets/${baseName.split("?")[0]}`);
  }
  return [...paths];
}

function refsFromText(text) {
  const found = new Set();
  const patterns = [
    /\b(?:href|src|url|path)=["']([^"']+)["']/gi,
    /url\(["']?([^"')]+)["']?\)/gi,
    /["']([^"']+\.(?:swf|xml|jpg|jpeg|png|gif|dae|mp3|wav|json|css|js|html|txt|obj|mtl|atf|pdf|pat|dat|flv))["']/gi,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const href = match[1];
      if (looksLikeAsset(href)) {
        found.add(href.split("?")[0] ?? href);
      }
    }
  }
  return [...found];
}

function swfRawRefs(buffer) {
  let payload = buffer;
  const sig = buffer.subarray(0, 3).toString("ascii");
  if (sig === "CWS") {
    try {
      payload = Buffer.concat([buffer.subarray(0, 8), inflateSync(buffer.subarray(8))]);
    } catch {
      payload = buffer;
    }
  }
  const body = payload.toString("latin1");
  const matches = body.match(
    /(?:\.\.\/)?[A-Za-z0-9_./%-]{2,180}\.(?:xml|jpg|jpeg|png|gif|dae|mp3|wav|flv|json|css|swf|txt|html|obj|mtl|atf|pdf|pat|dat)/gi,
  );
  return matches ?? [];
}

async function fetchBuffer(path) {
  const response = await fetch(`${ORIGIN}/${path}`);
  if (!response.ok) {
    return null;
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_BYTES) {
    console.warn(`skip large ${path} (${buffer.length})`);
    return null;
  }
  return buffer;
}

async function savePath(pieceDir, path, buffer) {
  const dest = join(pieceDir, path);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, buffer);
}

function enqueue(queue, seen, path) {
  const key = path.split("?")[0] ?? path;
  if (!key || seen.has(key) || key.includes("..")) {
    return;
  }
  seen.add(key);
  queue.push(key);
}

function enqueueRef(queue, seen, href, fromPath, swfPath) {
  for (const candidate of resolveRef(href, fromPath, swfPath)) {
    enqueue(queue, seen, candidate);
  }
}

function xmlAttr(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1];
}

function enqueueXmlDerived(text, swfPath, queue, seen) {
  const swfDir = swfPath.replace(/[^/]+$/, "");
  const carpeta = text.match(/<carpeta\b([^>]*)\/?>/i)?.[1] ?? "";
  const imgFolder = xmlAttr(carpeta, "img") || "img";
  const imgTag = text.match(/<img\b([^>]*)\/?>/i)?.[1] ?? "";
  const term = xmlAttr(imgTag, "term") || ".jpg";
  const fin = xmlAttr(imgTag, "fin");
  const startReto = xmlAttr(imgTag, "startReto");
  const startSaber = xmlAttr(imgTag, "startSaber");
  if (fin) {
    enqueue(queue, seen, `${swfDir}${imgFolder}/${fin}`);
  }
  if (startReto) {
    for (let n = 1; n <= 40; n += 1) {
      enqueue(queue, seen, `${swfDir}${imgFolder}/${startReto}${n}${term}`);
    }
  }
  if (startSaber) {
    for (let n = 1; n <= 12; n += 1) {
      enqueue(queue, seen, `${swfDir}${imgFolder}/${startSaber}${n}${term}`);
    }
  }
  for (const match of text.matchAll(/<escenario\b([^>]*)>/gi)) {
    const folder = xmlAttr(match[1], "carpeta");
    if (!folder || !startReto) {
      continue;
    }
    for (let n = 1; n <= 12; n += 1) {
      enqueue(
        queue,
        seen,
        `${swfDir}${folder}/${imgFolder}/${startReto}${n}${term}`,
      );
    }
  }
  const extTag = text.match(/<extension\b([^>]*)\/?>/i)?.[1] ?? "";
  const imgExt = xmlAttr(extTag, "img") || ".jpg";
  const preguntas = [...text.matchAll(/<pregunta\b/gi)];
  if (
    preguntas.length > 0 &&
    (/tipo="img"/i.test(text) || /<extension\b[^>]*\bimg=/i.test(text))
  ) {
    preguntas.forEach((_, index) => {
      const n = index + 1;
      for (let j = 0; j <= 8; j += 1) {
        enqueue(queue, seen, `${swfDir}img/p_${n}/${j}${imgExt}`);
      }
    });
  }
}

function walkFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

function aliasDaeTextures(pieceDir) {
  if (!existsSync(pieceDir)) {
    return;
  }
  for (const file of walkFiles(pieceDir)) {
    if (!/\.(?:dae|mtl)$/i.test(file)) {
      continue;
    }
    const fromPath = file.slice(pieceDir.length + 1).replaceAll("\\", "/");
    const fromDir = fromPath.replace(/[^/]+$/, "");
    const text = readFileSync(file, "utf8");
    const hits = [
      ...text.matchAll(/<init_from>\s*([^<]+)\s*<\/init_from>/gi),
      ...text.matchAll(/^[ \t]*map_Kd[ \t]+(\S+)/gim),
    ];
    for (const match of hits) {
      const href = match[1].trim();
      const baseName = href.split("/").pop()?.split("?")[0];
      if (!href || href.startsWith("file:") || !baseName) {
        continue;
      }
      const sibling = join(pieceDir, fromDir, baseName);
      if (!existsSync(sibling)) {
        continue;
      }
      let resolved;
      try {
        resolved = decodeURIComponent(
          new URL(href, `http://local/${fromPath}`).pathname.replace(/^\//, ""),
        );
      } catch {
        continue;
      }
      if (!resolved || resolved.includes("..")) {
        continue;
      }
      const dests = new Set([resolved, `${fromDir}${baseName}`]);
      const parentDir = fromDir.replace(/[^/]+\/$/, "");
      if (parentDir && parentDir !== fromDir) {
        dests.add(`${parentDir}meshes/${baseName}`);
      }
      const buffer = readFileSync(sibling);
      for (const rel of dests) {
        if (!rel || rel.includes("..")) {
          continue;
        }
        const dest = join(pieceDir, rel);
        if (existsSync(dest)) {
          continue;
        }
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, buffer);
      }
    }
  }
}

function enqueueTextureRefs(text, fromPath, swfPath, queue, seen) {
  const hits = [
    ...text.matchAll(/<init_from>\s*([^<]+)\s*<\/init_from>/gi),
    ...text.matchAll(/^[ \t]*map_Kd[ \t]+(\S+)/gim),
  ];
  const fromDir = fromPath.replace(/[^/]+$/, "");
  const swfDir = swfPath.replace(/[^/]+$/, "");
  for (const match of hits) {
    const href = match[1].trim();
    if (!href || href.startsWith("file:")) {
      continue;
    }
    enqueueRef(queue, seen, href, fromPath, swfPath);
    const baseName = href.split("/").pop()?.split("?")[0];
    if (baseName && ASSET_EXT.test(baseName)) {
      enqueue(queue, seen, `${fromDir}${baseName}`);
      enqueue(queue, seen, `${swfDir}assets/${baseName}`);
    }
  }
}

async function ingestPath(pieceDir, path, swfPath, queue, seen, fetched) {
  const dest = join(pieceDir, path);
  let buffer;
  if (existsSync(dest)) {
    buffer = readFileSync(dest);
  } else {
    buffer = await fetchBuffer(path);
    if (!buffer) {
      return false;
    }
    await savePath(pieceDir, path, buffer);
    fetched.push(path);
  }
  if (/\.swf$/i.test(path)) {
    for (const ref of swfRawRefs(buffer)) {
      enqueueRef(queue, seen, ref, path, swfPath);
    }
  } else if (/\.(?:html|js|css|xml|txt|dae|mtl)$/i.test(path)) {
    const text = buffer.toString("utf8");
    for (const ref of refsFromText(text)) {
      enqueueRef(queue, seen, ref, path, swfPath);
    }
    for (const extra of localRefsFromText(text, `${ORIGIN}/${path}`)) {
      enqueue(queue, seen, extra);
    }
    if (/\.xml$/i.test(path)) {
      enqueueXmlDerived(text, swfPath, queue, seen);
    }
    if (/\.(?:dae|mtl)$/i.test(path)) {
      enqueueTextureRefs(text, path, swfPath, queue, seen);
    }
  }
  return true;
}

function localRefsFromText(text, pageUrl) {
  const found = new Set();
  for (const href of refsFromText(text)) {
    const path = hostPathFromHref(href, pageUrl);
    if (path) {
      found.add(path.split("?")[0] ?? path);
    }
  }
  return [...found];
}

function originUrl(path) {
  return `${ORIGIN}/${String(path ?? "").replace(/^\//, "")}`;
}

function originDirUrl(path) {
  return originUrl(path).replace(/[^/]+$/, "");
}

function stripMoviePath(id, swf) {
  let path = String(swf ?? "");
  path = path.replace(`/swf-compare/pieces/${id}/`, "");
  path = path.replace(/^https?:\/\/static\.nikart\.co\.uk\//, "");
  path = path.replace(/^\/static\//, "");
  path = path.replace(/^\//, "");
  return path;
}

function unescapeHtml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function movieHref(piece) {
  if (piece.localSwf) {
    return piece.movieUrl ?? piece.localSwf;
  }
  if (piece.movieUrl) {
    return piece.movieUrl;
  }
  return originUrl(piece.swfPath);
}

function sourceForPieceId(id) {
  return (
    sources.find((source) => source.id === id) ??
    sources.find((source) => id.startsWith(`${source.id}__`))
  );
}

/** Catalog JSON order, with extra movies from one wrapper kept after that source. */
function orderPiecesByCatalog(produced) {
  const remaining = new Map(produced.map((piece) => [piece.id, piece]));
  const ordered = [];
  for (const source of sources) {
    const main = remaining.get(source.id);
    if (main) {
      ordered.push(main);
      remaining.delete(source.id);
    }
    const extraIds = [...remaining.keys()]
      .filter((id) => id.startsWith(`${source.id}__`))
      .sort((a, b) => a.localeCompare(b));
    for (const id of extraIds) {
      ordered.push(remaining.get(id));
      remaining.delete(id);
    }
  }
  const leftovers = [...remaining.values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  ordered.push(...leftovers);
  return ordered;
}

function writeCompareHtml(produced) {
  const ordered = orderPiecesByCatalog(produced);
  for (const [index, piece] of ordered.entries()) {
    const siblings = ordered.filter((item) => item.itemId === piece.itemId);
    const html = renderPieceHtml(
      piece,
      siblings,
      ordered[index - 1],
      ordered[index + 1],
    );
    mkdirSync(join(piecesRoot, piece.id), { recursive: true });
    writeFileSync(join(piecesRoot, piece.id, "index.html"), html);
  }
  writeFileSync(join(outRoot, "index.html"), renderIndex(ordered));
  writeFileSync(
    join(outRoot, "generated-catalog.json"),
    `${JSON.stringify(ordered, null, 2)}\n`,
  );
  return ordered;
}

function parseExistingPiece(id) {
  const htmlPath = join(piecesRoot, id, "index.html");
  if (!existsSync(htmlPath)) {
    return null;
  }
  const html = readFileSync(htmlPath, "utf8");
  const source = sourceForPieceId(id);
  if (!source) {
    return null;
  }
  const title = unescapeHtml(html.match(/<h1>(.*?)<\/h1>/s)?.[1] ?? source.title);
  const swf = unescapeHtml(
    html.match(/data-swf="([^"]+)"/)?.[1] ?? "",
  );
  const swfPath = source.localSwf
    ? (source.localSwf.split("/").pop() ?? "movie.swf")
    : stripMoviePath(id, swf);
  const width = Number.parseInt(html.match(/data-width="(\d+)"/)?.[1] ?? "", 10);
  const height = Number.parseInt(html.match(/data-height="(\d+)"/)?.[1] ?? "", 10);
  const parametersRaw = html.match(/data-parameters="([^"]*)"/)?.[1];
  let parameters;
  if (parametersRaw) {
    try {
      parameters = JSON.parse(unescapeHtml(parametersRaw));
    } catch {
      parameters = undefined;
    }
  }
  const baseAttr = unescapeHtml(html.match(/data-base="([^"]*)"/)?.[1] ?? "");
  return {
    id,
    title,
    group: source.group,
    itemId: source.itemId,
    wrapper: source.wrapper,
    localSwf: source.localSwf,
    swfPath,
    movieUrl: source.localSwf ?? originUrl(swfPath),
    loaderUrl: source.loaderUrl,
    base: source.base ?? originDirUrl(swfPath) ?? (baseAttr || undefined),
    playerVersion: source.playerVersion,
    background: source.background,
    parameters: source.parameters ?? parameters,
    note: source.note,
    width: Number.isFinite(width) ? width : source.width,
    height: Number.isFinite(height) ? height : source.height,
    primary: Boolean(source.primary),
  };
}

function rebuildHtmlFromPieces() {
  const produced = readdirSync(piecesRoot)
    .map((id) => parseExistingPiece(id))
    .filter(Boolean);
  const ordered = writeCompareHtml(produced);
  console.log(
    `Rewrote ${ordered.length} compare pages in catalog order (no SWF download).`,
  );
}

function extraStageAttrs(piece) {
  const attrs = [];
  if (piece.base) {
    attrs.push(`data-base="${escapeHtml(piece.base)}"`);
  }
  if (piece.loaderUrl) {
    attrs.push(`data-loader-url="${escapeHtml(piece.loaderUrl)}"`);
  }
  if (piece.playerVersion) {
    attrs.push(`data-player-version="${escapeHtml(String(piece.playerVersion))}"`);
  }
  if (piece.background) {
    attrs.push(`data-background="${escapeHtml(piece.background)}"`);
  }
  if (piece.parameters) {
    attrs.push(
      `data-parameters="${escapeHtml(JSON.stringify(piece.parameters))}"`,
    );
  }
  return attrs.length ? ` ${attrs.join(" ")}` : "";
}

function renderPieceHtml(piece, siblings, prev, next) {
  const siblingLinks = siblings
    .filter((item) => item.id !== piece.id)
    .map(
      (item) =>
        `<a href="../${item.id}/index.html">${escapeHtml(item.title)}</a>`,
    )
    .join(" · ");
  const href = movieHref(piece);
  const extra = extraStageAttrs(piece);
  const note =
    piece.note ??
    "Both players fetch the movie from <code>https://static.nikart.co.uk</code> (HTTPS + CORS). Child SWF/XML/JPEG URLs resolve from that movie directory. Some files work in Ruffle, some in AwayFL, some in neither.";
  const navLinks = [
    `<a href="/swf-compare/index.html">All SWFs</a>`,
    piece.id === "lizard-site" ? `<a href="/fl">Flash view</a>` : "",
    prev ? `<a href="../${prev.id}/index.html">← ${escapeHtml(prev.title)}</a>` : "",
    next ? `<a href="../${next.id}/index.html">${escapeHtml(next.title)} →</a>` : "",
  ].filter(Boolean);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(piece.title)} — Ruffle vs AwayFL</title>
  <link rel="stylesheet" href="/swf-compare/players.css">
</head>
<body>
  <div class="wrap">
    <nav class="topnav">
      ${navLinks.join("\n      ")}
    </nav>
    <h1>${escapeHtml(piece.title)}</h1>
    <p class="meta">${escapeHtml(href)} · ${piece.width}×${piece.height}</p>
    ${siblingLinks ? `<p class="siblings">Same item: ${siblingLinks}</p>\n    ` : ""}<p class="note">${note}</p>
    <div class="split">
      <section class="pane${defaultVisible(piece.id, "ruffle") ? "" : " is-off"}" data-pane="ruffle">
        <div class="pane-head">
          <h2>Ruffle</h2>
          ${visPaneToggle(piece.id, "ruffle")}
        </div>
        <div class="stage" style="--swf-aspect: ${piece.width} / ${piece.height}" data-player="ruffle" data-swf="${escapeHtml(href)}" data-width="${piece.width}" data-height="${piece.height}"${extra}></div>
      </section>
      <section class="pane${defaultVisible(piece.id, "awayfl") ? "" : " is-off"}" data-pane="awayfl">
        <div class="pane-head">
          <h2>AwayFL</h2>
          ${visPaneToggle(piece.id, "awayfl")}
        </div>
        <div class="stage" style="--swf-aspect: ${piece.width} / ${piece.height}" data-player="awayfl" data-swf="${escapeHtml(href)}" data-width="${piece.width}" data-height="${piece.height}"${extra}></div>
      </section>
    </div>
  </div>
  <script src="/swf-compare/players.js"></script>
</body>
</html>
`;
}

function renderIndex(pieces) {
  const groups = new Map();
  for (const piece of pieces) {
    const list = groups.get(piece.group) ?? [];
    list.push(piece);
    groups.set(piece.group, list);
  }
  const groupOrder = ["site", "websites", "games", "3d", "banners"];
  const sections = [...groups.entries()]
    .sort(
      (a, b) =>
        groupOrder.indexOf(a[0]) - groupOrder.indexOf(b[0]) ||
        a[0].localeCompare(b[0]),
    )
    .map(([group, list]) => {
      // Cards stay in catalog JSON order (the order `list` was filled).
      const cards = list
        .map(
          (piece) =>
            `<div class="card" data-piece="${escapeHtml(piece.id)}"><a href="pieces/${piece.id}/index.html">${escapeHtml(piece.title)}<small>${escapeHtml(piece.swfPath.split("/").pop() ?? piece.swfPath)}</small></a><span class="card-vis">${visFlagButton(piece.id, "ruffle", "Ruffle")}${visFlagButton(piece.id, "awayfl", "AwayFL")}</span></div>`,
        )
        .join("\n");
      return `<h2 class="group" id="${escapeHtml(group)}">${escapeHtml(group)}</h2>\n<div class="grid">${cards}</div>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ruffle vs AwayFL</title>
  <link rel="stylesheet" href="/swf-compare/players.css">
</head>
<body>
  <div class="wrap">
    <nav class="topnav">
      <a href="/fl">Flash site</a>
      <a href="pieces/lizard-site/index.html">Legacy Flash site</a>
      <a href="/en">HTML5 site</a>
    </nav>
    <h1>Ruffle vs AwayFL</h1>
    <p class="note">One page per SWF, both players side by side. Movies load from <code>https://static.nikart.co.uk</code> (HTTPS + CORS) so this repo does not duplicate the bucket. The <a href="pieces/lizard-site/index.html">legacy lizard Flash site</a> stays on <code>/fl/main.ruffle.swf</code> with <code>base=/fl/</code>.</p>
    ${sections}
  </div>
  <script src="/swf-compare/players.js"></script>
</body>
</html>
`;
}

async function siblingSwf(wrapperPath) {
  const dir = wrapperPath.replace(/\/[^/]*$/, "/");
  for (const name of ["Main.swf", "main.swf"]) {
    const path = `${dir}${name}`;
    const response = await fetch(`${ORIGIN}/${path}`, { method: "HEAD" });
    if (response.ok) {
      return path;
    }
  }
  return null;
}

function pieceIdFor(source, swfPath, index) {
  if (index === 0) {
    return source.id;
  }
  const base = (swfPath.split("/").pop() ?? "swf")
    .replace(/\.swf$/i, "")
    .replace(/[^\w]+/g, "-")
    .toLowerCase();
  return `${source.id}__${base}`;
}

async function syncSource(source, produced) {
  if (source.localSwf) {
    const destName =
      (source.localSwf.split("/").pop() ?? "movie.swf").split("?")[0] ??
      "movie.swf";
    produced.push({
      id: source.id,
      title: source.title,
      group: source.group,
      itemId: source.itemId,
      wrapper: source.wrapper,
      localSwf: source.localSwf,
      swfPath: destName,
      movieUrl: source.localSwf,
      loaderUrl: source.loaderUrl ?? source.localSwf,
      base: source.base,
      playerVersion: source.playerVersion,
      background: source.background,
      parameters: source.parameters,
      note: source.note,
      width: source.width,
      height: source.height,
      primary: Boolean(source.primary),
    });
    console.log(`  ${source.id}: ${source.localSwf} (local, not mirrored)`);
    return;
  }

  const pageUrl = `${ORIGIN}/${source.wrapper}`;
  const wrapperBuf = await fetchBuffer(source.wrapper);
  if (!wrapperBuf) {
    console.warn(`missing wrapper ${source.wrapper}`);
    return;
  }
  const html = wrapperBuf.toString("utf8");
  let movies = findSwfMovies(html, pageUrl);
  if (movies.length === 0) {
    const sibling = await siblingSwf(source.wrapper);
    if (sibling) {
      movies = [{ path: sibling, raw: sibling }];
    }
  }
  if (movies.length === 0) {
    console.warn(`no SWF in ${source.wrapper}`);
    return;
  }

  for (const [index, movie] of movies.entries()) {
    const id = pieceIdFor(source, movie.path, index);
    const title =
      movies.length === 1
        ? source.title
        : `${source.title} (${movie.path.split("/").pop()})`;
    produced.push({
      id,
      title,
      group: source.group,
      itemId: source.itemId,
      wrapper: source.wrapper,
      swfPath: movie.path,
      movieUrl: originUrl(movie.path),
      base: originDirUrl(movie.path),
      width: source.width,
      height: source.height,
      primary: Boolean(source.primary) && index === 0,
    });
    console.log(`  ${id}: ${originUrl(movie.path)}`);
  }
}

if (process.argv.includes("--html-only")) {
  rebuildHtmlFromPieces();
} else {
  mkdirSync(piecesRoot, { recursive: true });
  const produced = [];
  console.log(`Writing compare pages for ${ORIGIN}`);
  for (const source of sources) {
    try {
      await syncSource(source, produced);
    } catch (error) {
      console.warn(`failed ${source.id}:`, error);
    }
  }

  const ordered = writeCompareHtml(produced);
  console.log(
    `Wrote ${ordered.length} compare pages (movies load from ${ORIGIN})`,
  );
}
