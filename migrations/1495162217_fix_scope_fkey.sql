ALTER TABLE api_credential_api_credential_scopes DROP CONSTRAINT  "api_credential_api_credential_scopes_scopeId_fkey";
ALTER TABLE  api_credential_api_credential_scopes ADD CONSTRAINT "api_credential_api_credential_scopes_scopeId_fkey" FOREIGN KEY ("scopeId")
      REFERENCES public."api_credential_scope" (id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE;