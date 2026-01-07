package api

import (
	"net/http"
	"strconv"
	"sync"

	"chain-vault-backend/internal/service"
	"github.com/gin-gonic/gin"
)

var (
	brandService     *service.BrandService
	brandServiceOnce sync.Once
)

func getBrandService() *service.BrandService {
	brandServiceOnce.Do(func() {
		brandService = service.NewBrandService()
	})
	return brandService
}

// ListBrands 获取品牌列表
func ListBrands(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	authorizedOnly := c.Query("authorized") == "true"

	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	offset, _ := strconv.Atoi(offsetStr)
	if offset < 0 {
		offset = 0
	}

	var brands interface{}
	var err error

	if authorizedOnly {
		brands, err = getBrandService().ListAuthorizedBrands()
	} else {
		brands, err = getBrandService().ListBrands(limit, offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch brands",
		})
		return
	}

	total, _ := getBrandService().GetTotalCount()

	c.JSON(http.StatusOK, gin.H{
		"data":   brands,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetBrand 获取品牌详情
func GetBrand(c *gin.Context) {
	address := c.Param("address")

	brand, err := getBrandService().GetBrand(address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch brand",
		})
		return
	}

	if brand == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Brand not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": brand,
	})
}

// AuthorizeBrand 授权品牌（管理员功能）
func AuthorizeBrand(c *gin.Context) {
	var req struct {
		Address    string `json:"address" binding:"required"`
		Authorized bool   `json:"authorized"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request",
		})
		return
	}

	// TODO: 验证管理员权限

	err := getBrandService().UpdateAuthorization(req.Address, req.Authorized)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update authorization",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Authorization updated successfully",
	})
}


