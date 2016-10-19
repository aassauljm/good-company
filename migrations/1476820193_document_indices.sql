CREATE INDEX "document_filename_idx"
  ON public.document
  USING btree
  ("filename");

CREATE INDEX "document_type_idx"
  ON public.document
  USING btree
  ("type");
