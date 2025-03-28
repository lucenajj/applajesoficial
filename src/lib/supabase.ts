import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uvfqlotohxyfrospqfzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZnFsb3RvaHh5ZnJvc3BxZnpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDUxMTYsImV4cCI6MjA1MzgyMTExNn0.eiWEYgWweO43Cfo0f-hG-oS8RsDQcLhW3AJRkoOEpRk';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'seller';
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  type: 'vigota' | 'eps';
  price: number;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  cpf?: string;
  rg?: string;
  endereco_entrega?: string;
  cidade?: string;
  bairro?: string;
  cep?: string;
  data_nascimento?: string;
};

export type PredefinedArea = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
};

export type House = {
  id: string;
  customer_id: string;
  name: string;
  address?: string;
  created_at: string;
  updated_at?: string;
};
export type Area = {
  id: string;
  house_id: string;
  predefined_area_id?: string;
  name: string;
  vigota_id: string;
  eps_id: string;
  vigota_width: number;
  vigota_length: number;
  ie: number;
  created_at: string;
  updated_at?: string;
};

export type Calculation = {
  id: string;
  customer_id: string;
  house_id?: string | null;
  house_name?: string;
  house_address?: string;
  vigota_id?: string;
  eps_id?: string;
  ie?: number;
  vigota_width: number;
  vigota_length: number;
  vigota_price: number;
  eps_price: number;
  freight_cost: number;
  total_cost: number;
  cost_per_m2: number;
  total_area?: number;
  concrete_volume?: number;
  steel_weight?: number;
  created_at: string;
  updated_at?: string;
};
