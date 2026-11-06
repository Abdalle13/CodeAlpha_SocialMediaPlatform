// Vercel Serverless Function: /api/health
export default function handler(req, res) {
  res.json({ status: 'ok', service: 'veyra-api', timestamp: new Date().toISOString() });
}

