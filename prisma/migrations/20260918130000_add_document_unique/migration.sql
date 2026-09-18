-- Impede o cadastro de dois visitantes com o mesmo "document".
-- Postgres trata múltiplos NULL como valores distintos, então visitantes
-- sem documento continuam podendo ser cadastrados sem problema.
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_document_key" UNIQUE ("document");
