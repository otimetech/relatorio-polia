import { useQuery } from "@tanstack/react-query";
import { VibracaoRelatorioResponse, UltrasomRelatorioResponse } from "@/types/vibracao";

const SUPABASE_FUNCTIONS_BASE_URL = "https://ayfkjjdgrbymmlkuzbig.supabase.co/functions/v1";
const configuredApiBaseUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/+$/, "")
  : "/api";

export type RelatorioResponse = VibracaoRelatorioResponse | UltrasomRelatorioResponse;

const readApiError = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    if (data && typeof data === "object") {
      const message = data.error || data.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
  }

  const bodyText = await response.text().catch(() => "");
  if (bodyText.trim().startsWith("<!doctype html>") || bodyText.trim().startsWith("<html")) {
    return "A requisicao da API retornou HTML em vez de JSON. Verifique VITE_API_URL ou o proxy /api deste ambiente.";
  }

  return bodyText.slice(0, 160) || `HTTP ${response.status}`;
};

export const fetchRelatorio = async (idRelatorio: string): Promise<RelatorioResponse> => {
  // Endpoint público dedicado para relatório de alinhamento de polia
  const poliaUrl = `${API_BASE_URL}/get-relatorio-polia?id_relatorio=${idRelatorio}`;
  let poliaResponse: Response;

  try {
    poliaResponse = await fetch(poliaUrl);
  } catch (error) {
    const isDirectSupabaseCall = API_BASE_URL === SUPABASE_FUNCTIONS_BASE_URL;
    const corsHint = isDirectSupabaseCall
      ? " A chamada foi feita direto para o Supabase; se o navegador bloquear por CORS, publique o app com proxy same-origin em /api ou libere o dominio no endpoint."
      : "";

    throw new Error(
      `Erro ao buscar relatório de polia: ${error instanceof Error ? error.message : "falha de rede"}.${corsHint}`,
    );
  }

  if (!poliaResponse.ok) {
    const message = await readApiError(poliaResponse);
    throw new Error(`Erro ao buscar relatório de polia: ${message || poliaResponse.status}`);
  }

  const contentType = poliaResponse.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const bodyText = await poliaResponse.text();
    if (bodyText.trim().startsWith("<!doctype html>") || bodyText.trim().startsWith("<html")) {
      throw new Error("A requisicao da API retornou HTML em vez de JSON. Verifique VITE_API_URL ou o proxy /api deste ambiente.");
    }
    throw new Error(`Resposta inesperada da API: ${bodyText.slice(0, 120)}`);
  }

  const poliaData = await poliaResponse.json();

  if (!poliaData || !poliaData.id || !Array.isArray(poliaData.alinhamentos)) {
    throw new Error("Erro ao buscar relatório de polia: resposta inválida");
  }

  const normalizedUltrasom: UltrasomRelatorioResponse = {
    relatorio: {
      ...poliaData,
      num_revisao: poliaData.num_revisao,
      cliente: poliaData.cliente,
      executor: poliaData.usuario,
      aprovador: poliaData.aprovador,
      ultrassom: poliaData.alinhamentos.map((item: any) => ({
        id: item.id,
        foto_a: item.foto_a || null,
        foto_c: item.foto_c || null,
        foto_painel: item.foto_a || item.foto_epto || null,
        foto_camera: item.foto_c || item.foto_b || item.foto_d || null,
        setor: item.equipamento || "-",
        num_vazamento: String(item.canal_polia ?? "-"),
        localizacao: item.distancia_cabecotes || "-",
        componente: item.qtde_correia != null ? `Correias: ${item.qtde_correia}` : "-",
        valor_medido: item.valor_desalinhamento || "-",
        diagnostico: item.comentario || "-",
        recomendacao: item.consideracao_final || "-",
        status: item.condicao_final || poliaData.status || "Não iniciado",
      })),
    },
  };

  return normalizedUltrasom;
};

export const useRelatorio = (idRelatorio: string | null) => {
  return useQuery({
    queryKey: ["relatorio", idRelatorio],
    queryFn: () => fetchRelatorio(idRelatorio!),
    enabled: !!idRelatorio,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
