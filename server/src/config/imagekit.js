import ImageKit from 'imagekit';
import { config } from './env.js';

let imageKitInstance = null;

export function getImageKit() {
  if (imageKitInstance) {
    return imageKitInstance;
  }

  const { publicKey, privateKey, urlEndpoint } = config.imagekit;

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error(
      'ImageKit credentials are not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in server/.env'
    );
  }

  imageKitInstance = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });

  return imageKitInstance;
}

export function isImageKitConfigured() {
  return Boolean(
    config.imagekit.publicKey &&
    config.imagekit.privateKey &&
    config.imagekit.urlEndpoint
  );
}

