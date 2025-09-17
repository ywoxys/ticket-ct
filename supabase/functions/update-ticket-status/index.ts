const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface UpdateStatusRequest {
  ticket_id?: string;
  matricula?: string;
  status_type: 'enviado' | 'pago';
  value: boolean;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método não permitido" }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const { ticket_id, matricula, status_type, value }: UpdateStatusRequest = await req.json();

    if (!status_type || typeof value !== 'boolean') {
      return new Response(
        JSON.stringify({ error: "Parâmetros inválidos. Necessário: status_type ('enviado' ou 'pago') e value (boolean)" }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    if (!ticket_id && !matricula) {
      return new Response(
        JSON.stringify({ error: "Necessário fornecer ticket_id ou matricula" }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('npm:@supabase/supabase-js@2.55.0');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Preparar dados para atualização
    const updates: any = { [status_type]: value };
    
    if (status_type === 'enviado') {
      updates.data_envio = value ? new Date().toISOString() : null;
    } else if (status_type === 'pago') {
      updates.data_pagamento = value ? new Date().toISOString() : null;
    }

    // Atualizar ticket
    let query = supabase.from('tickets').update(updates);
    
    if (ticket_id) {
      query = query.eq('id', ticket_id);
    } else {
      query = query.eq('matricula', matricula);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error('Erro ao atualizar ticket:', error);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar ticket", details: error.message }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Ticket não encontrado" }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Status ${status_type} atualizado com sucesso`,
        ticket: data
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});