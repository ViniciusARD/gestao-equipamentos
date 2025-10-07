-- Inserindo dados na tabela de TIPOS de equipamento (equipment_types)

INSERT INTO equipment_types (name, category, description) VALUES
-- Categoria: Audiovisual
('Projetor Multimídia Full HD', 'Audiovisual', 'Projetor com resolução 1920x1080, ideal para apresentações em salas de reunião e auditórios.'),
('Kit Microfone de Lapela Sem Fio', 'Audiovisual', 'Conjunto com dois microfones de lapela e receptor sem fio, para gravações e eventos.'),
('Mesa de Som Portátil 4 Canais', 'Audiovisual', 'Mesa de som compacta para controle de áudio em pequenas apresentações ou gravações.'),
('Webcam 4K com Microfone Embutido', 'Audiovisual', 'Webcam de alta resolução para videoconferências e transmissões com qualidade profissional.'),
('Caixa de Som Amplificada Portátil', 'Audiovisual', 'Caixa de som com bateria interna, Bluetooth e entrada para microfone. Potência de 100W RMS.'),

-- Categoria: Computacional
('Notebook Dell Latitude 14"', 'Computacional', 'Notebook corporativo com Intel i5, 16GB de RAM e 256GB SSD. Windows 11 Pro.'),
('MacBook Air 13" (M2)', 'Computacional', 'Notebook Apple com chip M2, 8GB de RAM e 256GB SSD. Ideal para tarefas de design e edição.'),
('Tablet Samsung Galaxy Tab S9', 'Computacional', 'Tablet com caneta S-Pen, ideal para anotações, desenhos e apresentações interativas.'),
('Mesa Digitalizadora Wacom Intuos', 'Computacional', 'Dispositivo para desenho digital e edição de imagens. Tamanho médio.'),
('Adaptador Multiportas USB-C', 'Computacional', 'Adaptador com saídas HDMI, USB 3.0 e leitor de cartão SD para notebooks modernos.'),

-- Categoria: Fotografia e Vídeo
('Câmera DSLR Canon EOS Rebel T8i', 'Fotografia e Vídeo', 'Câmera com lente 18-55mm, ideal para fotos e gravação de vídeos em alta qualidade.'),
('Tripé Manfrotto Compact Action', 'Fotografia e Vídeo', 'Tripé de alumínio, leve e versátil para câmeras e smartphones.'),
('Kit de Iluminação LED (Softbox)', 'Fotografia e Vídeo', 'Conjunto com dois painéis de LED com difusores (softbox) e tripés para iluminação de estúdio.'),
('Gravador de Áudio Zoom H5', 'Fotografia e Vídeo', 'Gravador de áudio digital portátil com cápsulas de microfone intercambiáveis.'),

-- Categoria: Realidade Virtual e Aumentada
('Óculos de Realidade Virtual Meta Quest 3', 'VR/AR', 'Headset de VR autônomo para simulações, treinamentos e experiências imersivas.'),
('Óculos de Realidade Aumentada HoloLens 2', 'VR/AR', 'Headset de AR para visualização de hologramas e interação com conteúdo digital no ambiente real.'),

-- Categoria: Prototipagem e Eletrônica
('Impressora 3D Creality Ender 3 V2', 'Prototipagem', 'Impressora 3D para prototipagem rápida de peças e modelos em plástico PLA/ABS.'),
('Kit Arduino Uno R3 Completo', 'Eletrônica', 'Kit para iniciantes em eletrônica com placa Arduino, sensores e atuadores diversos.'),
('Raspberry Pi 4 Model B (4GB)', 'Eletrônica', 'Mini computador para projetos de IoT, automação e aprendizado de programação.'),
('Estação de Solda Digital', 'Eletrônica', 'Equipamento para soldagem de componentes eletrônicos com controle de temperatura.');


-- Inserindo dados na tabela de UNIDADES FÍSICAS de cada equipamento (equipment_units)

-- Projetores Multimídia Full HD
INSERT INTO equipment_units (type_id, identifier_code, status) VALUES
((SELECT id FROM equipment_types WHERE name = 'Projetor Multimídia Full HD'), 'AV-PROJ-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Projetor Multimídia Full HD'), 'AV-PROJ-002', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Projetor Multimídia Full HD'), 'AV-PROJ-003', 'maintenance');

-- Kit Microfone de Lapela Sem Fio
INSERT INTO equipment_units (type_id, identifier_code, status) VALUES
((SELECT id FROM equipment_types WHERE name = 'Kit Microfone de Lapela Sem Fio'), 'AV-MIC-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Kit Microfone de Lapela Sem Fio'), 'AV-MIC-002', 'reserved');

-- Notebook Dell Latitude 14"
INSERT INTO equipment_units (type_id, identifier_code, status) VALUES
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Latitude 14"'), 'COMP-NOTE-DELL-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Latitude 14"'), 'COMP-NOTE-DELL-002', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Latitude 14"'), 'COMP-NOTE-DELL-003', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Latitude 14"'), 'COMP-NOTE-DELL-004', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Latitude 14"'), 'COMP-NOTE-DELL-005', 'available');

-- MacBook Air 13" (M2)
INSERT INTO equipment_units (type_id, identifier_code, status) VALUES
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'COMP-NOTE-MAC-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'COMP-NOTE-MAC-002', 'reserved');

-- Câmera DSLR Canon EOS Rebel T8i
INSERT INTO equipment_units (type_id, identifier_code, status) VALUES
((SELECT id FROM equipment_types WHERE name = 'Câmera DSLR Canon EOS Rebel T8i'), 'FOTO-CAM-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Câmera DSLR Canon EOS Rebel T8i'), 'FOTO-CAM-002', 'available');

-- Óculos de Realidade Virtual Meta Quest 3
INSERT INTO equipment_units (type_id, identifier_code, status) VALUES
((SELECT id FROM equipment_types WHERE name = 'Óculos de Realidade Virtual Meta Quest 3'), 'VR-QUEST3-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Óculos de Realidade Virtual Meta Quest 3'), 'VR-QUEST3-002', 'available');

-- Impressora 3D Creality Ender 3 V2
INSERT INTO equipment_units (type_id, identifier_code, status) VALUES
((SELECT id FROM equipment_types WHERE name = 'Impressora 3D Creality Ender 3 V2'), 'PROTO-3DPRINT-001', 'available');

-- Kit Arduino Uno R3 Completo
INSERT INTO equipment_units (type_id, identifier_code, status) VALUES
((SELECT id FROM equipment_types WHERE name = 'Kit Arduino Uno R3 Completo'), 'ELET-ARD-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Kit Arduino Uno R3 Completo'), 'ELET-ARD-002', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Kit Arduino Uno R3 Completo'), 'ELET-ARD-003', 'available');

-- Inserindo dados na tabela de setores (setores)
INSERT INTO setores (name) VALUES
('Tecnologia da Informação'),
('Recursos Humanos'),
('Marketing'),
('Financeiro'),
('Acadêmico'),
('Administrativo');
