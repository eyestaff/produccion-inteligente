-- Sprint 12.5: Auditoría y preparación Forecast en purchase_requests

-- Campos de auditoría de descarte
ALTER TABLE purchase_requests ADD COLUMN discarded_reason TEXT;
ALTER TABLE purchase_requests ADD COLUMN discarded_at TEXT;
ALTER TABLE purchase_requests ADD COLUMN discarded_by INTEGER;

-- Campos para aprendizaje Forecast (sin implementar todavía)
-- accepted: 1=aceptada, 0=ignorada/descartada
-- stockout_occurred: 1=hubo rotura tras ignorar, 0=no
ALTER TABLE purchase_requests ADD COLUMN accepted INTEGER DEFAULT NULL;
ALTER TABLE purchase_requests ADD COLUMN stockout_occurred INTEGER DEFAULT NULL;
