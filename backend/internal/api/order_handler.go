package api

import (
	"net/http"
	"strconv"
	"sync"

	"chain-vault-backend/internal/service"
	"github.com/gin-gonic/gin"
)

var (
	orderService     *service.OrderService
	orderServiceOnce sync.Once
)

func getOrderService() *service.OrderService {
	orderServiceOnce.Do(func() {
		orderService = service.NewOrderService()
	})
	return orderService
}

// ListOrders 获取订单列表
func ListOrders(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	user := c.Query("user")
	buyer := c.Query("buyer")
	seller := c.Query("seller")

	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	offset, _ := strconv.Atoi(offsetStr)
	if offset < 0 {
		offset = 0
	}

	var orders interface{}
	var err error

	if user != "" {
		orders, err = getOrderService().GetOrdersByUser(user, limit, offset)
	} else if buyer != "" {
		orders, err = getOrderService().GetOrdersByBuyer(buyer, limit, offset)
	} else if seller != "" {
		orders, err = getOrderService().GetOrdersBySeller(seller, limit, offset)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Must specify user, buyer, or seller",
		})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch orders",
		})
		return
	}

	total, _ := getOrderService().GetTotalCount()

	c.JSON(http.StatusOK, gin.H{
		"data":   orders,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetOrder 获取订单详情
func GetOrder(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid order ID",
		})
		return
	}

	order, err := getOrderService().GetOrder(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch order",
		})
		return
	}

	if order == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Order not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": order,
	})
}

// GetOrdersByAsset 获取资产的订单历史
func GetOrdersByAsset(c *gin.Context) {
	idStr := c.Param("assetId")
	assetID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid asset ID",
		})
		return
	}

	orders, err := getOrderService().GetOrdersByAsset(assetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch orders",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": orders,
	})
}


