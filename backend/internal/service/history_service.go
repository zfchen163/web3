package service

import (
	"chain-vault-backend/internal/model"
	"chain-vault-backend/internal/repository"
	"time"
)

type HistoryService struct {
	repo *repository.HistoryRepository
}

func NewHistoryService() *HistoryService {
	return &HistoryService{
		repo: repository.NewHistoryRepository(),
	}
}

func (s *HistoryService) CreateHistory(assetID uint64, owner, txHash string, blockNum uint64) error {
	history := &model.AssetOwnerHistory{
		AssetID:   assetID,
		Owner:     owner,
		Timestamp: time.Now(),
		TxHash:    txHash,
		BlockNum:  blockNum,
	}
	return s.repo.Create(history)
}

func (s *HistoryService) GetHistoryByAsset(assetID uint64) ([]model.AssetOwnerHistory, error) {
	return s.repo.FindByAssetID(assetID)
}

func (s *HistoryService) GetHistoryByOwner(owner string, limit, offset int) ([]model.AssetOwnerHistory, error) {
	return s.repo.FindByOwner(owner, limit, offset)
}


