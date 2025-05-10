
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole } from '../../../lib/auth';
import { supabase } from '../../../services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if user has admin role
  const hasAccess = await checkRole(req, res, 'admin');
  if (!hasAccess) return;

  // Only GET requests allowed
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { panelId, limit = 100, offset = 0, startDate, endDate, eventType } = req.query;
    
    // Build query
    let query = supabase
      .from('painel_logs')
      .select('*, painels(name, location)')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);
      
    // Apply filters if provided
    if (panelId) {
      query = query.eq('painel_id', panelId);
    }
    
    if (startDate) {
      query = query.gte('created_at', String(startDate));
    }
    
    if (endDate) {
      query = query.lte('created_at', String(endDate));
    }
    
    if (eventType) {
      query = query.eq('status_sincronizacao', String(eventType));
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('painel_logs')
      .select('*', { count: 'exact', head: true });
      
    return res.status(200).json({
      data: data || [],
      pagination: {
        total: totalCount,
        offset: Number(offset),
        limit: Number(limit),
        hasMore: (Number(offset) + (data?.length || 0)) < (totalCount || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching panel logs:', error);
    return res.status(500).json({ error: 'Error fetching panel logs' });
  }
}
