-- Inserção das novas categorias no projetos_db
INSERT INTO public.categories (id, name, icon, color, type) VALUES
(gen_random_uuid(), 'Academia', 'academia', 'emerald', 'expense'),
(gen_random_uuid(), 'Empréstimo', 'emprestimo', 'amber', 'expense'),
(gen_random_uuid(), 'Reembolso', 'reembolso', 'blue', 'income'),
(gen_random_uuid(), 'Eletrodomésticos', 'eletrodomesticos', 'zinc', 'expense'),
(gen_random_uuid(), 'Internet e Telefone', 'internet_telefone', 'sky', 'expense'),
(gen_random_uuid(), 'Assinaturas', 'assinaturas', 'red', 'expense'),
(gen_random_uuid(), 'Cartão de Crédito', 'cartao_credito', 'purple', 'transfer');

-- Verificação rápida
SELECT * FROM public.categories ORDER BY name ASC;