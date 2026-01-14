package api

import (
	"chain-vault-backend/internal/model"
	"chain-vault-backend/internal/service"
	"net/http"
	"sync"
	
	"github.com/gin-gonic/gin"
)

var (
	reputationService *service.ReputationService
	reputationOnce    sync.Once
)

func getReputationService() *service.ReputationService {
	reputationOnce.Do(func() {
		reputationService = service.NewReputationService()
	})
	return reputationService
}

// GetUserReputation 获取用户信誉
func GetUserReputation(c *gin.Context) {
	userAddress := c.Param("address")
	if userAddress == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User address is required",
		})
		return
	}
	
	reputation, err := getReputationService().GetUserReputation(userAddress)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get user reputation: " + err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": reputation,
	})
}

// CreateReview 创建评价
func CreateReview(c *gin.Context) {
	var req struct {
		OrderID         uint64 `json:"orderId" binding:"required"`
		ReviewerAddress string `json:"reviewerAddress" binding:"required"`
		RevieweeAddress string `json:"revieweeAddress" binding:"required"`
		Role            string `json:"role" binding:"required"` // seller 或 buyer
		Rating          int    `json:"rating" binding:"required,min=1,max=5"`
		Comment         string `json:"comment"`
		Tags            string `json:"tags"` // JSON 数组字符串
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request: " + err.Error(),
		})
		return
	}
	
	review := &model.UserReview{
		OrderID:         req.OrderID,
		ReviewerAddress: req.ReviewerAddress,
		RevieweeAddress: req.RevieweeAddress,
		Role:            req.Role,
		Rating:          req.Rating,
		Comment:         req.Comment,
		Tags:            req.Tags,
	}
	
	if err := getReputationService().CreateReview(review); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create review: " + err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Review created successfully",
		"data":    review,
	})
}

// GetUserReviews 获取用户评价列表
func GetUserReviews(c *gin.Context) {
	userAddress := c.Param("address")
	role := c.Query("role") // seller 或 buyer，可选
	
	if userAddress == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User address is required",
		})
		return
	}
	
	reviews, err := getReputationService().GetUserReviews(userAddress, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get reviews: " + err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data":  reviews,
		"total": len(reviews),
	})
}
