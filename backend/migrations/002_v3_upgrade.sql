-- V3 升级脚本：添加品牌、订单、历史记录等表

-- 品牌表
CREATE TABLE IF NOT EXISTS brands (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    brand_address VARCHAR(42) UNIQUE NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    is_authorized BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMP NOT NULL,
    tx_hash VARCHAR(66),
    block_num BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_brand_address (brand_address),
    INDEX idx_tx_hash (tx_hash),
    INDEX idx_block_num (block_num)
);

-- 升级资产表
ALTER TABLE assets 
ADD COLUMN brand VARCHAR(42) AFTER owner,
ADD COLUMN serial_number VARCHAR(255) UNIQUE NOT NULL AFTER name,
ADD COLUMN metadata_uri TEXT AFTER serial_number,
ADD COLUMN status TINYINT DEFAULT 0 AFTER metadata_uri,
ADD COLUMN is_listed BOOLEAN DEFAULT FALSE AFTER status,
ADD COLUMN price VARCHAR(78) DEFAULT '0' AFTER is_listed,
ADD INDEX idx_brand (brand),
ADD INDEX idx_serial_number (serial_number),
ADD INDEX idx_status (status);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    asset_id BIGINT NOT NULL,
    seller VARCHAR(42) NOT NULL,
    buyer VARCHAR(42) NOT NULL,
    price VARCHAR(78) NOT NULL,
    status TINYINT DEFAULT 0,
    order_created_at TIMESTAMP NOT NULL,
    paid_at TIMESTAMP NULL,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    can_refund BOOLEAN DEFAULT TRUE,
    refund_deadline TIMESTAMP NULL,
    tx_hash VARCHAR(66) NOT NULL,
    block_num BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_asset_id (asset_id),
    INDEX idx_seller (seller),
    INDEX idx_buyer (buyer),
    INDEX idx_status (status),
    INDEX idx_tx_hash (tx_hash),
    INDEX idx_block_num (block_num),
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);

-- 资产所有权历史表
CREATE TABLE IF NOT EXISTS asset_owner_histories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    asset_id BIGINT NOT NULL,
    owner VARCHAR(42) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    block_num BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_asset_id (asset_id),
    INDEX idx_owner (owner),
    INDEX idx_tx_hash (tx_hash),
    INDEX idx_block_num (block_num),
    FOREIGN KEY (asset_id) REFERENCES assets(id)
);

