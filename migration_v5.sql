-- Migración V5 Completa: Nuevos Campos + Configuración de Almacenamiento

-- 1. Agregar columnas a la tabla alumnos
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS fecha_inicio date DEFAULT CURRENT_DATE;
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS comprobante_url text;

-- 2. Crear el Bucket 'comprobantes' automáticamente
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Crear políticas de seguridad para permitir subir y ver imágenes
-- Primero eliminamos políticas viejas si existen para evitar duplicados
DROP POLICY IF EXISTS "Permiso Total Comprobantes" ON storage.objects;

-- Creamos la política que permite TODO (Ver, Subir, Modificar) en este bucket
CREATE POLICY "Permiso Total Comprobantes"
ON storage.objects FOR ALL
USING ( bucket_id = 'comprobantes' )
WITH CHECK ( bucket_id = 'comprobantes' );
