CREATE SEQUENCE public.mbie_api_bearer_token_id_seq
    INCREMENT 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    START 10000
    CACHE 1;

CREATE TABLE public.mbie_api_bearer_token
(
    "id" integer NOT NULL DEFAULT nextval('mbie_api_bearer_token_id_seq'::regclass),
    "token" text NOT NULL,
    "expiresIn" integer NOT NULL,
    "service" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    
    CONSTRAINT mbie_api_bearer_token_pkey PRIMARY KEY (id)
)
