ALTER TABLE public.transactions ADD CONSTRAINT transactions_external_id_key UNIQUE (external_id);
