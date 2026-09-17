-- ============================================================
-- TABLE: visit_audit
-- Guarda o histórico de todo INSERT/UPDATE feito em "visits":
-- quem fez, quando, e como a linha estava antes/depois.
-- ============================================================
CREATE TABLE "visit_audit" (
    "id" BIGSERIAL NOT NULL,
    "visit_id" TEXT NOT NULL,
    "action" VARCHAR(10) NOT NULL,
    "changed_by" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "old_values" JSONB,
    "new_values" JSONB,

    CONSTRAINT "visit_audit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "visit_audit_action_check" CHECK ("action" IN ('INSERT', 'UPDATE'))
);

CREATE INDEX "visit_audit_visit_id_idx" ON "visit_audit"("visit_id");

-- ============================================================
-- TRIGGER: prevent_double_active_visit
-- BEFORE INSERT ON visits — bloqueia um segundo INSERT com
-- status ACTIVE pro mesmo visitante (defesa extra: mesma regra já
-- validada na procedure insert_visit, mas aqui vale mesmo se alguém
-- inserir direto na tabela sem passar pela procedure).
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_double_active_visit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_visita_ativa_existe BOOLEAN;
BEGIN
    IF NEW."status" = 'ACTIVE' THEN
        SELECT EXISTS (
            SELECT 1 FROM "visits"
            WHERE "fk_visitorId" = NEW."fk_visitorId" AND "status" = 'ACTIVE'
        ) INTO v_visita_ativa_existe;

        IF v_visita_ativa_existe THEN
            RAISE EXCEPTION 'Visitante já possui uma visita ativa';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_double_active_visit
BEFORE INSERT ON "visits"
FOR EACH ROW
EXECUTE FUNCTION prevent_double_active_visit();

-- ============================================================
-- TRIGGER: prevent_double_checkout
-- BEFORE UPDATE ON visits — quando o status está mudando de
-- ACTIVE pra CLOSED, exige que checkoutAt e checkoutBy já
-- estejam preenchidos na própria linha que está sendo salva.
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_double_checkout()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD."status" = 'ACTIVE' AND NEW."status" = 'CLOSED' THEN
        IF NEW."checkoutAt" IS NULL OR NEW."checkoutBy" IS NULL THEN
            RAISE EXCEPTION 'checkoutAt e checkoutBy são obrigatórios para encerrar uma visita';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_double_checkout
BEFORE UPDATE ON "visits"
FOR EACH ROW
EXECUTE FUNCTION prevent_double_checkout();

-- ============================================================
-- TRIGGER: audit_visits
-- AFTER INSERT OR UPDATE ON visits — grava uma linha em
-- visit_audit com o estado antes/depois da linha alterada.
-- Roda só depois que os triggers BEFORE validaram tudo, então
-- nunca existe registro de auditoria de uma operação que falhou.
-- ============================================================
CREATE OR REPLACE FUNCTION audit_visits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "visit_audit" ("visit_id", "action", "changed_by", "old_values", "new_values")
        VALUES (NEW."id_visit", 'INSERT', NEW."createdBy", NULL, to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO "visit_audit" ("visit_id", "action", "changed_by", "old_values", "new_values")
        VALUES (NEW."id_visit", 'UPDATE', COALESCE(NEW."checkoutBy", NEW."createdBy"), to_jsonb(OLD), to_jsonb(NEW));
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_visits
AFTER INSERT OR UPDATE ON "visits"
FOR EACH ROW
EXECUTE FUNCTION audit_visits();
