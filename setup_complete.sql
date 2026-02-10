-- SCRIPT MAESTRO DE INSTALACIÓN (V1 a V6 + Seguridad)
-- Ejecutar este script COMPLETO en el SQL Editor de Supabase para configurar todo el proyecto desde cero.

-- ==========================================
-- 1. CONFIGURACIÓN INICIAL (Tablas Base)
-- ==========================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla: ALUMNOS
CREATE TABLE IF NOT EXISTS public.alumnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  -- Estos campos ahora son opcionales (Migración V6)
  fecha_nacimiento DATE, 
  nombre_tutor VARCHAR(200) NOT NULL,
  telefono_tutor VARCHAR(20),
  email_tutor VARCHAR(100),
  telefono_emergencia VARCHAR(20),
  -- Info médica
  paga_seguro BOOLEAN DEFAULT false, -- (Migración V3)
  alergias TEXT,
  condiciones_medicas TEXT,
  medicamentos TEXT,
  -- Info adicional
  observaciones TEXT,
  fecha_ingreso DATE DEFAULT CURRENT_DATE,
  fecha_inicio DATE DEFAULT CURRENT_DATE, -- (Migración V5)
  comprobante_url TEXT, -- (Migración V5)
  activo BOOLEAN DEFAULT true,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: GRUPOS
CREATE TABLE IF NOT EXISTS public.grupos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  dias_semana INTEGER[], -- (Migración V2)
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  nivel_habilidad VARCHAR(50), -- Opcional (Migración V4)
  capacidad_maxima INTEGER, -- Opcional (Migración V3)
  valor_cuota NUMERIC DEFAULT 0, -- (Migración V3)
  activo BOOLEAN DEFAULT true,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: ALUMNOS_GRUPOS
CREATE TABLE IF NOT EXISTS public.alumnos_grupos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  fecha_asignacion DATE DEFAULT CURRENT_DATE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alumno_id, grupo_id)
);

-- Tabla: ASISTENCIAS
CREATE TABLE IF NOT EXISTS public.asistencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  presente BOOLEAN NOT NULL DEFAULT false,
  observaciones_dia TEXT,
  registrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alumno_id, grupo_id, fecha)
);

-- Tabla: PAGOS (Migración V2)
CREATE TABLE IF NOT EXISTS public.pagos (
  id UUID NOT NULL DEFAULT gen_random_uuid (),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  alumno_id UUID NOT NULL REFERENCES public.alumnos (id),
  mes DATE NOT NULL,
  monto NUMERIC NOT NULL DEFAULT 0,
  pagado BOOLEAN NOT NULL DEFAULT false,
  fecha_pago TIMESTAMP WITH TIME ZONE,
  observaciones TEXT,
  CONSTRAINT pagos_pkey PRIMARY KEY (id),
  CONSTRAINT pagos_alumno_id_mes_key UNIQUE (alumno_id, mes)
);

-- Tabla: CONFIGURACION (Migración V2)
CREATE TABLE IF NOT EXISTS public.configuracion (
  clave TEXT NOT NULL,
  valor TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT configuracion_pkey PRIMARY KEY (clave)
);

-- Insertar Configuración Default
INSERT INTO configuracion (clave, valor) VALUES ('valor_cuota', '15000') ON CONFLICT DO NOTHING;

-- Habilitar RLS en todas las tablas
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 2. POLÍTICAS DE SEGURIDAD (Security Migration)
-- ==========================================

-- Limpiar políticas viejas
DROP POLICY IF EXISTS "Public Access Alumnos" ON public.alumnos;
DROP POLICY IF EXISTS "Public Access Grupos" ON public.grupos;
DROP POLICY IF EXISTS "Public Access Relacion" ON public.alumnos_grupos;
DROP POLICY IF EXISTS "Public Access Asistencias" ON public.asistencias;
DROP POLICY IF EXISTS "Public Access Pagos" ON public.pagos;
DROP POLICY IF EXISTS "Public Access Configuracion" ON public.configuracion;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.alumnos;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.alumnos;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.alumnos;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.alumnos;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.grupos;


-- ALUMNOS: Solo autenticados
CREATE POLICY "Auth Read Alumnos" ON public.alumnos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth Insert Alumnos" ON public.alumnos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth Update Alumnos" ON public.alumnos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth Delete Alumnos" ON public.alumnos FOR DELETE TO authenticated USING (true);

-- GRUPOS: Solo autenticados
CREATE POLICY "Auth All Grupos" ON public.grupos FOR ALL TO authenticated USING (true);

-- RELACIONES: Solo autenticados
CREATE POLICY "Auth All Relacion" ON public.alumnos_grupos FOR ALL TO authenticated USING (true);

-- ASISTENCIAS: Solo autenticados
CREATE POLICY "Auth All Asistencias" ON public.asistencias FOR ALL TO authenticated USING (true);

-- PAGOS: Solo autenticados
CREATE POLICY "Auth All Pagos" ON public.pagos FOR ALL TO authenticated USING (true);

-- CONFIGURACION: Solo autenticados
CREATE POLICY "Auth All Config" ON public.configuracion FOR ALL TO authenticated USING (true);


-- ==========================================
-- 3. ALMACENAMIENTO (Storage)
-- ==========================================

-- Crear Bucket 'comprobantes'
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
DROP POLICY IF EXISTS "Permiso Total Comprobantes" ON storage.objects;

CREATE POLICY "Permiso Total Comprobantes"
ON storage.objects FOR ALL
USING ( bucket_id = 'comprobantes' )
WITH CHECK ( bucket_id = 'comprobantes' );
