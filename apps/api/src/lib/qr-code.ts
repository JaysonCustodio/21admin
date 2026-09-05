import { Jimp } from "jimp";
import jsQR from "jsqr";

// decodes the image and confirms it actually contains a scannable QR code —
// so a treasurer can't accidentally upload an unrelated image as the payment QR
export async function imageContainsQrCode(filePath: string): Promise<boolean> {
  try {
    const image = await Jimp.read(filePath);
    const { data, width, height } = image.bitmap;
    const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
    const result = jsQR(pixels, width, height);
    return result !== null;
  } catch {
    return false;
  }
}
