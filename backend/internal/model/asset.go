package model

import (
	"time"
	"gorm.io/gorm"
)

// VerificationStatus 验证状态
type VerificationStatus int

const (
	Unverified VerificationStatus = 0 // 未验证
	Pending    VerificationStatus = 1 // 待验证
	Verified   VerificationStatus = 2 // 已验证
	Rejected   VerificationStatus = 3 // 已拒绝
)

// OrderStatus 订单状态
type OrderStatus int

const (
	OrderNone      OrderStatus = 0 // 无订单
	OrderCreated   OrderStatus = 1 // 已创建
	OrderPaid      OrderStatus = 2 // 已支付
	OrderShipped   OrderStatus = 3 // 已发货
	OrderDelivered OrderStatus = 4 // 已送达
	OrderCompleted OrderStatus = 5 // 已完成
	OrderDisputed  OrderStatus = 6 // 有争议
	OrderRefunded  OrderStatus = 7 // 已退款
	OrderCancelled OrderStatus = 8 // 已取消
)

// Brand 品牌
type Brand struct {
	ID            uint64    `json:"id" gorm:"primaryKey"`
	BrandAddress  string    `json:"brandAddress" gorm:"type:varchar(191);uniqueIndex;not null"`
	BrandName     string    `json:"brandName" gorm:"type:varchar(191);not null"`
	IsAuthorized  bool      `json:"isAuthorized" gorm:"default:false"`
	RegisteredAt  time.Time `json:"registeredAt" gorm:"not null"`
	TxHash        string    `json:"txHash" gorm:"type:varchar(191);index"`
	BlockNum      uint64    `json:"blockNum" gorm:"index"`
	gorm.Model
}

// Asset 资产
type Asset struct {
	ID             uint64             `json:"id" gorm:"primaryKey"`
	Owner          string             `json:"owner" gorm:"type:varchar(191);index;not null"`
	Brand          string             `json:"brand" gorm:"type:varchar(191);index"` // 品牌方地址
	Name           string             `json:"name" gorm:"type:varchar(500);not null"`
	SerialNumber   string             `json:"serialNumber" gorm:"type:varchar(191);uniqueIndex;not null"`
	MetadataURI    string             `json:"metadataURI" gorm:"type:text"`
	Images         string             `json:"images" gorm:"type:text"` // JSON 数组，存储 base64 图片
	Status         VerificationStatus `json:"status" gorm:"default:0"`
	IsListed       bool               `json:"isListed" gorm:"default:false"`
	Price          string             `json:"price" gorm:"type:varchar(191);default:0"` // wei as string
	CreatedAt      time.Time          `json:"createdAt" gorm:"not null"`
	TxHash         string             `json:"txHash" gorm:"type:varchar(191);index;not null"`
	BlockNum       uint64             `json:"blockNum" gorm:"index;not null"`
	gorm.Model
}

// Order 订单
type Order struct {
	ID             uint64      `json:"id" gorm:"primaryKey"`
	AssetID        uint64      `json:"assetId" gorm:"index;not null"`
	Seller         string      `json:"seller" gorm:"type:varchar(191);index;not null"`
	Buyer          string      `json:"buyer" gorm:"type:varchar(191);index;not null"`
	Price          string      `json:"price" gorm:"type:varchar(191);not null"` // wei as string
	Status         OrderStatus `json:"status" gorm:"default:0"`
	OrderCreatedAt time.Time   `json:"orderCreatedAt" gorm:"not null"`
	PaidAt         *time.Time  `json:"paidAt"`
	ShippedAt      *time.Time  `json:"shippedAt"`
	DeliveredAt    *time.Time  `json:"deliveredAt"`
	CompletedAt    *time.Time  `json:"completedAt"`
	CanRefund      bool        `json:"canRefund" gorm:"default:true"`
	RefundDeadline *time.Time  `json:"refundDeadline"`
	TxHash         string      `json:"txHash" gorm:"type:varchar(191);index;not null"`
	BlockNum       uint64      `json:"blockNum" gorm:"index;not null"`
	gorm.Model
}

// AssetOwnerHistory 资产所有权历史
type AssetOwnerHistory struct {
	ID        uint64    `json:"id" gorm:"primaryKey"`
	AssetID   uint64    `json:"assetId" gorm:"index;not null"`
	Owner     string    `json:"owner" gorm:"type:varchar(191);index;not null"`
	Timestamp time.Time `json:"timestamp" gorm:"not null"`
	TxHash    string    `json:"txHash" gorm:"type:varchar(191);index;not null"`
	BlockNum  uint64    `json:"blockNum" gorm:"index;not null"`
	gorm.Model
}

