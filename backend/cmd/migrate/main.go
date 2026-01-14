package main

import (
	"chain-vault-backend/internal/config"
	"chain-vault-backend/internal/database"
	"chain-vault-backend/internal/model"
	"fmt"
	"log"
)

func main() {
	// 加载配置
	cfg := config.Load()
	
	// 连接数据库
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	
	// 执行自动迁移（会添加新字段）
	db := database.GetDB()
	if err := db.AutoMigrate(&model.Asset{}); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
	
	fmt.Println("✅ 数据库迁移完成！")
	fmt.Println("✅ Images 字段已添加到 assets 表")
}

