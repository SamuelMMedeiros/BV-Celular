const { validateToken } = require('./utils/auth-validate');
const { supabaseAdmin } = require('./utils/supabase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { user, error } = await validateToken(event.headers);
    if (error) return { statusCode: 401, body: JSON.stringify({ error }) };

    const { data, error: dbError } = await supabaseAdmin
      .from('WholesaleClients')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError || !data) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Not a wholesale client' }) };
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify(data), 
      headers: { 'Content-Type': 'application/json' } 
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};