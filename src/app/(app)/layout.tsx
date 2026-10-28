import { Sidebar } from "@/components/sidebar";
import { exigirUsuario } from "@/lib/sessao";
import { sair } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await exigirUsuario();
  return (
    <>
      <Sidebar nomeUsuario={usuario.nome} sair={sair} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 lg:pl-72 print:p-0">{children}</main>
    </>
  );
}
