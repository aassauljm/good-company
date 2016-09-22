CREATE INDEX "holder_holdingId_idx"
  ON public.holder
  USING btree
  ("holdingId");

CREATE INDEX "holder_holderId_idx"
  ON public.holder
  USING btree
  ("holderId");