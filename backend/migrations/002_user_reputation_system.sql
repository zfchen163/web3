-- 用户信誉系统数据库表

-- 用户信誉表
CREATE TABLE IF NOT EXISTS user_reputations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_address VARCHAR(191) NOT NULL UNIQUE COMMENT '用户地址',
    
    -- 等级信息
    level INT DEFAULT 1 COMMENT '用户等级 (1-10)',
    stars INT DEFAULT 0 COMMENT '星级 (0-5)',
    experience_points INT DEFAULT 0 COMMENT '经验值',
    
    -- 交易统计
    total_orders INT DEFAULT 0 COMMENT '总订单数',
    completed_orders INT DEFAULT 0 COMMENT '完成的订单数',
    cancelled_orders INT DEFAULT 0 COMMENT '取消的订单数',
    refunded_orders INT DEFAULT 0 COMMENT '退款的订单数',
    
    -- 作为卖家的统计
    seller_orders INT DEFAULT 0 COMMENT '作为卖家的订单数',
    seller_completed INT DEFAULT 0 COMMENT '作为卖家完成的订单数',
    seller_rating DECIMAL(3,2) DEFAULT 5.00 COMMENT '卖家评分 (0-5)',
    seller_rating_count INT DEFAULT 0 COMMENT '卖家评分次数',
    
    -- 作为买家的统计
    buyer_orders INT DEFAULT 0 COMMENT '作为买家的订单数',
    buyer_completed INT DEFAULT 0 COMMENT '作为买家完成的订单数',
    buyer_rating DECIMAL(3,2) DEFAULT 5.00 COMMENT '买家评分 (0-5)',
    buyer_rating_count INT DEFAULT 0 COMMENT '买家评分次数',
    
    -- 信誉指标
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 100.00 COMMENT '准时发货率 (%)',
    response_time_hours DECIMAL(10,2) DEFAULT 24.00 COMMENT '平均响应时间 (小时)',
    dispute_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '纠纷率 (%)',
    
    -- 成就和徽章
    badges JSON COMMENT '徽章列表 JSON',
    achievements JSON COMMENT '成就列表 JSON',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_user_address (user_address),
    INDEX idx_level (level),
    INDEX idx_stars (stars)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户信誉表';

-- 用户评价表
CREATE TABLE IF NOT EXISTS user_reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
    reviewer_address VARCHAR(191) NOT NULL COMMENT '评价人地址',
    reviewee_address VARCHAR(191) NOT NULL COMMENT '被评价人地址',
    role ENUM('seller', 'buyer') NOT NULL COMMENT '被评价人角色',
    
    -- 评分
    rating INT NOT NULL COMMENT '评分 (1-5)',
    
    -- 评价内容
    comment TEXT COMMENT '评价内容',
    
    -- 评价标签
    tags JSON COMMENT '评价标签 ["准时发货", "商品如描述", "态度友好"]',
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_order_id (order_id),
    INDEX idx_reviewer (reviewer_address),
    INDEX idx_reviewee (reviewee_address),
    INDEX idx_role (role),
    INDEX idx_rating (rating),
    
    UNIQUE KEY unique_review (order_id, reviewer_address, role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户评价表';

-- 用户等级配置表
CREATE TABLE IF NOT EXISTS level_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level INT NOT NULL UNIQUE COMMENT '等级',
    min_exp INT NOT NULL COMMENT '所需最小经验值',
    stars INT NOT NULL COMMENT '对应星级',
    title VARCHAR(50) NOT NULL COMMENT '等级称号',
    benefits JSON COMMENT '等级权益',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户等级配置表';

-- 插入等级配置数据
INSERT INTO level_configs (level, min_exp, stars, title, benefits) VALUES
(1, 0, 0, '新手', '{"max_listings": 5, "fee_discount": 0}'),
(2, 100, 1, '铜牌会员', '{"max_listings": 10, "fee_discount": 5}'),
(3, 300, 1, '铜牌精英', '{"max_listings": 15, "fee_discount": 8}'),
(4, 600, 2, '银牌会员', '{"max_listings": 25, "fee_discount": 10}'),
(5, 1000, 2, '银牌精英', '{"max_listings": 40, "fee_discount": 12}'),
(6, 1500, 3, '金牌会员', '{"max_listings": 60, "fee_discount": 15}'),
(7, 2200, 3, '金牌精英', '{"max_listings": 80, "fee_discount": 18}'),
(8, 3000, 4, '白金会员', '{"max_listings": 100, "fee_discount": 20}'),
(9, 4000, 4, '白金精英', '{"max_listings": 150, "fee_discount": 22}'),
(10, 5500, 5, '钻石会员', '{"max_listings": 999, "fee_discount": 25}');

-- 经验值获取规则（注释说明）
-- 完成订单（买家）: +10 经验
-- 完成订单（卖家）: +20 经验
-- 收到好评: +5 经验
-- 准时发货: +3 经验
-- 首次验证资产: +50 经验
-- 连续10单无纠纷: +100 经验
-- 被投诉/退款: -20 经验
