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
  /\.(?:swf|xml|jpg|jpeg|png|gif|dae|mp3|wav|flv|json|css|js|html|txt|obj|mtl|atf|csv)(?:$|[?#])/i;

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

function localRefsFromText(text, pageUrl) {
  const found = new Set();
  const patterns = [
    /(?:href|src)=["']([^"']+)["']/gi,
    /url\(["']?([^"')]+)["']?\)/gi,
    /["']([^"']+\.(?:swf|xml|jpg|jpeg|png|gif|dae|mp3|wav|json|css|js|html|txt|obj|mtl))["']/gi,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const href = match[1];
      if (!href || href.startsWith("data:") || href.startsWith("mailto:")) {
        continue;
      }
      const path = hostPathFromHref(href, pageUrl);
      if (path && ASSET_EXT.test(path)) {
        found.add(path.split("?")[0] ?? path);
      }
    }
  }
  return [...found];
}

function swfAssetPaths(buffer, swfPath) {
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
    /[A-Za-z0-9_./%-]{3,180}\.(?:xml|jpg|jpeg|png|gif|dae|mp3|wav|flv|json|css|swf|txt|html|obj|mtl|atf)/gi,
  );
  if (!matches) {
    return [];
  }
  const swfUrl = `${ORIGIN}/${swfPath}`;
  const paths = new Set();
  for (const match of matches) {
    const cleaned = match.replace(/^[./]+/, "./" + match.replace(/^\.?\//, ""));
    const path = hostPathFromHref(match, swfUrl);
    if (path && !path.includes("..")) {
      paths.add(path.split("?")[0] ?? path);
    } else {
      const relative = hostPathFromHref(cleaned.startsWith("./") ? cleaned : `./${match}`, swfUrl);
      if (relative && !relative.includes("..")) {
        paths.add(relative.split("?")[0] ?? relative);
      }
    }
  }
  return [...paths];
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

async function downloadInto(pieceDir, path, cache) {
  const key = path.split("?")[0] ?? path;
  if (cache.has(key)) {
    return cache.get(key);
  }
  cache.set(key, false);
  const buffer = await fetchBuffer(key);
  if (!buffer) {
    return false;
  }
  await savePath(pieceDir, key, buffer);
  cache.set(key, true);
  return true;
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
        <div class="stage" data-player="ruffle" data-swf="${escapeHtml(piece.swfPath)}" data-width="${piece.width}" data-height="${piece.height}"></div>
      </section>
      <section class="pane">
        <h2>AwayFL</h2>
        <div class="stage" data-player="awayfl" data-swf="${escapeHtml(piece.swfPath)}" data-width="${piece.width}" data-height="${piece.height}"></div>
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
    const cache = new Map();

    const swfBuffer = await fetchBuffer(movie.path);
    if (!swfBuffer) {
      console.warn(`missing SWF ${movie.path}`);
      continue;
    }
    mkdirSync(pieceDir, { recursive: true });
    await savePath(pieceDir, source.wrapper, wrapperBuf);
    cache.set(source.wrapper, true);
    await savePath(pieceDir, movie.path, swfBuffer);
    cache.set(movie.path, true);
    const queue = new Set([
      movie.path,
      ...localRefsFromText(html, pageUrl),
    ]);
    for (const extra of swfAssetPaths(swfBuffer, movie.path)) {
      queue.add(extra);
    }

    for (const path of queue) {
      if (path === movie.path || path === source.wrapper) {
        continue;
      }
      const ok = await downloadInto(pieceDir, path, cache);
      if (!ok) {
        continue;
      }
      if (/\.(?:html|js|css|xml)$/i.test(path)) {
        const text = readFileSync(join(pieceDir, path), "utf8");
        for (const nested of localRefsFromText(text, `${ORIGIN}/${path}`)) {
          if (!cache.has(nested)) {
            await downloadInto(pieceDir, nested, cache);
          }
        }
      }
    }

    const copied = [...cache.entries()].filter(([, ok]) => ok).length;
    console.log(`  ${id}: ${movie.path} (+${copied} files)`);
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
