# Checklist de entrega — Champions League PVP

Rama de código lista: **`release/mvp-ready`**.  
No mergear a `develop` ni a `main` hasta que ustedes decidan.

## Ramas

### Git

| Rama | Para qué | Estado |
| --- | --- | --- |
| `release/mvp-ready` | Todo el MVP de código, listo para subir | Usar esta |
| `develop` | Demo con el cliente | Hoy en remoto sigue igual que `main` (commit viejo). Mergear `release/mvp-ready` → `develop` cuando vayan a demo. |
| `main` | Entrega / producción | Mergear `develop` → `main` cuando el cliente apruebe |

Comandos cuando llegue el momento (no ahora):

```bash
git checkout develop
git merge release/mvp-ready
git push origin develop

# después de la demo, entrega:
git checkout main
git merge develop
git push origin main
```

### Base de datos (Supabase)

Hay **un proyecto live** (`champions-league-pvp`, sa-east-1). Ahí ya están aplicadas las migraciones del MVP, incluido UID único y Realtime.

| Entorno | Base | Notas |
| --- | --- | --- |
| Local / demo `develop` / producción `main` | El mismo proyecto Supabase de producción | Evita dos economías distintas. El admin opera un solo wallet real. |
| Preview aislado (opcional, más adelante) | Branch de Supabase | Copia el schema **sin** jugadores ni Coins. Sale extra. No lo creamos ahora para no duplicar plata ni datos. |

Si más adelante quieren una DB vacía solo para demo, se crea un branch `develop` en Supabase y se apuntan las env de Vercel Preview a ese proyecto. Hasta entonces, demo y entrega usan la misma base.

---

## Pedirle al cliente (bloquea go-live)

Sin esto no se cobra de verdad ni Google entra:

1. **Datos de cobro reales**  
   CBU/CVU/alias (ARS) y address USDT + red. El admin los carga en `/admin` → Datos de cobro. Hasta entonces se ven placeholders.

2. **Google Login (si lo quieren en la entrega)**  
   En [Google Cloud Console](https://console.cloud.google.com/): OAuth client (Web), authorized origins y redirect:
   - `https://<PROJECT>.supabase.co/auth/v1/callback`
   - También el dominio de Vercel en Authorized JavaScript origins  
   Pegar **Client ID** y **Client Secret** en Supabase → Authentication → Providers → Google.  
   Redirect URLs de la app: `https://championspvp.netlify.app/**` y `http://localhost:3000/**`. Site URL: `https://championspvp.netlify.app`. Recuperar contraseña usa `/auth/callback?token_hash=...&type=recovery`.

3. **Cuenta Vercel** (o el host que usen) y dominio si no alcanza `*.vercel.app`.

4. **Un admin humano** que apruebe recargas y pague retiros (el flujo es manual, como el PRD).

5. **Dos cuentas de prueba** (email o Google + UID Free Fire reales) para la pasada de punta a punta.

---

## Lo que ya está en código (no pedirlo de nuevo)

- Auth email, recuperar clave, UID validado contra la API al registrarse (UID único).
- Google: botón y callback listos; quedan apagados hasta las credenciales.
- Wallet 5/10/15, recarga con archivo, retiro, 1 Coin = 1 USD.
- Desafíos con premios 50/30/10 configurables y métrica Puntos.
- Salas 1v1 / 2v2 / 3v3 / 4v4, entradas 1/10/15/50, capturas, revisión admin.
- Ranking / perfil / historial de la plataforma.
- Admin de usuarios, suspender, ajuste de Coins/premios.
- Realtime en salas, desafíos, ranking, wallet y panel de plata.
- Storage de comprobantes y evidencias de sala.

---

## Checklist interno antes de la demo (`develop`)

- [ ] Merge `release/mvp-ready` → `develop` y push.
- [ ] Deploy Vercel desde `develop`.
- [ ] Env en Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `FREE_FIRE_API_KEY`, `NEXT_PUBLIC_SITE_URL`.
- [ ] Redirect URLs de Auth con la URL de Vercel.
- [ ] Cargar CBU/USDT reales en `/admin` (cuando el cliente los mande).
- [ ] Probar Google si ya hay credenciales; si no, demo solo con email.
- [ ] Pasada corta: login → recarga pendiente → aprobar → desafío o sala → premio → retiro.

## Checklist de entrega (`main`)

- [ ] El cliente vio la demo en `develop` y aprobó.
- [ ] Merge `develop` → `main`.
- [ ] Producción en Vercel apunta a `main`.
- [ ] `NEXT_PUBLIC_SITE_URL` es el dominio final.
- [ ] Redirects de Google/Supabase con el dominio final.
- [ ] Circuito completo con dos jugadores reales (abajo).

## Circuito de prueba (entrega)

Dos cuentas (A admin o un admin aparte, B y C jugadores):

1. Registro email con UID válido; UID inventado debe fallar.
2. Google (si está habilitado) → completar UID.
3. Recarga 5 Coins con captura → admin aprueba → saldo 5.
4. Crear sala 1v1 entrada 1 → el otro entra → capturas → admin paga.
5. Sala 2v2 hasta 4 jugadores, estado `in_progress` recién al llenar.
6. Desafío métrica Puntos, inscribirse, sync, cerrar, premios 50/30/10.
7. Ranking muestra victorias / participaciones / Coins ganadas / puntos (no la carrera FF).
8. Retiro: se debitan Coins; admin paga o rechaza y se devuelven.
9. Suspender un jugador: no entra a jugar; reactivar.
10. Ajuste de Coins con motivo; el movimiento aparece en wallet.

## Qué no entra (y no hay que prometer)

OCR, ganador automático por API de Garena, app móvil, chat, streaming, marketplace, salas automáticas.
