-- Inserindo dados na tabela sectors (setores)
INSERT INTO sectors (name) VALUES
('Tecnologia da Informação'),
('Recursos Humanos'),
('Marketing'),
('Financeiro'),
('Acadêmico'),
('Engenharia'),
('Design e Multimídia'),
('Pesquisa e Desenvolvimento'),
('Administrativo');

-- Inserindo dados na tabela equipment_types (tipos de equipamento)
INSERT INTO equipment_types (name, category, description) VALUES
-- Categoria: Notebook
('Notebook Dell Vostro 15"', 'Notebook', 'Notebook corporativo com Intel i7, 16GB RAM, 512GB SSD. Ideal para desenvolvimento e tarefas pesadas.'),
('Notebook Dell XPS 13"', 'Notebook', 'Ultrabook premium com tela 4K, Intel i7, 16GB RAM. Focado em portabilidade e design.'),
('Notebook Lenovo ThinkPad T14', 'Notebook', 'Clássico corporativo conhecido pela durabilidade e teclado ergonômico. Intel i5, 16GB RAM.'),
('MacBook Pro 14" (M3 Pro)', 'Notebook', 'Notebook Apple com chip M3 Pro, 18GB RAM, 512GB SSD. Otimizado para edição de vídeo 8K e compilação de código.'),
('MacBook Air 13" (M2)', 'Notebook', 'Notebook leve da Apple com chip M2, 8GB RAM. Perfeito para reuniões, viagens e tarefas do dia a dia.'),

-- Categoria: Informática
('Monitor UltraWide LG 34"', 'Informática', 'Monitor de 34 polegadas com resolução QHD para multitarefa e visualização expandida.'),
('Teclado Mecânico Logitech MX', 'Informática', 'Teclado sem fio retroiluminado para programação e digitação intensiva.'),
('Mouse Ergonômico Vertical', 'Informática', 'Mouse projetado para reduzir a tensão no pulso durante o uso prolongado.'),
('Adaptador Multiportas USB-C/Thunderbolt', 'Informática', 'Hub com saídas HDMI 4K, USB-A 3.0, leitor de cartão SD e porta de carregamento PD.'),
('Tablet de Desenho Wacom Intuos Pro', 'Informática', 'Mesa digitalizadora profissional para ilustradores e designers, sensível à pressão.'),

-- Categoria: Audiovisual
('Projetor Laser 4K Epson', 'Audiovisual', 'Projetor de alta performance com 5000 lumens, ideal para auditórios e grandes salas.'),
('Kit Microfone Rode Wireless Go II', 'Audiovisual', 'Sistema de microfone sem fio de canal duplo, ultracompacto e versátil.'),
('Mesa de Som Behringer Xenyx 1204USB', 'Audiovisual', 'Mixer de 8 canais com interface de áudio USB integrada para gravações e eventos ao vivo.'),
('Webcam Logitech Brio 4K', 'Audiovisual', 'Webcam profissional com HDR e ajuste de campo de visão, para streaming e conferências de alta qualidade.'),
('Caixa de Som JBL EON 715', 'Audiovisual', 'Caixa de som ativa de 15 polegadas com Bluetooth, 1300W de potência para eventos de médio porte.'),
('Tela de Projeção Retrátil (100 polegadas)', 'Audiovisual', 'Tela de projeção de 100" com acionamento manual para instalação em teto ou parede.'),

-- Categoria: Fotografia e Vídeo
('Câmera Mirrorless Sony A7 IV', 'Fotografia e Vídeo', 'Câmera full-frame com lente 24-70mm f/2.8, ideal para fotografia profissional e vídeo 4K.'),
('Drone DJI Mavic 3', 'Fotografia e Vídeo', 'Drone com câmera Hasselblad 4/3 CMOS para captura de imagens aéreas cinematográficas.'),
('Tripé de Vídeo Manfrotto 504X', 'Fotografia e Vídeo', 'Tripé robusto com cabeça fluida, projetado para movimentos de câmera suaves e estáveis.'),
('Kit de Iluminação Aputure Amaran 200d', 'Fotografia e Vídeo', 'Conjunto de dois iluminadores LED Daylight com softboxes para produção de vídeo profissional.'),
('Gravador de Áudio Tascam DR-40X', 'Fotografia e Vídeo', 'Gravador de áudio de 4 pistas com microfones condensadores ajustáveis.'),
('Gimbal Estabilizador DJI RS 3', 'Fotografia e Vídeo', 'Estabilizador de 3 eixos para câmeras DSLR e mirrorless, suporta até 3kg.'),

-- Categoria: Prototipagem e Eletrônica
('Impressora 3D Bambu Lab P1S', 'Prototipagem', 'Impressora 3D de alta velocidade com capacidade de impressão multicolor.'),
('Kit Avançado Raspberry Pi 5 (8GB)', 'Eletrônica', 'Kit completo com Raspberry Pi 5, case, cooler, fonte e cabos para projetos de IoT e automação.'),
('Osciloscópio Digital Rigol DS1054Z', 'Eletrônica', 'Osciloscópio de 4 canais e 50 MHz para análise de circuitos eletrônicos.'),
('Estação de Retrabalho SMD (Ar Quente)', 'Eletrônica', 'Equipamento para soldar e dessoldar componentes eletrônicos de montagem em superfície.'),

-- Categoria: VR/AR e Imersão
('Óculos VR/MR Meta Quest 3 (128GB)', 'VR/AR', 'Headset de realidade mista autônomo para desenvolvimento, simulações e experiências imersivas.'),
('Headset de Rastreamento Ocular Varjo Aero', 'VR/AR', 'VR headset de alta fidelidade com rastreamento ocular integrado para simulações profissionais.');


-- Inserindo dados na tabela equipment_units (unidades de equipamento)
INSERT INTO equipment_units (type_id, identifier_code, serial_number, status) VALUES
-- Notebooks Dell Vostro (25 unidades)
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-001', 'SN-DV-A8B4C1', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-002', 'SN-DV-D5E2F8', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-003', 'SN-DV-G7H3J2', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-004', 'SN-DV-K9L6M4', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-005', 'SN-DV-N1P8Q7', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-006', 'SN-DV-R5S3T9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-007', 'SN-DV-U6V2W4', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-008', 'SN-DV-X1Y7Z5', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-009', 'SN-DV-B3C9A6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-010', 'SN-DV-F4G1H8', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-011', 'SN-DV-I2J5K3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-012', 'SN-DV-L9M6N4', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-013', 'SN-DV-P1Q8R7', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-014', 'SN-DV-S5T3U9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-015', 'SN-DV-V6W2X4', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-016', 'SN-DV-Y1Z8A5', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-017', 'SN-DV-B2C7D4', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-018', 'SN-DV-E9F6G3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-019', 'SN-DV-H2I5J1', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-020', 'SN-DV-K8L4M9', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-021', 'SN-DV-N7P1Q6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-022', 'SN-DV-R3S9T5', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-023', 'SN-DV-U2V8W4', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-024', 'SN-DV-X7Y3Z1', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Vostro 15"'), 'NT-DV-025', 'SN-DV-A6B5C2', 'available'),

-- Notebooks Dell XPS (10 unidades)
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell XPS 13"'), 'NT-DXP-001', 'SN-DXPS-A1B2C3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell XPS 13"'), 'NT-DXP-002', 'SN-DXPS-D4E5F6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell XPS 13"'), 'NT-DXP-003', 'SN-DXPS-G7H8I9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell XPS 13"'), 'NT-DXP-004', 'SN-DXPS-J1K2L3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell XPS 13"'), 'NT-DXP-005', 'SN-DXPS-M4N5P6', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell XPS 13"'), 'NT-DXP-006', 'SN-DXPS-Q7R8S9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell XPS 13"'), 'NT-DXP-007', 'SN-DXPS-T1U2V3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell XPS 13"'), 'NT-DXP-008', 'SN-DXPS-W4X5Y6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell XPS 13"'), 'NT-DXP-009', 'SN-DXPS-Z7A8B9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell XPS 13"'), 'NT-DXP-010', 'SN-DXPS-C1D2E3', 'available'),

-- Notebooks Lenovo ThinkPad (20 unidades)
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-001', 'SN-LNV-F4G5H6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-002', 'SN-LNV-I7J8K9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-003', 'SN-LNV-L1M2N3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-004', 'SN-LNV-P4Q5R6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-005', 'SN-LNV-S7T8U9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-006', 'SN-LNV-V1W2X3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-007', 'SN-LNV-Y4Z5A6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-008', 'SN-LNV-B7C8D9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-009', 'SN-LNV-E1F2G3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-010', 'SN-LNV-H4I5J6', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-011', 'SN-LNV-K7L8M9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-012', 'SN-LNV-N1P2Q3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-013', 'SN-LNV-R4S5T6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-014', 'SN-LNV-U7V8W9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-015', 'SN-LNV-X1Y2Z3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-016', 'SN-LNV-A4B5C6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-017', 'SN-LNV-D7E8F9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-018', 'SN-LNV-G1H2I3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-019', 'SN-LNV-J4K5L6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Lenovo ThinkPad T14'), 'NT-LNV-020', 'SN-LNV-M7N8P9', 'available'),

-- MacBooks Pro (10 unidades)
((SELECT id FROM equipment_types WHERE name = 'MacBook Pro 14" (M3 Pro)'), 'NT-MBP-001', 'SN-MBP-Q1R2S3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Pro 14" (M3 Pro)'), 'NT-MBP-002', 'SN-MBP-T4U5V6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Pro 14" (M3 Pro)'), 'NT-MBP-003', 'SN-MBP-W7X8Y9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Pro 14" (M3 Pro)'), 'NT-MBP-004', 'SN-MBP-Z1A2B3', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Pro 14" (M3 Pro)'), 'NT-MBP-005', 'SN-MBP-C4D5E6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Pro 14" (M3 Pro)'), 'NT-MBP-006', 'SN-MBP-F7G8H9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Pro 14" (M3 Pro)'), 'NT-MBP-007', 'SN-MBP-I1J2K3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Pro 14" (M3 Pro)'), 'NT-MBP-008', 'SN-MBP-L4M5N6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Pro 14" (M3 Pro)'), 'NT-MBP-009', 'SN-MBP-P7Q8R9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Pro 14" (M3 Pro)'), 'NT-MBP-010', 'SN-MBP-S1T2U3', 'available'),

-- MacBooks Air (15 unidades)
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-001', 'SN-MBA-V4W5X6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-002', 'SN-MBA-Y7Z8A9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-003', 'SN-MBA-B1C2D3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-004', 'SN-MBA-E4F5G6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-005', 'SN-MBA-H7I8J9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-006', 'SN-MBA-K1L2M3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-007', 'SN-MBA-N4P5Q6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-008', 'SN-MBA-R7S8T9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-009', 'SN-MBA-U1V2W3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-010', 'SN-MBA-X4Y5Z6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-011', 'SN-MBA-A7B8C9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-012', 'SN-MBA-D1E2F3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-013', 'SN-MBA-G4H5I6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-014', 'SN-MBA-J7K8L9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'NT-MBA-015', 'SN-MBA-M1N2P3', 'available'),

-- Monitores UltraWide (15 unidades)
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-001', 'SN-MON-Q4R5S6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-002', 'SN-MON-T7U8V9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-003', 'SN-MON-W1X2Y3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-004', 'SN-MON-Z4A5B6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-005', 'SN-MON-C7D8E9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-006', 'SN-MON-F1G2H3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-007', 'SN-MON-I4J5K6', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-008', 'SN-MON-L7M8N9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-009', 'SN-MON-P1Q2R3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-010', 'SN-MON-S4T5U6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-011', 'SN-MON-V7W8X9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-012', 'SN-MON-Y1Z2A3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-013', 'SN-MON-B4C5D6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-014', 'SN-MON-E7F8G9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Monitor UltraWide LG 34"'), 'INF-MON-015', 'SN-MON-H1I2J3', 'available'),

-- Teclados Mecânicos (20 unidades)
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-001', 'SN-TECL-K4L5M6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-002', 'SN-TECL-N7P8Q9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-003', 'SN-TECL-R1S2T3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-004', 'SN-TECL-U4V5W6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-005', 'SN-TECL-X7Y8Z9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-006', 'SN-TECL-A1B2C3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-007', 'SN-TECL-D4E5F6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-008', 'SN-TECL-G7H8I9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-009', 'SN-TECL-J1K2L3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-010', 'SN-TECL-M4N5P6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-011', 'SN-TECL-Q7R8S9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-012', 'SN-TECL-T1U2V3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-013', 'SN-TECL-W4X5Y6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-014', 'SN-TECL-Z7A8B9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-015', 'SN-TECL-C1D2E3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-016', 'SN-TECL-F4G5H6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-017', 'SN-TECL-I7J8K9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-018', 'SN-TECL-L1M2N3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-019', 'SN-TECL-P4Q5R6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Teclado Mecânico Logitech MX'), 'INF-TEC-020', 'SN-TECL-S7T8U9', 'available'),

-- Mouses Ergonômicos (20 unidades)
((SELECT id FROM equipment_types WHERE name = 'Mouse Ergonômico Vertical'), 'INF-MOU-001', 'SN-MOUSE-V1W2X3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Mouse Ergonômico Vertical'), 'INF-MOU-002', 'SN-MOUSE-Y4Z5A6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Mouse Ergonômico Vertical'), 'INF-MOU-003', 'SN-MOUSE-B7C8D9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Mouse Ergonômico Vertical'), 'INF-MOU-004', 'SN-MOUSE-E1F2G3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Mouse Ergonômico Vertical'), 'INF-MOU-005', 'SN-MOUSE-H4I5J6', 'available'),

-- Adaptadores Multiportas (25 unidades)
((SELECT id FROM equipment_types WHERE name = 'Adaptador Multiportas USB-C/Thunderbolt'), 'INF-ADP-001', 'SN-ADPT-K7L8M9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Adaptador Multiportas USB-C/Thunderbolt'), 'INF-ADP-002', 'SN-ADPT-N1P2Q3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Adaptador Multiportas USB-C/Thunderbolt'), 'INF-ADP-003', 'SN-ADPT-R4S5T6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Adaptador Multiportas USB-C/Thunderbolt'), 'INF-ADP-004', 'SN-ADPT-U7V8W9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Adaptador Multiportas USB-C/Thunderbolt'), 'INF-ADP-005', 'SN-ADPT-X1Y2Z3', 'available'),

-- Tablets Wacom (8 unidades)
((SELECT id FROM equipment_types WHERE name = 'Tablet de Desenho Wacom Intuos Pro'), 'INF-TAB-001', 'SN-WAC-A4B5C6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Tablet de Desenho Wacom Intuos Pro'), 'INF-TAB-002', 'SN-WAC-D7E8F9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Tablet de Desenho Wacom Intuos Pro'), 'INF-TAB-003', 'SN-WAC-G1H2I3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Tablet de Desenho Wacom Intuos Pro'), 'INF-TAB-004', 'SN-WAC-J4K5L6', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'Tablet de Desenho Wacom Intuos Pro'), 'INF-TAB-005', 'SN-WAC-M7N8P9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Tablet de Desenho Wacom Intuos Pro'), 'INF-TAB-006', 'SN-WAC-Q1R2S3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Tablet de Desenho Wacom Intuos Pro'), 'INF-TAB-007', 'SN-WAC-T4U5V6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Tablet de Desenho Wacom Intuos Pro'), 'INF-TAB-008', 'SN-WAC-W7X8Y9', 'available'),

-- Projetores Laser 4K (6 unidades)
((SELECT id FROM equipment_types WHERE name = 'Projetor Laser 4K Epson'), 'AV-PROJ-001', 'SN-PROJ-Z1A2B3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Projetor Laser 4K Epson'), 'AV-PROJ-002', 'SN-PROJ-C4D5E6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Projetor Laser 4K Epson'), 'AV-PROJ-003', 'SN-PROJ-F7G8H9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Projetor Laser 4K Epson'), 'AV-PROJ-004', 'SN-PROJ-I1J2K3', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'Projetor Laser 4K Epson'), 'AV-PROJ-005', 'SN-PROJ-L4M5N6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Projetor Laser 4K Epson'), 'AV-PROJ-006', 'SN-PROJ-P7Q8R9', 'available'),

-- Microfones Rode (15 unidades)
((SELECT id FROM equipment_types WHERE name = 'Kit Microfone Rode Wireless Go II'), 'AV-MIC-001', 'SN-RODE-S1T2U3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Kit Microfone Rode Wireless Go II'), 'AV-MIC-002', 'SN-RODE-V4W5X6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Kit Microfone Rode Wireless Go II'), 'AV-MIC-003', 'SN-RODE-Y7Z8A9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Kit Microfone Rode Wireless Go II'), 'AV-MIC-004', 'SN-RODE-B1C2D3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Kit Microfone Rode Wireless Go II'), 'AV-MIC-005', 'SN-RODE-E4F5G6', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'Kit Microfone Rode Wireless Go II'), 'AV-MIC-006', 'SN-RODE-H7I8J9', 'available'),

-- Webcams Logitech (20 unidades)
((SELECT id FROM equipment_types WHERE name = 'Webcam Logitech Brio 4K'), 'AV-WCAM-001', 'SN-WCAM-K1L2M3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Webcam Logitech Brio 4K'), 'AV-WCAM-002', 'SN-WCAM-N4P5Q6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Webcam Logitech Brio 4K'), 'AV-WCAM-003', 'SN-WCAM-R7S8T9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Webcam Logitech Brio 4K'), 'AV-WCAM-004', 'SN-WCAM-U1V2W3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Webcam Logitech Brio 4K'), 'AV-WCAM-005', 'SN-WCAM-X4Y5Z6', 'available'),

-- Câmeras Sony A7 IV (8 unidades)
((SELECT id FROM equipment_types WHERE name = 'Câmera Mirrorless Sony A7 IV'), 'FOT-CAM-001', 'SN-SONY-A7B8C9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Câmera Mirrorless Sony A7 IV'), 'FOT-CAM-002', 'SN-SONY-D1E2F3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Câmera Mirrorless Sony A7 IV'), 'FOT-CAM-003', 'SN-SONY-G4H5I6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Câmera Mirrorless Sony A7 IV'), 'FOT-CAM-004', 'SN-SONY-J7K8L9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Câmera Mirrorless Sony A7 IV'), 'FOT-CAM-005', 'SN-SONY-M1N2P3', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'Câmera Mirrorless Sony A7 IV'), 'FOT-CAM-006', 'SN-SONY-Q4R5S6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Câmera Mirrorless Sony A7 IV'), 'FOT-CAM-007', 'SN-SONY-T7U8V9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Câmera Mirrorless Sony A7 IV'), 'FOT-CAM-008', 'SN-SONY-W1X2Y3', 'available'),

-- Drones DJI Mavic 3 (5 unidades)
((SELECT id FROM equipment_types WHERE name = 'Drone DJI Mavic 3'), 'FOT-DRN-001', 'SN-DJI-Z4A5B6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Drone DJI Mavic 3'), 'FOT-DRN-002', 'SN-DJI-C7D8E9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Drone DJI Mavic 3'), 'FOT-DRN-003', 'SN-DJI-F1G2H3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Drone DJI Mavic 3'), 'FOT-DRN-004', 'SN-DJI-I4J5K6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Drone DJI Mavic 3'), 'FOT-DRN-005', 'SN-DJI-L7M8N9', 'available'),

-- Tripés de Vídeo (10 unidades)
((SELECT id FROM equipment_types WHERE name = 'Tripé de Vídeo Manfrotto 504X'), 'FOT-TRI-001', 'SN-MANF-P1Q2R3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Tripé de Vídeo Manfrotto 504X'), 'FOT-TRI-002', 'SN-MANF-S4T5U6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Tripé de Vídeo Manfrotto 504X'), 'FOT-TRI-003', 'SN-MANF-V7W8X9', 'available'),

-- Kits de Iluminação (5 kits)
((SELECT id FROM equipment_types WHERE name = 'Kit de Iluminação Aputure Amaran 200d'), 'FOT-ILUM-001', 'SN-APUT-Y1Z2A3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Kit de Iluminação Aputure Amaran 200d'), 'FOT-ILUM-002', 'SN-APUT-B4C5D6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Kit de Iluminação Aputure Amaran 200d'), 'FOT-ILUM-003', 'SN-APUT-E7F8G9', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'Kit de Iluminação Aputure Amaran 200d'), 'FOT-ILUM-004', 'SN-APUT-H1I2J3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Kit de Iluminação Aputure Amaran 200d'), 'FOT-ILUM-005', 'SN-APUT-K4L5M6', 'available'),

-- Gravadores de Áudio (10 unidades)
((SELECT id FROM equipment_types WHERE name = 'Gravador de Áudio Tascam DR-40X'), 'FOT-AUD-001', 'SN-TASC-N7P8Q9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Gravador de Áudio Tascam DR-40X'), 'FOT-AUD-002', 'SN-TASC-R1S2T3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Gravador de Áudio Tascam DR-40X'), 'FOT-AUD-003', 'SN-TASC-U4V5W6', 'available'),

-- Gimbals (5 unidades)
((SELECT id FROM equipment_types WHERE name = 'Gimbal Estabilizador DJI RS 3'), 'FOT-GIM-001', 'SN-GIM-X7Y8Z9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Gimbal Estabilizador DJI RS 3'), 'FOT-GIM-002', 'SN-GIM-A1B2C3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Gimbal Estabilizador DJI RS 3'), 'FOT-GIM-003', 'SN-GIM-D4E5F6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Gimbal Estabilizador DJI RS 3'), 'FOT-GIM-004', 'SN-GIM-G7H8I9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Gimbal Estabilizador DJI RS 3'), 'FOT-GIM-005', 'SN-GIM-J1K2L3', 'available'),

-- Impressoras 3D (4 unidades)
((SELECT id FROM equipment_types WHERE name = 'Impressora 3D Bambu Lab P1S'), 'PROT-3DP-001', 'SN-BAMBU-M4N5P6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Impressora 3D Bambu Lab P1S'), 'PROT-3DP-002', 'SN-BAMBU-Q7R8S9', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'Impressora 3D Bambu Lab P1S'), 'PROT-3DP-003', 'SN-BAMBU-T1U2V3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Impressora 3D Bambu Lab P1S'), 'PROT-3DP-004', 'SN-BAMBU-W4X5Y6', 'available'),

-- Kits Raspberry Pi 5 (15 unidades)
((SELECT id FROM equipment_types WHERE name = 'Kit Avançado Raspberry Pi 5 (8GB)'), 'ELET-RPI-001', 'SN-RPI5-Z7A8B9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Kit Avançado Raspberry Pi 5 (8GB)'), 'ELET-RPI-002', 'SN-RPI5-C1D2E3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Kit Avançado Raspberry Pi 5 (8GB)'), 'ELET-RPI-003', 'SN-RPI5-F4G5H6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Kit Avançado Raspberry Pi 5 (8GB)'), 'ELET-RPI-004', 'SN-RPI5-I7J8K9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Kit Avançado Raspberry Pi 5 (8GB)'), 'ELET-RPI-005', 'SN-RPI5-L1M2N3', 'available'),

-- Meta Quest 3 (12 unidades)
((SELECT id FROM equipment_types WHERE name = 'Óculos VR/MR Meta Quest 3 (128GB)'), 'VR-MQ3-001', 'SN-META-P4Q5R6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Óculos VR/MR Meta Quest 3 (128GB)'), 'VR-MQ3-002', 'SN-META-S7T8U9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Óculos VR/MR Meta Quest 3 (128GB)'), 'VR-MQ3-003', 'SN-META-V1W2X3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Óculos VR/MR Meta Quest 3 (128GB)'), 'VR-MQ3-004', 'SN-META-Y4Z5A6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Óculos VR/MR Meta Quest 3 (128GB)'), 'VR-MQ3-005', 'SN-META-B7C8D9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Óculos VR/MR Meta Quest 3 (128GB)'), 'VR-MQ3-006', 'SN-META-E1F2G3', 'available'),

-- Headsets Varjo Aero (4 unidades)
((SELECT id FROM equipment_types WHERE name = 'Headset de Rastreamento Ocular Varjo Aero'), 'VR-VAR-001', 'SN-VARJO-H4I5J6', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Headset de Rastreamento Ocular Varjo Aero'), 'VR-VAR-002', 'SN-VARJO-K7L8M9', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Headset de Rastreamento Ocular Varjo Aero'), 'VR-VAR-003', 'SN-VARJO-N1P2Q3', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Headset de Rastreamento Ocular Varjo Aero'), 'VR-VAR-004', 'SN-VARJO-R4S5T6', 'maintenance');