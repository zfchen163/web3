-- Complete database schema for V3
-- MySQL 8.0 compatible version

-- ==================== Assets Table ====================
-- Add missing fields to assets table

-- Add brand field
ALTER TABLE assets ADD COLUMN brand VARCHAR(191) DEFAULT '' COMMENT 'Brand Address';

-- Add serial number and metadata
ALTER TABLE assets ADD COLUMN serial_number VARCHAR(191) NOT NULL DEFAULT '' COMMENT 'Serial Number';
ALTER TABLE assets ADD COLUMN metadata_uri TEXT COMMENT 'Metadata URI';

-- Add images storage (base64)
ALTER TABLE assets ADD COLUMN images JSON COMMENT 'Base64 Images Array';

-- Add verification status
ALTER TABLE assets ADD COLUMN status TINYINT DEFAULT 0 COMMENT 'Verification Status: 0=Unverified, 1=Verified, 2=Rejected';

-- Add listing info
ALTER TABLE assets ADD COLUMN is_listed TINYINT(1) DEFAULT 0 COMMENT 'Is Listed';
ALTER TABLE assets ADD COLUMN price VARCHAR(191) DEFAULT '0' COMMENT 'Price in wei';

-- Add indexes
CREATE INDEX idx_assets_brand ON assets(brand);
CREATE UNIQUE INDEX idx_assets_serial_number ON assets(serial_number);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_is_listed ON assets(is_listed);

-- ==================== Brands Table ====================
-- Brand management table

CREATE TABLE IF NOT EXISTS brands (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    address VARCHAR(191) NOT NULL COMMENT 'Brand Address',
    name VARCHAR(191) NOT NULL COMMENT 'Brand Name',
    is_authorized TINYINT(1) DEFAULT 0 COMMENT 'Is Authorized',
    created_at DATETIME(3) NOT NULL,
    tx_hash VARCHAR(191) NOT NULL COMMENT 'Registration Transaction Hash',
    block_num BIGINT UNSIGNED NOT NULL COMMENT 'Registration Block Number',
    updated_at DATETIME(3) DEFAULT NULL,
    deleted_at DATETIME(3) DEFAULT NULL,
    
    UNIQUE KEY idx_brands_address (address),
    KEY idx_brands_tx_hash (tx_hash),
    KEY idx_brands_block_num (block_num),
    KEY idx_brands_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Brand Management Table';

-- ==================== Orders Table ====================
-- Order management table

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL COMMENT 'On-chain Order ID',
    asset_id BIGINT UNSIGNED NOT NULL COMMENT 'Asset ID',
    seller VARCHAR(191) NOT NULL COMMENT 'Seller Address',
    buyer VARCHAR(191) NOT NULL COMMENT 'Buyer Address',
    price VARCHAR(191) NOT NULL COMMENT 'Price in wei',
    platform_fee VARCHAR(191) DEFAULT '0' COMMENT 'Platform Fee in wei',
    status TINYINT DEFAULT 0 COMMENT 'Order Status: 0=Pending, 1=Paid, 2=Shipped, 3=Completed, 4=Cancelled, 5=Refunding, 6=Refunded',
    created_at DATETIME(3) NOT NULL,
    paid_at DATETIME(3) DEFAULT NULL COMMENT 'Payment Time',
    shipped_at DATETIME(3) DEFAULT NULL COMMENT 'Shipping Time',
    delivered_at DATETIME(3) DEFAULT NULL COMMENT 'Delivery Confirmation Time',
    completed_at DATETIME(3) DEFAULT NULL COMMENT 'Completion Time',
    cancelled_at DATETIME(3) DEFAULT NULL COMMENT 'Cancellation Time',
    tx_hash VARCHAR(191) NOT NULL COMMENT 'Creation Transaction Hash',
    block_num BIGINT UNSIGNED NOT NULL COMMENT 'Creation Block Number',
    updated_at DATETIME(3) DEFAULT NULL,
    deleted_at DATETIME(3) DEFAULT NULL,
    
    UNIQUE KEY idx_orders_order_id (order_id),
    KEY idx_orders_asset_id (asset_id),
    KEY idx_orders_seller (seller),
    KEY idx_orders_buyer (buyer),
    KEY idx_orders_status (status),
    KEY idx_orders_tx_hash (tx_hash),
    KEY idx_orders_block_num (block_num),
    KEY idx_orders_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Order Management Table';

-- ==================== Asset Owner History Table ====================
-- Asset ownership history table

CREATE TABLE IF NOT EXISTS asset_owner_histories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    asset_id BIGINT UNSIGNED NOT NULL COMMENT 'Asset ID',
    from_owner VARCHAR(191) NOT NULL COMMENT 'Previous Owner Address',
    to_owner VARCHAR(191) NOT NULL COMMENT 'New Owner Address',
    transfer_type VARCHAR(50) DEFAULT 'transfer' COMMENT 'Transfer Type: transfer, sale, gift',
    price VARCHAR(191) DEFAULT '0' COMMENT 'Transaction Price',
    created_at DATETIME(3) NOT NULL COMMENT 'Transfer Time',
    tx_hash VARCHAR(191) NOT NULL COMMENT 'Transaction Hash',
    block_num BIGINT UNSIGNED NOT NULL COMMENT 'Block Number',
    updated_at DATETIME(3) DEFAULT NULL,
    deleted_at DATETIME(3) DEFAULT NULL,
    
    KEY idx_histories_asset_id (asset_id),
    KEY idx_histories_from_owner (from_owner),
    KEY idx_histories_to_owner (to_owner),
    KEY idx_histories_tx_hash (tx_hash),
    KEY idx_histories_block_num (block_num),
    KEY idx_histories_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Asset Ownership History Table';

-- ==================== Completed ====================

SELECT 'Database migration completed successfully!' AS status;
