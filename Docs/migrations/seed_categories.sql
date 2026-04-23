-- Limpar tabela antes de popular (descomente se desejar resetar)
-- TRUNCATE TABLE public.categories CASCADE;

-- Inserção das categorias padronizadas mapeadas no ControlFin
INSERT INTO public.categories (id, name, icon, color, type) VALUES
-- 🔻 Despesas
(gen_random_uuid(), 'Alimentação', 'alimentacao', 'orange', 'Despesa'),
(gen_random_uuid(), 'Transporte', 'transporte', 'blue', 'Despesa'),
(gen_random_uuid(), 'Moradia', 'moradia', 'indigo', 'Despesa'),
(gen_random_uuid(), 'Saúde', 'saude', 'emerald', 'Despesa'),
(gen_random_uuid(), 'Mercado', 'mercado', 'green', 'Despesa'),
(gen_random_uuid(), 'Educação', 'educacao', 'purple', 'Despesa'),
(gen_random_uuid(), 'Lazer', 'lazer', 'pink', 'Despesa'),
(gen_random_uuid(), 'Vestuário', 'vestuario', 'cyan', 'Despesa'),
(gen_random_uuid(), 'Pets', 'pets', 'amber', 'Despesa'),
(gen_random_uuid(), 'Viagens', 'viagens', 'sky', 'Despesa'),
(gen_random_uuid(), 'Academia', 'academia', 'emerald', 'Despesa'),
(gen_random_uuid(), 'Empréstimo', 'emprestimo', 'amber', 'Despesa'),
(gen_random_uuid(), 'Eletrodomésticos', 'eletrodomesticos', 'zinc', 'Despesa'),
(gen_random_uuid(), 'Internet e Telefone', 'internet_telefone', 'sky', 'Despesa'),
(gen_random_uuid(), 'Assinaturas', 'assinaturas', 'red', 'Despesa'),

-- 🔺 Receitas
(gen_random_uuid(), 'Salário', 'salario', 'emerald', 'Receita'),
(gen_random_uuid(), 'Reembolso', 'reembolso', 'blue', 'Receita'),

-- 🏦 Reservas / Transferências
(gen_random_uuid(), 'Investimentos', 'investimentos', 'violet', 'Reserva'),
(gen_random_uuid(), 'Cartão de Crédito', 'cartao_credito', 'purple', 'Reserva');

-- Verificação rápida
SELECT * FROM public.categories ORDER BY type, name ASC;