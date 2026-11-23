-- ============================================================================
-- AtendeJá — Controle administrativo no Supabase
-- Dados operacionais dos contratantes ficam no PostgreSQL dedicado no Coolify.
-- Preparação local; aplicar somente após revisão/backup e autorização do Fundador.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Catálogo de planos: público somente para leitura.
CREATE TABLE IF NOT EXISTS public.plans (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_brl NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price_brl >= 0),
  max_assistants INTEGER NOT NULL DEFAULT 1 CHECK (max_assistants >= 0),
  capabilities JSONB NOT NULL DEFAULT '["atendimento"]'::jsonb,
  monthly_planning BOOLEAN NOT NULL DEFAULT false,
  max_apis INTEGER NOT NULL DEFAULT 1 CHECK (max_apis >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_plans_updated_at ON public.plans;
CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.plans (code, name, price_brl, max_assistants, capabilities, monthly_planning, max_apis)
VALUES
  ('trial', 'Teste Grátis (15 dias)', 0.00, 1, '["atendimento"]'::jsonb, false, 1),
  ('essencial', 'Essencial', 49.00, 1, '["atendimento", "cotacao"]'::jsonb, false, 2),
  ('pro', 'Pro', 97.00, 3, '["atendimento", "cotacao", "vendas", "crm_auto"]'::jsonb, true, 4),
  ('empresa', 'Empresa', 197.00, 6, '["atendimento", "cotacao", "vendas", "crm_auto", "marketing", "agendamento", "pos_venda"]'::jsonb, true, 99)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, price_brl = EXCLUDED.price_brl,
  max_assistants = EXCLUDED.max_assistants, capabilities = EXCLUDED.capabilities,
  monthly_planning = EXCLUDED.monthly_planning, max_apis = EXCLUDED.max_apis;

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email_google TEXT NOT NULL,
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_email_google_lower
  ON public.clients (LOWER(email_google));
CREATE INDEX IF NOT EXISTS idx_clients_plan_status
  ON public.clients(plan_code, subscription_status);

DROP TRIGGER IF EXISTS trg_clients_updated_at ON public.clients;
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Pagamentos: contratantes podem somente consultar os próprios registros.
CREATE TABLE IF NOT EXISTS public.subscriptions_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES public.plans(code),
  mp_payment_id TEXT UNIQUE,
  pedido_id TEXT UNIQUE,
  amount_brl NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount_brl >= 0),
  payment_method TEXT NOT NULL DEFAULT 'pix',
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sub_payments_client
  ON public.subscriptions_payments(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status
  ON public.subscriptions_payments(status);

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'support' CHECK (role IN ('founder', 'admin', 'support')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email_lower
  ON public.admin_users(LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_single_founder
  ON public.admin_users(role) WHERE role = 'founder';

-- Log é append-only para usuários autenticados; service_role fica restrita ao backend.
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  -- UUID histórico sem FK: eventos imutáveis não devem ser reescritos ao excluir cliente.
  client_id UUID,
  actor TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_client
  ON public.admin_audit_logs(client_id, created_at DESC);

-- Funções de autorização não dependem de políticas da própria admin_users.
CREATE OR REPLACE FUNCTION public.is_founder()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_user_id = auth.uid() AND active = true AND role = 'founder'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_user_id = auth.uid() AND active = true AND role IN ('founder', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_user_id = auth.uid() AND active = true
      AND role IN ('founder', 'admin', 'support')
  );
$$;



CREATE OR REPLACE FUNCTION public.reject_admin_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'admin_audit_logs é append-only';
END;
$$;
CREATE OR REPLACE FUNCTION public.set_admin_audit_actor()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.actor := COALESCE(auth.uid()::text, 'service_role');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_admin_audit_append_only ON public.admin_audit_logs;
CREATE TRIGGER trg_admin_audit_append_only
  BEFORE UPDATE OR DELETE ON public.admin_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.reject_admin_audit_mutation();
DROP TRIGGER IF EXISTS trg_admin_audit_actor ON public.admin_audit_logs;
CREATE TRIGGER trg_admin_audit_actor
  BEFORE INSERT ON public.admin_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_admin_audit_actor();

-- Atualização do cadastro do contratante exclusivamente pelos campos de perfil.
-- Plano, status e datas do trial não fazem parte dos parâmetros da RPC.
CREATE OR REPLACE FUNCTION public.register_client_profile(
  p_company_name TEXT,
  p_attendant_name TEXT DEFAULT '',
  p_niche TEXT DEFAULT '',
  p_city TEXT DEFAULT '',
  p_whatsapp TEXT DEFAULT '',
  p_social_type TEXT DEFAULT 'Instagram',
  p_social_url TEXT DEFAULT '',
  p_logo_url TEXT DEFAULT ''
)
RETURNS SETOF public.clients
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT := LOWER(COALESCE(auth.jwt() ->> 'email', ''));
BEGIN
  IF v_uid IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Sessão autenticada e e-mail são obrigatórios';
  END IF;
  IF COALESCE(auth.jwt() ->> 'email_verified', 'false') <> 'true' THEN
    RAISE EXCEPTION 'A conta precisa ter e-mail verificado';
  END IF;
  IF NULLIF(BTRIM(p_company_name), '') IS NULL THEN
    RAISE EXCEPTION 'Nome da empresa é obrigatório';
  END IF;
  IF p_social_type NOT IN ('Instagram', 'Facebook', 'TikTok', 'YouTube') THEN
    RAISE EXCEPTION 'Rede social inválida';
  END IF;

  -- Permite vincular com segurança um cadastro prévio do checkout pelo e-mail
  -- verificado, somente se ainda não estiver ligado a outra conta Auth.
  UPDATE public.clients SET
    auth_user_id = v_uid,
    email_google = v_email,
    company_name = BTRIM(p_company_name),
    attendant_name = COALESCE(p_attendant_name, ''),
    niche = COALESCE(p_niche, ''),
    city = COALESCE(p_city, ''),
    whatsapp = COALESCE(p_whatsapp, ''),
    social_type = p_social_type,
    social_url = COALESCE(p_social_url, ''),
    logo_url = COALESCE(p_logo_url, ''),
    updated_at = NOW()
  WHERE LOWER(email_google) = v_email AND auth_user_id IS NULL;
  IF FOUND THEN
    RETURN QUERY SELECT * FROM public.clients WHERE auth_user_id = v_uid;
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.clients WHERE LOWER(email_google) = v_email AND auth_user_id IS DISTINCT FROM v_uid) THEN
    RAISE EXCEPTION 'Este e-mail já está vinculado a outro cadastro';
  END IF;

  RETURN QUERY
  INSERT INTO public.clients (
    auth_user_id, email_google, company_name, attendant_name, niche, city,
    whatsapp, social_type, social_url, logo_url
  ) VALUES (
    v_uid, v_email, BTRIM(p_company_name), COALESCE(p_attendant_name, ''),
    COALESCE(p_niche, ''), COALESCE(p_city, ''), COALESCE(p_whatsapp, ''),
    p_social_type, COALESCE(p_social_url, ''), COALESCE(p_logo_url, '')
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    email_google = EXCLUDED.email_google,
    company_name = EXCLUDED.company_name,
    attendant_name = EXCLUDED.attendant_name,
    niche = EXCLUDED.niche,
    city = EXCLUDED.city,
    whatsapp = EXCLUDED.whatsapp,
    social_type = EXCLUDED.social_type,
    social_url = EXCLUDED.social_url,
    logo_url = EXCLUDED.logo_url,
    updated_at = NOW()
  RETURNING *;
END;
$$;

-- Bootstrap deliberadamente fechado: somente service_role pode vincular o primeiro
-- fundador, e apenas uma vez. Nunca expor a service_role key ao navegador.
CREATE OR REPLACE FUNCTION public.bootstrap_first_founder(p_auth_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email TEXT;
  v_name TEXT;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Bootstrap exige contexto service_role';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE role = 'founder') THEN
    RAISE EXCEPTION 'Fundador já foi configurado';
  END IF;
  SELECT LOWER(email), COALESCE(raw_user_meta_data ->> 'full_name', '')
    INTO v_email, v_name
    FROM auth.users WHERE id = p_auth_user_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Usuário Supabase Auth não encontrado';
  END IF;
  INSERT INTO public.admin_users(auth_user_id, email, name, role, active)
  VALUES (p_auth_user_id, v_email, v_name, 'founder', true);
END;
$$;

-- A API chama esta RPC somente após autenticar o operador como admin; a própria
-- função revalida operador, cliente, plano e motivo e grava auditoria na transação.
CREATE OR REPLACE FUNCTION public.admin_change_subscription(
  p_actor_id UUID,
  p_client_id UUID,
  p_plan_code TEXT,
  p_subscription_status TEXT,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Operação exige API server-side';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_user_id = p_actor_id AND active = true AND role IN ('founder', 'admin')
  ) THEN
    RAISE EXCEPTION 'Operador não autorizado';
  END IF;
  IF p_reason IS NULL OR LENGTH(BTRIM(p_reason)) < 3 OR LENGTH(p_reason) > 500 THEN
    RAISE EXCEPTION 'Informe um motivo entre 3 e 500 caracteres';
  END IF;
  IF p_subscription_status NOT IN ('trial', 'active', 'past_due', 'canceled', 'suspended') THEN
    RAISE EXCEPTION 'Status de assinatura inválido';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE code = p_plan_code) THEN
    RAISE EXCEPTION 'Plano inválido';
  END IF;

  UPDATE public.clients
    SET plan_code = p_plan_code, subscription_status = p_subscription_status, updated_at = NOW()
    WHERE id = p_client_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contratante não encontrado';
  END IF;

  INSERT INTO public.admin_audit_logs(client_id, action, details)
  VALUES (
    p_client_id,
    'subscription_changed',
    pg_catalog.jsonb_build_object(
      'actor_user_id', p_actor_id,
      'plan_code', p_plan_code,
      'subscription_status', p_subscription_status,
      'reason', BTRIM(p_reason)
    )
  );
END;
$$;

-- Recebe eventos já verificados pelo backend (HMAC do n8n). Idempotente por
-- payment_id, permite evento chegar antes do primeiro login Google e nunca
-- aceita chamada direta de anon/authenticated.
CREATE OR REPLACE FUNCTION public.process_payment_event(
  p_email_google TEXT,
  p_payment_id TEXT,
  p_plan_code TEXT,
  p_amount_brl NUMERIC,
  p_status TEXT,
  p_payment_method TEXT DEFAULT 'pix',
  p_paid_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email TEXT := LOWER(BTRIM(p_email_google));
  v_client_id UUID;
  v_old_status TEXT;
  v_payment_client UUID;
  v_payment_plan TEXT;
  v_created BOOLEAN := false;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Operação exige API server-side';
  END IF;
  IF v_email = '' OR p_payment_id IS NULL OR BTRIM(p_payment_id) = '' OR LENGTH(p_payment_id) > 120 THEN
    RAISE EXCEPTION 'E-mail e payment_id são obrigatórios';
  END IF;
  IF p_status NOT IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back') THEN
    RAISE EXCEPTION 'Status de pagamento inválido';
  END IF;
  IF p_amount_brl IS NULL OR p_amount_brl < 0 OR NOT EXISTS (SELECT 1 FROM public.plans WHERE code = p_plan_code) THEN
    RAISE EXCEPTION 'Valor ou plano inválido';
  END IF;
  IF p_plan_code = 'trial' OR p_amount_brl <= 0 THEN
    RAISE EXCEPTION 'Evento não corresponde a um plano pago';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(74592, pg_catalog.hashtext(v_email));
  PERFORM pg_catalog.pg_advisory_xact_lock(74594, pg_catalog.hashtext(p_payment_id));
  SELECT id INTO v_client_id FROM public.clients WHERE LOWER(email_google) = v_email FOR UPDATE;
  IF v_client_id IS NULL THEN
    INSERT INTO public.clients(email_google, company_name)
    VALUES (v_email, COALESCE(NULLIF(SPLIT_PART(v_email, '@', 1), ''), 'Novo contratante'))
    RETURNING id INTO v_client_id;
  END IF;

  SELECT client_id, plan_code, status INTO v_payment_client, v_payment_plan, v_old_status
    FROM public.subscriptions_payments WHERE mp_payment_id = p_payment_id FOR UPDATE;
  IF FOUND THEN
    IF v_payment_client <> v_client_id OR v_payment_plan <> p_plan_code THEN
      RAISE EXCEPTION 'payment_id já vinculado a outro cadastro ou plano';
    END IF;
    UPDATE public.subscriptions_payments SET
      status = CASE WHEN status = 'approved' AND p_status <> 'approved' THEN status ELSE p_status END,
      paid_at = COALESCE(p_paid_at, paid_at),
      amount_brl = p_amount_brl
    WHERE mp_payment_id = p_payment_id;
  ELSE
    INSERT INTO public.subscriptions_payments(
      client_id, plan_code, mp_payment_id, amount_brl, payment_method, status, paid_at, raw_metadata
    ) VALUES (
      v_client_id, p_plan_code, p_payment_id, p_amount_brl,
      COALESCE(NULLIF(LEFT(p_payment_method, 40), ''), 'pix'), p_status,
      p_paid_at, pg_catalog.jsonb_build_object('source', 'signed_n8n_webhook')
    );
    v_created := true;
  END IF;

  IF p_status = 'approved' THEN
    UPDATE public.clients SET plan_code = p_plan_code, subscription_status = 'active', updated_at = NOW()
      WHERE id = v_client_id;
    IF v_created OR v_old_status IS DISTINCT FROM 'approved' THEN
      INSERT INTO public.admin_audit_logs(client_id, action, details)
      VALUES (v_client_id, 'payment_approved', pg_catalog.jsonb_build_object('payment_id', p_payment_id, 'plan_code', p_plan_code, 'amount_brl', p_amount_brl));
    END IF;
  END IF;
  RETURN pg_catalog.jsonb_build_object('client_id', v_client_id, 'created', v_created, 'status', p_status);
END;
$$;

REVOKE ALL ON FUNCTION public.register_client_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_client_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.bootstrap_first_founder(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_founder(UUID) TO service_role;
REVOKE ALL ON FUNCTION public.admin_change_subscription(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_subscription(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;
REVOKE ALL ON FUNCTION public.process_payment_event(TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment_event(TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
REVOKE ALL ON FUNCTION public.reject_admin_audit_mutation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_admin_audit_actor() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_founder() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_founder(), public.is_admin(), public.is_staff() TO authenticated;

-- RLS + grants: RLS determina as linhas; grants limitam as operações disponíveis.
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plans_read_all ON public.plans;
CREATE POLICY plans_read_all ON public.plans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS plans_admin_all ON public.plans;
CREATE POLICY plans_admin_all ON public.plans FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS clients_select_own ON public.clients;
CREATE POLICY clients_select_own ON public.clients FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id OR public.is_admin());
DROP POLICY IF EXISTS clients_admin_all ON public.clients;
DROP POLICY IF EXISTS clients_insert_own ON public.clients;
DROP POLICY IF EXISTS clients_update_own ON public.clients;
DROP POLICY IF EXISTS clients_admin_delete ON public.clients;
CREATE POLICY clients_admin_all ON public.clients FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS payments_select_own ON public.subscriptions_payments;
CREATE POLICY payments_select_own ON public.subscriptions_payments FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = subscriptions_payments.client_id AND c.auth_user_id = auth.uid()
  ));
DROP POLICY IF EXISTS payments_admin_all ON public.subscriptions_payments;
CREATE POLICY payments_admin_all ON public.subscriptions_payments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_users_select_own_or_admin ON public.admin_users;
DROP POLICY IF EXISTS admin_users_admin_all ON public.admin_users;
DROP POLICY IF EXISTS admin_users_founder_manage ON public.admin_users;
CREATE POLICY admin_users_select_own_or_admin ON public.admin_users FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id OR public.is_admin());
CREATE POLICY admin_users_founder_manage ON public.admin_users FOR ALL TO authenticated
  USING (public.is_founder()) WITH CHECK (public.is_founder());

DROP POLICY IF EXISTS audit_logs_admin_all ON public.admin_audit_logs;
DROP POLICY IF EXISTS audit_logs_staff_read ON public.admin_audit_logs;
DROP POLICY IF EXISTS audit_logs_staff_insert ON public.admin_audit_logs;
CREATE POLICY audit_logs_staff_read ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.is_staff());
CREATE POLICY audit_logs_staff_insert ON public.admin_audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

GRANT SELECT ON public.plans TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_users TO authenticated;
GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.admin_audit_logs_id_seq TO authenticated;
REVOKE UPDATE, DELETE ON public.admin_audit_logs FROM anon, authenticated;
-- Chave secret/service_role bypassa RLS, mas ainda depende de grants SQL explícitos.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.plans, public.clients, public.subscriptions_payments, public.admin_users
TO service_role;
GRANT SELECT, INSERT ON public.admin_audit_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.admin_audit_logs_id_seq TO service_role;
REVOKE ALL ON public.clients FROM anon;
REVOKE ALL ON public.subscriptions_payments FROM anon;
REVOKE ALL ON public.admin_users FROM anon;
REVOKE ALL ON public.admin_audit_logs FROM anon;

-- A view deve respeitar RLS do invocador; somente equipe administrativa pode consultá-la.
CREATE OR REPLACE VIEW public.vw_founder_clients_overview
WITH (security_invoker = true)
AS
SELECT
  c.id AS client_id, c.company_name, c.attendant_name, c.email_google,
  c.whatsapp, c.niche, c.city, c.plan_code, p.name AS plan_name,
  p.price_brl AS plan_price_brl, c.subscription_status,
  c.trial_started_at, c.trial_ends_at,
  GREATEST(0, CEIL(EXTRACT(EPOCH FROM (c.trial_ends_at - NOW())) / 86400.0))::int AS trial_days_left,
  COALESCE(SUM(CASE WHEN sp.status = 'approved' THEN sp.amount_brl ELSE 0 END), 0) AS total_paid_brl,
  MAX(sp.paid_at) AS last_payment_at, c.created_at
FROM public.clients c
JOIN public.plans p ON p.code = c.plan_code
LEFT JOIN public.subscriptions_payments sp ON sp.client_id = c.id
GROUP BY c.id, p.name, p.price_brl;
REVOKE ALL ON public.vw_founder_clients_overview FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.vw_founder_clients_overview TO authenticated;
GRANT SELECT ON public.vw_founder_clients_overview TO service_role;

COMMENT ON TABLE public.clients IS 'Cadastro mestre e estado da assinatura; perfil próprio via register_client_profile.';
COMMENT ON FUNCTION public.bootstrap_first_founder(UUID) IS 'Bootstrap único do Fundador; invocação exclusiva via service_role fora do frontend.';
COMMENT ON FUNCTION public.admin_change_subscription(UUID, UUID, TEXT, TEXT, TEXT) IS 'Altera plano/status e grava auditoria na mesma transação; exclusivo da API autenticada.';
