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

const qualityBefore = [
  "if (_root.connection == undefined) {",
  '\t//trace("con 2: "+connection);',
  "\tstop();",
  '\tvideoContainer.gotoAndStop("select");',
  '\tvideoContainer.quality_txt.htmlText = _root.getLangStr(_root.otherObj, "quality");',
  '\t_root.lowStr = _root.getLangStr(_root.otherObj, "low_txt");',
  '\t_root.highStr = _root.getLangStr(_root.otherObj, "high_txt");',
  '\t_root.lowCombi = _root.lowStr + "<br />" + _root.getLangStr(_root.otherObj, "low_spd");',
  '\t_root.highCombi = _root.highStr + "<br />" + _root.getLangStr(_root.otherObj, "high_spd");',
  "\tvideoContainer.low_but.onRollOver = videoContainer.high_but.onRollOver = function () {",
  "\t\tMouse.show();",
  "\t};",
  "\tvideoContainer.low_but.onRelease = function() {",
  '\t\tselectConnection("150");',
  "\t};",
  "\tvideoContainer.high_but.onRelease = function() {",
  '\t\tselectConnection("500");',
  "\t};",
  "} else {",
  '\tvideoContainer.gotoAndStop("playing");',
  '\tgotoAndStop("vidPlaying");',
  "}",
  "",
  "function selectConnection(spd_str:String):Void {",
  "\t_root.connection = spd_str;",
  '\tvideoContainer.gotoAndStop("playing");',
  '\t_root.gotoAndStop("vidPlaying");',
  "}",
].join("\n");

const qualityAfter = [
  '_root.connection = "500";',
  'videoContainer.gotoAndStop("playing");',
  'gotoAndStop("vidPlaying");',
].join("\n");

const endVideoBefore = [
  "function endVideo() {",
  '\tif (_root.getCurType() == "vid") {',
  "\t\tnetStream.close();",
  "\t}",
  "}",
].join("\n");

const endVideoAfter = [
  "function endVideo() {",
  '\tif (_root.getCurType() == "vid") {',
  "\t\tnetStream.pause(true);",
  "\t}",
  "}",
].join("\n");

const hideQualityButton = '\nvid_controls["quality_" + connection + "_but"]._visible = false;';

const playbackButtons = `        <DOMLayer name="quality_high_but" color="#4F80FF" autoNamed="false">
          <frames>
            <DOMFrame index="0" keyMode="9728">
              <elements>
                <DOMSymbolInstance libraryItemName="video_folder/quality_high_but" name="quality_500_but" symbolType="button">
                  <matrix>
                    <Matrix tx="109" ty="-0.75"/>
                  </matrix>
                  <transformationPoint>
                    <Point/>
                  </transformationPoint>
                  <Actionscript>
                    <script><![CDATA[on (release) {
	_root.endVideo();
	_root.connection = "500";
	_root.gotoAndPlay("vidIn");
}
]]></script>
                  </Actionscript>
                </DOMSymbolInstance>
              </elements>
            </DOMFrame>
          </frames>
        </DOMLayer>
        <DOMLayer name="quality_low_but" color="#9933CC" autoNamed="false">
          <frames>
            <DOMFrame index="0" keyMode="9728">
              <elements>
                <DOMSymbolInstance libraryItemName="video_folder/quality_low_but" name="quality_150_but" symbolType="button">
                  <matrix>
                    <Matrix tx="109" ty="-0.75"/>
                  </matrix>
                  <transformationPoint>
                    <Point/>
                  </transformationPoint>
                  <Actionscript>
                    <script><![CDATA[on (release) {
	_root.endVideo();
	_root.connection = "150";
	_root.gotoAndPlay("vidIn");
}
]]></script>
                  </Actionscript>
                </DOMSymbolInstance>
              </elements>
            </DOMFrame>
          </frames>
        </DOMLayer>
`;

const selectButtons = `<elements>
                <DOMDynamicText name="quality_txt" fontRenderingMode="standard" left="-33.85" width="218.6" height="34" includeOutlines="true" isSelectable="false" renderAsHTML="true" lineType="multiline">
                  <matrix>
                    <Matrix tx="-75.45" ty="-35.95"/>
                  </matrix>
                  <textRuns>
                    <DOMTextRun>
                      <characters>quality_txt&#xD;2</characters>
                      <textAttrs>
                        <DOMTextAttrs alignment="center" aliasText="false" autoKern="false" size="16" face="KickAssinger" fillColor="#FFFFFF"/>
                      </textAttrs>
                    </DOMTextRun>
                  </textRuns>
                </DOMDynamicText>
                <DOMSymbolInstance libraryItemName="video_folder/modem" name="low_but" symbolType="button">
                  <matrix>
                    <Matrix tx="-87.75" ty="17"/>
                  </matrix>
                  <transformationPoint>
                    <Point/>
                  </transformationPoint>
                </DOMSymbolInstance>
                <DOMSymbolInstance libraryItemName="video_folder/broadband" name="high_but" selected="true" symbolType="button">
                  <matrix>
                    <Matrix tx="85.85" ty="17"/>
                  </matrix>
                  <transformationPoint>
                    <Point/>
                  </transformationPoint>
                </DOMSymbolInstance>
              </elements>`;

function replaceOnce(xml, before, after, done, label) {
  const count = xml.split(before).length - 1;
  if (count === 1) return { xml: xml.replace(before, after), changed: true };
  if (count === 0 && done(xml)) return { xml, changed: false };
  throw new Error(`${label} (${count} matches)`);
}

const patches = {
  "DOMDocument.xml": [
    [(xml) => replaceOnce(xml, drawingBefore, drawingAfter, (next) => next.includes(drawingAfter), "tongue drawing")],
    [(xml) => replaceOnce(xml, qualityBefore, qualityAfter, (next) => next.includes(qualityAfter) && !next.includes("selectConnection"), "quality step")],
    [(xml) => replaceOnce(xml, hideQualityButton, "", (next) => !next.includes('quality_" + connection'), "playback quality button")],
    [(xml) => replaceOnce(xml, endVideoBefore, endVideoAfter, (next) => next.includes(endVideoAfter) && !next.includes("netStream.close()"), "endVideo pause")],
  ],
  "LIBRARY/video_folder/vid_controls.xml": [
    [(xml) => replaceOnce(xml, playbackButtons, "", (next) => !next.includes("quality_500_but"), "vid_controls quality buttons")],
  ],
  "LIBRARY/video_folder/videoContainer.xml": [
    [(xml) => replaceOnce(xml, selectButtons, "<elements/>", (next) => !next.includes('name="low_but"'), "select-connection buttons")],
  ],
};

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
let changed = false;

for (const [name, steps] of Object.entries(patches)) {
  const entry = entries.find((item) => item.name === name);
  if (!entry) throw new Error(`${name} is missing from the FLA`);
  let xml = inflateEntry(entry).toString("utf8");
  let fileChanged = false;
  for (const [step] of steps) {
    const result = step(xml);
    xml = result.xml;
    fileChanged = fileChanged || result.changed;
  }
  if (!fileChanged) continue;
  const buf = Buffer.from(xml, "utf8");
  entry.method = 8;
  entry.data = deflateRawSync(buf);
  entry.crc = crc32(buf);
  entry.uncompressedSize = buf.length;
  changed = true;
}

if (!changed) {
  console.log(`${sourceFla} already has the tongue drawing, the high-quality video path, and the endVideo pause`);
  process.exit(0);
}

writeFileSync(outPath, pack(entries));
console.log(`Wrote ${outPath}`);
