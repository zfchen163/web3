package service

import (
	"chain-vault-backend/internal/model"
	"chain-vault-backend/internal/repository"
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
