-- SQL para criação das tabelas no seu projeto Supabase (Frota Verde)
-- Execute no SQL Editor do seu Dashboard no Supabase se ainda não criou as tabelas:

-- 1. Tabela de Veículos
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  plate TEXT NOT NULL,
  "plateType" TEXT NOT NULL,
  "fuelTypeDefault" TEXT NOT NULL,
  "targetKmL" NUMERIC NOT NULL,
  "initialOdometer" NUMERIC NOT NULL,
  "cityState" TEXT,
  color TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Abastecimentos
CREATE TABLE IF NOT EXISTS public.refuels (
  id TEXT PRIMARY KEY,
  "vehicleId" TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  odometer NUMERIC NOT NULL,
  liters NUMERIC NOT NULL,
  "pricePerLiter" NUMERIC NOT NULL,
  "totalCost" NUMERIC NOT NULL,
  "fuelType" TEXT NOT NULL,
  "isFullTank" BOOLEAN NOT NULL DEFAULT true,
  "stationName" TEXT,
  notes TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Usuários do Sistema
CREATE TABLE IF NOT EXISTS public.app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  password TEXT,
  "isRoot" BOOLEAN DEFAULT false,
  "vehicleAssigned" TEXT DEFAULT 'Todos',
  status TEXT DEFAULT 'Ativo',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS ou permitir leitura/gravação pública para anon se desejado:
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refuels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso completo anônimo para vehicles" ON public.vehicles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Acesso completo anônimo para refuels" ON public.refuels
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Acesso completo anônimo para app_users" ON public.app_users
  FOR ALL USING (true) WITH CHECK (true);
