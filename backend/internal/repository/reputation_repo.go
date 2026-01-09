package repository

import (
	"chain-vault-backend/internal/database"
	"chain-vault-backend/internal/model"
	"errors"
	
	"gorm.io/gorm"
)

type ReputationRepository struct {
	db *gorm.DB
}

func NewReputationRepository() *ReputationRepository {
	return &ReputationRepository{
		db: nil,
	}
}

func (r *ReputationRepository) ensureDB() error {
	if r.db == nil {
		r.db = database.GetDB()
		if r.db == nil {
			return errors.New("database connection is nil")
		}
	}
	return nil
}

// GetOrCreateReputation 获取或创建用户信誉记录
func (r *ReputationRepository) GetOrCreateReputation(userAddress string) (*model.UserReputation, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	
	var reputation model.UserReputation
	err := r.db.Where("user_address = ?", userAddress).First(&reputation).Error
	
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// 创建新记录
		reputation = model.UserReputation{
			UserAddress:        userAddress,
			Level:              1,
			Stars:              0,
			ExperiencePoints:   0,
			SellerRating:       5.00,
			BuyerRating:        5.00,
			OnTimeDeliveryRate: 100.00,
			ResponseTimeHours:  24.00,
			DisputeRate:        0.00,
		}
		if err := r.db.Create(&reputation).Error; err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	
	return &reputation, nil
}

// UpdateReputation 更新用户信誉
func (r *ReputationRepository) UpdateReputation(reputation *model.UserReputation) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	return r.db.Save(reputation).Error
}

// AddExperience 添加经验值
func (r *ReputationRepository) AddExperience(userAddress string, exp int) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	
	reputation, err := r.GetOrCreateReputation(userAddress)
	if err != nil {
		return err
	}
	
	reputation.ExperiencePoints += exp
	
	// 重新计算等级和星级
	level, stars := model.CalculateLevel(reputation.ExperiencePoints)
	reputation.Level = level
	reputation.Stars = stars
	
	return r.UpdateReputation(reputation)
}

// IncrementOrderCount 增加订单计数
func (r *ReputationRepository) IncrementOrderCount(userAddress string, role string, completed bool) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	
	reputation, err := r.GetOrCreateReputation(userAddress)
	if err != nil {
		return err
	}
	
	reputation.TotalOrders++
	if completed {
		reputation.CompletedOrders++
	}
	
	if role == "seller" {
		reputation.SellerOrders++
		if completed {
			reputation.SellerCompleted++
		}
	} else if role == "buyer" {
		reputation.BuyerOrders++
		if completed {
			reputation.BuyerCompleted++
		}
	}
	
	return r.UpdateReputation(reputation)
}

// CreateReview 创建评价
func (r *ReputationRepository) CreateReview(review *model.UserReview) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	return r.db.Create(review).Error
}

// GetReviewsByUser 获取用户的所有评价
func (r *ReputationRepository) GetReviewsByUser(userAddress string, role string) ([]model.UserReview, error) {
	if err := r.ensureDB(); err != nil {
		return nil, err
	}
	
	var reviews []model.UserReview
	query := r.db.Where("reviewee_address = ?", userAddress)
	if role != "" {
		query = query.Where("role = ?", role)
	}
	err := query.Order("created_at DESC").Find(&reviews).Error
	return reviews, err
}

// UpdateRating 更新用户评分
func (r *ReputationRepository) UpdateRating(userAddress string, role string, rating float64) error {
	if err := r.ensureDB(); err != nil {
		return err
	}
	
	reputation, err := r.GetOrCreateReputation(userAddress)
	if err != nil {
		return err
	}
	
	if role == "seller" {
		// 计算新的平均评分
		totalRating := reputation.SellerRating * float64(reputation.SellerRatingCount)
		reputation.SellerRatingCount++
		reputation.SellerRating = (totalRating + rating) / float64(reputation.SellerRatingCount)
	} else if role == "buyer" {
		totalRating := reputation.BuyerRating * float64(reputation.BuyerRatingCount)
		reputation.BuyerRatingCount++
		reputation.BuyerRating = (totalRating + rating) / float64(reputation.BuyerRatingCount)
	}
	
	return r.UpdateReputation(reputation)
}
