-- Habilitar extensión UUID para generar IDs únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla: ALUMNOS
CREATE TABLE IF NOT EXISTS public.alumnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  -- Edad se puede calcular en frontend o con columna generada, aquí simplificamos
  -- Contacto
  nombre_tutor VARCHAR(200) NOT NULL,
  telefono_tutor VARCHAR(20) NOT NULL,
  email_tutor VARCHAR(100),
  telefono_emergencia VARCHAR(20),
  -- Info médica
  obra_social VARCHAR(100),
  alergias TEXT,
  condiciones_medicas TEXT,
  medicamentos TEXT,
  -- Info adicional
  observaciones TEXT,
  fecha_ingreso DATE DEFAULT CURRENT_DATE,
  activo BOOLEAN DEFAULT true,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla: GRUPOS
CREATE TABLE IF NOT EXISTS public.grupos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 1=Lunes...
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  nivel_habilidad VARCHAR(50) NOT NULL, -- 'Principiante', 'Intermedio', 'Avanzado', 'Competición'
  capacidad_maxima INTEGER,
  activo BOOLEAN DEFAULT true,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dia_semana, hora_inicio, nivel_habilidad)
);

-- 3. Tabla: ALUMNOS_GRUPOS (Relación Mucho-a-Muchos)
CREATE TABLE IF NOT EXISTS public.alumnos_grupos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  fecha_asignacion DATE DEFAULT CURRENT_DATE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alumno_id, grupo_id) -- Evita duplicados
);

-- 4. Tabla: ASISTENCIAS
CREATE TABLE IF NOT EXISTS public.asistencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  presente BOOLEAN NOT NULL DEFAULT false,
  observaciones_dia TEXT,
  registrado_por UUID REFERENCES auth.users(id), -- Opcional, si usas Auth
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alumno_id, grupo_id, fecha) -- Un registro por alumno/grupo/día
);

-- 5. Seguridad (RLS)
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso PÚBLICO para empezar (LUEGO restringiremos con Auth)
-- Permitir todo a todos (⚠️ Solo para desarrollo rápido inicial)

CREATE POLICY "Public Access Alumnos" ON public.alumnos FOR ALL USING (true);
CREATE POLICY "Public Access Grupos" ON public.grupos FOR ALL USING (true);
CREATE POLICY "Public Access Relacion" ON public.alumnos_grupos FOR ALL USING (true);
CREATE POLICY "Public Access Asistencias" ON public.asistencias FOR ALL USING (true);

-- Insertar datos de prueba (Seed Data)
INSERT INTO public.grupos (nombre, dia_semana, hora_inicio, hora_fin, nivel_habilidad, color)
VALUES 
('Principiantes Lun 18hs', 1, '18:00', '19:00', 'Principiante', '#3B82F6'),
('Avanzados Mie 19hs', 3, '19:00', '20:30', 'Avanzado', '#EF4444');

INSERT INTO public.alumnos (nombre, apellido, fecha_nacimiento, nombre_tutor, telefono_tutor, fecha_ingreso)
VALUES 
('Sofia', 'Martinez', '2015-05-12', 'Maria Lopez', '11-1234-5678', '2025-03-01'),
('Lucia', 'Gomez', '2014-08-22', 'Juan Gomez', '11-8765-4321', '2025-03-05');
