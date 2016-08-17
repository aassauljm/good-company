ALTER TABLE "holderJ" rename TO "holder";

ALTER TABLE "holder" DROP CONSTRAINT "holderJ_pkey";

ALTER TABLE "holder" ADD COLUMN id BIGSERIAL PRIMARY KEY;