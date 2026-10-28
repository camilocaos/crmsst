import { BotaoLink, Cabecalho, Vazio } from "@/components/ui";

export default function DashboardPage() {
  return (
    <>
      <Cabecalho titulo="Dashboard" subtitulo="Visão geral das vendas." />
      <Vazio>
        O painel com metas e números chega em breve.{" "}
        <BotaoLink href="/empresas" variante="fantasma">Ir para Empresas</BotaoLink>
      </Vazio>
    </>
  );
}
