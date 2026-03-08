/**
 * Generates solid-color PNG icons for the PWA manifest.
 * Run with: bun run scripts/generate-icons.ts
 */
import { deflateSync } from "zlib";
import { writeFileSync } from "fs";

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const b of data) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = Buffer.from(type, "ascii");
  const crcBuf = Buffer.concat([typeBytes, data]);
  const checksum = crc32(new Uint8Array(crcBuf));
  const out = new Uint8Array(4 + 4 + data.length + 4);
  const v = new DataView(out.buffer);
  v.setUint32(0, data.length, false);
  out.set(typeBytes, 4);
  out.set(data, 8);
  v.setUint32(8 + data.length, checksum, false);
  return out;
}

function makePNG(size: number, r: number, g: number, b: number): Buffer {
  // IHDR: width, height, 8-bit RGB
  const ihdr = new Uint8Array(13);
  const iv = new DataView(ihdr.buffer);
  iv.setUint32(0, size);
  iv.setUint32(4, size);
  ihdr[8] = 8; ihdr[9] = 2; // bit-depth=8, colour-type=RGB

  // Raw scanlines: 1 filter byte + width*3 RGB bytes per row
  const row = 1 + size * 3;
  const raw = new Uint8Array(row * size);
  for (let y = 0; y < size; y++) {
    const o = y * row;
    raw[o] = 0; // filter=None
    for (let x = 0; x < size; x++) {
      raw[o + 1 + x * 3] = r;
      raw[o + 1 + x * 3 + 1] = g;
      raw[o + 1 + x * 3 + 2] = b;
    }
  }
  const compressed = deflateSync(Buffer.from(raw));

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", new Uint8Array(compressed)),
    pngChunk("IEND", new Uint8Array(0)),
  ]);
}

// Sage green: #8BAF7C = rgb(139, 175, 124)
for (const size of [192, 512]) {
  const png = makePNG(size, 139, 175, 124);
  writeFileSync(`public/icons/icon-${size}.png`, png);
  console.log(`✓ public/icons/icon-${size}.png (${(png.length / 1024).toFixed(1)} KB)`);
}
