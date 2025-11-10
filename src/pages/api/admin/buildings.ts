
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
    case 'DELETE':
      return deleteBuilding(req, res);
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
    const { nome, endereco, bairro, latitude, longitude } = req.body;
    
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
          latitude,
          longitude,
          status: 'ativo'
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
    
    // Chamar Edge Function (proxy) para criar cliente - SE FALHAR, CANCELA TUDO
    try {
      const clienteId = data.id.replace(/-/g, '').substring(0, 4);
      
      console.log('[EDGE FUNCTION PROXY] Criando cliente externo via Edge Function:', { clienteId, nome });
      
      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('create-building-client', {
        body: {
          cliente_id: clienteId,
          cliente_name: nome
        }
      });

      if (edgeFunctionError) {
        throw new Error(`Edge Function falhou: ${edgeFunctionError.message}`);
      }

      if (!edgeFunctionData?.success) {
        throw new Error(edgeFunctionData?.error || 'Erro desconhecido ao criar cliente');
      }

      console.log('[EDGE FUNCTION PROXY] Cliente criado com sucesso:', edgeFunctionData);

    } catch (apiError: any) {
      console.error('[EDGE FUNCTION PROXY] ERRO CRÍTICO ao criar cliente:', apiError);
      
      // ROLLBACK: Deletar o prédio criado
      await supabase
        .from('buildings')
        .delete()
        .eq('id', data.id);
      
      console.error('[ROLLBACK] Prédio deletado devido a falha na API externa');
      
      // Retornar erro para o cliente
      return res.status(500).json({ 
        error: 'Falha ao criar cliente externo. Criação do prédio cancelada.',
        details: apiError.message 
      });
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

// Delete an existing building
async function deleteBuilding(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Building ID is required' });
    }

    // Buscar o prédio para obter o codigo_predio antes de deletar
    const { data: building, error: fetchError } = await supabase
      .from('buildings')
      .select('id, nome, codigo_predio')
      .eq('id', id)
      .single();

    if (fetchError || !building) {
      throw new Error('Prédio não encontrado');
    }

    const clienteId = building.codigo_predio || building.id.replace(/-/g, '').substring(0, 4);

    // Chamar Edge Function (proxy) para deletar cliente externo
    try {
      console.log('[DELETE API] Deletando cliente externo via Edge Function:', { clienteId, nome: building.nome });
      
      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('delete-building-client', {
        body: {
          cliente_id: clienteId
        }
      });

      if (edgeFunctionError) {
        console.error('[DELETE API] Erro na Edge Function:', edgeFunctionError);
        // Não falhar a deleção se a API externa falhar (pode já não existir)
      }

      if (edgeFunctionData && !edgeFunctionData.success) {
        console.warn('[DELETE API] Aviso ao deletar cliente externo:', edgeFunctionData.error);
        // Continuar mesmo com erro - o cliente pode já ter sido deletado
      }

      console.log('[DELETE API] Cliente externo deletado (ou já inexistente)');
    } catch (apiError) {
      console.error('[DELETE API] Erro ao chamar API externa (não crítico):', apiError);
      // Continuar com a deleção do prédio mesmo se a API externa falhar
    }

    // Deletar o prédio do banco de dados
    const { error: deleteError } = await supabase
      .from('buildings')
      .delete()
      .eq('id', id);
      
    if (deleteError) {
      throw deleteError;
    }
    
    // Log action
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await logUserAction(
          user.id,
          'delete_building',
          { building_id: id, building_name: building.nome }
        );
      }
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Prédio deletado com sucesso' 
    });
  } catch (error) {
    console.error('Error deleting building:', error);
    return res.status(500).json({ error: 'Error deleting building' });
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
