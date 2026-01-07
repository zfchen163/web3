package repository

import (
	"chain-vault-backend/internal/database"
	"chain-vault-backend/internal/model"
	"errors"

	"gorm.io/gorm"
)

type HistoryRepository struct {
	db *gorm.DB
}

func NewHistoryRepository() *HistoryRepository {
	return &HistoryRepository{
		db: nil,
	}
}

func (r *HistoryRepository) ensureDB() error {
	if r.db == nil {
		r.db = database.GetDB()
		if r.db == nil {
			return errors.New("database connection is nil")
		}
	}
	return nil
}

func (r *HistoryRepository) Create(history *model.AssetOwnerHistory) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	return r.db.Create(history).Error
}

func (r *HistoryRepository) FindByAssetID(assetID uint64) ([]model.AssetOwnerHistory, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var histories []model.AssetOwnerHistory
	err := r.db.Where("asset_id = ?", assetID).
		Order("timestamp ASC").
		Find(&histories).Error
	return histories, err
}

func (r *HistoryRepository) FindByOwner(owner string, limit, offset int) ([]model.AssetOwnerHistory, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var histories []model.AssetOwnerHistory
	err := r.db.Where("owner = ?", owner).
		Order("timestamp DESC").
		Limit(limit).
		Offset(offset).
		Find(&histories).Error
	return histories, err
}


