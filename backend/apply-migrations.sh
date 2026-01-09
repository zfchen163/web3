#!/bin/bash

echo "=========================================="
echo "📊 执行数据库迁移"
echo "=========================================="
echo ""

# 数据库连接信息
DB_HOST="127.0.0.1"
DB_PORT="3306"
DB_NAME="chainvault"
DB_USER="chainvault"
DB_PASS="chainvault"

# 检查 MySQL 客户端
if ! command -v mysql &> /dev/null; then
    echo "❌ 未安装 mysql 客户端"
    echo ""
    echo "请使用以下方式之一安装："
    echo "1. Homebrew: brew install mysql-client"
    echo "2. 或使用 Docker 容器内的 mysql："
    echo "   docker exec -i chainvault-db mysql -u chainvault -pchainvault chainvault < migrations/001_complete_schema.sql"
    exit 1
fi

# 检查数据库连接
echo "1️⃣  检查数据库连接..."
if mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS -e "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ 数据库连接成功"
else
    echo "❌ 数据库连接失败"
    echo ""
    echo "请确保："
    echo "1. MySQL 容器正在运行: docker ps | grep mysql"
    echo "2. 端口 3306 已映射"
    echo "3. 数据库凭据正确"
    exit 1
fi
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 执行迁移
echo "2️⃣  执行数据库迁移..."
echo ""

# 迁移 1: 完整的表结构
if [ -f "migrations/001_complete_schema.sql" ]; then
    echo "   执行: 001_complete_schema.sql"
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME < migrations/001_complete_schema.sql
    if [ $? -eq 0 ]; then
        echo "   ✅ 完成"
    else
        echo "   ❌ 失败"
        exit 1
    fi
else
    echo "   ⚠️  文件不存在: migrations/001_complete_schema.sql"
fi

echo ""
echo "3️⃣  验证表结构..."
echo ""

# 验证 assets 表
echo "   📋 Assets 表字段："
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME -e "DESCRIBE assets;" 2>/dev/null | sed 's/^/      /'

echo ""
echo "   📋 Brands 表："
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME -e "SHOW TABLES LIKE 'brands';" 2>/dev/null | sed 's/^/      /'

echo ""
echo "   📋 Orders 表："
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME -e "SHOW TABLES LIKE 'orders';" 2>/dev/null | sed 's/^/      /'

echo ""
echo "   📋 Asset Owner Histories 表："
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME -e "SHOW TABLES LIKE 'asset_owner_histories';" 2>/dev/null | sed 's/^/      /'

echo ""
echo "4️⃣  显示所有表..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME -e "SHOW TABLES;" 2>/dev/null | sed 's/^/   /'

echo ""
echo "=========================================="
echo "🎉 迁移完成！"
echo "=========================================="
echo ""
echo "现在数据库包含以下表："
echo "  ✅ assets - 资产表（已更新字段）"
echo "  ✅ brands - 品牌表"
echo "  ✅ orders - 订单表"
echo "  ✅ asset_owner_histories - 所有权历史表"
echo ""
echo "可以重启后端服务了："
echo "  cd /Users/h/practice/web3/chain-vault/backend"
echo "  go run cmd/api/main.go"
echo ""

