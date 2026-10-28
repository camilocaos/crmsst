import type { Metadata } from "next";
import { AvisoAtualizacao } from "@/components/aviso-atualizacao";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CRM Comercial", template: "%s · CRM Comercial" },
  description: "CRM comercial para empresas de Saúde e Segurança do Trabalho",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full font-sans">
        {children}
        <AvisoAtualizacao />
      </body>
    </html>
  );
}
