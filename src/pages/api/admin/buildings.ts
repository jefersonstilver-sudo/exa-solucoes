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
    console.log('=== CREATE BUILDING DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const buildingData = req.body;
    
    if (!buildingData.nome || !buildingData.endereco || !buildingData.bairro) {
      console.log('Missing required fields:', { 
        nome: !!buildingData.nome, 
        endereco: !!buildingData.endereco, 
        bairro: !!buildingData.bairro 
      });
      return res.status(400).json({ error: 'Nome, endereco, and bairro are required' });
    }
    
    console.log('Creating building with data:', buildingData);
    
    const { data, error } = await supabase
      .from('buildings')
      .insert([buildingData])
      .select()
      .single();
      
    if (error) {
      console.error('Supabase error creating building:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log('Building created successfully:', data);

    // Generate codigo_predio from building ID
    const codigoPredioParts = data.id.split('-');
    const codigo_predio = codigoPredioParts[0].substring(0, 3).toUpperCase();
    
    console.log('Generated codigo_predio:', codigo_predio);
    
    const { error: updateError } = await supabase
      .from('buildings')
      .update({ codigo_predio })
      .eq('id', data.id);
    
    if (updateError) {
      console.error('Error updating building with codigo_predio:', updateError);
      return res.status(500).json({ error: updateError.message });
    }
    
    console.log('Building updated with codigo_predio successfully');

    // Call external webhook
    try {
      console.log('Calling external webhook...');
      const webhookResult = await supabase.functions.invoke('create-external-client', {
        body: {
          buildingId: data.id,
          buildingName: buildingData.nome
        }
      });
      console.log('Webhook result:', webhookResult);
    } catch (webhookError) {
      console.error('Webhook error (non-blocking):', webhookError);
    }

    // Log user action
    try {
      console.log('Logging user action...');
      await logUserAction(
        (req as any).user.id,
        'create_building',
        { description: `Created building: ${buildingData.nome}`, building_id: data.id, codigo_predio }
      );
      console.log('User action logged successfully');
    } catch (logError) {
      console.error('Error logging user action (non-blocking):', logError);
    }
    
    const finalResult = { ...data, codigo_predio };
    console.log('Returning final result:', finalResult);
    console.log('=== END CREATE BUILDING DEBUG ===');
    
    res.status(201).json(finalResult);
  } catch (error: any) {
    console.error('Error in createBuilding:', error);
    console.log('=== END CREATE BUILDING DEBUG (ERROR) ===');
    res.status(500).json({ error: error.message || 'Internal server error' });
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
    
    // Log user action
    try {
      await logUserAction(
        (req as any).user.id,
        'update_building',
        { description: `Updated building: ${nome}`, building_id: id }
      );
    } catch (logError) {
      console.error('Error logging user action (non-blocking):', logError);
    }
    
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error updating building:', error);
    return res.status(500).json({ error: error.message || 'Error updating building' });
  }
}