import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Zoom } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/zoom'

interface AssetDetailModalV2Props {
  asset: any
  onClose: () => void
  formatAddress: (address: string) => string
  formatPrice: (price: string) => string
  getStatusText: (status: number) => string
}

export default function AssetDetailModalV2({
  asset,
  onClose,
  formatAddress,
  formatPrice,
  getStatusText
}: AssetDetailModalV2Props) {
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    // 解析图片
    const imageList: string[] = []
    
    // 从 images 字段获取
    if (asset.images) {
      try {
        const parsed = JSON.parse(asset.images)
        if (Array.isArray(parsed)) {
          imageList.push(...parsed)
        }
      } catch (e) {
        console.error('Failed to parse images:', e)
      }
    }
    
    // 从 metadata 获取
    if (asset.metadataURI) {
      try {
        const metadata = JSON.parse(asset.metadataURI)
        if (metadata.image && !imageList.includes(metadata.image)) {
          imageList.push(metadata.image)
        }
      } catch (e) {
        console.error('Failed to parse metadata:', e)
      }
    }
    
    setImages(imageList)
  }, [asset])

  // 解析 metadata
  let metadata: any = {}
  try {
    if (asset.metadataURI) {
      metadata = JSON.parse(asset.metadataURI)
    }
  } catch (e) {
    console.error('Failed to parse metadata:', e)
  }

  // 阻止背景滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // 状态颜色
  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'text-gray-700 bg-gray-100'
      case 1: return 'text-yellow-700 bg-yellow-100'
      case 2: return 'text-green-700 bg-green-100'
      case 3: return 'text-red-700 bg-red-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[10000] p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="sticky top-4 right-4 float-right w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors flex items-center justify-center text-gray-600 z-10"
        >
          <span className="text-xl">×</span>
        </button>

        {/* 图片轮播 */}
        {images.length > 0 && (
          <div className="relative bg-gray-50">
            <Swiper
              modules={[Navigation, Pagination, Zoom]}
              navigation
              pagination={{ clickable: true }}
              zoom={true}
              className="h-[500px]"
            >
              {images.map((img, index) => (
                <SwiperSlide key={index}>
                  <div className="swiper-zoom-container flex items-center justify-center h-full p-8">
                    <img 
                      src={img} 
                      alt={`${asset.name} - ${index + 1}`}
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* 内容区域 */}
        <div className="p-8 pt-4">
          {/* 标题和状态 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500">#{asset.id}</span>
              {asset.status === 2 && (
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-semibold">
                  ✓ 已验证
                </span>
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{asset.name}</h2>
            {metadata.description && (
              <p className="text-gray-600 text-base leading-relaxed">{metadata.description}</p>
            )}
          </div>

          {/* 价格卡片 */}
          {asset.isListed && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">当前价格</p>
              <p className="text-4xl font-bold text-gray-900">
                {formatPrice(asset.price)} <span className="text-xl font-normal text-gray-500">ETH</span>
              </p>
            </div>
          )}

          {/* 详细信息网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">序列号</p>
              <p className="font-mono text-gray-900 font-medium">{asset.serialNumber}</p>
            </div>

            {metadata.attributes?.brand && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">品牌</p>
                <p className="text-gray-900 font-medium">{metadata.attributes.brand}</p>
              </div>
            )}

            {metadata.attributes?.category && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">分类</p>
                <p className="text-gray-900">{metadata.attributes.category}</p>
              </div>
            )}

            {metadata.attributes?.model && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">型号</p>
                <p className="text-gray-900">{metadata.attributes.model}</p>
              </div>
            )}

            {metadata.attributes?.color && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">颜色</p>
                <p className="text-gray-900">{metadata.attributes.color}</p>
              </div>
            )}

            {metadata.attributes?.size && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">尺寸</p>
                <p className="text-gray-900">{metadata.attributes.size}</p>
              </div>
            )}

            {metadata.attributes?.condition && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">成色</p>
                <p className="text-gray-900">{metadata.attributes.condition}</p>
              </div>
            )}

            {metadata.attributes?.purchaseDate && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">购买日期</p>
                <p className="text-gray-900">{metadata.attributes.purchaseDate}</p>
              </div>
            )}

            {metadata.attributes?.warrantyUntil && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">保修期至</p>
                <p className="text-gray-900">{metadata.attributes.warrantyUntil}</p>
              </div>
            )}

            {metadata.attributes?.certificateUrl && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">官方证书</p>
                <a 
                  href={metadata.attributes.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  查看证书 →
                </a>
              </div>
            )}

            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">所有者</p>
              <p className="font-mono text-gray-900 text-sm">{formatAddress(asset.owner)}</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">上架状态</p>
              <p className="text-gray-900 font-medium">
                {asset.isListed ? '在售中' : '未上架'}
              </p>
            </div>
          </div>

          {/* 区块链信息 */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-4">区块链信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">资产 ID</p>
                <p className="font-mono text-gray-900">#{asset.id}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">品牌地址</p>
                <p className="font-mono text-gray-900 text-xs">{formatAddress(asset.brand)}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">所有者地址</p>
                <p className="font-mono text-gray-900 text-xs">{formatAddress(asset.owner)}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">创建时间</p>
                <p className="text-gray-900">{new Date(asset.createdAt * 1000).toLocaleString('zh-CN')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
