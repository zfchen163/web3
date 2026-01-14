package model

import (
	"time"
	"gorm.io/gorm"
)

// UserReputation 用户信誉
type UserReputation struct {
	ID          uint64  `json:"id" gorm:"primaryKey"`
	UserAddress string  `json:"userAddress" gorm:"type:varchar(191);uniqueIndex;not null"`
	
	// 等级信息
	Level            int `json:"level" gorm:"default:1"`
	Stars            int `json:"stars" gorm:"default:0"`
	ExperiencePoints int `json:"experiencePoints" gorm:"default:0"`
	
	// 交易统计
	TotalOrders     int `json:"totalOrders" gorm:"default:0"`
	CompletedOrders int `json:"completedOrders" gorm:"default:0"`
	CancelledOrders int `json:"cancelledOrders" gorm:"default:0"`
	RefundedOrders  int `json:"refundedOrders" gorm:"default:0"`
	
	// 作为卖家的统计
	SellerOrders      int     `json:"sellerOrders" gorm:"default:0"`
	SellerCompleted   int     `json:"sellerCompleted" gorm:"default:0"`
	SellerRating      float64 `json:"sellerRating" gorm:"type:decimal(3,2);default:5.00"`
	SellerRatingCount int     `json:"sellerRatingCount" gorm:"default:0"`
	
	// 作为买家的统计
	BuyerOrders      int     `json:"buyerOrders" gorm:"default:0"`
	BuyerCompleted   int     `json:"buyerCompleted" gorm:"default:0"`
	BuyerRating      float64 `json:"buyerRating" gorm:"type:decimal(3,2);default:5.00"`
	BuyerRatingCount int     `json:"buyerRatingCount" gorm:"default:0"`
	
	// 信誉指标
	OnTimeDeliveryRate float64 `json:"onTimeDeliveryRate" gorm:"type:decimal(5,2);default:100.00"`
	ResponseTimeHours  float64 `json:"responseTimeHours" gorm:"type:decimal(10,2);default:24.00"`
	DisputeRate        float64 `json:"disputeRate" gorm:"type:decimal(5,2);default:0.00"`
	
	// 成就和徽章
	Badges       string `json:"badges" gorm:"type:json"`       // JSON 数组
	Achievements string `json:"achievements" gorm:"type:json"` // JSON 数组
	
	gorm.Model
}

// UserReview 用户评价
type UserReview struct {
	ID              uint64 `json:"id" gorm:"primaryKey"`
	OrderID         uint64 `json:"orderId" gorm:"index;not null"`
	ReviewerAddress string `json:"reviewerAddress" gorm:"type:varchar(191);index;not null"`
	RevieweeAddress string `json:"revieweeAddress" gorm:"type:varchar(191);index;not null"`
	Role            string `json:"role" gorm:"type:enum('seller','buyer');not null"` // seller 或 buyer
	
	// 评分
	Rating int `json:"rating" gorm:"not null"` // 1-5
	
	// 评价内容
	Comment string `json:"comment" gorm:"type:text"`
	
	// 评价标签
	Tags string `json:"tags" gorm:"type:json"` // JSON 数组
	
	gorm.Model
}

// LevelConfig 等级配置
type LevelConfig struct {
	ID       int    `json:"id" gorm:"primaryKey"`
	Level    int    `json:"level" gorm:"uniqueIndex;not null"`
	MinExp   int    `json:"minExp" gorm:"not null"`
	Stars    int    `json:"stars" gorm:"not null"`
	Title    string `json:"title" gorm:"type:varchar(50);not null"`
	Benefits string `json:"benefits" gorm:"type:json"`
	
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// GetLevelTitle 获取等级称号
func GetLevelTitle(level int) string {
	titles := map[int]string{
		1:  "🆕 新手",
		2:  "🥉 铜牌会员",
		3:  "🥉 铜牌精英",
		4:  "🥈 银牌会员",
		5:  "🥈 银牌精英",
		6:  "🥇 金牌会员",
		7:  "🥇 金牌精英",
		8:  "💎 白金会员",
		9:  "💎 白金精英",
		10: "👑 钻石会员",
	}
	if title, ok := titles[level]; ok {
		return title
	}
	return "新手"
}

// GetStarsDisplay 获取星级显示
func GetStarsDisplay(stars int) string {
	result := ""
	for i := 0; i < stars; i++ {
		result += "⭐"
	}
	return result
}

// CalculateLevel 根据经验值计算等级
func CalculateLevel(exp int) (level int, stars int) {
	levelConfigs := []struct {
		level  int
		minExp int
		stars  int
	}{
		{10, 5500, 5},
		{9, 4000, 4},
		{8, 3000, 4},
		{7, 2200, 3},
		{6, 1500, 3},
		{5, 1000, 2},
		{4, 600, 2},
		{3, 300, 1},
		{2, 100, 1},
		{1, 0, 0},
	}
	
	for _, config := range levelConfigs {
		if exp >= config.minExp {
			return config.level, config.stars
		}
	}
	
	return 1, 0
}
