/**
 * Canvas helpers — image loading and canvas → blob download.
 * Used by the postcard composer (Phase 3); kept generic.
 */

/** Load an HTMLImageElement as a promise (crossOrigin anonymous for remote URLs). */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('blob:') && !src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`[canvas] image failed to load: ${src}`));
    img.src = src;
  });
}

/** canvas.toBlob → trigger a browser download. */
export function saveImage(canvas, filename = 'roomie-postcard.png') {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('[canvas] toBlob returned null'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve(blob);
    }, 'image/png');
  });
}

export default { loadImage, saveImage };
