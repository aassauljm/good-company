ALTER TABLE document DROP CONSTRAINT "document_directoryId_fkey";

drop table document_directory;

ALTER TABLE document  ADD CONSTRAINT "document_directoryId_fkey" FOREIGN KEY ("directoryId")
      REFERENCES public.document (id) MATCH SIMPLE;
