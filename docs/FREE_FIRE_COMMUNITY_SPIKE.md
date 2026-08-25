# Free Fire Community API Spike

Fecha: 2026-07-10

## Objetivo

Validar si Free Fire Community API puede entregar datos reales de jugador por UID y region antes de integrarla en el flujo de perfil/dashboard.

## Proveedor

- Base URL: `https://developers.freefirecommunity.com/api/v1`
- Endpoints objetivo:
  - `GET /info?region=BR&uid={uid}`
  - `GET /stats?region=BR&uid={uid}`
- Auth: header `x-api-key`

## Estado del spike

Bloqueado por configuracion.

`FREE_FIRE_API_KEY` no esta configurada en `.env.local`, por lo que no se hicieron requests reales al proveedor y no se avanzo a la integracion de Fase B.

## Script creado

`champions-league-pvp/scripts/free-fire-community-spike.mjs`

Uso:

```bash
node scripts/free-fire-community-spike.mjs <uid> BR
```

El script:

- carga `.env.local` localmente;
- valida UID numerico con minimo 6 digitos;
- usa `FREE_FIRE_API_KEY` sin imprimirla;
- consulta `/info` y `/stats`;
- aplica timeout de 8 segundos;
- imprime HTTP status y nombres de campos principales;
- no imprime la respuesta cruda completa.

## Resultado actual

Prueba tecnica de configuracion:

```txt
UID: 123456
Region: BR
Resultado: CONFIGURATION_ERROR
Motivo: FREE_FIRE_API_KEY missing
```

No se considera prueba real del proveedor porque el UID fue usado solo para validar el flujo local y no habia API key disponible.

## Pendiente para reintentar

1. Agregar `FREE_FIRE_API_KEY` a `.env.local` y Netlify Environment Variables.
2. Proveer un UID real de Free Fire para region `BR`.
3. Ejecutar:

```bash
node scripts/free-fire-community-spike.mjs <uid-real> BR
```

4. Si `/info` y `/stats` responden con datos reales, avanzar a Fase B.

## Decision tecnica

No implementar `src/lib/free-fire/*`, route handler ni sync con `player_stats` hasta validar que el proveedor responde con datos utiles.
