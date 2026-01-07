package repository

import (
	"chain-vault-backend/internal/database"
	"chain-vault-backend/internal/model"
	"errors"

	"gorm.io/gorm"
)

type OrderRepository struct {
	db *gorm.DB
}

func NewOrderRepository() *OrderRepository {
	return &OrderRepository{
		db: nil,
	}
}

func (r *OrderRepository) ensureDB() error {
	if r.db == nil {
		r.db = database.GetDB()
		if r.db == nil {
			return errors.New("database connection is nil")
		}
	}
	return nil
}

func (r *OrderRepository) Create(order *model.Order) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	return r.db.Create(order).Error
}

func (r *OrderRepository) FindByID(id uint64) (*model.Order, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var order model.Order
	err := r.db.First(&order, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &order, err
}

func (r *OrderRepository) FindByAssetID(assetID uint64) ([]model.Order, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var orders []model.Order
	err := r.db.Where("asset_id = ?", assetID).
		Order("order_created_at DESC").
		Find(&orders).Error
	return orders, err
}

func (r *OrderRepository) FindByBuyer(buyer string, limit, offset int) ([]model.Order, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var orders []model.Order
	err := r.db.Where("buyer = ?", buyer).
		Order("order_created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&orders).Error
	return orders, err
}

func (r *OrderRepository) FindBySeller(seller string, limit, offset int) ([]model.Order, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var orders []model.Order
	err := r.db.Where("seller = ?", seller).
		Order("order_created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&orders).Error
	return orders, err
}

func (r *OrderRepository) FindByUser(user string, limit, offset int) ([]model.Order, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	var orders []model.Order
	err := r.db.Where("buyer = ? OR seller = ?", user, user).
		Order("order_created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&orders).Error
	return orders, err
}

func (r *OrderRepository) UpdateStatus(orderID uint64, status model.OrderStatus) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	return r.db.Model(&model.Order{}).
		Where("id = ?", orderID).
		Update("status", status).Error
}

func (r *OrderRepository) Count() (int64, error) {
	if err := r.ensureDB(); err != nil {
		return 0, err
	}
	var count int64
	err := r.db.Model(&model.Order{}).Count(&count).Error
	return count, err
}

func (r *OrderRepository) CountByStatus(status model.OrderStatus) (int64, error) {
	if err := r.ensureDB(); err != nil {
		return 0, err
	}
	var count int64
	err := r.db.Model(&model.Order{}).Where("status = ?", status).Count(&count).Error
	return count, err
}


