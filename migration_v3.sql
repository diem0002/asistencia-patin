-- Migración Fase 3: Correcciones y Ajustes

-- 1. Modificaciones en tabla 'grupos'
-- Hacer 'dia_semana' opcional (ya que usamos 'dias_semana') para evitar crash
ALTER TABLE grupos ALTER COLUMN dia_semana DROP NOT NULL;

-- Hacer 'capacidad_maxima' opcional
ALTER TABLE grupos ALTER COLUMN capacidad_maxima DROP NOT NULL;

-- Agregar 'valor_cuota' específico para el grupo. Default 0.
ALTER TABLE grupos ADD COLUMN valor_cuota numeric DEFAULT 0;


-- 2. Modificaciones en tabla 'alumnos'
-- Agregar check 'paga_seguro'
ALTER TABLE alumnos ADD COLUMN paga_seguro boolean DEFAULT false;

-- (Opcional) Eliminar 'obra_social' si ya no se usa, o ignorarla.
-- Para mantener los datos por si acaso, solo la dejaremos ahí, pero la UI la ignorará.
-- Si quieres borrarla descomenta la siguiente línea:
ALTER TABLE alumnos DROP COLUMN obra_social;
