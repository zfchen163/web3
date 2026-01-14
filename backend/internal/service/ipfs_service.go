/**
 * IPFS 服务模块
 * 
 * 功能说明：
 * 1. 上传文件到 IPFS（照片、视频等）
 * 2. 生成和上传资产元数据
 * 3. 从 IPFS 获取文件和元数据
 * 4. 固定文件（防止被垃圾回收）
 * 
 * IPFS 简介：
 * IPFS (InterPlanetary File System) 是一个去中心化的文件存储系统
 * - 文件通过内容哈希寻址（内容相同，哈希相同）
 * - 文件分布式存储，不依赖单一服务器
 * - 适合存储商品照片、证书等不可变数据
 * 
 * 使用方式：
 * 1. 本地 IPFS 节点：http://localhost:5001
 * 2. 公共网关：https://ipfs.infura.io:5001
 * 3. Pinata/NFT.Storage 等托管服务
 */

package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

// IPFSService IPFS 服务结构体
// 封装了与 IPFS 节点交互的所有方法
type IPFSService struct {
	apiURL string          // IPFS API 地址，如 http://localhost:5001/api/v0
	client *http.Client    // HTTP 客户端，用于发送请求
}

// ==================== 元数据结构定义 ====================

// AssetMetadata 资产元数据结构
// 这是存储在 IPFS 上的完整资产信息
// 智能合约中只存储 IPFS 链接（metadataURI），详细信息存储在这里
type AssetMetadata struct {
	Name        string              `json:"name"`         // 资产名称
	Description string              `json:"description"`  // 详细描述
	SerialNumber string             `json:"serialNumber"` // 序列号
	Brand       BrandInfo           `json:"brand"`        // 品牌信息
	Product     ProductInfo         `json:"product"`      // 商品详情
	Media       MediaInfo           `json:"media"`        // 媒体文件（照片、视频）
	NFC         *NFCInfo            `json:"nfc,omitempty"` // NFC 标签信息（可选）
	Certificate *CertificateInfo    `json:"certificate,omitempty"` // 证书信息（可选）
	Attributes  []AttributeInfo     `json:"attributes,omitempty"` // 自定义属性（可选）
}

// BrandInfo 品牌信息
type BrandInfo struct {
	Name     string `json:"name"`     // 品牌名称，如 "Nike"
	Address  string `json:"address"`  // 品牌方以太坊地址
	Verified bool   `json:"verified"` // 是否已验证
}

// ProductInfo 商品详情
// 存储商品的具体信息
type ProductInfo struct {
	Category           string `json:"category"`           // 分类，如 "鞋类"、"服装"
	Model              string `json:"model"`              // 型号，如 "Air Jordan 1"
	Size               string `json:"size,omitempty"`     // 尺码，如 "42"
	Color              string `json:"color,omitempty"`    // 颜色，如 "红黑配色"
	ProductionDate     string `json:"productionDate,omitempty"`     // 生产日期
	ProductionLocation string `json:"productionLocation,omitempty"` // 生产地
	Condition          string `json:"condition,omitempty"` // 新旧程度：new, used, refurbished
}

// MediaInfo 媒体信息
// 存储商品的照片、视频等多媒体文件
type MediaInfo struct {
	Images      []string `json:"images"`      // 照片列表（IPFS 链接）
	Thumbnail   string   `json:"thumbnail,omitempty"`   // 缩略图（第一张照片）
	Video       string   `json:"video,omitempty"`       // 视频（IPFS 链接）
	Documents   []string `json:"documents,omitempty"`   // 文档列表（如鉴定证书PDF）
}

// NFCInfo NFC 标签信息
// 用于将数字资产与物理商品绑定
type NFCInfo struct {
	TagID    string `json:"tagId"`    // NFC 标签 ID，如 "NFC-001234"
	ChipType string `json:"chipType"` // 芯片类型，如 "NTAG216"
}

// CertificateInfo 证书信息
// 存储品牌官方证书或第三方鉴定证书
type CertificateInfo struct {
	Issuer          string `json:"issuer"`          // 发行方，如 "Nike Official"
	IssueDate       string `json:"issueDate"`       // 发行日期
	CertificateHash string `json:"certificateHash"` // 证书哈希值（防篡改）
	CertificateURL  string `json:"certificateUrl,omitempty"` // 证书链接
}

// AttributeInfo 自定义属性
// 用于存储额外的商品属性（类似 NFT 的 traits）
type AttributeInfo struct {
	TraitType string `json:"trait_type"` // 属性类型，如 "材质"
	Value     string `json:"value"`      // 属性值，如 "真皮"
}

// IPFSUploadResponse IPFS 上传响应
// IPFS 节点返回的上传结果
type IPFSUploadResponse struct {
	Hash string `json:"Hash"` // 文件的 IPFS 哈希值，如 "QmXxx..."
	Name string `json:"Name"` // 文件名
	Size string `json:"Size"` // 文件大小
}

// ==================== 服务初始化 ====================

// NewIPFSService 创建 IPFS 服务实例
// 
// 功能说明：
// 1. 从环境变量读取 IPFS API 地址
// 2. 如果未设置，使用默认的本地节点地址
// 3. 创建 HTTP 客户端
// 
// 环境变量：
// - IPFS_API_URL: IPFS API 地址（可选）
//   默认值：http://localhost:5001/api/v0
// 
// 返回值：
// - IPFSService 实例，可用于上传和获取文件
func NewIPFSService() *IPFSService {
	// 从环境变量读取 IPFS API 地址
	apiURL := os.Getenv("IPFS_API_URL")
	if apiURL == "" {
		// 默认使用本地 IPFS 节点
		// 确保本地运行了 IPFS daemon
		apiURL = "http://localhost:5001/api/v0"
	}

	return &IPFSService{
		apiURL: apiURL,
		client: &http.Client{},
	}
}

// ==================== 文件上传 ====================

// UploadFile 上传文件到 IPFS
// 
// 功能说明：
// 1. 将文件数据上传到 IPFS 节点
// 2. 返回文件的 IPFS 哈希值
// 3. 哈希值可用于后续访问文件
// 
// 参数说明：
// - fileData: 文件的二进制数据
// - fileName: 文件名（用于识别文件类型）
// 
// 返回值：
// - string: IPFS 哈希值，如 "QmXxx..."
// - error: 如果上传失败，返回错误信息
// 
// 使用示例：
// hash, err := ipfsService.UploadFile(imageData, "shoe.jpg")
// if err != nil {
//     log.Fatal(err)
// }
// fmt.Println("IPFS 哈希:", hash)
// fmt.Println("访问链接:", "https://ipfs.io/ipfs/" + hash)
func (s *IPFSService) UploadFile(fileData []byte, fileName string) (string, error) {
	// 创建 multipart form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// 添加文件
	part, err := writer.CreateFormFile("file", fileName)
	if err != nil {
		return "", fmt.Errorf("failed to create form file: %w", err)
	}

	if _, err := part.Write(fileData); err != nil {
		return "", fmt.Errorf("failed to write file data: %w", err)
	}

	if err := writer.Close(); err != nil {
		return "", fmt.Errorf("failed to close writer: %w", err)
	}

	// 发送请求到 IPFS
	req, err := http.NewRequest("POST", s.apiURL+"/add", body)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to upload to IPFS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("IPFS upload failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	// 解析响应
	var uploadResp IPFSUploadResponse
	if err := json.NewDecoder(resp.Body).Decode(&uploadResp); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	// 返回 IPFS 哈希
	return uploadResp.Hash, nil
}

// UploadMetadata 上传元数据到 IPFS
func (s *IPFSService) UploadMetadata(metadata *AssetMetadata) (string, error) {
	// 将元数据转换为 JSON
	metadataJSON, err := json.MarshalIndent(metadata, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal metadata: %w", err)
	}

	// 上传到 IPFS
	hash, err := s.UploadFile(metadataJSON, "metadata.json")
	if err != nil {
		return "", err
	}

	// 返回完整的 IPFS URI
	return fmt.Sprintf("ipfs://%s", hash), nil
}

// GetFile 从 IPFS 获取文件
func (s *IPFSService) GetFile(hash string) ([]byte, error) {
	// 移除 ipfs:// 前缀
	if len(hash) > 7 && hash[:7] == "ipfs://" {
		hash = hash[7:]
	}

	// 发送请求到 IPFS
	req, err := http.NewRequest("POST", s.apiURL+"/cat?arg="+hash, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get from IPFS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("IPFS get failed with status %d", resp.StatusCode)
	}

	// 读取文件内容
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	return data, nil
}

// GetMetadata 从 IPFS 获取元数据
func (s *IPFSService) GetMetadata(uri string) (*AssetMetadata, error) {
	data, err := s.GetFile(uri)
	if err != nil {
		return nil, err
	}

	var metadata AssetMetadata
	if err := json.Unmarshal(data, &metadata); err != nil {
		return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
	}

	return &metadata, nil
}

// PinFile 固定文件到 IPFS（防止被垃圾回收）
func (s *IPFSService) PinFile(hash string) error {
	// 移除 ipfs:// 前缀
	if len(hash) > 7 && hash[:7] == "ipfs://" {
		hash = hash[7:]
	}

	req, err := http.NewRequest("POST", s.apiURL+"/pin/add?arg="+hash, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to pin file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("IPFS pin failed with status %d", resp.StatusCode)
	}

	return nil
}

// GenerateMetadataURI 生成完整的元数据并上传到 IPFS
func (s *IPFSService) GenerateMetadataURI(
	name, description, serialNumber string,
	brandName, brandAddress string,
	category, model string,
	imageHashes []string,
) (string, error) {
	// 构建元数据
	metadata := &AssetMetadata{
		Name:         name,
		Description:  description,
		SerialNumber: serialNumber,
		Brand: BrandInfo{
			Name:     brandName,
			Address:  brandAddress,
			Verified: true,
		},
		Product: ProductInfo{
			Category: category,
			Model:    model,
		},
		Media: MediaInfo{
			Images: make([]string, len(imageHashes)),
		},
	}

	// 转换图片哈希为 IPFS URI
	for i, hash := range imageHashes {
		metadata.Media.Images[i] = fmt.Sprintf("ipfs://%s", hash)
	}

	// 设置缩略图（第一张图片）
	if len(imageHashes) > 0 {
		metadata.Media.Thumbnail = metadata.Media.Images[0]
	}

	// 上传元数据
	return s.UploadMetadata(metadata)
}


