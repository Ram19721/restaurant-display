// Cloudinary client-side config for unsigned uploads
// Fill in your Cloudinary cloud name and an UNSIGNED upload preset
// Create preset at: Cloudinary Console → Settings → Upload → Upload presets

export const cloudName = 'dwxnli5ie';
export const uploadPreset = 'restaurant_unsigned';

export const cloudinaryEnabled =
  typeof cloudName === 'string' && cloudName && !cloudName.includes('YOUR_') &&
  typeof uploadPreset === 'string' && uploadPreset && !uploadPreset.includes('YOUR_');
