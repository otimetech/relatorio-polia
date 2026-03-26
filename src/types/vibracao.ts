export interface VibracaoEquipamento {
  id: number;
  area?: string | null;
  local?: string | null;
  modelo?: string | null;
  rotacao?: string | null;
  conjunto?: string | null;
  potencia?: string | null;
  descricao?: string | null;
  fabricante?: string | null;
  foto_equipamento?: string | null;
  rolamento?: string | null;
  alimentacao?: string | null;
  transmissao?: string | null;
}

export interface VibracaoItem {
  id: number;
  foto: string | null;
  local: string;
  area?: string;
  conjunto: string;
  espectro: string | null;
  diagnostico: string | null;
  equipamento: VibracaoEquipamento | null;
  recomendacao: string | null;
  status?: string;
  st3?: string;
  data_exe?: string;
}

export interface VibracaoCliente {
  id: number;
  cnpj?: string;
  logo?: string | null;
  nome: string;
  cidade?: string;
  estado?: string | null;
  email?: string;
  telefone?: string;
  pessoa_contato?: string;
  departamento_contato?: string;
}

export interface VibracaoUsuario {
  id: number;
  nome: string;
  email?: string;
  foto_assinatura?: string | null;
  departamento?: string;
  telefone?: string;
}

export interface VibracaoRelatorio {
  id: number;
  n_relatorio: string;
  tipo: string;
  status: string;
  created_at: string;
  dataExe: string;
  cliente?: VibracaoCliente;
  usuario?: VibracaoUsuario;
  aprovador?: VibracaoUsuario | null;
  vibracoes: VibracaoItem[];
}

export interface VibracaoRelatorioResponse {
  success: boolean;
  relatorio: VibracaoRelatorio;
}

// Tipos para Ultrassom
export interface UltrasomCliente {
  id: number;
  cnpj: string;
  logo: string | null;
  nome: string;
  ativo: boolean;
  email: string;
  cidade: string;
  estado: string;
  endereco: string;
  telefone: string;
  valor_gas: number;
  valor_kwh: number;
  created_at: string;
  valor_vapor: number | null;
  horas_trabalho: number;
  pessoa_contato: string;
  departamento_contato: string;
}

export interface UltrasomItem {
  id?: number;
  foto?: string | null;
  local?: string;
  area?: string;
  conjunto?: string;
  diagnostico?: string | null;
  recomendacao?: string | null;
  status?: string;
  [key: string]: any;
}

export interface UltrasomRelatorio {
  id: number;
  n_relatorio: string | null;
  tipo: string;
  status: string;
  dataExe: string;
  data_execucao: string;
  tipoVazamento: string | null;
  num_revisao: string | null;
  cliente: UltrasomCliente;
  ultrassom: UltrasomItem[];
}

export interface UltrasomRelatorioResponse {
  success?: boolean;
  relatorio: UltrasomRelatorio;
}

