import { inflateSync } from "node:zlib";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "src/lib/swf-compare-catalog.json");
const outRoot = join(root, "public/swf-compare");
const piecesRoot = join(outRoot, "pieces");
const ORIGIN = process.env.SWF_COMPARE_ORIGIN ?? "http://static.nikart.co.uk";
const MAX_BYTES = 80 * 1024 * 1024;

const sources = JSON.parse(readFileSync(catalogPath, "utf8"));

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
    for (const extra of [".txt", ".dat", ".pat", ".xml", ".swf"]) {
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
  } else if (/\.(?:html|js|css|xml|txt)$/i.test(path)) {
    const text = buffer.toString("utf8");
    for (const ref of refsFromText(text)) {
      enqueueRef(queue, seen, ref, path, swfPath);
    }
    for (const extra of localRefsFromText(text, `${ORIGIN}/${path}`)) {
      enqueue(queue, seen, extra);
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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPieceHtml(piece, siblings, prev, next) {
  const siblingLinks = siblings
    .filter((item) => item.id !== piece.id)
    .map(
      (item) =>
        `<a href="../${item.id}/index.html">${escapeHtml(item.title)}</a>`,
    )
    .join(" · ");
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
      <a href="/swf-compare/index.html">All SWFs</a>
      ${prev ? `<a href="../${prev.id}/index.html">← ${escapeHtml(prev.title)}</a>` : ""}
      ${next ? `<a href="../${next.id}/index.html">${escapeHtml(next.title)} →</a>` : ""}
    </nav>
    <h1>${escapeHtml(piece.title)}</h1>
    <p class="meta">${escapeHtml(piece.swfPath)} · ${piece.width}×${piece.height}</p>
    ${siblingLinks ? `<p class="siblings">Same item: ${siblingLinks}</p>` : ""}
    <p class="note">Same local SWF in both players. Some files work in Ruffle, some in AwayFL, some in neither.</p>
    <div class="split">
      <section class="pane">
        <h2>Ruffle</h2>
        <div class="stage" style="--swf-aspect: ${piece.width} / ${piece.height}" data-player="ruffle" data-swf="${escapeHtml(piece.swfPath)}" data-width="${piece.width}" data-height="${piece.height}"></div>
      </section>
      <section class="pane">
        <h2>AwayFL</h2>
        <div class="stage" style="--swf-aspect: ${piece.width} / ${piece.height}" data-player="awayfl" data-swf="${escapeHtml(piece.swfPath)}" data-width="${piece.width}" data-height="${piece.height}"></div>
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
  const sections = [...groups.entries()]
    .map(([group, list]) => {
      const cards = list
        .map(
          (piece) =>
            `<a class="card" href="pieces/${piece.id}/index.html">${escapeHtml(piece.title)}<small>${escapeHtml(piece.swfPath.split("/").pop() ?? piece.swfPath)}</small></a>`,
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
      <a href="/en">HTML5 site</a>
    </nav>
    <h1>Ruffle vs AwayFL</h1>
    <p class="note">One page per SWF, both players side by side. Files are copied locally under <code>public/swf-compare/pieces/</code>.</p>
    ${sections}
  </div>
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
    const pieceDir = join(piecesRoot, id);
    const swfDest = join(pieceDir, movie.path);
    const swfBuffer = existsSync(swfDest)
      ? readFileSync(swfDest)
      : await fetchBuffer(movie.path);
    if (!swfBuffer) {
      console.warn(`missing SWF ${movie.path}`);
      continue;
    }
    mkdirSync(pieceDir, { recursive: true });
    await savePath(pieceDir, source.wrapper, wrapperBuf);
    if (!existsSync(swfDest)) {
      await savePath(pieceDir, movie.path, swfBuffer);
    }

    const seen = new Set();
    const queue = [];
    const fetched = [];
    enqueue(queue, seen, source.wrapper);
    enqueue(queue, seen, movie.path);
    for (const href of refsFromText(html)) {
      enqueueRef(queue, seen, href, source.wrapper, movie.path);
    }
    for (const extra of localRefsFromText(html, pageUrl)) {
      enqueue(queue, seen, extra);
    }
    for (const ref of swfRawRefs(swfBuffer)) {
      enqueueRef(queue, seen, ref, movie.path, movie.path);
    }
    const swfDir = movie.path.replace(/[^/]+$/, "");
    for (const seed of SWF_DIR_SEEDS) {
      enqueue(queue, seen, `${swfDir}${seed}`);
    }

    while (queue.length > 0) {
      const path = queue.shift();
      if (path === movie.path || path === source.wrapper) {
        await ingestPath(pieceDir, path, movie.path, queue, seen, fetched);
        continue;
      }
      await ingestPath(pieceDir, path, movie.path, queue, seen, fetched);
    }

    console.log(
      `  ${id}: ${movie.path} (${seen.size} candidates, +${fetched.length} new)`,
    );
    produced.push({
      id,
      title,
      group: source.group,
      itemId: source.itemId,
      wrapper: source.wrapper,
      swfPath: movie.path,
      width: source.width,
      height: source.height,
      primary: Boolean(source.primary) && index === 0,
    });
  }
}

mkdirSync(piecesRoot, { recursive: true });
const produced = [];
console.log(`Mirroring SWFs from ${ORIGIN}`);
for (const source of sources) {
  try {
    await syncSource(source, produced);
  } catch (error) {
    console.warn(`failed ${source.id}:`, error);
  }
}

produced.sort((a, b) => a.title.localeCompare(b.title));
for (const [index, piece] of produced.entries()) {
  const siblings = produced.filter((item) => item.itemId === piece.itemId);
  const html = renderPieceHtml(
    piece,
    siblings,
    produced[index - 1],
    produced[index + 1],
  );
  writeFileSync(join(piecesRoot, piece.id, "index.html"), html);
}

writeFileSync(join(outRoot, "index.html"), renderIndex(produced));
writeFileSync(
  join(outRoot, "generated-catalog.json"),
  `${JSON.stringify(produced, null, 2)}\n`,
);
console.log(`Wrote ${produced.length} compare pages to public/swf-compare/pieces/`);
