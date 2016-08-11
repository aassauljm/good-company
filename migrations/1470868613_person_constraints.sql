ALTER TABLE person
ADD CONSTRAINT person_owner_fkey
FOREIGN KEY ("ownerId")
REFERENCES public.user;

ALTER TABLE person
ADD CONSTRAINT person_createdby_fkey
FOREIGN KEY ("createdById")
REFERENCES public.user;