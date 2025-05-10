
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole, getTokenFromHeader } from '../../../lib/auth';
import { supabase, logUserAction } from '../../../services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if user has client role
  const hasAccess = await checkRole(req, res, 'client');
  if (!hasAccess) return;

  // Get user ID from token
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getPedidos(req, res, user.id);
    case 'POST':
      return createPedido(req, res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get pedidos for the authenticated client
async function getPedidos(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    // Check if a specific pedido ID is requested
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    
    if (id) {
      // Get single pedido
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', id)
        .eq('client_id', userId)
        .single();
        
      if (error) {
        return res.status(404).json({ error: 'Pedido not found' });
      }
      
      return res.status(200).json(data);
    } else {
      // Get all pedidos for this client
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      return res.status(200).json(data || []);
    }
  } catch (error) {
    console.error('Error fetching pedidos:', error);
    return res.status(500).json({ error: 'Error fetching pedidos' });
  }
}

// Create a new pedido
async function createPedido(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { lista_paineis, duracao, valor_total } = req.body;
    
    if (!lista_paineis || !duracao || !valor_total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create pedido using the correct field names according to the schema
    const { data, error } = await supabase
      .from('pedidos')
      .insert([
        {
          client_id: userId,
          lista_paineis,
          duracao,
          valor_total,
          status: 'pendente'
        }
      ])
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    // Log action
    await logUserAction(
      userId,
      'create_pedido',
      { pedido_id: data.id }
    );
    
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating pedido:', error);
    return res.status(500).json({ error: 'Error creating pedido' });
  }
}
