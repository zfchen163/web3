package api

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// SearchAssets 搜索资产
func SearchAssets(c *gin.Context) {
	keyword := c.Query("q")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	if keyword == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Search keyword is required",
		})
		return
	}

	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	offset, _ := strconv.Atoi(offsetStr)
	if offset < 0 {
		offset = 0
	}

	assets, err := getAssetService().SearchAssets(keyword, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to search assets",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    assets,
		"keyword": keyword,
		"limit":   limit,
		"offset":  offset,
	})
}

// GetAssetBySerialNumber 通过序列号查询资产
func GetAssetBySerialNumber(c *gin.Context) {
	serialNumber := c.Param("serialNumber")

	asset, err := getAssetService().GetAssetBySerialNumber(serialNumber)
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

// GetListedAssets 获取在售资产
func GetListedAssets(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	offset, _ := strconv.Atoi(offsetStr)
	if offset < 0 {
		offset = 0
	}

	assets, err := getAssetService().GetListedAssets(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch listed assets",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":   assets,
		"limit":  limit,
		"offset": offset,
	})
}

