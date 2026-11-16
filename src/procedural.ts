import {
  DataTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace,
  RepeatWrapping, RGBAFormat, SRGBColorSpace, UnsignedByteType,
} from 'three';

export type Random = () => number;
export type Rgb = readonly [red: number, green: number, blue: number];
export type Field<T> = (s: number, t: number) => T;
export type Raster = { readonly width: number; readonly height: number };

export function randomStream(label: string): Random {
  let state = 2166136261;
  for (let index = 0; index < label.length; index++) {
    state = Math.imul(state ^ label.charCodeAt(index), 16777619);
  }
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function rgb(hex: string): Rgb {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

export function mixRgb(from: Rgb, to: Rgb, amount: number): Rgb {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
  ];
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function tileableNoise(random: Random, period: number): Field<number> {
  const values = Array.from({ length: period * period }, random);
  return (s, t) => {
    const x = ((s % 1) + 1) % 1 * period;
    const y = ((t % 1) + 1) % 1 * period;
    const x0 = Math.floor(x) % period;
    const y0 = Math.floor(y) % period;
    const x1 = (x0 + 1) % period;
    const y1 = (y0 + 1) % period;
    const fx = smoothstep(0, 1, x - Math.floor(x));
    const fy = smoothstep(0, 1, y - Math.floor(y));
    const at = (ix: number, iy: number) => values[iy * period + ix];
    const top = at(x0, y0) + (at(x1, y0) - at(x0, y0)) * fx;
    const bottom = at(x0, y1) + (at(x1, y1) - at(x0, y1)) * fx;
    return top + (bottom - top) * fy;
  };
}

function texture(raster: Raster, field: Field<Rgb>, colorSpace: typeof SRGBColorSpace | typeof NoColorSpace): DataTexture {
  const data = new Uint8Array(raster.width * raster.height * 4);
  for (let y = 0; y < raster.height; y++) {
    for (let x = 0; x < raster.width; x++) {
      const color = field((x + 0.5) / raster.width, (y + 0.5) / raster.height);
      const offset = (y * raster.width + x) * 4;
      data[offset] = Math.round(Math.max(0, Math.min(1, color[0])) * 255);
      data[offset + 1] = Math.round(Math.max(0, Math.min(1, color[1])) * 255);
      data[offset + 2] = Math.round(Math.max(0, Math.min(1, color[2])) * 255);
      data[offset + 3] = 255;
    }
  }
  const result = new DataTexture(data, raster.width, raster.height, RGBAFormat, UnsignedByteType);
  result.colorSpace = colorSpace;
  result.wrapS = result.wrapT = RepeatWrapping;
  result.magFilter = LinearFilter;
  result.minFilter = LinearMipmapLinearFilter;
  result.generateMipmaps = true;
  result.anisotropy = 8;
  result.needsUpdate = true;
  return result;
}

export function colorTexture(raster: Raster, field: Field<Rgb>): DataTexture {
  return texture(raster, field, SRGBColorSpace);
}

export function reliefTexture(raster: Raster, field: Field<number>): DataTexture {
  return texture(raster, (s, t) => {
    const value = field(s, t);
    return [value, value, value];
  }, NoColorSpace);
}
