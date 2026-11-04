import { inflateSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Ruffle's AVM1 `NetStream.close()` is a stub, so the lizard movie's
 * `endVideo` left FLV audio running after Back. The Ruffle copy pauses
 * instead. `npm run fla:ruffle` writes that `pause(true)` into
 * `main.ruffle.fla`; this file locks the published SWF. The Animate
 * export still calls `close()`.
 */

const publicFl = join(__dirname, "../../public/fl");

type PushValue = string | number | boolean;

type Instruction =
  | { op: "Push"; values: PushValue[] }
  | { op: "GetVar" }
  | { op: "CallMethod" }
  | { op: "Equals2" }
  | { op: "Not" }
  | { op: "Pop" }
  | { op: "If"; offset: number };

function decompressSwf(file: Buffer): Buffer {
  if (file.subarray(0, 3).toString("latin1") !== "CWS") {
    throw new Error("expected a zlib-compressed SWF");
  }
  return inflateSync(file.subarray(8));
}

function readCString(buf: Buffer, offset: number): { value: string; next: number } {
  const end = buf.indexOf(0, offset);
  if (end < 0) {
    throw new Error("unterminated string");
  }
  return { value: buf.toString("latin1", offset, end), next: end + 1 };
}

function constantPoolBefore(body: Buffer, functionAt: number): string[] {
  for (let at = functionAt - 1; at > functionAt - 8000 && at >= 0; at -= 1) {
    if (body[at] !== 0x88) {
      continue;
    }
    const length = body.readUInt16LE(at + 1);
    const payload = body.subarray(at + 3, at + 3 + length);
    if (payload.length < 2) {
      continue;
    }
    const count = payload.readUInt16LE(0);
    const values: string[] = [];
    let cursor = 2;
    try {
      for (let i = 0; i < count; i += 1) {
        const next = readCString(payload, cursor);
        values.push(next.value);
        cursor = next.next;
      }
    } catch {
      continue;
    }
    if (cursor === payload.length && values.includes("endVideo") && values.includes("netStream")) {
      return values;
    }
  }
  throw new Error("endVideo constant pool not found");
}

function pushValues(payload: Buffer, constants: string[]): PushValue[] {
  const values: PushValue[] = [];
  let cursor = 0;
  while (cursor < payload.length) {
    const type = payload[cursor];
    cursor += 1;
    if (type === undefined) {
      break;
    }
    if (type === 0) {
      const next = readCString(payload, cursor);
      values.push(next.value);
      cursor = next.next;
    } else if (type === 4) {
      const register = payload[cursor];
      if (register === undefined) {
        throw new Error("truncated register push");
      }
      values.push(`r${register}`);
      cursor += 1;
    } else if (type === 5) {
      values.push(payload[cursor] === 1);
      cursor += 1;
    } else if (type === 6) {
      values.push(payload.readDoubleLE(cursor));
      cursor += 8;
    } else if (type === 7) {
      values.push(payload.readInt32LE(cursor));
      cursor += 4;
    } else if (type === 8) {
      const index = payload[cursor];
      if (index === undefined) {
        throw new Error("truncated constant8");
      }
      const name = constants[index];
      if (name === undefined) {
        throw new Error(`missing constant ${index}`);
      }
      values.push(name);
      cursor += 1;
    } else if (type === 9) {
      const index = payload.readUInt16LE(cursor);
      const name = constants[index];
      if (name === undefined) {
        throw new Error(`missing constant ${index}`);
      }
      values.push(name);
      cursor += 2;
    } else {
      throw new Error(`unsupported push type ${type}`);
    }
  }
  return values;
}

function disassemble(code: Buffer, constants: string[]): Instruction[] {
  const instructions: Instruction[] = [];
  let cursor = 0;
  while (cursor < code.length) {
    const opcode = code[cursor];
    cursor += 1;
    if (opcode === undefined || opcode === 0) {
      break;
    }
    let payload = Buffer.alloc(0);
    if (opcode >= 0x80) {
      const length = code.readUInt16LE(cursor);
      cursor += 2;
      payload = code.subarray(cursor, cursor + length);
      cursor += length;
    }
    if (opcode === 0x96) {
      instructions.push({ op: "Push", values: pushValues(payload, constants) });
    } else if (opcode === 0x1c) {
      instructions.push({ op: "GetVar" });
    } else if (opcode === 0x52) {
      instructions.push({ op: "CallMethod" });
    } else if (opcode === 0x49) {
      instructions.push({ op: "Equals2" });
    } else if (opcode === 0x12) {
      instructions.push({ op: "Not" });
    } else if (opcode === 0x17) {
      instructions.push({ op: "Pop" });
    } else if (opcode === 0x9d) {
      instructions.push({ op: "If", offset: payload.readInt16LE(0) });
    } else {
      throw new Error(`unexpected opcode ${opcode.toString(16)} in endVideo`);
    }
  }
  return instructions;
}

function endVideoInstructions(file: Buffer): Instruction[] {
  const body = decompressSwf(file);
  const name = Buffer.from("endVideo\0", "latin1");
  let from = 0;
  while (from < body.length) {
    const nameAt = body.indexOf(name, from);
    if (nameAt < 3) {
      break;
    }
    if (body[nameAt - 3] === 0x8e && body.readUInt16LE(nameAt - 2) === name.length + 7) {
      const headerAt = nameAt + name.length;
      const codeSize = body.readUInt16LE(headerAt + 5);
      const code = body.subarray(headerAt + 7, headerAt + 7 + codeSize);
      return disassemble(code, constantPoolBefore(body, nameAt - 3));
    }
    from = nameAt + 1;
  }
  throw new Error("endVideo function not found");
}

describe("Flash endVideo", () => {
  it("pauses the NetStream when the Ruffle movie leaves a video", () => {
    const instructions = endVideoInstructions(readFileSync(join(publicFl, "main.ruffle.swf")));

    expect(instructions).toEqual([
      { op: "Push", values: [0] },
      { op: "Push", values: ["r1"] },
      { op: "Push", values: ["getCurType"] },
      { op: "CallMethod" },
      { op: "Push", values: ["vid"] },
      { op: "Equals2" },
      { op: "Not" },
      { op: "If", offset: 21 },
      { op: "Push", values: [true, 1, "netStream"] },
      { op: "GetVar" },
      { op: "Push", values: ["pause"] },
      { op: "CallMethod" },
      { op: "Pop" },
    ]);
  });

  it("leaves the Animate export calling NetStream.close", () => {
    const instructions = endVideoInstructions(readFileSync(join(publicFl, "main.swf")));

    expect(instructions).toEqual([
      { op: "Push", values: [0, "r1", "getCurType"] },
      { op: "CallMethod" },
      { op: "Push", values: ["vid"] },
      { op: "Equals2" },
      { op: "Not" },
      { op: "If", offset: 22 },
      { op: "Push", values: [0, "netStream"] },
      { op: "GetVar" },
      { op: "Push", values: ["close"] },
      { op: "CallMethod" },
      { op: "Pop" },
    ]);
  });
});
