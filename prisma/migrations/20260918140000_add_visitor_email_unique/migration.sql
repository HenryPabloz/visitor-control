-- Impede o cadastro de dois visitantes com o mesmo e-mail.
-- Postgres trata múltiplos NULL como valores distintos, então visitantes
-- sem e-mail continuam podendo ser cadastrados sem problema.
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_email_key" UNIQUE ("email");
