-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('admin', 'professor', 'aluno', 'vendedor', 'cliente');

CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  cpf TEXT,
  phone TEXT,
  address TEXT,
  turma_id UUID,
  turma_ids UUID[] DEFAULT '{}',
  enrollment_date TIMESTAMPTZ,
  course_start_date DATE,
  course_end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- profiles policies
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin(auth.uid())) WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "admin insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY "admin delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- user_roles policies
CREATE POLICY "roles readable by authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===== LMS core =====
CREATE TABLE public.turmas (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  professor_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.turmas TO authenticated;
GRANT ALL ON public.turmas TO service_role;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "turmas readable" ON public.turmas FOR SELECT TO authenticated USING (true);
CREATE POLICY "turmas admin manage" ON public.turmas FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.materials (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID,
  professor_id UUID,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_data TEXT,
  video_url TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials readable" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "materials staff manage" ON public.materials FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'professor')) WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'professor'));

CREATE TABLE public.announcements (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  author_id UUID,
  turma_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements readable" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "announcements staff manage" ON public.announcements FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'professor')) WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'professor'));

CREATE TABLE public.attendance_records (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL,
  date TEXT NOT NULL,
  professor_id UUID,
  records JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance readable" ON public.attendance_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "attendance staff manage" ON public.attendance_records FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'professor')) WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'professor'));

CREATE TABLE public.material_progress (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  material_id UUID NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, material_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_progress TO authenticated;
GRANT ALL ON public.material_progress TO service_role;
ALTER TABLE public.material_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress readable" ON public.material_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "progress own or staff" ON public.material_progress FOR ALL TO authenticated USING (auth.uid() = student_id OR public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'professor')) WITH CHECK (auth.uid() = student_id OR public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'professor'));

CREATE TABLE public.submissions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  turma_id UUID,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_data TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions readable" ON public.submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "submissions own or staff" ON public.submissions FOR ALL TO authenticated USING (auth.uid() = student_id OR public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'professor')) WITH CHECK (auth.uid() = student_id OR public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'professor'));

CREATE TABLE public.payments (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  month TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments readable" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments admin manage" ON public.payments FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===== Lan House =====
CREATE TABLE public.computers (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.computers TO authenticated;
GRANT ALL ON public.computers TO service_role;
ALTER TABLE public.computers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "computers readable" ON public.computers FOR SELECT TO authenticated USING (true);
CREATE POLICY "computers staff manage" ON public.computers FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'vendedor')) WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'vendedor'));

CREATE TABLE public.game_sessions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'paused',
  remaining_seconds INTEGER NOT NULL DEFAULT 0,
  last_started_at TIMESTAMPTZ,
  computer_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions readable" ON public.game_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "sessions staff manage" ON public.game_sessions FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'vendedor')) WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'vendedor'));

CREATE TABLE public.game_time_transactions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  seller_id UUID,
  minutes INTEGER NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  note TEXT,
  computer_id UUID,
  payment_method TEXT,
  operation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_time_transactions TO authenticated;
GRANT ALL ON public.game_time_transactions TO service_role;
ALTER TABLE public.game_time_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gtt readable" ON public.game_time_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "gtt staff manage" ON public.game_time_transactions FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'vendedor')) WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'vendedor'));

CREATE TABLE public.expenses (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Outros',
  amount NUMERIC NOT NULL DEFAULT 0,
  note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses readable" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "expenses staff manage" ON public.expenses FOR ALL TO authenticated USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'vendedor')) WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'vendedor'));

-- ===== Store =====
CREATE TABLE public.products (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products admin manage" ON public.products FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===== CMS / site content =====
CREATE TABLE public.site_content (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content public read" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "content admin manage" ON public.site_content FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.blog_posts (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog public read" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "blog admin manage" ON public.blog_posts FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));