-- Inserting data into the equipment_types table
INSERT INTO equipment_types (name, category, description) VALUES
('Projector Multimedia Full HD', 'Audiovisual', 'Projector with 1920x1080 resolution, ideal for presentations in meeting rooms and auditoriums.'),
('Wireless Lavalier Microphone Kit', 'Audiovisual', 'Set with two lavalier microphones and a wireless receiver, for recordings and events.'),
('Portable 4-Channel Sound Mixer', 'Audiovisual', 'Compact sound mixer for audio control in small presentations or recordings.'),
('4K Webcam with Built-in Microphone', 'Audiovisual', 'High-resolution webcam for video conferences and broadcasts with professional quality.'),
('Portable Amplified Speaker Box', 'Audiovisual', 'Speaker box with internal battery, Bluetooth, and microphone input. Power of 100W RMS.'),
('Notebook Dell Latitude 14"', 'Computing', 'Corporate notebook with Intel i5, 16GB RAM, and 256GB SSD. Windows 11 Pro.'),
('MacBook Air 13" (M2)', 'Computing', 'Apple notebook with M2 chip, 8GB RAM, and 256GB SSD. Ideal for design and editing tasks.'),
('Tablet Samsung Galaxy Tab S9', 'Computing', 'Tablet with S-Pen, ideal for notes, drawings, and interactive presentations.'),
('Wacom Intuos Graphics Tablet', 'Computing', 'Device for digital drawing and image editing. Medium size.'),
('USB-C Multiport Adapter', 'Computing', 'Adapter with HDMI, USB 3.0, and SD card reader outputs for modern notebooks.'),
('DSLR Camera Canon EOS Rebel T8i', 'Photography and Video', 'Camera with 18-55mm lens, ideal for photos and high-quality video recording.'),
('Manfrotto Compact Action Tripod', 'Photography and Video', 'Lightweight and versatile aluminum tripod for cameras and smartphones.'),
('LED Lighting Kit (Softbox)', 'Photography and Video', 'Set with two LED panels with diffusers (softbox) and tripods for studio lighting.'),
('Zoom H5 Audio Recorder', 'Photography and Video', 'Portable digital audio recorder with interchangeable microphone capsules.'),
('Meta Quest 3 Virtual Reality Glasses', 'VR/AR', 'Standalone VR headset for simulations, training, and immersive experiences.'),
('HoloLens 2 Augmented Reality Glasses', 'VR/AR', 'AR headset for hologram viewing and interaction with digital content in the real environment.'),
('Creality Ender 3 V2 3D Printer', 'Prototyping', '3D printer for rapid prototyping of parts and models in PLA/ABS plastic.'),
('Complete Arduino Uno R3 Kit', 'Electronics', 'Kit for beginners in electronics with Arduino board, various sensors, and actuators.'),
('Raspberry Pi 4 Model B (4GB)', 'Electronics', 'Mini computer for IoT projects, automation, and programming learning.'),
('Digital Soldering Station', 'Electronics', 'Equipment for soldering electronic components with temperature control.');

-- Inserting data into the equipment_units table
INSERT INTO equipment_units (type_id, identifier_code, status) VALUES
((SELECT id FROM equipment_types WHERE name = 'Projector Multimedia Full HD'), 'AV-PROJ-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Projector Multimedia Full HD'), 'AV-PROJ-002', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Projector Multimedia Full HD'), 'AV-PROJ-003', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'Wireless Lavalier Microphone Kit'), 'AV-MIC-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Wireless Lavalier Microphone Kit'), 'AV-MIC-002', 'reserved'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Latitude 14"'), 'COMP-NOTE-DELL-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Latitude 14"'), 'COMP-NOTE-DELL-002', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Latitude 14"'), 'COMP-NOTE-DELL-003', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Latitude 14"'), 'COMP-NOTE-DELL-004', 'maintenance'),
((SELECT id FROM equipment_types WHERE name = 'Notebook Dell Latitude 14"'), 'COMP-NOTE-DELL-005', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'COMP-NOTE-MAC-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'MacBook Air 13" (M2)'), 'COMP-NOTE-MAC-002', 'reserved'),
((SELECT id FROM equipment_types WHERE name = 'DSLR Camera Canon EOS Rebel T8i'), 'FOTO-CAM-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'DSLR Camera Canon EOS Rebel T8i'), 'FOTO-CAM-002', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Meta Quest 3 Virtual Reality Glasses'), 'VR-QUEST3-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Meta Quest 3 Virtual Reality Glasses'), 'VR-QUEST3-002', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Creality Ender 3 V2 3D Printer'), 'PROTO-3DPRINT-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Complete Arduino Uno R3 Kit'), 'ELET-ARD-001', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Complete Arduino Uno R3 Kit'), 'ELET-ARD-002', 'available'),
((SELECT id FROM equipment_types WHERE name = 'Complete Arduino Uno R3 Kit'), 'ELET-ARD-003', 'available');

-- Inserting data into the sectors table
INSERT INTO sectors (name) VALUES
('Information Technology'),
('Human Resources'),
('Marketing'),
('Finance'),
('Academic'),
('Administrative');