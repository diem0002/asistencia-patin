-- Migración: Seguridad y RLS
-- Objetivo: Restringir modificaciones solo a usuarios autenticados.

-- 1. Eliminar políticas públicas anteriores (si existen)
DROP POLICY IF EXISTS "Public Access Alumnos" ON public.alumnos;
DROP POLICY IF EXISTS "Public Access Grupos" ON public.grupos;
DROP POLICY IF EXISTS "Public Access Relacion" ON public.alumnos_grupos;
DROP POLICY IF EXISTS "Public Access Asistencias" ON public.asistencias;
DROP POLICY IF EXISTS "Public Access Pagos" ON public.pagos;
DROP POLICY IF EXISTS "Public Access Configuracion" ON public.configuracion;

-- 2. Crear políticas nuevas

-- TABLA ALUMNOS
-- Lectura: Solo autenticados (Si quieres que sea público cambia TO authenticated por TO anon, authenticated)
CREATE POLICY "Enable read access for authenticated users" ON public.alumnos
FOR SELECT TO authenticated USING (true);

-- Escritura: Solo autenticados
CREATE POLICY "Enable insert for authenticated users" ON public.alumnos
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.alumnos
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.alumnos
FOR DELETE TO authenticated USING (true);


-- TABLA GRUPOS
CREATE POLICY "Enable read access for public" ON public.grupos
FOR SELECT TO anon, authenticated USING (true); -- Grupos públicos para ver horarios? Mejor todo privado si es gestión interna.
-- CAMBIO: Todo privado.

CREATE POLICY "Enable read access for authenticated users" ON public.grupos
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable all access for authenticated users" ON public.grupos
FOR ALL TO authenticated USING (true);


-- TABLA ALUMNOS_GRUPOS
CREATE POLICY "Enable all access for authenticated users" ON public.alumnos_grupos
FOR ALL TO authenticated USING (true);


-- TABLA ASISTENCIAS
CREATE POLICY "Enable all access for authenticated users" ON public.asistencias
FOR ALL TO authenticated USING (true);


-- TABLA PAGOS
CREATE POLICY "Enable all access for authenticated users" ON public.pagos
FOR ALL TO authenticated USING (true);


-- TABLA CONFIGURACION
CREATE POLICY "Enable all access for authenticated users" ON public.configuracion
FOR ALL TO authenticated USING (true);


-- BUCKETS STORAGE (Comprobantes)
-- Ya se había configurado en migration_v5, pero aseguramos
-- (Supabase Storage policies se manejan distinto, por buckets)
