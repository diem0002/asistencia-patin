-- Migración Fase 2: Grupos Multi-día y Finanzas

-- 1. Modificar tabla 'grupos'
-- Añadimos columna para días multiples (Array de enteros 0-6)
ALTER TABLE grupos ADD COLUMN dias_semana integer[];

-- Migrar datos existentes: Convertir el valor único 'dia_semana' al array
UPDATE grupos SET dias_semana = ARRAY[dia_semana];

-- (Opcional) Eliminar columnas viejas si ya no se usan
-- ALTER TABLE grupos DROP COLUMN dia_semana;
-- ALTER TABLE grupos DROP COLUMN nivel_habilidad; -- El usuario pidió sacarlo

-- 2. Nueva tabla: 'pagos'
create table public.pagos (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  alumno_id uuid not null references public.alumnos (id),
  mes date not null, -- Usaremos el primer día del mes para identificar (ej: 2024-02-01)
  monto numeric not null default 0,
  pagado boolean not null default false,
  fecha_pago timestamp with time zone,
  observaciones text,
  constraint pagos_pkey primary key (id),
  constraint pagos_alumno_id_mes_key unique (alumno_id, mes) -- Un solo registro por alumno/mes
) tablespace pg_default;

-- 3. Nueva tabla: 'configuracion'
create table public.configuracion (
  clave text not null,
  valor text not null,
  created_at timestamp with time zone not null default now(),
  constraint configuracion_pkey primary key (clave)
) tablespace pg_default;

-- Insertar valor por defecto para la cuota
INSERT INTO configuracion (clave, valor) VALUES ('valor_cuota', '15000') ON CONFLICT DO NOTHING;

-- ACTUALIZAR POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Permitir todo (Development Mode) - Ajustar para producción
CREATE POLICY "Enable all access for all users" ON "public"."pagos"
AS PERMISSIVE FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for all users" ON "public"."configuracion"
AS PERMISSIVE FOR ALL
TO public
USING (true)
WITH CHECK (true);
