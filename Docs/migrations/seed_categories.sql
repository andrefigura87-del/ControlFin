-- Seed para tabela de categorias com Emojis Nativos
-- Utilize este script para repopular a tabela 'categories' após o TRUNCATE.

INSERT INTO public.categories (id, user_id, name, type, icon, color) VALUES
('b87b37d4-0b16-430c-8069-b5f7e491ee41', NULL, 'Alimentação', 'Despesa', '🍔', 'orange'),
('5c345a0e-bc28-4e1b-b78f-51d02c8969b7', NULL, 'Transporte', 'Despesa', '🚗', 'blue'),
('9d8db1fc-64bb-4e94-9b22-55f6d6ed9581', NULL, 'Moradia', 'Despesa', '🏠', 'indigo'),
('8c47b5ae-3c94-4ab2-9f37-1dfd9a6c2014', NULL, 'Saúde', 'Despesa', '💊', 'emerald'),
('b5c13b35-4ab2-4b24-b152-bf6e927ad06f', NULL, 'Mercado', 'Despesa', '🛒', 'green'),
('6fa79698-fdf9-4ec4-9df2-5d933e4b7787', NULL, 'Educação', 'Despesa', '🎓', 'purple'),
('7b5e43a9-6e01-4470-8b06-1b0d2d38ff12', NULL, 'Lazer', 'Despesa', '🎮', 'pink'),
('1c696e5d-b873-45c1-8b29-db225c56df3d', NULL, 'Vestuário', 'Despesa', '👕', 'cyan'),
('9f1d0b7b-2321-4ba2-8a90-3b9cd4b5b7c0', NULL, 'Salário', 'Receita', '💰', 'emerald'),
('2b9d1469-8f23-4591-9cb6-c2300b99c824', NULL, 'Investimentos', 'Receita', '🏦', 'violet'),
('f78e4708-3a87-4148-8df0-3162a8385bbd', NULL, 'Pets', 'Despesa', '🐶', 'amber'),
('4e528b98-6a4a-4c28-98e3-125a2df6a67f', NULL, 'Viagens', 'Despesa', '✈️', 'sky')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    type = EXCLUDED.type, 
    icon = EXCLUDED.icon, 
    color = EXCLUDED.color;
