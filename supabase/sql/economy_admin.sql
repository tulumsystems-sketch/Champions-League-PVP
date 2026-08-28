-- Economía + admin: 1 Coin = 1 USD.
-- Recarga: el jugador transfiere ARS/USDT, manda comprobante, el admin aprueba y acredita.
-- Retiro: se debitan Coins al pedir; el admin paga fiat y marca pagado (o rechaza y se reembolsa).
-- Este archivo documenta el schema ya aplicado en el proyecto live.

-- Planes MVP
-- 5 Coins / $5, 10 Coins / $10, 15 Coins / $15
-- Entradas de sala: 1, 10, 15, 50 Coins

-- RPCs (SECURITY DEFINER, search_path = public)
-- is_admin()
-- claim_first_admin()          -- solo si todavía no hay admin
-- debit_own_coins(...)         -- débito del jugador
-- apply_wallet_credit(...)     -- interno; NO ejecutar desde el cliente
-- credit_user_coins(...)       -- wrapper admin
-- approve_deposit / reject_deposit
-- request_withdrawal / approve_withdrawal / reject_withdrawal
-- create_match_room / join_match_room / cancel_match_room
-- submit_match_result / approve_match_result / reject_match_result / resolve_match_room / admin_void_match_room
-- complete_match_room (solo admin; paga el premio)
-- join_challenge(p_challenge_id uuid)
-- create_challenge / update_challenge / close_challenge / cancel_challenge
-- update_payout_settings(p_value jsonb)

-- Premio de sala: floor(entry_fee * 1.8)
-- Premio de desafío: 90% del pozo, top 3 (50/30/20) o 70/30 si hay 2
