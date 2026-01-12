package repository

import (
	"chain-vault-backend/internal/database"
	"chain-vault-backend/internal/model"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type AssetRepository struct {
	db *gorm.DB
}

func NewAssetRepository() *AssetRepository {
	return &AssetRepository{
		db: nil, // 延迟初始化，在第一次使用时获取
	}
}

func (r *AssetRepository) ensureDB() error {
	if r.db == nil {
		r.db = database.GetDB()
		if r.db == nil {
			return errors.New("database connection is nil")
		}
	}
	return nil
}

func (r *AssetRepository) Create(asset *model.Asset) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	return r.db.Create(asset).Error
}

func (r *AssetRepository) FindByID(id uint64) (*model.Asset, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var asset model.Asset
	err := r.db.First(&asset, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &asset, err
}

func (r *AssetRepository) FindAll(limit, offset int) ([]model.Asset, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var assets []model.Asset
	// 排序：1. 已上架的优先 2. 按更新时间倒序 3. 按创建时间倒序
	err := r.db.Order("is_listed DESC, updated_at DESC, created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&assets).Error
	return assets, err
}

func (r *AssetRepository) Count() (int64, error) {
	if err := r.ensureDB(); err != nil {
		return 0, err
	}
	var count int64
	err := r.db.Model(&model.Asset{}).Count(&count).Error
	return count, err
}

func (r *AssetRepository) FindByOwner(owner string, limit, offset int) ([]model.Asset, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var assets []model.Asset
	err := r.db.Where("LOWER(owner) = LOWER(?)", owner).
		Order("is_listed DESC, updated_at DESC, created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&assets).Error
	return assets, err
}

func (r *AssetRepository) FindByTxHash(txHash string) (*model.Asset, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var asset model.Asset
	err := r.db.Where("tx_hash = ?", txHash).First(&asset).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &asset, err
}

// CountByOwner 统计特定所有者的资产数量
func (r *AssetRepository) CountByOwner(owner string) (int64, error) {
	if err := r.ensureDB(); err != nil {
		return 0, err
	}
	var count int64
	err := r.db.Model(&model.Asset{}).Where("LOWER(owner) = LOWER(?)", owner).Count(&count).Error
	return count, err
}

// GetTopOwners 获取资产数量最多的前N个所有者
func (r *AssetRepository) GetTopOwners(limit int) ([]map[string]interface{}, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var results []map[string]interface{}
	err := r.db.Model(&model.Asset{}).
		Select("owner, COUNT(*) as count").
		Group("owner").
		Order("count DESC").
		Limit(limit).
		Scan(&results).Error
	return results, err
}

// GetAssetsByDateRange 按日期范围查询资产
func (r *AssetRepository) GetAssetsByDateRange(startDate, endDate string, limit, offset int) ([]model.Asset, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var assets []model.Asset
	query := r.db.Model(&model.Asset{})
	
	if startDate != "" {
		query = query.Where("DATE(created_at) >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("DATE(created_at) <= ?", endDate)
	}
	
	err := query.Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&assets).Error
	return assets, err
}

// GetDailyStats 获取每日注册统计
func (r *AssetRepository) GetDailyStats(days int) ([]map[string]interface{}, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var results []map[string]interface{}
	err := r.db.Model(&model.Asset{}).
		Select("DATE(created_at) as date, COUNT(*) as count").
		Where("created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)", days).
		Group("DATE(created_at)").
		Order("date DESC").
		Scan(&results).Error
	return results, err
}

// UpdateOwner 更新资产所有者（用于处理转移事件）
func (r *AssetRepository) UpdateOwner(assetID uint64, newOwner string, txHash string, blockNum uint64) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	
	// 检查资产是否存在
	var asset model.Asset
	if err := r.db.First(&asset, assetID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 如果资产不存在，可能是先收到转移事件，后收到注册事件
			// 这种情况下先记录日志，等待注册事件
			return fmt.Errorf("asset %d not found, waiting for registration event", assetID)
		}
		return err
	}
	
	// 更新所有者
	return r.db.Model(&asset).Updates(map[string]interface{}{
		"owner":     newOwner,
		"tx_hash":   txHash,
		"block_num": blockNum,
	}).Error
}

// FindBySerialNumber 通过序列号查找资产
func (r *AssetRepository) FindBySerialNumber(serialNumber string) (*model.Asset, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var asset model.Asset
	err := r.db.Where("serial_number = ?", serialNumber).First(&asset).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &asset, err
}

// FindByBrand 查找品牌的所有资产
func (r *AssetRepository) FindByBrand(brand string, limit, offset int) ([]model.Asset, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var assets []model.Asset
	err := r.db.Where("brand = ?", brand).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&assets).Error
	return assets, err
}

// FindListed 查找所有在售资产
func (r *AssetRepository) FindListed(limit, offset int) ([]model.Asset, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var assets []model.Asset
	// 市场列表：按最近上架时间排序
	err := r.db.Where("is_listed = ?", true).
		Order("updated_at DESC, created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&assets).Error
	return assets, err
}

// CountListed 统计在售资产数量
func (r *AssetRepository) CountListed() (int64, error) {
	if err := r.ensureDB(); err != nil {
		return 0, err
	}
	var count int64
	err := r.db.Model(&model.Asset{}).Where("is_listed = ?", true).Count(&count).Error
	return count, err
}

// FindByStatus 按验证状态查找资产
func (r *AssetRepository) FindByStatus(status model.VerificationStatus, limit, offset int) ([]model.Asset, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var assets []model.Asset
	err := r.db.Where("status = ?", status).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&assets).Error
	return assets, err
}

// Search 搜索资产（按名称或序列号）
func (r *AssetRepository) Search(keyword string, limit, offset int) ([]model.Asset, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var assets []model.Asset
	err := r.db.Where("name LIKE ? OR serial_number LIKE ?", "%"+keyword+"%", "%"+keyword+"%").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&assets).Error
	return assets, err
}

// UpdateListingStatus 更新上架状态
func (r *AssetRepository) UpdateListingStatus(assetID uint64, isListed bool, price string) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	return r.db.Model(&model.Asset{}).
		Where("id = ?", assetID).
		Updates(map[string]interface{}{
			"is_listed": isListed,
			"price":     price,
		}).Error
}

// UpdateVerificationStatus 更新验证状态
func (r *AssetRepository) UpdateVerificationStatus(assetID uint64, status model.VerificationStatus, brand string) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	updates := map[string]interface{}{
		"status": status,
	}
	if brand != "" {
		updates["brand"] = brand
	}
	return r.db.Model(&model.Asset{}).
		Where("id = ?", assetID).
		Updates(updates).Error
}

// UpdateImages 更新资产的图片
func (r *AssetRepository) UpdateImages(assetID uint64, imagesJSON string) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	result := r.db.Model(&model.Asset{}).
		Where("id = ?", assetID).
		Update("images", imagesJSON)
	
	if result.Error != nil {
		return result.Error
	}
	
	if result.RowsAffected == 0 {
		return fmt.Errorf("asset %d not found", assetID)
	}
	
	return nil
}
