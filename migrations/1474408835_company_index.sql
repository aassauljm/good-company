CREATE INDEX "company_currentCompanyStateId_idx"
  ON public.company
  USING btree
  ("currentCompanyStateId");

CREATE INDEX "company_ownerId_idx"
  ON public.company
  USING btree
  ("ownerId");

CREATE INDEX "company_deleted_idx"
  ON public.company
  USING btree
  ("deleted");