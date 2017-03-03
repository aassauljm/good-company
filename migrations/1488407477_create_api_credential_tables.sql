CREATE TABLE public.api_credential
(
  "id" integer NOT NULL DEFAULT nextval('api_credential_id_seq'::regclass),
  "accessToken" text NOT NULL,
  "tokenType" text NOT NULL,
  "refreshToken" text NOT NULL,
  "expiresIn" integer NOT NULL,
  "service" text NOT NULL,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "ownerId" integer,
  CONSTRAINT api_credential_pkey PRIMARY KEY (id),
  CONSTRAINT "api_credential_ownerId_fkey" FOREIGN KEY ("ownerId")
      REFERENCES public."user" (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)

CREATE TABLE public.api_credential_scope
(
  "id" integer NOT NULL DEFAULT nextval('api_credential_scope_id_seq'::regclass),
  "scope" text NOT NULL,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  CONSTRAINT api_credential_scope_pkey PRIMARY KEY (id)
)

CREATE TABLE public.api_credential_api_credential_scopes
(
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "scopeId" integer NOT NULL,
  "apiCredentialId" integer NOT NULL,
  CONSTRAINT api_credential_api_credential_scopes_pkey PRIMARY KEY ("scopeId", "apiCredentialId"),
  CONSTRAINT "api_credential_api_credential_scopes_ApiCredentialId_fkey" FOREIGN KEY ("apiCredentialId")
      REFERENCES public.api_credential (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "api_credential_api_credential_scopes_scopeId_fkey" FOREIGN KEY ("scopeId")
      REFERENCES public."user" (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
)
