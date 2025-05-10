
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
    const { 
      panelId, 
      limit = 100, 
      offset = 0, 
      startDate, 
      endDate, 
      eventType 
    } = req.query;
    
    // Normalize query parameters
    const parsedLimit = Number(Array.isArray(limit) ? limit[0] : limit);
    const parsedOffset = Number(Array.isArray(offset) ? offset[0] : offset);
    const parsedPanelId = Array.isArray(panelId) ? panelId[0] : panelId;
    const parsedStartDate = Array.isArray(startDate) ? startDate[0] : startDate;
    const parsedEndDate = Array.isArray(endDate) ? endDate[0] : endDate;
    const parsedEventType = Array.isArray(eventType) ? eventType[0] : eventType;
    
    // Build query
    let query = supabase
      .from('painel_logs')
      .select('*, painels(name, location)')
      .order('created_at', { ascending: false })
      .range(parsedOffset, parsedOffset + parsedLimit - 1);
      
    // Apply filters if provided
    if (parsedPanelId) {
      query = query.eq('painel_id', parsedPanelId);
    }
    
    if (parsedStartDate) {
      query = query.gte('created_at', parsedStartDate);
    }
    
    if (parsedEndDate) {
      query = query.lte('created_at', parsedEndDate);
    }
    
    if (parsedEventType) {
      query = query.eq('status_sincronizacao', parsedEventType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('painel_logs')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      throw countError;
    }
    
    return res.status(200).json({
      data: data || [],
      pagination: {
        total: totalCount,
        offset: parsedOffset,
        limit: parsedLimit,
        hasMore: (parsedOffset + (data?.length || 0)) < (totalCount || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching panel logs:', error);
    return res.status(500).json({ error: 'Error fetching panel logs' });
  }
}
