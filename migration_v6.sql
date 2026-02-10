-- Migración V6: Hacer opcionales campos de Alumnos

-- 1. Quitar restricción NOT NULL de fecha_nacimiento
ALTER TABLE alumnos ALTER COLUMN fecha_nacimiento DROP NOT NULL;

-- 2. Quitar restricción NOT NULL de telefono_tutor
ALTER TABLE alumnos ALTER COLUMN telefono_tutor DROP NOT NULL;

-- 3. Quitar restricción NOT NULL de telefono_emergencia (por si acaso)
ALTER TABLE alumnos ALTER COLUMN telefono_emergencia DROP NOT NULL;
