const { validateToken } = require('./utils/auth-validate.cjs');
const { supabaseAdmin } = require('./utils/supabase-admin.cjs');

exports.handler = async (event) => {
  // Apenas aceita POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 1. Valida se o usuário enviou um token válido do Supabase
    const { user, error } = await validateToken(event.headers);
    if (error) {
      return { statusCode: 401, body: JSON.stringify({ error }) };
    }

    // 2. Verifica primeiro se é Admin (Tabela Employees)
    const { data: adminData } = await supabaseAdmin
      .from('Employees')
      .select('id')
      .eq('id', user.id)
      .single();

    if (adminData) {
      return {
        statusCode: 200,
        body: JSON.stringify({ role: 'admin' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // 3. Se não for admin, verifica se é Atacado (Tabela WholesaleClients)
    const { data: wholesaleData } = await supabaseAdmin
      .from('WholesaleClients')
      .select('id')
      .eq('id', user.id)
      .single();

    if (wholesaleData) {
      return {
        statusCode: 200,
        body: JSON.stringify({ role: 'wholesale' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // 4. Se não for nenhum, é cliente comum
    return {
      statusCode: 200,
      body: JSON.stringify({ role: 'customer' }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (err) {
    console.error("Erro na function get-user-role:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};