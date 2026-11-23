-- ============================================================================
-- AtendeJá — Dados operacionais no PostgreSQL dedicado do Coolify
-- Isolamento por client_id. O backend valida JWT Supabase e define o contexto
-- via SET LOCAL app.current_client_id dentro de cada transação.
-- Preparação local; aplicar somente após backup e autorização do Fundador.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Role de grupo sem login e sem privilégios de bypass. Crie o login real no
-- Coolify, usando segredo fora do repositório, e conceda membership nesta role.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'atendeja_app_runtime') THEN
    EXECUTE 'CREATE ROLE atendeja_app_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS';
  END IF;
END;
$$;
ALTER ROLE atendeja_app_runtime
  NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_client_id()
RETURNS UUID
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT NULLIF(current_setting('app.current_client_id', true), '')::uuid;
$$;

-- 1. Leads do CRM
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL DEFAULT '',
  servico TEXT NOT NULL DEFAULT '',
  nicho TEXT NOT NULL DEFAULT '',
  valor NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  retorno_data DATE,
  stage TEXT NOT NULL DEFAULT 'novo'
    CHECK (stage IN ('novo', 'atendimento', 'orcamento', 'retorno', 'fechado', 'perdido')),
  obs TEXT NOT NULL DEFAULT '',
  auto_stage BOOLEAN NOT NULL DEFAULT true,
  last_auto_reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, id)
);
CREATE INDEX IF NOT EXISTS idx_leads_client_stage ON public.leads(client_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_client_retorno ON public.leads(client_id, retorno_data);
CREATE INDEX IF NOT EXISTS idx_leads_client_whatsapp ON public.leads(client_id, whatsapp);
DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Mensagens vinculadas ao lead dentro do mesmo tenant
CREATE TABLE IF NOT EXISTS public.lead_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('lead', 'agent', 'system')),
  content TEXT NOT NULL,
  detected_trigger TEXT NOT NULL DEFAULT '',
  moved_to_stage TEXT NOT NULL DEFAULT ''
    CHECK (moved_to_stage IN ('', 'novo', 'atendimento', 'orcamento', 'retorno', 'fechado', 'perdido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_lead_messages_tenant_lead FOREIGN KEY (client_id, lead_id)
    REFERENCES public.leads(client_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_lead_messages_lead
  ON public.lead_messages(client_id, lead_id, created_at ASC);

-- 3. Histórico de movimentações e vendas
CREATE TABLE IF NOT EXISTS public.lead_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  lead_id UUID,
  event_type TEXT NOT NULL DEFAULT 'info' CHECK (event_type IN ('info', 'ia', 'win')),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_lead_history_tenant_lead FOREIGN KEY (client_id, lead_id)
    REFERENCES public.leads(client_id, id) ON DELETE SET NULL (lead_id)
);
CREATE INDEX IF NOT EXISTS idx_lead_history_client
  ON public.lead_history(client_id, created_at DESC);

-- 4. Metas semanais/mensais
CREATE TABLE IF NOT EXISTS public.planning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  period_mode TEXT NOT NULL DEFAULT 'semanal' CHECK (period_mode IN ('semanal', 'mensal')),
  meta_clientes INTEGER NOT NULL DEFAULT 8 CHECK (meta_clientes >= 0),
  meta_faturamento NUMERIC(12, 2) NOT NULL DEFAULT 4500.00 CHECK (meta_faturamento >= 0),
  capacidade_dia INTEGER NOT NULL DEFAULT 3 CHECK (capacidade_dia >= 0),
  observacoes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, period_mode)
);
DROP TRIGGER IF EXISTS trg_planning_goals_updated_at ON public.planning_goals;
CREATE TRIGGER trg_planning_goals_updated_at BEFORE UPDATE ON public.planning_goals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Serviços que o contratante planeja ofertar
CREATE TABLE IF NOT EXISTS public.planning_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  nome TEXT NOT NULL,
  preco NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (preco >= 0),
  meta_qtd INTEGER NOT NULL DEFAULT 1 CHECK (meta_qtd >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_planning_services_client
  ON public.planning_services(client_id);

-- 6. Agenda semanal
CREATE TABLE IF NOT EXISTS public.planning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  day_key TEXT NOT NULL CHECK (day_key IN ('seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom')),
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_planning_tasks_client_day
  ON public.planning_tasks(client_id, day_key);

-- 7. Ciclos encerrados; porcentagem de tarefas sempre entre 0 e 100
CREATE TABLE IF NOT EXISTS public.planning_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  period_mode TEXT NOT NULL CHECK (period_mode IN ('semanal', 'mensal')),
  meta_clientes INTEGER NOT NULL DEFAULT 0 CHECK (meta_clientes >= 0),
  clientes_reais INTEGER NOT NULL DEFAULT 0 CHECK (clientes_reais >= 0),
  meta_faturamento NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (meta_faturamento >= 0),
  faturamento_real NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (faturamento_real >= 0),
  task_pct INTEGER NOT NULL DEFAULT 0 CHECK (task_pct BETWEEN 0 AND 100),
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_planning_cycles_client
  ON public.planning_cycles(client_id, closed_at DESC);

-- 8. Assistentes virtuais
CREATE TABLE IF NOT EXISTS public.assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  nome TEXT NOT NULL,
  especialidade TEXT NOT NULL DEFAULT 'Atendimento',
  capacidades JSONB NOT NULL DEFAULT '["atendimento"]'::jsonb,
  prompt TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  whatsapp_binding TEXT NOT NULL DEFAULT 'WAHA Principal',
  ai_binding TEXT NOT NULL DEFAULT 'OpenAI (gpt-4o-mini)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assistants_client ON public.assistants(client_id);
DROP TRIGGER IF EXISTS trg_assistants_updated_at ON public.assistants;
CREATE TRIGGER trg_assistants_updated_at BEFORE UPDATE ON public.assistants
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. Metadados de integrações. Segredos reais ficam em cofre, nunca nesta tabela.
CREATE TABLE IF NOT EXISTS public.api_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('whatsapp', 'ai', 'webhook')),
  provider TEXT NOT NULL DEFAULT '',
  endpoint_url TEXT NOT NULL DEFAULT '',
  model_or_session TEXT NOT NULL DEFAULT '',
  secret_ref TEXT NOT NULL DEFAULT '',
  key_last4 TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_connections_client_kind
  ON public.api_connections(client_id, kind);
DROP TRIGGER IF EXISTS trg_api_connections_updated_at ON public.api_connections;
CREATE TRIGGER trg_api_connections_updated_at BEFORE UPDATE ON public.api_connections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Estado versionado do dashboard para sincronização segura entre dispositivos.
-- O payload é cache persistente do app; tabelas normalizadas continuam disponíveis
-- para integrações e relatórios que exijam consultas relacionais.
CREATE TABLE IF NOT EXISTS public.client_workspace_state (
  client_id UUID PRIMARY KEY,
  revision BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0),
  state JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(state) = 'object'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cada consulta sem client_id de contexto retorna zero linhas. A API deve sempre
-- verificar o JWT do Supabase e usar SET LOCAL, nunca confiar no client_id do body.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'leads', 'lead_messages', 'lead_history', 'planning_goals',
    'planning_services', 'planning_tasks', 'planning_cycles',
    'assistants', 'api_connections', 'client_workspace_state'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', t);
  END LOOP;
END;
$$;

CREATE POLICY tenant_isolation ON public.leads FOR ALL TO atendeja_app_runtime
  USING (client_id = public.current_client_id())
  WITH CHECK (client_id = public.current_client_id());
CREATE POLICY tenant_isolation ON public.lead_messages FOR ALL TO atendeja_app_runtime
  USING (lead_messages.client_id = public.current_client_id() AND EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_messages.lead_id AND l.client_id = lead_messages.client_id
  ))
  WITH CHECK (lead_messages.client_id = public.current_client_id() AND EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_messages.lead_id AND l.client_id = lead_messages.client_id
  ));
CREATE POLICY tenant_isolation ON public.lead_history FOR ALL TO atendeja_app_runtime
  USING (lead_history.client_id = public.current_client_id() AND (lead_history.lead_id IS NULL OR EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_history.lead_id AND l.client_id = lead_history.client_id
  )))
  WITH CHECK (lead_history.client_id = public.current_client_id() AND (lead_history.lead_id IS NULL OR EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_history.lead_id AND l.client_id = lead_history.client_id
  )));

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'planning_goals', 'planning_services', 'planning_tasks',
    'planning_cycles', 'assistants', 'api_connections'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I FOR ALL TO atendeja_app_runtime USING (client_id = public.current_client_id()) WITH CHECK (client_id = public.current_client_id())',
      t
    );
  END LOOP;
END;
$$;

CREATE POLICY tenant_isolation ON public.client_workspace_state FOR ALL TO atendeja_app_runtime
  USING (client_id = public.current_client_id())
  WITH CHECK (client_id = public.current_client_id());

GRANT USAGE ON SCHEMA public TO atendeja_app_runtime;
REVOKE ALL ON FUNCTION public.current_client_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_client_id() TO atendeja_app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.leads, public.lead_messages, public.lead_history,
  public.planning_goals, public.planning_services, public.planning_tasks,
  public.planning_cycles, public.assistants, public.api_connections,
  public.client_workspace_state
TO atendeja_app_runtime;

COMMENT ON ROLE atendeja_app_runtime IS
  'Role sem login/BYPASSRLS para o backend; associe a um login secreto mantido no Coolify.';
COMMENT ON FUNCTION public.current_client_id() IS
  'Lê o contexto de tenant definido pelo backend via SET LOCAL app.current_client_id.';
