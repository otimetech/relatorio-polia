import { useQuery } from "@tanstack/react-query";
import { VibracaoRelatorioResponse, UltrasomRelatorioResponse } from "@/types/vibracao";

const SUPABASE_FUNCTIONS_BASE_URL = "https://ayfkjjdgrbymmlkuzbig.supabase.co/functions/v1";
const API_BASE_URL = import.meta.env.VITE_API_URL?.trim() || (import.meta.env.DEV ? "/api" : SUPABASE_FUNCTIONS_BASE_URL);

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
  let lastErrorMessage: string | null = null;

  try {
    const poliaResponse = await fetch(poliaUrl);

    if (poliaResponse.ok) {
      const contentType = poliaResponse.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const poliaData = await poliaResponse.json();

        // Normaliza payload de polia para o formato que a página já renderiza
        if (poliaData && poliaData.id && Array.isArray(poliaData.alinhamentos)) {
          const normalizedUltrasom: UltrasomRelatorioResponse = {
            relatorio: {
              ...poliaData,
              num_revisao: poliaData.num_revisao,
              cliente: poliaData.cliente,
              executor: poliaData.usuario,
              aprovador: poliaData.aprovador,
              ultrassom: poliaData.alinhamentos.map((item: any) => ({
                id: item.id,
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
        }
      }
    } else {
      lastErrorMessage = await readApiError(poliaResponse);
    }
  } catch (error) {
    console.warn("Erro ao buscar relatorio de polia, tentando fallback...", error);
    lastErrorMessage = error instanceof Error ? error.message : "Falha ao acessar endpoint de polia";
  }

  // Tentar buscar dados de Ultrassom primeiro
  try {
    const ultrasomUrl = `${API_BASE_URL}/get-relatorio-ultrassom?id_relatorio=${idRelatorio}`;
    const response = await fetch(ultrasomUrl);
    
    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data: UltrasomRelatorioResponse = await response.json();
        // Se a resposta tem a estrutura de ultrassom, retorna
        if (data.relatorio && data.relatorio.ultrassom) {
          return data;
        }
      }
    } else {
      lastErrorMessage = await readApiError(response);
    }
  } catch (error) {
    console.warn("Erro ao buscar Ultrassom, tentando Vibracao...", error);
  }

  // Fallback para Vibracao
  const vibracaoUrl = `${API_BASE_URL}/get-vibracao?id_relatorio=${idRelatorio}`;
  const response = await fetch(vibracaoUrl);
  
  if (!response.ok) {
    const message = await readApiError(response);
    throw new Error(`Erro ao buscar relatório: ${message || lastErrorMessage || response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const bodyText = await response.text();
    if (bodyText.trim().startsWith("<!doctype html>") || bodyText.trim().startsWith("<html")) {
      throw new Error("A requisicao da API retornou HTML em vez de JSON. Verifique VITE_API_URL ou o proxy /api deste ambiente.");
    }
    throw new Error(`Resposta inesperada da API: ${bodyText.slice(0, 120)}`);
  }

  const data: VibracaoRelatorioResponse = await response.json();
  if (!data.success) {
    throw new Error("Erro ao buscar relatório: resposta inválida");
  }

  return data;
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
