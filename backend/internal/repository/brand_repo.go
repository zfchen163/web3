package repository

import (
	"chain-vault-backend/internal/database"
	"chain-vault-backend/internal/model"
	"errors"

	"gorm.io/gorm"
)

type BrandRepository struct {
	db *gorm.DB
}

func NewBrandRepository() *BrandRepository {
	return &BrandRepository{
		db: nil,
	}
}

func (r *BrandRepository) ensureDB() error {
	if r.db == nil {
		r.db = database.GetDB()
		if r.db == nil {
			return errors.New("database connection is nil")
		}
	}
	return nil
}

func (r *BrandRepository) Create(brand *model.Brand) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	return r.db.Create(brand).Error
}

func (r *BrandRepository) FindByAddress(address string) (*model.Brand, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var brand model.Brand
	err := r.db.Where("brand_address = ?", address).First(&brand).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &brand, err
}

func (r *BrandRepository) FindAll(limit, offset int) ([]model.Brand, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var brands []model.Brand
	err := r.db.Order("registered_at DESC").Limit(limit).Offset(offset).Find(&brands).Error
	return brands, err
}

func (r *BrandRepository) FindAuthorized() ([]model.Brand, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var brands []model.Brand
	err := r.db.Where("is_authorized = ?", true).Find(&brands).Error
	return brands, err
}

func (r *BrandRepository) UpdateAuthorization(address string, authorized bool) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	return r.db.Model(&model.Brand{}).
		Where("brand_address = ?", address).
		Update("is_authorized", authorized).Error
}

func (r *BrandRepository) Count() (int64, error) {
	if err := r.ensureDB(); err != nil {
		return 0, err
	}
	var count int64
	err := r.db.Model(&model.Brand{}).Count(&count).Error
	return count, err
}


