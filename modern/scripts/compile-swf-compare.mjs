import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = join(root, "public/swf-compare");
const pagesPath = join(outRoot, "pages.json");
const KEEP = new Set([
  "pages.json",
  "players.js",
  "players.css",
  "README.md",
  "index.html",
  "visibility-defaults.json",
  "generated-catalog.json",
]);
const GROUP_ORDER = ["site", "websites", "games", "3d", "banners"];
const DEFAULT_NOTE =
  "Both players fetch the movie from <code>https://static.nikart.co.uk</code> (HTTPS + CORS). Child SWF/XML/JPEG URLs resolve from that movie directory. Some files work in Ruffle, some in AwayFL, some in neither.";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function loadPages() {
  const pages = JSON.parse(readFileSync(pagesPath, "utf8"));
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error(`${pagesPath} must be a non-empty array`);
  }
  const ids = new Set();
  for (const page of pages) {
    if (!page.id || ids.has(page.id)) {
      throw new Error(`duplicate or missing page id: ${page.id}`);
    }
    ids.add(page.id);
    for (const key of ["title", "group", "itemId", "swf", "base", "background"]) {
      if (!page[key]) {
        throw new Error(`${page.id} is missing ${key}`);
      }
    }
    if (!Number.isFinite(page.width) || !Number.isFinite(page.height)) {
      throw new Error(`${page.id} needs numeric width and height`);
    }
  }
  return pages;
}

function visible(page, player) {
  return page[player] !== false;
}

function visFlagButton(page, player, label) {
  const on = visible(page, player);
  return `<button type="button" class="vis ${on ? "is-on" : "is-off"}" data-vis="${player}" aria-pressed="${on}">${label}</button>`;
}

function visPaneToggle(page, player) {
  const on = visible(page, player);
  return `<button type="button" class="vis-toggle" data-vis="${player}" aria-pressed="${on}">${on ? "Hide" : "Show"}</button>`;
}

function extraStageAttrs(page, { includeBackground }) {
  const attrs = [];
  if (page.base) {
    attrs.push(`data-base="${escapeHtml(page.base)}"`);
  }
  if (page.loaderUrl) {
    attrs.push(`data-loader-url="${escapeHtml(page.loaderUrl)}"`);
  }
  if (page.playerVersion) {
    attrs.push(`data-player-version="${escapeHtml(String(page.playerVersion))}"`);
  }
  if (includeBackground && page.background) {
    attrs.push(`data-background="${escapeHtml(page.background)}"`);
  }
  if (page.parameters) {
    attrs.push(`data-parameters="${escapeHtml(JSON.stringify(page.parameters))}"`);
  }
  return attrs.length ? ` ${attrs.join(" ")}` : "";
}

function stageStyle(page) {
  return `style="--swf-w: ${page.width}; --swf-h: ${page.height}; --swf-aspect: ${page.width} / ${page.height}"`;
}

function pieceHref(id) {
  return `/swf-compare/${id}/index.html`;
}

function fillHref(id) {
  return `/swf-compare/${id}/fill.html`;
}

function renderPieceHtml(page, siblings, prev, next) {
  const siblingLinks = siblings
    .filter((item) => item.id !== page.id)
    .map(
      (item) =>
        `<a href="${pieceHref(item.id)}">${escapeHtml(item.title)}</a>`,
    )
    .join(" · ");
  const extra = extraStageAttrs(page, {
    includeBackground: page.stageBackground === true,
  });
  const note = page.note ?? DEFAULT_NOTE;
  const navLinks = [
    `<a href="/swf-compare/index.html">All SWFs</a>`,
    `<a href="${fillHref(page.id)}">Fill</a>`,
    page.id === "lizard-site" ? `<a href="/fl">Flash view</a>` : "",
    prev ? `<a href="${pieceHref(prev.id)}">← ${escapeHtml(prev.title)}</a>` : "",
    next ? `<a href="${pieceHref(next.id)}">${escapeHtml(next.title)} →</a>` : "",
  ].filter(Boolean);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)} — Ruffle vs AwayFL</title>
  <link rel="stylesheet" href="/swf-compare/players.css">
</head>
<body>
  <div class="wrap">
    <nav class="topnav">
      ${navLinks.join("\n      ")}
    </nav>
    <h1>${escapeHtml(page.title)}</h1>
    <p class="meta">${escapeHtml(page.swf)} · ${page.width}×${page.height}</p>
    ${siblingLinks ? `<p class="siblings">Same item: ${siblingLinks}</p>\n    ` : ""}<p class="note">${note}</p>
    <div class="split">
      <section class="pane${visible(page, "ruffle") ? "" : " is-off"}" data-pane="ruffle">
        <div class="pane-head">
          <h2>Ruffle</h2>
          ${visPaneToggle(page, "ruffle")}
        </div>
        <div class="stage" ${stageStyle(page)} data-player="ruffle" data-swf="${escapeHtml(page.swf)}" data-width="${page.width}" data-height="${page.height}"${extra}></div>
      </section>
      <section class="pane${visible(page, "awayfl") ? "" : " is-off"}" data-pane="awayfl">
        <div class="pane-head">
          <h2>AwayFL</h2>
          ${visPaneToggle(page, "awayfl")}
        </div>
        <div class="stage" ${stageStyle(page)} data-player="awayfl" data-swf="${escapeHtml(page.swf)}" data-width="${page.width}" data-height="${page.height}"${extra}></div>
      </section>
    </div>
  </div>
  <script src="/swf-compare/players.js"></script>
</body>
</html>
`;
}

function fillPlayer(page) {
  if (page.ruffle !== false) {
    return "ruffle";
  }
  if (page.awayfl !== false) {
    return "awayfl";
  }
  return "ruffle";
}

function renderFillHtml(page) {
  const player = fillPlayer(page);
  const extra = extraStageAttrs(page, { includeBackground: true });
  const background = escapeHtml(page.background);
  return `<!doctype html>
<html lang="en" style="background:${background}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)}</title>
  <link rel="stylesheet" href="/swf-compare/players.css">
</head>
<body style="background:${background}">
  <div class="stage stage-fill" style="--swf-w: ${page.width}; --swf-h: ${page.height}; --swf-aspect: ${page.width} / ${page.height}; background:${background}" data-fill="1" data-player="${player}" data-swf="${escapeHtml(page.swf)}" data-width="${page.width}" data-height="${page.height}"${extra}></div>
  <script src="/swf-compare/players.js"></script>
</body>
</html>
`;
}

function swfFileName(page) {
  const path = page.swf.split("?")[0] ?? page.swf;
  return path.split("/").pop() || path;
}

function renderIndex(pages) {
  const groups = new Map();
  for (const page of pages) {
    const list = groups.get(page.group) ?? [];
    list.push(page);
    groups.set(page.group, list);
  }
  const sections = [...groups.entries()]
    .sort(
      (a, b) =>
        GROUP_ORDER.indexOf(a[0]) - GROUP_ORDER.indexOf(b[0]) ||
        a[0].localeCompare(b[0]),
    )
    .map(([group, list]) => {
      const cards = list
        .map(
          (page) =>
            `<div class="card" data-piece="${escapeHtml(page.id)}"><a href="${pieceHref(page.id)}">${escapeHtml(page.title)}<small>${escapeHtml(swfFileName(page))}</small></a><span class="card-vis">${visFlagButton(page, "ruffle", "Ruffle")}${visFlagButton(page, "awayfl", "AwayFL")}</span></div>`,
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
      <a href="${pieceHref("lizard-site")}">Legacy Flash site</a>
      <a href="/en">HTML5 site</a>
    </nav>
    <h1>Ruffle vs AwayFL</h1>
    <p class="note">One page per SWF, both players side by side. Movies load from <code>https://static.nikart.co.uk</code> (HTTPS + CORS) so this repo does not duplicate the bucket. The <a href="${pieceHref("lizard-site")}">legacy lizard Flash site</a> stays on <code>/fl/main.ruffle.swf</code> with <code>base=/fl/</code>.</p>
    ${sections}
  </div>
  <script src="/swf-compare/players.js"></script>
</body>
</html>
`;
}

function visibilityDefaults(pages) {
  const defaults = {};
  for (const page of pages) {
    defaults[page.id] = {
      ruffle: page.ruffle !== false,
      awayfl: page.awayfl !== false,
    };
  }
  return defaults;
}

function removeStalePieces(pageIds) {
  if (!existsSync(outRoot)) {
    return;
  }
  for (const name of readdirSync(outRoot)) {
    if (KEEP.has(name) || pageIds.has(name)) {
      continue;
    }
    const path = join(outRoot, name);
    if (statSync(path).isDirectory()) {
      rmSync(path, { recursive: true, force: true });
    }
  }
}

function compile() {
  const pages = loadPages();
  mkdirSync(outRoot, { recursive: true });
  removeStalePieces(new Set(pages.map((page) => page.id)));
  for (const [index, page] of pages.entries()) {
    const siblings = pages.filter((item) => item.itemId === page.itemId);
    const dir = join(outRoot, page.id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "index.html"),
      renderPieceHtml(page, siblings, pages[index - 1], pages[index + 1]),
    );
    writeFileSync(join(dir, "fill.html"), renderFillHtml(page));
  }
  writeFileSync(join(outRoot, "index.html"), renderIndex(pages));
  writeFileSync(
    join(outRoot, "visibility-defaults.json"),
    `${JSON.stringify(visibilityDefaults(pages), null, 2)}\n`,
  );
  console.log(
    `Compiled ${pages.length} compare pages and fill pages from pages.json.`,
  );
}

compile();
