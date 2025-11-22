import { createRemoteJWKSet, jwtVerify } from "https://esm.sh/jose@4.15.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const JWKS_URL = new URL(`${SUPABASE_URL}/auth/v1/keys`);
const JWKS = createRemoteJWKSet(JWKS_URL);

// Parser de cookies auxiliar para Deno
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(cookieHeader.split(";").map(s => {
    const [k, ...v] = s.trim().split("=");
    return [k, decodeURIComponent(v.join("="))];
  }));
}

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. Ignorar rotas de auth internas
  if (path.startsWith("/auth")) return context.next();

  // 2. Tentar recuperar o token (Header ou Cookie)
  const authHeader = request.headers.get("authorization");
  let token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parseCookies(cookieHeader);
    // Procura cookie padrão do Supabase (sb-*-auth-token)
    const supaCookieName = Object.keys(cookies).find(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
    if (supaCookieName) token = cookies[supaCookieName];
  }

  // 3. Se não tem token, manda pro login
  if (!token) {
    return Response.redirect(new URL("/login", url), 302);
  }

  try {
    // 4. Valida a assinatura do JWT (não consulta o banco, é instantâneo)
    const { payload } = await jwtVerify(token, JWKS);
    
    // Pega a role dos metadados (custom_claims ou app_metadata)
    const role = payload?.app_metadata?.role || payload?.user_metadata?.role || "customer";

    // 5. Regras de Proteção de Rota
    if (path.startsWith("/admin") && role !== "admin") {
      return Response.redirect(new URL("/", url), 302);
    }

    if (path.startsWith("/atacado") && role !== "wholesale") {
      return Response.redirect(new URL("/", url), 302);
    }

    // Passou no teste, carrega a página
    return context.next();
  } catch (err) {
    console.error("Edge auth error:", err);
    // Token inválido ou expirado
    return Response.redirect(new URL("/login", url), 302);
  }
};

export const config = { path: ["/admin/*", "/dashboard/*", "/atacado/*"] };