-- 数据库初始化脚本（可选，GORM 会自动创建表）
-- 如果需要手动创建，可以使用这个脚本

CREATE DATABASE IF NOT EXISTS chainvault;

-- GORM 会自动创建表结构，但如果你想手动创建：

CREATE TABLE IF NOT EXISTS assets (
    id BIGINT PRIMARY KEY,
    owner VARCHAR(42) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    block_num BIGINT NOT NULL,
    created_at_gorm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_owner (owner),
    INDEX idx_tx_hash (tx_hash),
    INDEX idx_block_num (block_num)
);

