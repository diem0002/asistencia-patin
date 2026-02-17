-- Migración: Agenda de Eventos (Feriados / Cancelaciones)

create table public.agenda_eventos (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  grupo_id uuid references public.grupos (id) on delete cascade, -- Si es NULL, aplica a TODOS los grupos (ej. Feriado Nacional)
  fecha date not null,
  tipo varchar(50) not null, -- 'FERIADO', 'CANCELADO', 'EXAMEN', 'OTRO'
  descripcion text,
  activo boolean default true,
  constraint agenda_eventos_pkey primary key (id),
  constraint agenda_eventos_grupo_fecha_key unique (grupo_id, fecha) -- Un evento por grupo/fecha
);

-- RLS
alter table public.agenda_eventos enable row level security;

-- Políticas (Igual que el resto, solo auth)
create policy "Enable all access for authenticated users" on "public"."agenda_eventos"
as permissive for all
to authenticated
using (true)
with check (true);
