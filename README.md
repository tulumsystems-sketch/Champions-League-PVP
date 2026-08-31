# Champions League PVP

Plataforma competitiva de Free Fire: Coins, desafíos, salas 1v1–4v4, ranking de la arena y panel admin.

## Arranque local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Variables en `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `FREE_FIRE_API_KEY`
- `NEXT_PUBLIC_SITE_URL` (en local: `http://localhost:3000`)

## Ramas Git

| Rama | Uso |
| --- | --- |
| `release/mvp-ready` | Código listo para demo y entrega. **Esta es la rama a mergear.** |
| `develop` | Demo con el cliente (Vercel preview o entorno de prueba). |
| `main` | Entrega / producción.

Flujo: `release/mvp-ready` → `develop` (demo) → `main` (entrega).

## Deploy (Vercel)

1. Importar el repo y desplegar **`develop`** primero (demo).
2. Cargar las mismas variables, con `NEXT_PUBLIC_SITE_URL` = URL de Vercel.
3. En Supabase Auth → Redirect URLs, agregar (Google y recuperar contraseña usan el mismo path):
   - `http://localhost:3000/auth/callback`
   - `https://TU-DOMINIO.vercel.app/auth/callback`
4. Google Login: Client ID y Secret en Supabase Auth → Providers → Google. Hasta que eso no esté, el botón muestra el error y el email sigue funcionando.
5. Cuando el cliente apruebe, mergear `develop` → `main` y apuntar producción a `main`.

La base live ya tiene el schema del MVP (fases 0–8). No hace falta recrear tablas.

Checklist completo: `docs/ENTREGA.md`.
