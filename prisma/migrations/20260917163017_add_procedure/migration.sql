-- Habilita a função gen_random_uuid(), usada pra gerar os ids das novas
-- linhas direto no banco (aqui as procedures inserem sem passar pelo
-- Prisma Client, então ninguém mais gera esse uuid por fora).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- PROCEDURE: create_visitor
-- Cria um visitante e devolve o id gerado.
-- ============================================================
CREATE OR REPLACE PROCEDURE create_visitor(
    IN p_full_name VARCHAR(150),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_company VARCHAR(150),
    IN p_purpose VARCHAR(255),
    IN p_document VARCHAR(20),
    OUT o_visitor_id TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    o_visitor_id := gen_random_uuid()::text;

    INSERT INTO "visitors" (
        "id_visitor", "fullName", "email", "phone", "company", "purpose", "document", "createdAt", "updatedAt"
    ) VALUES (
        o_visitor_id, p_full_name, p_email, p_phone, p_company, p_purpose, p_document, NOW(), NOW()
    );
END;
$$;

-- ============================================================
-- PROCEDURE: insert_visit
-- Registra o check-in de uma visita nova.
-- ============================================================
CREATE OR REPLACE PROCEDURE insert_visit(
    IN p_visitor_id TEXT,
    IN p_host VARCHAR(150),
    IN p_notes VARCHAR(500),
    IN p_created_by TEXT,
    OUT o_visit_id TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_visita_ativa_existe BOOLEAN;
BEGIN
    -- Visitante precisa existir antes de qualquer coisa.
    IF NOT EXISTS (SELECT 1 FROM "visitors" WHERE "id_visitor" = p_visitor_id) THEN
        RAISE EXCEPTION 'Visitante % não encontrado', p_visitor_id;
    END IF;

    -- Regra de negócio: um visitante não pode ter 2 visitas ACTIVE ao mesmo tempo.
    SELECT EXISTS (
        SELECT 1 FROM "visits"
        WHERE "fk_visitorId" = p_visitor_id AND "status" = 'ACTIVE'
    ) INTO v_visita_ativa_existe;

    IF v_visita_ativa_existe THEN
        RAISE EXCEPTION 'Visitante % já possui uma visita ativa', p_visitor_id;
    END IF;

    o_visit_id := gen_random_uuid()::text;

    INSERT INTO "visits" (
        "id_visit", "fk_visitorId", "checkinAt", "status", "host", "notes", "createdBy", "createdAt", "updatedAt"
    ) VALUES (
        o_visit_id, p_visitor_id, NOW(), 'ACTIVE', p_host, p_notes, p_created_by, NOW(), NOW()
    );
END;
$$;

-- ============================================================
-- PROCEDURE: checkout_visit
-- Registra o check-out (saída) de uma visita existente.
-- ============================================================
CREATE OR REPLACE PROCEDURE checkout_visit(
    IN p_visit_id TEXT,
    IN p_checkout_by TEXT,
    IN p_notes VARCHAR(500),
    OUT o_success BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_status_atual "VisitStatus";
BEGIN
    SELECT "status" INTO v_status_atual
    FROM "visits"
    WHERE "id_visit" = p_visit_id;

    -- Se a busca não encontrou a linha, a variável continua NULL.
    IF v_status_atual IS NULL THEN
        RAISE EXCEPTION 'Visita % não encontrada', p_visit_id;
    END IF;

    IF v_status_atual <> 'ACTIVE' THEN
        RAISE EXCEPTION 'Visita % não está ativa', p_visit_id;
    END IF;

    -- COALESCE mantém o "notes" atual quando p_notes vem NULL, e só troca
    -- quando um valor novo é passado.
    UPDATE "visits"
    SET
        "status" = 'CLOSED',
        "checkoutAt" = NOW(),
        "checkoutBy" = p_checkout_by,
        "notes" = COALESCE(p_notes, "notes"),
        "updatedAt" = NOW()
    WHERE "id_visit" = p_visit_id;

    o_success := TRUE;
END;
$$;
