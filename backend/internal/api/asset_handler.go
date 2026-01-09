package api

import (
	"net/http"
	"strconv"
	"strings"
	"sync"

	"chain-vault-backend/internal/service"
	"github.com/gin-gonic/gin"
)

var (
	assetService *service.AssetService
	serviceOnce  sync.Once
)

func getAssetService() *service.AssetService {
	serviceOnce.Do(func() {
		assetService = service.NewAssetService()
	})
	return assetService
}

func ListAssets(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	owner := c.Query("owner")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	var assets []interface{}
	var total int64

	if owner != "" {
		// 查询特定所有者的资产
		assetList, err := getAssetService().GetAssetsByOwner(owner, limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch assets",
			})
			return
		}
		for _, asset := range assetList {
			assets = append(assets, asset)
		}
		total, _ = getAssetService().GetTotalCount()
	} else {
		// 查询所有资产
		assetList, err := getAssetService().ListAssets(limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch assets",
			})
			return
		}
		for _, asset := range assetList {
			assets = append(assets, asset)
		}
		total, _ = getAssetService().GetTotalCount()
	}

	c.JSON(http.StatusOK, gin.H{
		"data": assets,
		"total": total,
		"limit": limit,
		"offset": offset,
	})
}

func GetAsset(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid asset ID",
		})
		return
	}

	asset, err := getAssetService().GetAsset(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch asset",
		})
		return
	}

	if asset == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Asset not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": asset,
	})
}

func GetStats(c *gin.Context) {
	total, err := getAssetService().GetTotalCount()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch stats",
		})
		return
	}

	// 获取前10个所有者
	topOwners, _ := getAssetService().GetTopOwners(10)
	
	// 获取最近7天的统计
	dailyStats, _ := getAssetService().GetDailyStats(7)

	c.JSON(http.StatusOK, gin.H{
		"totalAssets": total,
		"topOwners":   topOwners,
		"dailyStats":  dailyStats,
	})
}

func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"message": "ChainVault API is running",
	})
}

// UpdateAssetImages 更新资产的图片
func UpdateAssetImages(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid asset ID",
		})
		return
	}

	var req struct {
		Images []string `json:"images" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request: " + err.Error(),
		})
		return
	}

	// 过滤出 base64 格式的图片（以 data: 开头）
	base64Images := make([]string, 0)
	for _, img := range req.Images {
		if strings.HasPrefix(img, "data:") {
			base64Images = append(base64Images, img)
		}
	}

	err = getAssetService().UpdateAssetImages(id, base64Images)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update images: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Images updated successfully",
	})
}

