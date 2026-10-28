import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim()),

  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  imagekit: {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
    uploadFolder: process.env.IMAGEKIT_UPLOAD_FOLDER || '/veyra',
  },

  adminBootstrapSecret: process.env.ADMIN_BOOTSTRAP_SECRET || '',
};

export function validateEnv() {
  const missing = [];
  if (config.env === 'production') {
    if (!config.supabase.url) missing.push('SUPABASE_URL');
    if (!config.supabase.serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!config.imagekit.privateKey) missing.push('IMAGEKIT_PRIVATE_KEY');
    if (!config.imagekit.urlEndpoint) missing.push('IMAGEKIT_URL_ENDPOINT');
  }
  return {
    valid: missing.length === 0,
    missing,
  };
}

