package api

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"

	"chain-vault-backend/internal/service"
	"github.com/gin-gonic/gin"
)

var (
	ipfsService     *service.IPFSService
	ipfsServiceOnce sync.Once
)

func getIPFSService() *service.IPFSService {
	ipfsServiceOnce.Do(func() {
		ipfsService = service.NewIPFSService()
	})
	return ipfsService
}

// UploadImage 上传图片并转为 base64
// 注意：当前实现为 base64 存储，保留 IPFS 相关代码以便日后切换
func UploadImage(c *gin.Context) {
	file, _, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to get image file",
		})
		return
	}
	defer file.Close()

	// 读取文件内容
	fileData, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to read file",
		})
		return
	}

	// 转为 base64
	base64Str := base64.StdEncoding.EncodeToString(fileData)
	
	// 根据文件类型添加 data URI 前缀
	mimeType := http.DetectContentType(fileData)
	dataURI := fmt.Sprintf("data:%s;base64,%s", mimeType, base64Str)

	c.JSON(http.StatusOK, gin.H{
		"base64": dataURI,
		"hash":   "", // 保留字段，兼容前端
		"uri":    "", // 保留字段，兼容前端
		"url":    "", // 保留字段，兼容前端
	})
}

// UploadMultipleImages 批量上传图片并转为 base64
// 注意：当前实现为 base64 存储，保留 IPFS 相关代码以便日后切换
func UploadMultipleImages(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to parse form",
		})
		return
	}

	files := form.File["images"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No images provided",
		})
		return
	}

	var base64Images []string

	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}

		fileData, err := io.ReadAll(file)
		file.Close()
		if err != nil {
			continue
		}

		// 转为 base64
		base64Str := base64.StdEncoding.EncodeToString(fileData)
		mimeType := http.DetectContentType(fileData)
		dataURI := fmt.Sprintf("data:%s;base64,%s", mimeType, base64Str)
		base64Images = append(base64Images, dataURI)
	}

	c.JSON(http.StatusOK, gin.H{
		"count":  len(base64Images),
		"base64": base64Images,
		"hashes": []string{}, // 保留字段
		"uris":   []string{}, // 保留字段
	})
}

// GenerateMetadata 生成元数据（不上传到IPFS，直接返回JSON）
// 注意：当前实现为本地存储，保留 IPFS 相关代码以便日后切换
func GenerateMetadata(c *gin.Context) {
	var req struct {
		Name               string   `json:"name" binding:"required"`
		Description        string   `json:"description"`
		SerialNumber       string   `json:"serialNumber" binding:"required"`
		BrandName          string   `json:"brandName"`
		BrandAddress       string   `json:"brandAddress"`
		Category           string   `json:"category"`
		Model              string   `json:"model"`
		ImageHashes        []string `json:"imageHashes"`
		// 商品详情
		Size               string   `json:"size"`
		Color              string   `json:"color"`
		Condition          string   `json:"condition"`
		ProductionDate     string   `json:"productionDate"`
		ProductionLocation string   `json:"productionLocation"`
		// NFC 信息
		NfcTagId           string   `json:"nfcTagId"`
		// 证书信息
		CertificateUrl     string   `json:"certificateUrl"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request: " + err.Error(),
		})
		return
	}

	// 构建元数据（不上传到IPFS）
	// 注意：图片不存储在链上元数据中，只存储在数据库
	// 这样可以避免 Gas 过高的问题
	metadata := map[string]interface{}{
		"name":         req.Name,
		"description":  req.Description,
		"serialNumber": req.SerialNumber,
		"brand": map[string]interface{}{
			"name":     req.BrandName,
			"address":  req.BrandAddress,
			"verified": true,
		},
		"product": map[string]interface{}{
			"category": req.Category,
			"model":    req.Model,
			"size":     req.Size,
			"color":    req.Color,
			"condition": req.Condition,
			"productionDate": req.ProductionDate,
			"productionLocation": req.ProductionLocation,
		},
		"media": map[string]interface{}{
			"images":    []string{}, // 图片不存储在链上，只存储在数据库
			"thumbnail": "",          // 缩略图也不存储在链上
		},
		"nfc": map[string]interface{}{
			"tagId": req.NfcTagId,
		},
		"certificate": map[string]interface{}{
			"url": req.CertificateUrl,
		},
	}

	// 将元数据转为JSON字符串作为URI
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to marshal metadata: " + err.Error(),
		})
		return
	}

	// 使用 data URI 格式存储元数据
	metadataURI := fmt.Sprintf("data:application/json;base64,%s", base64.StdEncoding.EncodeToString(metadataJSON))

	c.JSON(http.StatusOK, gin.H{
		"uri": metadataURI,
		"url": "", // 本地存储无需URL
	})
}

// GetMetadata 获取元数据
func GetMetadata(c *gin.Context) {
	uri := c.Query("uri")
	if uri == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "URI is required",
		})
		return
	}

	metadata, err := getIPFSService().GetMetadata(uri)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get metadata: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": metadata,
	})
}

// GetFile 获取文件
func GetFile(c *gin.Context) {
	hash := c.Param("hash")
	if hash == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Hash is required",
		})
		return
	}

	data, err := getIPFSService().GetFile(hash)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get file: " + err.Error(),
		})
		return
	}

	// 返回文件内容
	c.Data(http.StatusOK, "application/octet-stream", data)
}


