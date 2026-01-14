/**
 * 资产详情模态框
 * 展示完整的资产信息和所有图片
 */

import React, { useState } from 'react';
import './AssetDetailModal.css';

interface Asset {
  id: number
  owner: string
  brand: string
  name: string
  serialNumber: string
  metadataURI: string
  images?: string
  status: number
  createdAt: string
  isListed: boolean
  price: string
}

interface AssetDetailModalProps {
  asset: Asset | null
  isOpen: boolean
  onClose: () => void
  onBuy?: (asset: Asset) => void
  onList?: (assetId: number) => void
  onUnlist?: (assetId: number) => void
  onTransfer?: (assetId: number) => void
  isOwner?: boolean
  viewMode?: string
}

const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  isOpen,
  onClose,
  onBuy,
  onList,
  onUnlist,
  onTransfer,
  isOwner = false,
  viewMode = 'marketplace'
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // 监听 ESC 键关闭
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // 防止背景滚动
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !asset) return null

  // 解析图片数据
  let images: string[] = []
  if (asset.images) {
    try {
      const parsed = JSON.parse(asset.images)
      // 如果是数组，直接使用；如果是字符串，转为数组
      images = Array.isArray(parsed) ? parsed : [parsed]
    } catch (e) {
      // 如果解析失败，尝试作为单个字符串
      images = [asset.images]
    }
  }

  // 过滤空值并转换图片 URL
  const imageUrls = images
    .filter(img => img && img.trim())
    .map(img => {
      // 如果是 base64 数据，直接使用
      if (img.startsWith('data:image/')) {
        return img
      }
      // 如果是 IPFS hash，转换为 URL
      if (img.startsWith('Qm') || img.startsWith('bafy')) {
        return `https://ipfs.io/ipfs/${img}`
      }
      // 如果已经是完整 URL，直接使用
      if (img.startsWith('http://') || img.startsWith('https://')) {
        return img
      }
      // 默认作为 IPFS hash 处理
      return `https://ipfs.io/ipfs/${img}`
    })

  // 解析元数据
  let metadata: any = {}
  if (asset.metadataURI) {
    try {
      if (asset.metadataURI.startsWith('data:application/json;base64,')) {
        const base64Data = asset.metadataURI.replace('data:application/json;base64,', '')
        const jsonStr = atob(base64Data)
        metadata = JSON.parse(jsonStr)
      }
    } catch (e) {
      console.error('Failed to parse metadata:', e)
    }
  }

  // 格式化地址
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // 格式化价格
  const formatPrice = (price: string) => {
    try {
      const eth = parseFloat(price) / 1e18
      return eth.toFixed(4)
    } catch {
      return '0'
    }
  }

  // 获取验证状态文本
  const getStatusText = (status: number) => {
    const statusMap: Record<number, string> = {
      0: '未验证',
      1: '待验证',
      2: '已验证',
      3: '已拒绝'
    }
    return statusMap[status] || '未知'
  }

  // 获取新旧程度文本
  const getConditionText = (condition: string) => {
    const conditionMap: Record<string, string> = {
      'new': '🆕 全新',
      'used': '♻️ 二手',
      'refurbished': '🔧 翻新'
    }
    return conditionMap[condition] || condition
  }

  return (
    <div className="asset-detail-overlay" onClick={onClose}>
      <div className="asset-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* 关闭按钮 */}
        <button className="detail-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="detail-content">
          {/* 左侧：图片展示 */}
          <div className="detail-images-section">
            {/* 主图 */}
            <div className="detail-main-image">
              {imageUrls.length > 0 ? (
                <img 
                  src={imageUrls[currentImageIndex]} 
                  alt={asset.name}
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="%23f3f4f6" width="400" height="400"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-size="20">无图片</text></svg>'
                  }}
                />
              ) : (
                <div className="no-image-placeholder">
                  <span>📷</span>
                  <p>暂无图片</p>
                </div>
              )}
            </div>

            {/* 缩略图 */}
            {imageUrls.length > 1 && (
              <div className="detail-thumbnails">
                {imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img src={url} alt={`${asset.name} ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}

            {/* 图片导航 */}
            {imageUrls.length > 1 && (
              <div className="image-navigation">
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length)}
                  className="nav-btn"
                >
                  ‹
                </button>
                <span className="image-counter">
                  {currentImageIndex + 1} / {imageUrls.length}
                </span>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length)}
                  className="nav-btn"
                >
                  ›
                </button>
              </div>
            )}
          </div>

          {/* 右侧：详细信息 */}
          <div className="detail-info-section">
            {/* 标题和状态 */}
            <div className="detail-header">
              <div className="detail-title-row">
                <span className="detail-id">#{asset.id}</span>
                <h2 className="detail-title">{asset.name}</h2>
              </div>
              
              <div className="detail-badges">
                {asset.status === 2 && (
                  <span className="badge badge-verified">✓ 已验证</span>
                )}
                {asset.isListed && (
                  <span className="badge badge-listed">🏷️ 在售中</span>
                )}
              </div>
            </div>

            {/* 价格 */}
            {asset.isListed && (
              <div className="detail-price-box">
                <span className="price-label">售价</span>
                <span className="price-value">{formatPrice(asset.price)} ETH</span>
              </div>
            )}

            {/* 描述 */}
            {metadata.description && (
              <div className="detail-section">
                <h3 className="section-title">📝 商品描述</h3>
                <p className="description-text">{metadata.description}</p>
              </div>
            )}

            {/* 基本信息 */}
            <div className="detail-section">
              <h3 className="section-title">📋 基本信息</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">序列号</span>
                  <span className="info-value monospace">{asset.serialNumber}</span>
                </div>

                {metadata.attributes?.brand && (
                  <div className="info-item">
                    <span className="info-label">品牌</span>
                    <span className="info-value brand-name">{metadata.attributes.brand}</span>
                  </div>
                )}

                {metadata.attributes?.category && (
                  <div className="info-item">
                    <span className="info-label">分类</span>
                    <span className="info-value">{metadata.attributes.category}</span>
                  </div>
                )}

                {metadata.attributes?.model && (
                  <div className="info-item">
                    <span className="info-label">型号</span>
                    <span className="info-value">{metadata.attributes.model}</span>
                  </div>
                )}

                {metadata.attributes?.size && (
                  <div className="info-item">
                    <span className="info-label">尺码</span>
                    <span className="info-value">{metadata.attributes.size}</span>
                  </div>
                )}

                {metadata.attributes?.color && (
                  <div className="info-item">
                    <span className="info-label">颜色</span>
                    <span className="info-value">{metadata.attributes.color}</span>
                  </div>
                )}

                {metadata.attributes?.condition && (
                  <div className="info-item">
                    <span className="info-label">新旧程度</span>
                    <span className="info-value">{getConditionText(metadata.attributes.condition)}</span>
                  </div>
                )}

                {metadata.attributes?.productionDate && (
                  <div className="info-item">
                    <span className="info-label">生产日期</span>
                    <span className="info-value">{metadata.attributes.productionDate}</span>
                  </div>
                )}

                {metadata.attributes?.productionLocation && (
                  <div className="info-item">
                    <span className="info-label">生产地</span>
                    <span className="info-value">🌍 {metadata.attributes.productionLocation}</span>
                  </div>
                )}

                {metadata.attributes?.nfcTagId && (
                  <div className="info-item">
                    <span className="info-label">NFC 标签</span>
                    <span className="info-value monospace">{metadata.attributes.nfcTagId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 证书信息 */}
            {metadata.attributes?.certificateUrl && (
              <div className="detail-section">
                <h3 className="section-title">📜 品牌证书</h3>
                <a 
                  href={metadata.attributes.certificateUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="certificate-link"
                >
                  <span>查看官方证书</span>
                  <span>→</span>
                </a>
              </div>
            )}

            {/* 所有权信息 */}
            <div className="detail-section">
              <h3 className="section-title">👤 所有权信息</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">当前所有者</span>
                  <span className="info-value monospace">{formatAddress(asset.owner)}</span>
                </div>

                <div className="info-item">
                  <span className="info-label">验证状态</span>
                  <span className={`info-value status-${asset.status}`}>
                    {getStatusText(asset.status)}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">注册时间</span>
                  <span className="info-value">
                    {new Date(asset.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="detail-actions">
              {viewMode === 'marketplace' && asset.isListed && !isOwner && onBuy && (
                <button 
                  onClick={() => onBuy(asset)} 
                  className="action-btn btn-buy"
                >
                  💰 立即购买
                </button>
              )}

              {viewMode === 'myAssets' && isOwner && (
                <>
                  {!asset.isListed ? (
                    <button 
                      onClick={() => onList && onList(asset.id)}
                      className="action-btn btn-list"
                    >
                      🏷️ 上架出售
                    </button>
                  ) : (
                    <button 
                      onClick={() => onUnlist && onUnlist(asset.id)}
                      className="action-btn btn-unlist"
                    >
                      📦 下架商品
                    </button>
                  )}

                  <button 
                    onClick={() => onTransfer && onTransfer(asset.id)}
                    className="action-btn btn-transfer"
                  >
                    🔄 转移资产
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssetDetailModal
