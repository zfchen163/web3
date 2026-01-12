package database

import (
	"chain-vault-backend/internal/model"
	"fmt"
	"log"

	"strings"

	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(databaseURL string) error {
	var err error
	
	var dialector gorm.Dialector
	if strings.Contains(databaseURL, "@tcp") || strings.Contains(databaseURL, "@udp") || strings.Contains(databaseURL, "@unix") {
		dialector = mysql.Open(databaseURL)
	} else {
		// Assume SQLite for file paths or simple strings
		dialector = sqlite.Open(databaseURL)
	}

	DB, err = gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// 自动迁移（包括新添加的 Images 字段）
	if err := DB.AutoMigrate(
		&model.Asset{},
		&model.Brand{},
		&model.Order{},
		&model.AssetOwnerHistory{},
	); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database connected and migrated successfully")
	return nil
}

func GetDB() *gorm.DB {
	return DB
}

