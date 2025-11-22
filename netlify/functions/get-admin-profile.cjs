const { validateToken } = require('./utils/auth-validate.cjs');
const { supabaseAdmin } = require('./utils/supabase-admin.cjs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    // 1. Quem está chamando?
    const { user, error } = await validateToken(event.headers);
    if (error) return { statusCode: 401, body: JSON.stringify({ error }) };

    // 2. Consulta tabela de Employees com permissão total (Admin)
    const { data, error: dbError } = await supabaseAdmin
      .from('Employees')
      .select('*')
      .eq('id', user.id) // O ID da tabela Employees deve bater com o ID do Auth
      .single();

    if (dbError || !data) {
      return { statusCode: 403, body: JSON.stringify({ error: 'User is not an admin' }) };
    }

    // Sucesso
    return { 
      statusCode: 200, 
      body: JSON.stringify(data), 
      headers: { 'Content-Type': 'application/json' } 
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};