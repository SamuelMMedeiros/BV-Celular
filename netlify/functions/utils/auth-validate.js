const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
// Tenta usar a chave anon pública padrão
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

async function validateToken(headers) {
  try {
    const authHeader = headers['authorization'] || headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Token missing' };
    }
    const token = authHeader.replace(/^Bearer\s+/, '').trim();
    
    // Valida o token perguntando ao Supabase Auth
    const { data, error } = await supabasePublic.auth.getUser(token);
    
    if (error || !data?.user) {
      return { user: null, error: 'Invalid token' };
    }
    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: err.message };
  }
}

module.exports = { validateToken };