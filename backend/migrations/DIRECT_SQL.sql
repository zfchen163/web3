-- 如果脚本执行失败，可以在 DBeaver 中直接执行此 SQL
-- 复制以下所有内容，在 DBeaver SQL 编辑器中执行

USE chainvault;

-- ==================== Assets 表 ====================
-- 添加缺失的字段到 assets 表

-- 品牌相关
ALTER TABLE assets ADD COLUMN IF NOT EXISTS brand VARCHAR(191) DEFAULT '' COMMENT '品牌方地址';

-- 序列号和元数据
ALTER TABLE assets ADD COLUMN IF NOT EXISTS serial_number VARCHAR(191) NOT NULL DEFAULT '' COMMENT '序列号（唯一）';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS metadata_uri TEXT COMMENT '元数据 URI (IPFS)';

-- 图片存储（base64）
ALTER TABLE assets ADD COLUMN IF NOT EXISTS images JSON COMMENT 'Base64 编码的图片数组（JSON 格式）';

-- 验证状态
ALTER TABLE assets ADD COLUMN IF NOT EXISTS status TINYINT DEFAULT 0 COMMENT '验证状态: 0=待验证, 1=已验证, 2=已拒绝';

-- 上架信息
ALTER TABLE assets ADD COLUMN IF NOT EXISTS is_listed TINYINT(1) DEFAULT 0 COMMENT '是否上架';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS price VARCHAR(191) DEFAULT '0' COMMENT '价格（wei 字符串）';

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_assets_brand ON assets(brand);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_serial_number ON assets(serial_number);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_is_listed ON assets(is_listed);

-- ==================== Brands 表 ====================
-- 品牌管理表

CREATE TABLE IF NOT EXISTS brands (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    address VARCHAR(191) NOT NULL COMMENT '品牌方地址',
    name VARCHAR(191) NOT NULL COMMENT '品牌名称',
    is_authorized TINYINT(1) DEFAULT 0 COMMENT '是否已授权',
    created_at DATETIME(3) NOT NULL,
    tx_hash VARCHAR(191) NOT NULL COMMENT '注册交易哈希',
    block_num BIGINT UNSIGNED NOT NULL COMMENT '注册区块号',
    updated_at DATETIME(3) DEFAULT NULL,
    deleted_at DATETIME(3) DEFAULT NULL,
    
    UNIQUE KEY idx_brands_address (address),
    KEY idx_brands_tx_hash (tx_hash),
    KEY idx_brands_block_num (block_num),
    KEY idx_brands_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='品牌管理表';

-- ==================== Orders 表 ====================
-- 订单管理表

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL COMMENT '链上订单 ID',
    asset_id BIGINT UNSIGNED NOT NULL COMMENT '资产 ID',
    seller VARCHAR(191) NOT NULL COMMENT '卖家地址',
    buyer VARCHAR(191) NOT NULL COMMENT '买家地址',
    price VARCHAR(191) NOT NULL COMMENT '价格（wei 字符串）',
    platform_fee VARCHAR(191) DEFAULT '0' COMMENT '平台费用（wei 字符串）',
    status TINYINT DEFAULT 0 COMMENT '订单状态: 0=待支付, 1=已支付, 2=已发货, 3=已完成, 4=已取消, 5=退款中, 6=已退款',
    created_at DATETIME(3) NOT NULL,
    paid_at DATETIME(3) DEFAULT NULL COMMENT '支付时间',
    shipped_at DATETIME(3) DEFAULT NULL COMMENT '发货时间',
    delivered_at DATETIME(3) DEFAULT NULL COMMENT '确认收货时间',
    completed_at DATETIME(3) DEFAULT NULL COMMENT '完成时间',
    cancelled_at DATETIME(3) DEFAULT NULL COMMENT '取消时间',
    tx_hash VARCHAR(191) NOT NULL COMMENT '创建交易哈希',
    block_num BIGINT UNSIGNED NOT NULL COMMENT '创建区块号',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='订单管理表';

-- ==================== Asset Owner History 表 ====================
-- 资产所有权历史记录表

CREATE TABLE IF NOT EXISTS asset_owner_histories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    asset_id BIGINT UNSIGNED NOT NULL COMMENT '资产 ID',
    from_owner VARCHAR(191) NOT NULL COMMENT '原所有者地址',
    to_owner VARCHAR(191) NOT NULL COMMENT '新所有者地址',
    transfer_type VARCHAR(50) DEFAULT 'transfer' COMMENT '转移类型: transfer, sale, gift',
    price VARCHAR(191) DEFAULT '0' COMMENT '交易价格（如果是销售）',
    created_at DATETIME(3) NOT NULL COMMENT '转移时间',
    tx_hash VARCHAR(191) NOT NULL COMMENT '交易哈希',
    block_num BIGINT UNSIGNED NOT NULL COMMENT '区块号',
    updated_at DATETIME(3) DEFAULT NULL,
    deleted_at DATETIME(3) DEFAULT NULL,
    
    KEY idx_histories_asset_id (asset_id),
    KEY idx_histories_from_owner (from_owner),
    KEY idx_histories_to_owner (to_owner),
    KEY idx_histories_tx_hash (tx_hash),
    KEY idx_histories_block_num (block_num),
    KEY idx_histories_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='资产所有权历史记录表';

-- ==================== 完成 ====================

SELECT 'Database migration completed successfully!' AS status;

-- 验证结果
SHOW TABLES;
DESCRIBE assets;

