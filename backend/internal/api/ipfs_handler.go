package api

import (
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

// UploadImage 上传图片到 IPFS
func UploadImage(c *gin.Context) {
	file, header, err := c.Request.FormFile("image")
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

	// 上传到 IPFS
	hash, err := getIPFSService().UploadFile(fileData, header.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to upload to IPFS: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"hash": hash,
		"uri":  "ipfs://" + hash,
		"url":  "https://ipfs.io/ipfs/" + hash,
	})
}

// UploadMultipleImages 批量上传图片
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

	var hashes []string
	var uris []string

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

		hash, err := getIPFSService().UploadFile(fileData, fileHeader.Filename)
		if err != nil {
			continue
		}

		hashes = append(hashes, hash)
		uris = append(uris, "ipfs://"+hash)
	}

	c.JSON(http.StatusOK, gin.H{
		"count":  len(hashes),
		"hashes": hashes,
		"uris":   uris,
	})
}

// GenerateMetadata 生成并上传元数据
func GenerateMetadata(c *gin.Context) {
	var req struct {
		Name         string   `json:"name" binding:"required"`
		Description  string   `json:"description"`
		SerialNumber string   `json:"serialNumber" binding:"required"`
		BrandName    string   `json:"brandName"`
		BrandAddress string   `json:"brandAddress"`
		Category     string   `json:"category"`
		Model        string   `json:"model"`
		ImageHashes  []string `json:"imageHashes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request: " + err.Error(),
		})
		return
	}

	uri, err := getIPFSService().GenerateMetadataURI(
		req.Name,
		req.Description,
		req.SerialNumber,
		req.BrandName,
		req.BrandAddress,
		req.Category,
		req.Model,
		req.ImageHashes,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate metadata: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"uri": uri,
		"url": "https://ipfs.io/ipfs/" + uri[7:], // 移除 ipfs:// 前缀
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


