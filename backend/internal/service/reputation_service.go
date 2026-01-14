package service

import (
	"chain-vault-backend/internal/model"
	"chain-vault-backend/internal/repository"
)

type ReputationService struct {
	repo *repository.ReputationRepository
}

func NewReputationService() *ReputationService {
	return &ReputationService{
		repo: repository.NewReputationRepository(),
	}
}

// GetUserReputation 获取用户信誉
func (s *ReputationService) GetUserReputation(userAddress string) (*model.UserReputation, error) {
	return s.repo.GetOrCreateReputation(userAddress)
}

// OnOrderCompleted 订单完成时更新信誉
func (s *ReputationService) OnOrderCompleted(sellerAddress, buyerAddress string) error {
	// 卖家：完成订单 +20 经验
	if err := s.repo.AddExperience(sellerAddress, 20); err != nil {
		return err
	}
	if err := s.repo.IncrementOrderCount(sellerAddress, "seller", true); err != nil {
		return err
	}
	
	// 买家：完成订单 +10 经验
	if err := s.repo.AddExperience(buyerAddress, 10); err != nil {
		return err
	}
	if err := s.repo.IncrementOrderCount(buyerAddress, "buyer", true); err != nil {
		return err
	}
	
	return nil
}

// OnOrderCancelled 订单取消时更新信誉
func (s *ReputationService) OnOrderCancelled(userAddress string) error {
	reputation, err := s.repo.GetOrCreateReputation(userAddress)
	if err != nil {
		return err
	}
	
	reputation.CancelledOrders++
	return s.repo.UpdateReputation(reputation)
}

// OnOrderRefunded 订单退款时更新信誉
func (s *ReputationService) OnOrderRefunded(sellerAddress string) error {
	// 卖家被退款：-20 经验
	if err := s.repo.AddExperience(sellerAddress, -20); err != nil {
		return err
	}
	
	reputation, err := s.repo.GetOrCreateReputation(sellerAddress)
	if err != nil {
		return err
	}
	
	reputation.RefundedOrders++
	return s.repo.UpdateReputation(reputation)
}

// CreateReview 创建评价
func (s *ReputationService) CreateReview(review *model.UserReview) error {
	// 创建评价记录
	if err := s.repo.CreateReview(review); err != nil {
		return err
	}
	
	// 更新被评价人的评分
	if err := s.repo.UpdateRating(review.RevieweeAddress, review.Role, float64(review.Rating)); err != nil {
		return err
	}
	
	// 如果是好评（4-5星），给被评价人 +5 经验
	if review.Rating >= 4 {
		if err := s.repo.AddExperience(review.RevieweeAddress, 5); err != nil {
			return err
		}
	}
	
	return nil
}

// GetUserReviews 获取用户评价列表
func (s *ReputationService) GetUserReviews(userAddress string, role string) ([]model.UserReview, error) {
	return s.repo.GetReviewsByUser(userAddress, role)
}
