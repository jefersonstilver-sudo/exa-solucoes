import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeia dia da semana JavaScript (0=Domingo) para o ENUM dia_semana do banco
// ENUM: segunda, terca, quarta, quinta, sexta, sabado, domingo
function getWeekDayEnum(date: Date): string {
  const jsDay = date.getDay(); // 0=Domingo, 1=Segunda, ..., 6=Sábado
  const enumMap: Record<number, string> = {
    0: 'domingo',
    1: 'segunda',
    2: 'terca',
    3: 'quarta',
    4: 'quinta',
    5: 'sexta',
    6: 'sabado'
  };
  return enumMap[jsDay];
}

// Nomes dos dias para log (mais legível)
const weekDayDisplayNames: Record<string, string> = {
  'segunda': 'Segunda-feira',
  'terca': 'Terça-feira',
  'quarta': 'Quarta-feira',
  'quinta': 'Quinta-feira',
  'sexta': 'Sexta-feira',
  'sabado': 'Sábado',
  'domingo': 'Domingo'
};

// Verifica se a rotina deve ser executada no dia atual
function shouldExecuteRoutine(
  frequencia: string,
  diasSemana: string[] | null,
  diaMes: number | null,
  currentDayOfWeek: string,
  currentDayOfMonth: number,
  currentWeekOfYear: number
): { execute: boolean; reason: string } {
  switch (frequencia) {
    case 'diaria':
      return { execute: true, reason: 'diaria' };
    
    case 'semanal':
      if (!diasSemana || diasSemana.length === 0) {
        return { execute: false, reason: 'sem dias_semana configurados' };
      }
      const executeWeekly = diasSemana.includes(currentDayOfWeek);
      return { 
        execute: executeWeekly, 
        reason: executeWeekly 
          ? `dia ${currentDayOfWeek} está em [${diasSemana.join(', ')}]` 
          : `dia ${currentDayOfWeek} não está em [${diasSemana.join(', ')}]`
      };
    
    case 'quinzenal':
      // Executa em semanas pares
      if (!diasSemana || diasSemana.length === 0) {
        return { execute: false, reason: 'sem dias_semana configurados para quinzenal' };
      }
      const isEvenWeek = currentWeekOfYear % 2 === 0;
      const dayMatches = diasSemana.includes(currentDayOfWeek);
      return { 
        execute: isEvenWeek && dayMatches, 
        reason: `semana ${currentWeekOfYear} ${isEvenWeek ? 'par' : 'ímpar'}, dia ${dayMatches ? 'confere' : 'não confere'}`
      };
    
    case 'mensal':
      if (diaMes === null) {
        return { execute: false, reason: 'sem dia_mes configurado' };
      }
      const executeMonthly = diaMes === currentDayOfMonth;
      return { 
        execute: executeMonthly, 
        reason: executeMonthly 
          ? `dia ${currentDayOfMonth} = dia_mes ${diaMes}` 
          : `dia ${currentDayOfMonth} ≠ dia_mes ${diaMes}`
      };
    
    default:
      return { execute: false, reason: `frequência desconhecida: ${frequencia}` };
  }
}

// Calcula semana do ano
function getWeekOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 604800000; // ms em uma semana
  return Math.ceil(diff / oneWeek);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    console.log('🚀 [generate-daily-tasks] Iniciando geração de tarefas diárias');

    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calcular data atual no fuso horário do Brasil (UTC-3)
    const now = new Date();
    const brazilOffset = -3 * 60; // -3 horas em minutos
    const brazilTime = new Date(now.getTime() + (brazilOffset - now.getTimezoneOffset()) * 60000);
    
    const today = brazilTime.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentDayOfWeek = getWeekDayEnum(brazilTime);
    const currentDayOfMonth = brazilTime.getDate();
    const currentWeekOfYear = getWeekOfYear(brazilTime);

    console.log(`📅 Data Brasil: ${today}, Dia da semana: ${currentDayOfWeek} (${weekDayDisplayNames[currentDayOfWeek]}), Dia do mês: ${currentDayOfMonth}, Semana: ${currentWeekOfYear}`);

    // Buscar rotinas ativas
    const { data: rotinas, error: rotinasError } = await supabase
      .from('task_rotinas')
      .select(`
        id,
        nome,
        descricao,
        frequencia,
        dias_semana,
        dia_mes,
        horario_inicio,
        horario_limite,
        prioridade,
        task_type_id,
        todos_responsaveis,
        ativo
      `)
      .eq('ativo', true);

    if (rotinasError) {
      console.error('❌ Erro ao buscar rotinas:', rotinasError);
      throw new Error(`Erro ao buscar rotinas: ${rotinasError.message}`);
    }

    console.log(`📋 Rotinas ativas encontradas: ${rotinas?.length || 0}`);

    const results: Array<{
      rotina: string;
      rotina_id: string;
      status: 'created' | 'skipped' | 'error';
      reason?: string;
      task_id?: string;
    }> = [];

    let tasksCreated = 0;
    let tasksSkipped = 0;
    let tasksError = 0;

    for (const rotina of rotinas || []) {
      console.log(`\n🔄 Processando rotina: ${rotina.nome} (${rotina.frequencia})`);

      // Verificar se deve executar hoje
      const { execute, reason } = shouldExecuteRoutine(
        rotina.frequencia,
        rotina.dias_semana,
        rotina.dia_mes,
        currentDayOfWeek,
        currentDayOfMonth,
        currentWeekOfYear
      );

      if (!execute) {
        console.log(`⏭️ Pulando rotina: ${reason}`);
        results.push({
          rotina: rotina.nome,
          rotina_id: rotina.id,
          status: 'skipped',
          reason: `não é dia de execução: ${reason}`
        });
        tasksSkipped++;
        continue;
      }

      // Verificar se já existe tarefa para hoje
      const { data: existingTask, error: checkError } = await supabase
        .from('tasks')
        .select('id')
        .eq('rotina_id', rotina.id)
        .eq('data_prevista', today)
        .maybeSingle();

      if (checkError) {
        console.error(`❌ Erro ao verificar tarefa existente:`, checkError);
        results.push({
          rotina: rotina.nome,
          rotina_id: rotina.id,
          status: 'error',
          reason: `erro ao verificar duplicidade: ${checkError.message}`
        });
        tasksError++;
        continue;
      }

      if (existingTask) {
        console.log(`⏭️ Tarefa já existe para hoje (ID: ${existingTask.id})`);
        results.push({
          rotina: rotina.nome,
          rotina_id: rotina.id,
          status: 'skipped',
          reason: 'already_exists',
          task_id: existingTask.id
        });
        tasksSkipped++;
        continue;
      }

      // Criar nova tarefa
      console.log(`✨ Criando tarefa para rotina: ${rotina.nome}`);

      const { data: newTask, error: createError } = await supabase
        .from('tasks')
        .insert({
          titulo: rotina.nome,
          descricao: rotina.descricao,
          status: 'pendente',
          prioridade: rotina.prioridade || 'media',
          origem: 'rotina',
          task_type_id: rotina.task_type_id,
          rotina_id: rotina.id,
          data_prevista: today,
          horario_limite: rotina.horario_limite,
          todos_responsaveis: rotina.todos_responsaveis || false
        })
        .select('id')
        .single();

      if (createError) {
        console.error(`❌ Erro ao criar tarefa:`, createError);
        results.push({
          rotina: rotina.nome,
          rotina_id: rotina.id,
          status: 'error',
          reason: `erro ao criar: ${createError.message}`
        });
        tasksError++;
        continue;
      }

      console.log(`✅ Tarefa criada com ID: ${newTask.id}`);

      // Se todos_responsaveis = false, buscar e inserir responsáveis da rotina
      if (!rotina.todos_responsaveis) {
        const { data: rotinaResponsaveis, error: respError } = await supabase
          .from('task_rotina_responsaveis')
          .select('user_id')
          .eq('rotina_id', rotina.id);

        if (respError) {
          console.error(`⚠️ Erro ao buscar responsáveis da rotina:`, respError);
        } else if (rotinaResponsaveis && rotinaResponsaveis.length > 0) {
          const taskResponsaveis = rotinaResponsaveis.map(r => ({
            task_id: newTask.id,
            user_id: r.user_id
          }));

          const { error: insertRespError } = await supabase
            .from('task_responsaveis')
            .insert(taskResponsaveis);

          if (insertRespError) {
            console.error(`⚠️ Erro ao inserir responsáveis:`, insertRespError);
          } else {
            console.log(`👥 ${taskResponsaveis.length} responsável(is) atribuído(s)`);
          }
        }
      } else {
        console.log(`👥 todos_responsaveis = true, sem inserção em task_responsaveis`);
      }

      // Buscar e inserir checklist items da rotina
      const { data: rotinaChecklist, error: checklistError } = await supabase
        .from('task_rotina_checklist')
        .select('descricao, obrigatorio, ordem')
        .eq('rotina_id', rotina.id)
        .order('ordem', { ascending: true });

      if (checklistError) {
        console.error(`⚠️ Erro ao buscar checklist da rotina:`, checklistError);
      } else if (rotinaChecklist && rotinaChecklist.length > 0) {
        const taskChecklistItems = rotinaChecklist.map(item => ({
          task_id: newTask.id,
          descricao: item.descricao,
          obrigatorio: item.obrigatorio,
          ordem: item.ordem,
          concluido: false
        }));

        const { error: insertChecklistError } = await supabase
          .from('task_checklist_items')
          .insert(taskChecklistItems);

        if (insertChecklistError) {
          console.error(`⚠️ Erro ao inserir checklist:`, insertChecklistError);
        } else {
          console.log(`✓ ${taskChecklistItems.length} item(ns) de checklist criado(s)`);
        }
      }

      results.push({
        rotina: rotina.nome,
        rotina_id: rotina.id,
        status: 'created',
        task_id: newTask.id
      });
      tasksCreated++;
    }

    const executionTime = Date.now() - startTime;

    const response = {
      success: true,
      date: today,
      day_of_week: currentDayOfWeek,
      day_of_week_display: weekDayDisplayNames[currentDayOfWeek],
      day_of_month: currentDayOfMonth,
      week_of_year: currentWeekOfYear,
      routines_processed: rotinas?.length || 0,
      tasks_created: tasksCreated,
      tasks_skipped: tasksSkipped,
      tasks_error: tasksError,
      execution_time_ms: executionTime,
      details: results
    };

    console.log(`\n📊 Resumo: ${tasksCreated} criadas, ${tasksSkipped} puladas, ${tasksError} erros (${executionTime}ms)`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      execution_time_ms: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
