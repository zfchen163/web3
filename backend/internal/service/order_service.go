package service

import (
	"chain-vault-backend/internal/model"
	"chain-vault-backend/internal/repository"
	"time"
)

type OrderService struct {
	repo *repository.OrderRepository
}

func NewOrderService() *OrderService {
	return &OrderService{
		repo: repository.NewOrderRepository(),
	}
}

func (s *OrderService) CreateOrder(orderID, assetID uint64, seller, buyer, price, txHash string, blockNum uint64, status model.OrderStatus) error {
	now := time.Now()
	order := &model.Order{
		ID:             orderID,
		AssetID:        assetID,
		Seller:         seller,
		Buyer:          buyer,
		Price:          price,
		Status:         status,
		OrderCreatedAt: now,
		TxHash:         txHash,
		BlockNum:       blockNum,
	}
	
	// 根据状态设置时间戳
	if status == model.OrderPaid {
		order.PaidAt = &now
		refundDeadline := now.Add(7 * 24 * time.Hour)
		order.RefundDeadline = &refundDeadline
	}
	
	return s.repo.Create(order)
}

func (s *OrderService) GetOrder(id uint64) (*model.Order, error) {
	return s.repo.FindByID(id)
}

func (s *OrderService) GetOrdersByAsset(assetID uint64) ([]model.Order, error) {
	return s.repo.FindByAssetID(assetID)
}

func (s *OrderService) GetOrdersByBuyer(buyer string, limit, offset int) ([]model.Order, error) {
	return s.repo.FindByBuyer(buyer, limit, offset)
}

func (s *OrderService) GetOrdersBySeller(seller string, limit, offset int) ([]model.Order, error) {
	return s.repo.FindBySeller(seller, limit, offset)
}

func (s *OrderService) GetOrdersByUser(user string, limit, offset int) ([]model.Order, error) {
	return s.repo.FindByUser(user, limit, offset)
}

func (s *OrderService) UpdateOrderStatus(orderID uint64, status model.OrderStatus) error {
	return s.repo.UpdateStatus(orderID, status)
}

func (s *OrderService) GetTotalCount() (int64, error) {
	return s.repo.Count()
}

func (s *OrderService) GetCountByStatus(status model.OrderStatus) (int64, error) {
	return s.repo.CountByStatus(status)
}


