
import { NextApiRequest, NextApiResponse } from 'next';
import { checkRole } from '../../../lib/auth';
import { supabase, logUserAction } from '../../../services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if user has admin role
  const hasAccess = await checkRole(req, res, 'admin');
  if (!hasAccess) return;

  switch (req.method) {
    case 'GET':
      return getBuildings(req, res);
    case 'POST':
      return createBuilding(req, res);
    case 'PUT':
      return updateBuilding(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get all buildings with optional filtering
async function getBuildings(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { status, bairro } = req.query;
    
    // Normalize query parameters
    const parsedStatus = Array.isArray(status) ? status[0] : status;
    const parsedBairro = Array.isArray(bairro) ? bairro[0] : bairro;
    
    // Build query
    let query = supabase
      .from('buildings')
      .select(`
        *,
        painels (id, status, code)
      `);
      
    // Apply filters if provided
    if (parsedStatus) {
      query = query.eq('status', parsedStatus);
    }
    
    if (parsedBairro) {
      query = query.eq('bairro', parsedBairro);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return res.status(500).json({ error: 'Error fetching buildings' });
  }
}

// Create a new building
async function createBuilding(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = req.body;
    const { nome, endereco, bairro } = body;
    
    if (!nome || !endereco || !bairro) {
      return res.status(400).json({ error: 'Nome, endereco, and bairro are required' });
    }
    
    const { data, error } = await supabase
      .from('buildings')
      .insert([
        {
          nome,
          endereco,
          bairro,
          numero_unidades: body.numero_unidades || 0,
          preco_base: body.preco_base || 0,
          padrao_publico: body.padrao_publico || 'normal',
          status: body.status || 'ativo',
          venue_type: body.venue_type || 'Residencial',
          location_type: body.location_type || 'residential',
          latitude: body.latitude || 0,
          longitude: body.longitude || 0,
          caracteristicas: body.caracteristicas || [],
          amenities: body.amenities || body.caracteristicas || [],
          monthly_traffic: body.monthly_traffic || 0,
          nome_sindico: body.nome_sindico || '',
          contato_sindico: body.contato_sindico || '',
          nome_vice_sindico: body.nome_vice_sindico || '',
          contato_vice_sindico: body.contato_vice_sindico || '',
          nome_contato_predio: body.nome_contato_predio || '',
          numero_contato_predio: body.numero_contato_predio || ''
        }
      ])
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    // Extrair os primeiros 4 dígitos do UUID como codigo_predio
    const codigoPredio = data.id.replace(/-/g, '').substring(0, 4);
    
    // Atualizar o prédio com o codigo_predio
    const { error: updateError } = await supabase
      .from('buildings')
      .update({ codigo_predio: codigoPredio })
      .eq('id', data.id);
      
    if (updateError) {
      console.error('Error updating codigo_predio:', updateError);
    }
    
    // Chamar edge function para criar cliente externo
    try {
      await supabase.functions.invoke('create-external-client', {
        body: {
          buildingId: data.id,
          buildingName: nome
        }
      });
    } catch (webhookError) {
      console.error('Error calling create-external-client webhook:', webhookError);
      // Não falhar a criação do prédio se o webhook falhar
    }
    
    // Log action
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await logUserAction(
          user.id,
          'create_building',
          { building_id: data.id, codigo_predio: codigoPredio }
        );
      }
    }
    
    // Retornar dados atualizados com codigo_predio
    return res.status(201).json({
      ...data,
      codigo_predio: codigoPredio
    });
  } catch (error) {
    console.error('Error creating building:', error);
    return res.status(500).json({ error: 'Error creating building' });
  }
}

// Update an existing building
async function updateBuilding(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, nome, endereco, bairro, latitude, longitude, status } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Building ID is required' });
    }
    
    const { data, error } = await supabase
      .from('buildings')
      .update({
        nome,
        endereco,
        bairro,
        latitude,
        longitude,
        status
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    // Log action
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await logUserAction(
          user.id,
          'update_building',
          { building_id: id }
        );
      }
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating building:', error);
    return res.status(500).json({ error: 'Error updating building' });
  }
}
