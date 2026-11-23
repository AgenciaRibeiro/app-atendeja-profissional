-- ============================================================================
-- AtendeJá — Banco de Controle do Fundador (Supabase: kunpzzmubfvzmweyxfjp)
-- Responsável por: planos, contratantes (auth Google), pagamentos e auditoria.
-- Script idempotente (pode ser reexecutado com segurança).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função padrão de atualização de updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 1. Tabela de Planos
CREATE TABLE IF NOT EXISTS public.plans (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_brl NUMERIC(10, 2) NOT NULL DEFAULT 0,
  max_assistants INTEGER NOT NULL DEFAULT 1,
  capabilities JSONB NOT NULL DEFAULT '["atendimento"]'::jsonb,
  monthly_planning BOOLEAN NOT NULL DEFAULT false,
  max_apis INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_plans_updated_at ON public.plans;
CREATE TRIGGER trg_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.plans (code, name, price_brl, max_assistants, capabilities, monthly_planning, max_apis)
VALUES
  ('trial', 'Teste Grátis (15 dias)', 0.00, 1, '["atendimento"]'::jsonb, false, 1),
  ('essencial', 'Essencial', 49.00, 1, '["atendimento", "cotacao"]'::jsonb, false, 2),
  ('pro', 'Pro', 97.00, 3, '["atendimento", "cotacao", "vendas", "crm_auto"]'::jsonb, true, 4),
  ('empresa', 'Empresa', 197.00, 6, '["atendimento", "cotacao", "vendas", "crm_auto", "marketing", "agendamento", "pos_venda"]'::jsonb, true, 99)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  price_brl = EXCLUDED.price_brl,
  max_assistants = EXCLUDED.max_assistants,
  capabilities = EXCLUDED.capabilities,
  monthly_planning = EXCLUDED.monthly_planning,
  max_apis = EXCLUDED.max_apis;

-- 2. Tabela de Contratantes / Clientes da Plataforma
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email_google TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  attendant_name TEXT NOT NULL DEFAULT '',
  niche TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  social_type TEXT NOT NULL DEFAULT 'Instagram',
  social_url TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  plan_code TEXT NOT NULL DEFAULT 'trial' REFERENCES public.plans(code),
  trial_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 days'),
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_plan_status ON public.clients(plan_code, subscription_status);
CREATE INDEX IF NOT EXISTS idx_clients_email_google ON public.clients(email_google);

DROP TRIGGER IF EXISTS trg_clients_updated_at ON public.clients;
CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Tabela de Assinaturas e Pagamentos (Mercado Pago)
CREATE TABLE IF NOT EXISTS public.subscriptions_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES public.plans(code),
  mp_payment_id TEXT UNIQUE,
  pedido_id TEXT UNIQUE,
  amount_brl NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'pix',
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_payments_client ON public.subscriptions_payments(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status ON public.subscriptions_payments(status);

-- 4. Tabela de Administradores (Dashboard Admin do Fundador)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'founder' CHECK (role IN ('founder', 'admin', 'support')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabela de Auditoria Administrativa (Acesso exclusivo admin / Fundador)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_client ON public.admin_audit_logs(client_id, created_at DESC);

-- Função helper para checar se o usuário logado no Supabase Auth é Admin ativo
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE auth_user_id = auth.uid()
      AND active = true
  );
$$;

-- ============================================================================
-- RLS (Row Level Security) — Isolamento por conta autenticada + Admin
-- ============================================================================
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Plans: leitura pública / autenticada + gerenciamento admin
DROP POLICY IF EXISTS "plans_read_all" ON public.plans;
CREATE POLICY "plans_read_all"
  ON public.plans FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "plans_admin_all" ON public.plans;
CREATE POLICY "plans_admin_all"
  ON public.plans FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Clients: usuário lê/edita apenas o próprio registro; admin gerencia todos
DROP POLICY IF EXISTS "clients_select_own" ON public.clients;
CREATE POLICY "clients_select_own"
  ON public.clients FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id OR public.is_admin());

DROP POLICY IF EXISTS "clients_insert_own" ON public.clients;
CREATE POLICY "clients_insert_own"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id OR public.is_admin());

DROP POLICY IF EXISTS "clients_update_own" ON public.clients;
CREATE POLICY "clients_update_own"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id OR public.is_admin())
  WITH CHECK (auth.uid() = auth_user_id OR public.is_admin());

DROP POLICY IF EXISTS "clients_admin_delete" ON public.clients;
CREATE POLICY "clients_admin_delete"
  ON public.clients FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Subscriptions Payments: contratante lê os próprios pagamentos; admin gerencia todos
DROP POLICY IF EXISTS "payments_select_own" ON public.subscriptions_payments;
CREATE POLICY "payments_select_own"
  ON public.subscriptions_payments FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = subscriptions_payments.client_id
        AND c.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "payments_admin_all" ON public.subscriptions_payments;
CREATE POLICY "payments_admin_all"
  ON public.subscriptions_payments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- admin_users: usuário autenticado enxerga seu vínculo ou todos se admin
DROP POLICY IF EXISTS "admin_users_select_own_or_admin" ON public.admin_users;
CREATE POLICY "admin_users_select_own_or_admin"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id OR public.is_admin());

DROP POLICY IF EXISTS "admin_users_admin_all" ON public.admin_users;
CREATE POLICY "admin_users_admin_all"
  ON public.admin_users FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- admin_audit_logs: leitura e gravação liberadas para admins ativos (além de service_role)
DROP POLICY IF EXISTS "audit_logs_admin_all" ON public.admin_audit_logs;
CREATE POLICY "audit_logs_admin_all"
  ON public.admin_audit_logs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- Visão consolidada para o painel de controle do Fundador
-- ============================================================================
CREATE OR REPLACE VIEW public.vw_founder_clients_overview AS
SELECT
  c.id AS client_id,
  c.company_name,
  c.attendant_name,
  c.email_google,
  c.whatsapp,
  c.niche,
  c.city,
  c.plan_code,
  p.name AS plan_name,
  p.price_brl AS plan_price_brl,
  c.subscription_status,
  c.trial_started_at,
  c.trial_ends_at,
  GREATEST(0, CEIL(EXTRACT(EPOCH FROM (c.trial_ends_at - NOW())) / 86400.0))::int AS trial_days_left,
  COALESCE(SUM(CASE WHEN sp.status = 'approved' THEN sp.amount_brl ELSE 0 END), 0) AS total_paid_brl,
  MAX(sp.paid_at) AS last_payment_at,
  c.created_at
FROM public.clients c
JOIN public.plans p ON p.code = c.plan_code
LEFT JOIN public.subscriptions_payments sp ON sp.client_id = c.id
GROUP BY c.id, p.name, p.price_brl;
