import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync, inflateRawSync, crc32 } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const sourceFla = resolve(here, "../src/fl/main.fla");

const drawingBefore = [
  "\t\tlizard.tongue.clear();",
  '\t\tlizard.tongue.lineStyle(10,"0x340101",100);',
  "\t\tmidx = tongueTarget._x + Math.cos(tongueTarget.curAngle) * 75;",
  "\t\tmidy = tongueTarget._y + Math.sin(tongueTarget.curAngle) * 75;",
  "\t\tlizard.tongue.curveTo(midx,midy,tongueTarget._x,tongueTarget._y);",
  '\t\tlizard.tongue.lineStyle(6,"0xBA0101",100);',
  "\t\tlizard.tongue.curveTo(midx,midy,0,0);",
].join("\n");

const drawingAfter = [
  "\t\tlizard.tongue.clear();",
  "\t\tmidx = tongueTarget._x + Math.cos(tongueTarget.curAngle) * 75;",
  "\t\tmidy = tongueTarget._y + Math.sin(tongueTarget.curAngle) * 75;",
  '\t\tlizard.tongue.lineStyle(10,"0x340101",100);',
  "\t\tlizard.tongue.moveTo(0,0);",
  "\t\tlizard.tongue.curveTo(midx,midy,tongueTarget._x,tongueTarget._y);",
  '\t\tlizard.tongue.lineStyle(6,"0xBA0101",100);',
  "\t\tlizard.tongue.moveTo(0,0);",
  "\t\tlizard.tongue.curveTo(midx,midy,tongueTarget._x,tongueTarget._y);",
].join("\n");

function parseLocalEntries(buf) {
  const entries = [];
  let off = 0;
  while (off + 30 <= buf.length && buf.readUInt32LE(off) === 0x04034b50) {
    const versionNeeded = buf.readUInt16LE(off + 4);
    const flag = buf.readUInt16LE(off + 6);
    const method = buf.readUInt16LE(off + 8);
    const time = buf.readUInt16LE(off + 10);
    const date = buf.readUInt16LE(off + 12);
    const crc = buf.readUInt32LE(off + 14);
    const compressedSize = buf.readUInt32LE(off + 18);
    const uncompressedSize = buf.readUInt32LE(off + 22);
    const nameLength = buf.readUInt16LE(off + 26);
    const extraLength = buf.readUInt16LE(off + 28);
    const nameStart = off + 30;
    const name = buf.subarray(nameStart, nameStart + nameLength).toString("utf8");
    const extra = buf.subarray(nameStart + nameLength, nameStart + nameLength + extraLength);
    const dataStart = nameStart + nameLength + extraLength;
    const data = buf.subarray(dataStart, dataStart + compressedSize);
    entries.push({
      versionNeeded,
      flag,
      method,
      time,
      date,
      crc,
      uncompressedSize,
      name,
      extra,
      data,
    });
    off = dataStart + compressedSize;
  }
  if (entries.length === 0) {
    throw new Error(`No zip local headers in ${sourceFla}`);
  }
  return entries;
}

function inflateEntry(entry) {
  if (entry.method === 0) return Buffer.from(entry.data);
  if (entry.method === 8) return inflateRawSync(entry.data);
  throw new Error(`${entry.name} uses zip method ${entry.method}`);
}

function patchDocument(xml) {
  const hasBefore = xml.includes(drawingBefore);
  const hasAfter = xml.includes(drawingAfter);
  if (hasAfter && !hasBefore) return { xml, changed: false };
  if (!hasBefore) {
    throw new Error("DOMDocument.xml does not contain the original tongue drawing");
  }
  if (xml.split(drawingBefore).length !== 2) {
    throw new Error("Expected the tongue drawing once");
  }
  return { xml: xml.replace(drawingBefore, drawingAfter), changed: true };
}

function localHeader(entry, name) {
  const nameBuf = Buffer.from(name, "utf8");
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(entry.versionNeeded, 4);
  header.writeUInt16LE(entry.flag, 6);
  header.writeUInt16LE(entry.method, 8);
  header.writeUInt16LE(entry.time, 10);
  header.writeUInt16LE(entry.date, 12);
  header.writeUInt32LE(entry.crc >>> 0, 14);
  header.writeUInt32LE(entry.data.length, 18);
  header.writeUInt32LE(entry.uncompressedSize, 22);
  header.writeUInt16LE(nameBuf.length, 26);
  header.writeUInt16LE(entry.extra.length, 28);
  return Buffer.concat([header, nameBuf, entry.extra, entry.data]);
}

function centralHeader(entry, name, offset) {
  const nameBuf = Buffer.from(name, "utf8");
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(entry.versionNeeded, 6);
  header.writeUInt16LE(entry.flag, 8);
  header.writeUInt16LE(entry.method, 10);
  header.writeUInt16LE(entry.time, 12);
  header.writeUInt16LE(entry.date, 14);
  header.writeUInt32LE(entry.crc >>> 0, 16);
  header.writeUInt32LE(entry.data.length, 20);
  header.writeUInt32LE(entry.uncompressedSize, 24);
  header.writeUInt16LE(nameBuf.length, 28);
  header.writeUInt16LE(entry.extra.length, 30);
  header.writeUInt32LE(offset, 42);
  return Buffer.concat([header, nameBuf, entry.extra]);
}

function endOfCentralDirectory(count, size, offset) {
  const header = Buffer.alloc(22);
  header.writeUInt32LE(0x06054b50, 0);
  header.writeUInt16LE(count, 8);
  header.writeUInt16LE(count, 10);
  header.writeUInt32LE(size, 12);
  header.writeUInt32LE(offset, 16);
  return header;
}

function pack(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const entry of entries) {
    const local = localHeader(entry, entry.name);
    locals.push(local);
    centrals.push(centralHeader(entry, entry.name, offset));
    offset += local.length;
  }
  const central = Buffer.concat(centrals);
  return Buffer.concat([...locals, central, endOfCentralDirectory(entries.length, central.length, offset)]);
}

const outFlag = process.argv.indexOf("--out");
const outPath = outFlag === -1 ? resolve(here, "../src/fl/main.ruffle.fla") : resolve(process.argv[outFlag + 1]);
const entries = parseLocalEntries(readFileSync(sourceFla));
const document = entries.find((entry) => entry.name === "DOMDocument.xml");
if (!document) throw new Error("DOMDocument.xml is missing from the FLA");

const patched = patchDocument(inflateEntry(document).toString("utf8"));
if (!patched.changed) {
  console.log(`${sourceFla} already has the Ruffle tongue drawing`);
  process.exit(0);
}
const xml = Buffer.from(patched.xml, "utf8");
document.method = 8;
document.data = deflateRawSync(xml);
document.crc = crc32(xml);
document.uncompressedSize = xml.length;

writeFileSync(outPath, pack(entries));
console.log(`Wrote ${outPath}`);
