package service

import (
	"chain-vault-backend/internal/model"
	"chain-vault-backend/internal/repository"
	"encoding/json"
	logpkg "log"
	"time"
)

type AssetService struct {
	repo *repository.AssetRepository
}

func NewAssetService() *AssetService {
	return &AssetService{
		repo: repository.NewAssetRepository(),
	}
}

func (s *AssetService) CreateAsset(assetID uint64, owner string, name string, txHash string, blockNum uint64) error {
	asset := &model.Asset{
		ID:        assetID,
		Owner:     owner,
		Name:      name,
		CreatedAt: time.Now(),
		TxHash:    txHash,
		BlockNum:  blockNum,
	}
	return s.repo.Create(asset)
}

func (s *AssetService) CreateAssetV3(assetID uint64, owner, brand, name, serialNumber, metadataURI, txHash string, blockNum uint64, status model.VerificationStatus) error {
	asset := &model.Asset{
		ID:           assetID,
		Owner:        owner,
		Brand:        brand,
		Name:         name,
		SerialNumber: serialNumber,
		MetadataURI:  metadataURI,
		Status:       status,
		CreatedAt:    time.Now(),
		TxHash:       txHash,
		BlockNum:     blockNum,
	}
	return s.repo.Create(asset)
}

// CreateAssetV3WithImages 创建资产并存储 base64 图片数组
func (s *AssetService) CreateAssetV3WithImages(assetID uint64, owner, brand, name, serialNumber, metadataURI, txHash string, blockNum uint64, status model.VerificationStatus, imageBase64Array []string) error {
	asset := &model.Asset{
		ID:           assetID,
		Owner:        owner,
		Brand:        brand,
		Name:         name,
		SerialNumber: serialNumber,
		MetadataURI:  metadataURI,
		Status:       status,
		CreatedAt:    time.Now(),
		TxHash:       txHash,
		BlockNum:     blockNum,
	}

	// 将 base64 图片数组转为 JSON 存储
	if len(imageBase64Array) > 0 {
		imagesJSON, err := json.Marshal(imageBase64Array)
		if err == nil {
			asset.Images = string(imagesJSON)
		}
	}

	return s.repo.Create(asset)
}

// UpdateAssetImages 更新资产的图片
func (s *AssetService) UpdateAssetImages(assetID uint64, imageBase64Array []string) error {
	var imagesJSON string
	if len(imageBase64Array) > 0 {
		bytes, err := json.Marshal(imageBase64Array)
		if err != nil {
			return err
		}
		imagesJSON = string(bytes)
	}

	// 打印日志以便调试
	if len(imagesJSON) > 100 {
		logpkg.Printf("Updating images for asset %d, data length: %d bytes", assetID, len(imagesJSON))
	} else {
		logpkg.Printf("Updating images for asset %d, data: %s", assetID, imagesJSON)
	}

	// 重试机制：尝试 20 次，每次间隔 500ms（共10秒），等待 EventListener 创建资产
	// 前端在交易确认后立即调用此接口，但后端 EventListener 需要轮询区块，存在延迟
	var lastErr error
	for i := 0; i < 20; i++ {
		err := s.repo.UpdateImages(assetID, imagesJSON)
		if err == nil {
			logpkg.Printf("Successfully updated images for asset %d on attempt %d", assetID, i+1)
			return nil
		}
		// 如果是未找到资产错误，继续重试
		lastErr = err
		if i%5 == 0 { // 每5次打印一次日志
			logpkg.Printf("Attempt %d/20: Failed to update images for asset %d: %v", i+1, assetID, err)
		}
		time.Sleep(500 * time.Millisecond)
	}
	
	logpkg.Printf("Final failure: Could not update images for asset %d after 20 attempts: %v", assetID, lastErr)
	return lastErr
}

func (s *AssetService) GetAsset(id uint64) (*model.Asset, error) {
	return s.repo.FindByID(id)
}

func (s *AssetService) ListAssets(limit, offset int) ([]model.Asset, error) {
	return s.repo.FindAll(limit, offset)
}

func (s *AssetService) GetTotalCount() (int64, error) {
	return s.repo.Count()
}

func (s *AssetService) GetAssetsByOwner(owner string, limit, offset int) ([]model.Asset, error) {
	return s.repo.FindByOwner(owner, limit, offset)
}

func (s *AssetService) GetCountByOwner(owner string) (int64, error) {
	return s.repo.CountByOwner(owner)
}

func (s *AssetService) GetTopOwners(limit int) ([]map[string]interface{}, error) {
	return s.repo.GetTopOwners(limit)
}

func (s *AssetService) GetAssetsByDateRange(startDate, endDate string, limit, offset int) ([]model.Asset, error) {
	return s.repo.GetAssetsByDateRange(startDate, endDate, limit, offset)
}

func (s *AssetService) GetDailyStats(days int) ([]map[string]interface{}, error) {
	return s.repo.GetDailyStats(days)
}

func (s *AssetService) UpdateAssetOwner(assetID uint64, newOwner string, txHash string, blockNum uint64) error {
	return s.repo.UpdateOwner(assetID, newOwner, txHash, blockNum)
}

func (s *AssetService) GetAssetBySerialNumber(serialNumber string) (*model.Asset, error) {
	return s.repo.FindBySerialNumber(serialNumber)
}

func (s *AssetService) GetAssetsByBrand(brand string, limit, offset int) ([]model.Asset, error) {
	return s.repo.FindByBrand(brand, limit, offset)
}

func (s *AssetService) GetListedAssets(limit, offset int) ([]model.Asset, error) {
	return s.repo.FindListed(limit, offset)
}

func (s *AssetService) GetAssetsByStatus(status model.VerificationStatus, limit, offset int) ([]model.Asset, error) {
	return s.repo.FindByStatus(status, limit, offset)
}

func (s *AssetService) SearchAssets(keyword string, limit, offset int) ([]model.Asset, error) {
	return s.repo.Search(keyword, limit, offset)
}

func (s *AssetService) UpdateListingStatus(assetID uint64, isListed bool, price string) error {
	return s.repo.UpdateListingStatus(assetID, isListed, price)
}

func (s *AssetService) UpdateVerificationStatus(assetID uint64, status model.VerificationStatus, brand string) error {
	return s.repo.UpdateVerificationStatus(assetID, status, brand)
}

// ListAsset 上架资产
func (s *AssetService) ListAsset(assetID uint64, priceWei string) error {
	return s.repo.UpdateListingStatus(assetID, true, priceWei)
}

// UnlistAsset 下架资产
func (s *AssetService) UnlistAsset(assetID uint64) error {
	return s.repo.UpdateListingStatus(assetID, false, "0")
}
