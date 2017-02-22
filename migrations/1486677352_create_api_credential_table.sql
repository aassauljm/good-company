CREATE TABLE api_credential
(
  id integer NOT NULL DEFAULT nextval('api_credential_id_seq'::regclass),
  "accessToken" text NOT NULL,
  "tokenType" text NOT NULL,
  "refreshToken" text NOT NULL,
  "expiresIn" integer NOT NULL,
  scope text NOT NULL,
  service text NOT NULL,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "ownerId" integer,
  CONSTRAINT api_credential_pkey PRIMARY KEY (id),
  CONSTRAINT "api_credential_ownerId_fkey" FOREIGN KEY ("ownerId")
  REFERENCES public."user" (id) MATCH SIMPLE
  ON UPDATE CASCADE ON DELETE SET NULL
)
