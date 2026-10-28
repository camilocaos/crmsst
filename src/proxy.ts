import { NextResponse, type NextRequest } from "next/server";

// Checagem rápida: sem cookie de sessão, vai para o login.
// A validação de verdade (no banco) acontece em exigirUsuario(), nas páginas e ações.
const PUBLICAS = ["/login", "/primeiro-acesso"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const temSessao = request.cookies.has("crm_sessao");
  if (!temSessao && !PUBLICAS.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico)$).*)"],
};
