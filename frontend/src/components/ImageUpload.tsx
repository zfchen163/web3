/**
 * 图片上传组件 - 优化版
 * 
 * 功能：
 * 1. 支持多张图片上传（最多5张）
 * 2. 自动上传到 IPFS
 * 3. 显示上传进度
 * 4. 图片预览
 * 5. 删除已上传的图片
 * 6. 更明显的视觉设计
 */

import React, { useState, useRef } from 'react';

// 上传的图片信息
interface UploadedImage {
  file: File;              // 原始文件
  preview: string;         // 预览 URL
  hash?: string;           // IPFS 哈希值（保留字段，兼容 IPFS）
  base64?: string;         // base64 编码的图片（data URI 格式）
  uploading: boolean;      // 是否正在上传
  progress: number;        // 上传进度（0-100）
  error?: string;          // 错误信息
}

interface ImageUploadProps {
  onUpload: (hashes: string[]) => void;  // 上传完成回调
  maxImages?: number;                     // 最多上传数量
  apiUrl?: string;                        // API 地址
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onUpload, 
  maxImages = 5,
  apiUrl = 'http://localhost:8080'
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 处理文件选择
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // 检查数量限制
    if (files.length + images.length > maxImages) {
      alert(`最多只能上传 ${maxImages} 张照片`);
      return;
    }

    // 检查文件类型
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} 不是图片文件`);
        return false;
      }
      return true;
    });

    // 检查文件大小（最大 10MB）
    const sizeLimit = 10 * 1024 * 1024;
    const validSizeFiles = validFiles.filter(file => {
      if (file.size > sizeLimit) {
        alert(`${file.name} 超过 10MB，请选择更小的文件`);
        return false;
      }
      return true;
    });

    // 上传每个文件
    for (const file of validSizeFiles) {
      await uploadFile(file);
    }
    
    // 清空 input 以允许重复选择同一文件
    if (e.target) {
      e.target.value = '';
    }
  };

  /**
   * 上传单个文件到 IPFS
   */
  const uploadFile = async (file: File) => {
    // 创建预览
    const preview = URL.createObjectURL(file);
    
    // 添加到图片列表
    const newImage: UploadedImage = {
      file,
      preview,
      uploading: true,
      progress: 0
    };
    
    setImages(prev => [...prev, newImage]);
    
    const imageIndex = images.length;
    
    try {
      // 创建 FormData
      const formData = new FormData();
      formData.append('images', file);  // 改为 'images' 以匹配后端
      
      // 上传到后端 IPFS 接口
      const response = await fetch(`${apiUrl}/ipfs/upload/images`, {  // 改为 /images
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        // 尝试获取详细错误信息
        let errorMessage = '上传失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // 如果响应不是 JSON，使用状态文本
          errorMessage = `上传失败 (${response.status} ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // 后端返回的是数组 { base64: ["data:image/jpeg;base64,..."], count: 1 }
      const base64Array = data.base64 || [];
      if (base64Array.length === 0) {
        throw new Error('服务器返回数据格式错误：缺少 base64 字段');
      }
      
      const imageData = base64Array[0]; // 获取第一个 base64 图片
      
      // 更新图片状态
      setImages(prev => {
        const updated = [...prev];
        updated[imageIndex] = {
          ...updated[imageIndex],
          base64: imageData, // 存储 base64
          uploading: false,
          progress: 100
        };
        return updated;
      });
      
      // 通知父组件：传递所有 base64 图片
      const allImageData = [...images
        .filter(img => img.base64)
        .map(img => img.base64!), imageData];
      
      onUpload(allImageData);
      
    } catch (error) {
      console.error('上传失败:', error);
      
      // 更新错误状态
      setImages(prev => {
        const updated = [...prev];
        updated[imageIndex] = {
          ...updated[imageIndex],
          uploading: false,
          error: '上传失败'
        };
        return updated;
      });
    }
  };

  /**
   * 删除图片
   */
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    
    // 通知父组件更新图片列表（base64）
    const allImageData = newImages
      .filter(img => img.base64)
      .map(img => img.base64!);
    
    onUpload(allImageData);
  };

  return (
    <div className="image-upload-container">
      {/* 超大上传区域 - 非常明显 */}
      <div 
        className={`upload-area ${images.length >= maxImages ? 'disabled' : ''}`}
        onClick={() => images.length < maxImages && fileInputRef.current?.click()}
        style={{
          border: '3px dashed #667eea',
          borderRadius: '20px',
          padding: '60px 40px',
          textAlign: 'center',
          cursor: images.length >= maxImages ? 'not-allowed' : 'pointer',
          background: images.length >= maxImages 
            ? '#f5f5f5'
            : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
          transition: 'all 0.3s ease',
          opacity: images.length >= maxImages ? 0.6 : 1
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {/* 超大图标 */}
        <div style={{ 
          fontSize: '6rem', 
          marginBottom: '24px',
          animation: 'bounce 2s infinite'
        }}>
          📷
        </div>
        
        {/* 明显的主文字 */}
        <div style={{ 
          fontSize: '1.8rem', 
          fontWeight: '800', 
          color: '#667eea',
          marginBottom: '16px',
          letterSpacing: '-0.5px'
        }}>
          {images.length >= maxImages ? '已达到上传上限' : '📸 点击上传商品照片'}
        </div>
        
        {/* 详细提示 */}
        <div style={{
          fontSize: '1.1rem',
          color: '#666',
          lineHeight: '2',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <div style={{ marginBottom: '8px' }}>
            ✅ 支持 JPG、PNG 等图片格式
          </div>
          <div style={{ marginBottom: '8px' }}>
            📊 最多上传 <strong style={{ color: '#667eea' }}>{maxImages}</strong> 张，每张不超过 10MB
          </div>
          <div>
            💡 建议上传商品全景照和细节特写
          </div>
        </div>
        
        {/* 当前数量提示 */}
        {images.length > 0 && (
          <div style={{
            marginTop: '20px',
            fontSize: '1rem',
            color: '#11998e',
            fontWeight: '600'
          }}>
            已上传 {images.length}/{maxImages} 张照片
          </div>
        )}
      </div>

      {/* 图片预览网格 */}
      {images.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '16px',
          marginTop: '24px'
        }}>
          {images.map((img, index) => (
            <div 
              key={index} 
              style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                aspectRatio: '1',
                background: '#f3f4f6',
                border: '2px solid #e5e7eb',
                transition: 'all 0.3s ease'
              }}
            >
              <img 
                src={img.preview} 
                alt={`预览 ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              
              {/* 删除按钮 */}
              <button
                onClick={() => removeImage(index)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="删除"
              >
                ✕
              </button>
              
              {/* 上传状态 */}
              {img.uploading && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '8px',
                  fontSize: '0.85rem',
                  color: '#667eea',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  上传中...
                </div>
              )}
              
              {/* 上传成功标识 */}
              {img.hash && !img.uploading && (
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}>
                  ✓ 已上传
                </div>
              )}
              
              {/* 错误标识 */}
              {img.error && (
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  background: '#ef4444',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}>
                  ✕ {img.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
