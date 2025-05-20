
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../services/supabase';

// Deprecated webhook handler - Being removed as part of webhook cleanup
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Return deprecated message
  return res.status(410).json({ 
    message: 'This webhook endpoint has been deprecated. Payment processing now happens through direct API integration.',
    status: 'deprecated'
  });
}
