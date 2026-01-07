package service

import (
	"chain-vault-backend/internal/model"
	"chain-vault-backend/internal/repository"
	"time"
)

type BrandService struct {
	repo *repository.BrandRepository
}

func NewBrandService() *BrandService {
	return &BrandService{
		repo: repository.NewBrandRepository(),
	}
}

func (s *BrandService) CreateBrand(brandAddress, brandName, txHash string, blockNum uint64) error {
	brand := &model.Brand{
		BrandAddress: brandAddress,
		BrandName:    brandName,
		IsAuthorized: false,
		RegisteredAt: time.Now(),
		TxHash:       txHash,
		BlockNum:     blockNum,
	}
	return s.repo.Create(brand)
}

func (s *BrandService) GetBrand(address string) (*model.Brand, error) {
	return s.repo.FindByAddress(address)
}

func (s *BrandService) ListBrands(limit, offset int) ([]model.Brand, error) {
	return s.repo.FindAll(limit, offset)
}

func (s *BrandService) ListAuthorizedBrands() ([]model.Brand, error) {
	return s.repo.FindAuthorized()
}

func (s *BrandService) UpdateAuthorization(address string, authorized bool) error {
	return s.repo.UpdateAuthorization(address, authorized)
}

func (s *BrandService) GetTotalCount() (int64, error) {
	return s.repo.Count()
}


