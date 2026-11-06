// Vercel Serverless Function: POST /api/media/imagekit-auth
// Generates temporary ImageKit upload credentials for authenticated users.
import ImageKit from 'imagekit';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed', status: 405 } });
  }

  const user = await verifyToken(req.headers.authorization).catch(() => null);
  if (!user) {
    return res.status(401).json({ error: { message: 'Authentication required.', status: 401 } });
  }

  const { publicKey, privateKey, urlEndpoint } = {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  };

  if (!publicKey || !privateKey || !urlEndpoint) {
    return res.status(503).json({ error: { message: 'Image storage is not configured.', status: 503 } });
  }

  try {
    const ik = new ImageKit({ publicKey, privateKey, urlEndpoint });
    const authParams = ik.getAuthenticationParameters();
    return res.json({
      token: authParams.token,
      expire: authParams.expire,
      signature: authParams.signature,
      publicKey,
    });
  } catch (err) {
    return res.status(500).json({ error: { message: 'Failed to generate upload credentials.', status: 500 } });
  }
}
