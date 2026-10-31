import { apiClient } from '../../lib/api';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * uploadToImageKit: Uploads an image file directly to ImageKit using
 * server-generated authentication parameters.
 */
export async function uploadToImageKit(file, { folder = '/veyra' } = {}) {
  if (!file) {
    throw new Error('Please select an image file to upload.');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Unsupported image format. Please use JPG, PNG, WebP, or AVIF.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image size exceeds 5 MB limit. Please choose a smaller photo.');
  }

  // 1. Obtain signed upload parameters from Veyra Express backend
  const authParams = await apiClient('/media/imagekit-auth', {
    method: 'POST',
  });

  const { token, expire, signature, publicKey } = authParams;

  // 2. Upload file directly to ImageKit REST endpoint
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  formData.append('publicKey', publicKey);
  formData.append('signature', signature);
  formData.append('expire', expire);
  formData.append('token', token);
  formData.append('folder', folder);
  formData.append('useUniqueFileName', 'true');

  const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await uploadResponse.json();

  if (!uploadResponse.ok) {
    throw new Error(result?.message || 'Failed to upload photo to media storage.');
  }

  return {
    url: result.url,
    fileId: result.fileId,
    name: result.name,
    width: result.width,
    height: result.height,
  };
}

/**
 * deleteFromImageKit: Deletes a user-owned asset through the Veyra server.
 */
export async function deleteFromImageKit(fileId) {
  if (!fileId) return;
  return apiClient(`/media/${fileId}`, {
    method: 'DELETE',
  });
}

