-- Run this ONLY if you already have an older `diy_marketplace` database
-- (instead of re-importing diy_marketplace.sql from scratch).

USE diy_marketplace;

-- If your Vendor table has no `commission_rate` yet, run once:
-- ALTER TABLE Vendor ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 0;

-- Clear demo financial / order history (keeps products, users, vendors)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Payout;
TRUNCATE TABLE CommissionRecord;
TRUNCATE TABLE OrderItem;
TRUNCATE TABLE Orders;
SET FOREIGN_KEY_CHECKS = 1;
