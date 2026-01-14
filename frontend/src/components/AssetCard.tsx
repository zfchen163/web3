import { useState } from 'react'

interface AssetCardProps {
  asset: any
  onOpenDetail: () => void
  onBuy?: () => void
  onList?: () => void
  onUnlist?: () => void
  onTransfer?: () => void
  viewMode: 'marketplace' | 'myAssets'
  isOwner: boolean
  formatAddress: (address: string) => string
  formatPrice: (price: string) => string
  getStatusText: (status: number) => string
}

export default function AssetCard({
  asset,
  onOpenDetail,
  onBuy,
  onList,
  onUnlist,
  onTransfer,
  viewMode,
  isOwner,
  formatAddress,
  formatPrice,
  getStatusText
}: AssetCardProps) {
  const [imageError, setImageError] = useState(false)
  
  // 解析 metadata
  let metadata: any = {}
  try {
    if (asset.metadataURI) {
      metadata = JSON.parse(asset.metadataURI)
    }
  } catch (e) {
    console.error('Failed to parse metadata:', e)
  }

  // 获取显示图片
  const getDisplayImage = () => {
    if (imageError) return null
    
    // 优先使用 images 字段
    if (asset.images) {
      try {
        const images = JSON.parse(asset.images)
        if (Array.isArray(images) && images.length > 0) {
          return images[0]
        }
      } catch (e) {
        console.error('Failed to parse images:', e)
      }
    }
    
    // 其次使用 metadata 中的 image
    if (metadata.image) {
      return metadata.image
    }
    
    return null
  }

  const displayImageUrl = getDisplayImage()

  // 状态颜色映射
  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-gray-100 text-gray-700'
      case 1: return 'bg-yellow-100 text-yellow-700'
      case 2: return 'bg-green-100 text-green-700'
      case 3: return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* 图片区域 */}
      {displayImageUrl && !imageError && (
        <div 
          className="relative aspect-square bg-gray-50 cursor-pointer overflow-hidden"
          onClick={onOpenDetail}
        >
          <img 
            src={displayImageUrl} 
            alt={asset.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
          
          {/* 验证徽章 */}
          {asset.status === 2 && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
              <span>✓</span>
              <span>已验证</span>
            </div>
          )}
        </div>
      )}

      {/* 内容区域 */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 flex-1">{asset.name}</h3>
          {asset.status === 2 && <span className="text-blue-600 text-sm ml-2">✓</span>}
        </div>
        
        {/* 描述 */}
        {metadata.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {metadata.description}
          </p>
        )}

        {/* 价格 */}
        {asset.isListed && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">当前价格</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(asset.price)} <span className="text-base font-normal text-gray-500">ETH</span>
            </p>
          </div>
        )}

        {/* 简化的信息 */}
        <div className="space-y-1.5 mb-3 text-sm">
          {metadata.attributes?.brand && (
            <div className="flex items-center gap-2 text-gray-600">
              <span>🏷️</span>
              <span>{metadata.attributes.brand}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-gray-500">
            <span>📦</span>
            <span className="font-mono text-xs">{asset.serialNumber}</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          {viewMode === 'marketplace' && asset.isListed && !isOwner && onBuy && (
            <button 
              onClick={onBuy}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              立即购买
            </button>
          )}
          
          {viewMode === 'myAssets' && isOwner && (
            <>
              {!asset.isListed ? (
                <button 
                  onClick={onList}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  上架
                </button>
              ) : (
                <button 
                  onClick={onUnlist}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                >
                  下架
                </button>
              )}
              
              <button 
                onClick={onTransfer}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                转移
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
