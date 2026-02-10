-- Migración V4: Corrección Constraint 'nivel_habilidad'

-- Se eliminó el campo 'nivel_habilidad' del formulario, pero la base de datos sigue esperando un valor.
-- Hacemos la columna opcional (NULLABLE) para que no falle al insertar.

ALTER TABLE grupos ALTER COLUMN nivel_habilidad DROP NOT NULL;
