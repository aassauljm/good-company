CREATE TABLE public.address_queries
(
  query character varying(255) NOT NULL,
  postal boolean DEFAULT false,
  addresses jsonb,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  CONSTRAINT address_queries_pkey PRIMARY KEY (query)
)