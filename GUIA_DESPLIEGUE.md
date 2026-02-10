# Guía de Despliegue para Asistencia Patín

Esta guía te ayudará a subir tu proyecto a Internet usando GitHub y Vercel (Totalmente GRATIS).

## 🟢 Parte 1: Subir código a GitHub

1.  Ve a [github.com](https://github.com/) e inicia sesión.
2.  Haz clic en el botón **New** (o +) para crear un nuevo repositorio.
3.  Nombre del repositorio: `asistencia-patin`.
4.  Selecciona **Public** o **Private** (Private es mejor para datos de alumnos).
5.  Haz clic en **Create repository**.
6.  Copia los comandos que aparecen bajo "...push an existing repository from the command line". Deberían ser parecidos a estos:
    ```bash
    git remote add origin https://github.com/TU_USUARIO/asistencia-patin.git
    git branch -M main
    git push -u origin main
    ```
7.  Abre la terminal en tu computadora (en la carpeta del proyecto) y ejecuta esos comandos.

## ▲ Parte 2: Despliegue en Vercel

1.  Ve a [vercel.com](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
2.  Haz clic en **Add New...** -> **Project**.
3.  Verás tu repositorio `asistencia-patin` en la lista (si no, haz clic en "Adjust GitHub App Permissions" para dar acceso).
4.  Haz clic en **Import** al lado de tu repositorio.
5.  En **Framework Preset**, Vercel debería detectar "Vite" automáticamente.
6.  Haz clic en **Deploy**.

¡Espera unos segundos y tu aplicación estará online! 🎉

## 🗄️ Parte 3: Conectar Base de Datos (Supabase)

1.  Ve a [supabase.com](https://supabase.com/) -> New Project.
2.  Copia la `Project URL` y la `API Key (anon/public)`.
3.  En Vercel, ve a tu proyecto -> **Settings** -> **Environment Variables**.
4.  Agrega las siguientes variables:
    - Key: `VITE_SUPABASE_URL` | Value: (Tu URL de Supabase)
    - Key: `VITE_SUPABASE_ANON_KEY` | Value: (Tu API Key de Supabase)
5.  Vuelve a hacer un Deploy en Vercel (o espera al próximo push) para que tome los cambios.

---
**Nota:** El código actual ya está listo para leer estas variables cuando las configures.
