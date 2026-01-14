/**
 * 完整的资产注册表单组件
 * 
 * 功能：
 * 1. 完整的表单字段（15+个）
 * 2. 照片上传（自动上传到 IPFS）
 * 3. 表单验证
 * 4. 自动生成元数据
 * 5. 一键注册并上架
 */

import React, { useState } from 'react';
import { ethers } from 'ethers';
import ImageUpload from './ImageUpload';
import WorldAreaSelector from './WorldAreaSelector';

// API 地址
const API_URL = 'http://localhost:8080';

// 表单数据接口
interface FormData {
  // 基础信息
  name: string;                    // 资产名称
  serialNumber: string;            // 序列号
  description: string;             // 描述
  
  // 分类信息
  category: string;                // 分类
  brand: string;                   // 品牌
  model: string;                   // 型号
  
  // 商品详情
  size: string;                    // 尺码
  color: string;                   // 颜色
  condition: 'new' | 'used' | 'refurbished';  // 新旧程度
  productionDate: string;          // 生产日期
  productionLocation: string;      // 生产地（完整地址）
  
  // NFC/物理标识
  nfcTagId: string;               // NFC 标签 ID
  
  // 证书信息
  certificateUrl: string;          // 证书链接
  
  // 上架信息
  listImmediately: boolean;        // 是否立即上架
  price: string;                   // 价格（ETH）
}

interface AssetRegistrationFormProps {
  account: string;                 // 用户地址
  isBrand: boolean;                // 是否是品牌方
  contractAddress: string;         // 合约地址
  contractABI: any[];              // 合约 ABI
  onSuccess: () => void;           // 成功回调
}

const AssetRegistrationForm: React.FC<AssetRegistrationFormProps> = ({
  account,
  isBrand,
  contractAddress,
  contractABI,
  onSuccess
}) => {
  // ==================== 状态管理 ====================
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    serialNumber: '',
    description: '',
    category: '',
    brand: '',
    model: '',
    size: '',
    color: '',
    condition: 'new',
    productionDate: '',
    productionLocation: '',
    nfcTagId: '',
    certificateUrl: '',
    listImmediately: false,
    price: ''
  });

  const [imageHashes, setImageHashes] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState('');

  // ==================== 一键填写 ====================
  
  /**
   * 一键填写随机数据
   * 自动生成所有表单字段的测试数据
   */
  const autoFillForm = () => {
    // 品牌列表
    const brands = ['Nike', 'Adidas', 'Gucci', 'Louis Vuitton', 'Prada', 'Chanel', 'Hermès', 'Rolex', 'Apple', 'Samsung'];
    
    // 商品名称模板
    const productNames = {
      shoes: ['Air Jordan 1', 'Air Max 90', 'Yeezy 350', 'Stan Smith', 'Superstar'],
      clothing: ['连帽卫衣', 'T恤', '牛仔裤', '运动裤', '夹克'],
      accessories: ['手提包', '钱包', '腰带', '太阳镜', '围巾'],
      electronics: ['智能手机', '笔记本电脑', '平板电脑', '智能手表', '耳机'],
      jewelry: ['项链', '手链', '戒指', '耳环', '胸针'],
      watches: ['机械表', '石英表', '智能手表', '潜水表', '飞行员表']
    };
    
    // 颜色列表
    const colors = ['黑色', '白色', '红色', '蓝色', '绿色', '黄色', '粉色', '紫色', '灰色', '棕色', '橙色', '金色', '银色'];
    
    // 尺码列表
    const sizes = {
      shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
      clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      accessories: ['均码', '小号', '中号', '大号'],
      electronics: ['64GB', '128GB', '256GB', '512GB', '1TB'],
      jewelry: ['14寸', '16寸', '18寸', '20寸'],
      watches: ['38mm', '40mm', '42mm', '44mm']
    };
    
    // 描述模板
    const descriptions = [
      '全新未拆封，原装正品，支持专柜验货',
      '经典款式，品质保证，附带完整包装和配件',
      '限量版，稀有配色，收藏价值极高',
      '热门款式，现货速发，支持无理由退换',
      '官方授权，正品保证，提供质保服务',
      '精品推荐，细节完美，值得入手',
      '爆款热卖，性价比超高，不容错过',
      '高端奢华，彰显品味，送礼佳品'
    ];
    
    // 生产地列表（省-市-区）
    const locations = [
      '广东省-广州市-天河区',
      '广东省-深圳市-南山区',
      '广东省-东莞市-东莞市',
      '浙江省-杭州市-西湖区',
      '浙江省-温州市-鹿城区',
      '江苏省-苏州市-姑苏区',
      '上海市-上海市-浦东新区',
      '北京市-北京市-朝阳区',
      '福建省-福州市-鼓楼区',
      '福建省-泉州市-丰泽区'
    ];
    
    // 随机选择函数
    const random = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    
    // 随机选择分类
    const categories = ['shoes', 'clothing', 'accessories', 'electronics', 'jewelry', 'watches'];
    const selectedCategory = random(categories) as keyof typeof productNames;
    
    // 随机选择品牌
    const selectedBrand = random(brands);
    
    // 随机选择商品名称
    const selectedProductName = random(productNames[selectedCategory]);
    
    // 生成完整商品名称
    const fullName = `${selectedBrand} ${selectedProductName}`;
    
    // 生成序列号
    const timestamp = Date.now().toString().slice(-8);
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const serialNumber = `${selectedBrand.toUpperCase().replace(/\s+/g, '')}-ITEM-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${randomNum}`;
    
    // 随机选择颜色
    const selectedColor = random(colors);
    
    // 随机选择尺码
    const sizeOptions = sizes[selectedCategory] || sizes.accessories;
    const selectedSize = random(sizeOptions);
    
    // 随机选择描述
    const selectedDescription = random(descriptions);
    
    // 随机选择生产地
    const selectedLocation = random(locations);
    
    // 随机生成生产日期（最近一年内）
    const today = new Date();
    const randomDays = Math.floor(Math.random() * 365);
    const productionDate = new Date(today.getTime() - randomDays * 24 * 60 * 60 * 1000);
    const formattedDate = productionDate.toISOString().split('T')[0];
    
    // 随机选择状况
    const conditions: ('new' | 'used' | 'refurbished')[] = ['new', 'new', 'new', 'used', 'refurbished']; // 新品概率更高
    const selectedCondition = random(conditions);
    
    // 生成型号
    const modelSuffix = ['Pro', 'Max', 'Plus', 'Ultra', 'Classic', 'Limited', 'Special Edition'];
    const selectedModel = `${selectedProductName} ${random(modelSuffix)}`;
    
    // 随机生成 NFC 标签 ID（总是生成）
    const nfcTagId = `NFC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    // 随机生成证书 URL（总是生成）
    const certificateUrl = `https://certificate.${selectedBrand.toLowerCase().replace(/\s+/g, '')}.com/${Math.random().toString(36).substring(2, 10)}`;
    
    // 随机决定是否立即上架
    const shouldList = Math.random() > 0.5;
    const price = shouldList ? (Math.random() * 5 + 0.1).toFixed(3) : '';
    
    // 填充表单
    setFormData({
      name: fullName,
      serialNumber: serialNumber,
      description: selectedDescription,
      category: selectedCategory,
      brand: selectedBrand,
      model: selectedModel,
      size: selectedSize,
      color: selectedColor,
      condition: selectedCondition,
      productionDate: formattedDate,
      productionLocation: selectedLocation,
      nfcTagId: nfcTagId,
      certificateUrl: certificateUrl,
      listImmediately: shouldList,
      price: price
    });
    
    // 清空错误
    setErrors([]);
    
    // 提示用户
    alert(`✅ 已自动填充表单！\n\n📦 商品：${fullName}\n🏷️ 序列号：${serialNumber}\n🎨 颜色：${selectedColor}\n📏 尺码：${selectedSize}\n${shouldList ? `💰 价格：${price} ETH` : '📦 暂不上架'}\n\n⚠️ 请记得上传图片！`);
  };

  // ==================== 表单验证 ====================
  
  /**
   * 验证表单
   * 检查所有必填字段是否已填写
   */
  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    // 必填字段检查
    if (!formData.name.trim()) {
      newErrors.push('❌ 请输入资产名称');
    }
    
    if (!formData.serialNumber.trim()) {
      newErrors.push('❌ 请输入序列号');
    } else if (!/^[A-Z0-9\-]+$/i.test(formData.serialNumber)) {
      newErrors.push('❌ 序列号格式不正确（仅支持字母、数字和连字符）');
    }
    
    if (!formData.category) {
      newErrors.push('❌ 请选择商品分类');
    }
    
    if (!formData.brand.trim()) {
      newErrors.push('❌ 请输入品牌');
    }
    
    if (imageHashes.length === 0) {
      newErrors.push('❌ 请至少上传一张商品照片');
    }
    
    if (formData.listImmediately) {
      if (!formData.price) {
        newErrors.push('❌ 立即上架需要设置价格');
      } else if (parseFloat(formData.price) <= 0) {
        newErrors.push('❌ 价格必须大于 0');
      }
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // ==================== 表单提交 ====================
  
  /**
   * 提交表单
   * 流程：
   * 1. 验证表单
   * 2. 生成元数据并上传到 IPFS
   * 3. 注册资产到区块链
   * 4. 如果需要，立即上架
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔥 表单提交开始');
    console.log('📋 表单数据:', formData);
    console.log('🖼️ 图片数量:', imageHashes.length);
    
    // 验证表单
    if (!validateForm()) {
      console.log('❌ 表单验证失败');
      return;
    }
    
    console.log('✅ 表单验证通过');
    
    setUploading(true);
    setUploadProgress(0);
    setTxStatus('');
    
    try {
      // ==================== 步骤 1：生成元数据 ====================
      setTxStatus('正在生成元数据...');
      setUploadProgress(20);
      
      const metadataResponse = await fetch(`${API_URL}/ipfs/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          serialNumber: formData.serialNumber,
          brandName: formData.brand,
          brandAddress: account,
          category: formData.category,
          model: formData.model,
          imageHashes: imageHashes,
          // 商品详情
          size: formData.size,
          color: formData.color,
          condition: formData.condition,
          productionDate: formData.productionDate,
          productionLocation: formData.productionLocation,
          // NFC 信息
          nfcTagId: formData.nfcTagId,
          // 证书信息
          certificateUrl: formData.certificateUrl
        })
      });
      
      if (!metadataResponse.ok) {
        throw new Error('元数据生成失败');
      }
      
      const { uri: metadataURI } = await metadataResponse.json();
      
      // ==================== 步骤 2：注册资产到区块链 ====================
      setTxStatus('正在注册资产到区块链...');
      setUploadProgress(50);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      let tx;
      if (isBrand) {
        // 品牌方注册（自动验证）
        tx = await contract.registerAsset(
          formData.name,
          formData.serialNumber,
          metadataURI
        );
      } else {
        // 用户注册（需要验证）
        tx = await contract.registerAssetByUser(
          formData.name,
          formData.serialNumber,
          metadataURI
        );
      }
      
      setTxHash(tx.hash);
      setTxStatus('等待交易确认...');
      setUploadProgress(75);
      
      const receipt = await tx.wait();
      
      // 获取资产 ID（从事件中）
      // 遍历日志找到 AssetRegistered 事件
      let assetId;
      console.log('🔍 解析交易回执:', receipt);
      
      // 尝试解析所有日志以找到 AssetRegistered
      for (const log of receipt.logs) {
        try {
          // 检查是否是 AssetRegistered 事件
          // 事件签名 hash: 0x...
          // 这里我们尝试解析日志
          const parsedLog = contract.interface.parseLog({
            topics: [...log.topics],
            data: log.data
          });
          
          if (parsedLog && parsedLog.name === 'AssetRegistered') {
            assetId = parsedLog.args.assetId;
            console.log('✅ 找到 AssetRegistered 事件，AssetID:', assetId.toString());
            break;
          }
        } catch (e) {
          // 忽略解析错误的日志（可能是其他合约的事件）
          continue;
        }
      }
      
      // 降级策略：如果没找到特定事件，尝试使用第一个日志的第一个参数
      if (!assetId) {
        console.warn('⚠️ 未找到 AssetRegistered 事件，尝试使用第一个日志...');
        assetId = receipt.logs[0]?.args?.assetId || receipt.logs[0]?.args?.[0];
      }
      
      // 确保 assetId 是字符串或数字
      const assetIdStr = assetId ? assetId.toString() : '';
      
      console.log('🔍 最终使用的 assetId:', assetIdStr);
      console.log('🖼️ imageHashes 数量:', imageHashes.length);
      
      // ==================== 步骤 3：更新资产图片到数据库 ====================
      if (assetIdStr && imageHashes.length > 0) {
        setTxStatus('正在保存图片...');
        setUploadProgress(80);
        
        // 收集所有 base64 图片（以 data: 开头）
        const base64Images = imageHashes.filter(h => h.startsWith('data:'));
        console.log('📸 过滤后的 base64 图片数量:', base64Images.length);
        
        if (base64Images.length > 0) {
          try {
            console.log('🚀 开始上传图片到数据库...');
            console.log('📡 API URL:', `${API_URL}/assets/${assetIdStr}/images`);
            // 不打印完整图片数据，太长了
            console.log('📦 请求包含图片数量:', base64Images.length);
            
            const updateResponse = await fetch(`${API_URL}/assets/${assetIdStr}/images`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ images: base64Images })
            });
            
            console.log('📥 响应状态:', updateResponse.status);
            
            if (!updateResponse.ok) {
              const errorText = await updateResponse.text();
              console.error('❌ 图片更新失败:', errorText);
              // 不要在界面上报错，因为资产已经注册成功了
              // 只在控制台输出
            } else {
              const result = await updateResponse.json();
              console.log('✅ 图片保存成功:', result);
            }
          } catch (err) {
            console.error('❌ 图片更新异常:', err);
          }
        } else {
          console.warn('⚠️ 没有 base64 格式的图片');
        }
      } else {
        console.warn('⚠️ 跳过图片保存:', { assetId: assetIdStr, imageHashesLength: imageHashes.length });
      }
      
      // ==================== 步骤 4：如果需要，立即上架 ====================
      if (formData.listImmediately && formData.price && assetId) {
        setTxStatus('正在上架资产...');
        setUploadProgress(85);
        
        const price = ethers.parseEther(formData.price);
        const listTx = await contract.listAsset(assetId, price);
        await listTx.wait();
      }
      
      // ==================== 完成 ====================
      setUploadProgress(100);
      setTxStatus('注册成功！');
      
      // 2秒后重置表单
      setTimeout(() => {
        resetForm();
        onSuccess();
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ 注册失败:', error);
      console.error('错误详情:', error);
      const errorMsg = error.message || error.toString() || '未知错误';
      
      // 检测常见错误：Missing revert data (Nonce 不匹配)
      if (errorMsg.includes('missing revert data') || errorMsg.includes('Nonce too high') || errorMsg.includes('replacement transaction underpriced')) {
        const tip = "⚠️ 交易失败：检测到钱包状态不一致。\n\n💡 解决方案：请重置 MetaMask 账户（设置 -> 高级 -> 清除活动数据），然后刷新页面重试。";
        setTxStatus(tip);
        alert(tip);
      } else {
        setTxStatus(`❌ 注册失败: ${errorMsg}`);
        alert(`注册失败: ${errorMsg}`);
      }
    } finally {
      setUploading(false);
    }
  };

  /**
   * 重置表单
   */
  const resetForm = () => {
    setFormData({
      name: '',
      serialNumber: '',
      description: '',
      category: '',
      brand: '',
      model: '',
      size: '',
      color: '',
      condition: 'new',
      productionDate: '',
      productionLocation: '',
      nfcTagId: '',
      certificateUrl: '',
      listImmediately: false,
      price: ''
    });
    setImageHashes([]);
    setErrors([]);
    setUploading(false);
    setUploadProgress(0);
    setTxHash('');
    setTxStatus('');
  };

  /**
   * 生成序列号
   * 格式：品牌缩写-分类-年月日-随机4位数
   * 例如：NK-SHOES-20240107-8234
   */
  const generateSerialNumber = () => {
    // 品牌缩写（取前2-3个字符）
    const brandPrefix = formData.brand 
      ? formData.brand.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '')
      : 'BRAND';
    
    // 分类缩写
    const categoryMap: Record<string, string> = {
      'shoes': 'SHOES',
      'clothing': 'CLOTH',
      'accessories': 'ACCES',
      'bags': 'BAGS',
      'watches': 'WATCH',
      'jewelry': 'JEWEL',
      'electronics': 'ELECT',
      'collectibles': 'COLLEC',
      'sports': 'SPORT',
      'other': 'OTHER'
    };
    const categoryPrefix = formData.category 
      ? categoryMap[formData.category] || 'ITEM'
      : 'ITEM';
    
    // 日期（年月日）
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    
    // 随机4位数
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    
    // 组合
    const serialNumber = `${brandPrefix}-${categoryPrefix}-${dateStr}-${randomNum}`;
    
    updateField('serialNumber', serialNumber);
  };

  /**
   * 更新表单字段
   */
  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除错误提示
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // ==================== 渲染表单 ====================
  
  return (
    <form className="asset-registration-form" onSubmit={handleSubmit}>
      
      {/* ==================== 一键填写按钮 ==================== */}
      <div className="form-section" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div style={{ color: 'white' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>
              🎲 快速测试
            </h3>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              点击按钮自动填充所有表单字段（随机生成测试数据）
            </p>
          </div>
          <button
            type="button"
            onClick={autoFillForm}
            style={{
              background: 'white',
              color: '#667eea',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            }}
          >
            ✨ 一键填写所有字段
          </button>
        </div>
      </div>
      
      {/* ==================== 基础信息 ==================== */}
      <div className="form-section">
        <h3>📝 基础信息</h3>
        
        {/* 资产名称 */}
        <div className="form-group">
          <label>资产名称 <span className="required">*</span></label>
          <input
            type="text"
            placeholder="例如：耐克 Air Jordan 1 High OG 红黑配色"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
          />
          <span className="help-text">
            请输入完整的商品名称，建议包含品牌、型号、颜色等信息
          </span>
        </div>
        
        {/* 序列号 */}
        <div className="form-group">
          <label>序列号 <span className="required">*</span></label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <input
              type="text"
              placeholder="例如：NK-SHOES-20240107-1234"
              value={formData.serialNumber}
              onChange={(e) => updateField('serialNumber', e.target.value.toUpperCase())}
              pattern="[A-Z0-9\-]+"
              required
              style={{ flex: '1' }}
            />
            <button
              type="button"
              onClick={generateSerialNumber}
              className="btn btn-secondary"
              style={{
                padding: '14px 20px',
                whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(17, 153, 142, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ⚡ 自动生成
            </button>
          </div>
          <span className="help-text">
            💡 点击"自动生成"按钮可根据品牌和分类自动创建唯一序列号，也可手动输入
          </span>
        </div>
        
        {/* 描述 */}
        <div className="form-group">
          <label>商品描述</label>
          <textarea
            placeholder="详细描述商品的特点、状态、配件等..."
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
          />
          <span className="help-text">
            详细描述有助于买家了解商品，提高成交率
          </span>
        </div>
      </div>

      {/* ==================== 分类信息 ==================== */}
      <div className="form-section">
        <h3>🏷️ 分类信息</h3>
        
        {/* 分类 */}
        <div className="form-group">
          <label>商品分类 <span className="required">*</span></label>
          <select
            value={formData.category}
            onChange={(e) => updateField('category', e.target.value)}
            required
          >
            <option value="">请选择分类</option>
            <option value="shoes">👟 鞋类</option>
            <option value="clothing">👕 服装</option>
            <option value="accessories">👜 配饰</option>
            <option value="bags">🎒 箱包</option>
            <option value="watches">⌚ 手表</option>
            <option value="jewelry">💎 珠宝</option>
            <option value="electronics">📱 电子产品</option>
            <option value="collectibles">🎨 收藏品</option>
            <option value="sports">⚽ 运动器材</option>
            <option value="other">📦 其他</option>
          </select>
        </div>
        
        {/* 品牌和型号（并排） */}
        <div className="form-row">
          <div className="form-group">
            <label>品牌 <span className="required">*</span></label>
            <input
              type="text"
              placeholder="输入或选择品牌名称"
              value={formData.brand}
              onChange={(e) => updateField('brand', e.target.value)}
              list="brand-suggestions"
              required
              style={{
                background: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e") no-repeat right 12px center',
                backgroundSize: '20px',
                paddingRight: '40px'
              }}
            />
            <datalist id="brand-suggestions">
              <option value="Nike" />
              <option value="Adidas" />
              <option value="Jordan" />
              <option value="Yeezy" />
              <option value="Supreme" />
              <option value="Gucci" />
              <option value="Louis Vuitton" />
              <option value="Hermès" />
              <option value="Chanel" />
              <option value="Prada" />
              <option value="Balenciaga" />
              <option value="Off-White" />
              <option value="Rolex" />
              <option value="Apple" />
              <option value="其他品牌" />
            </datalist>
            <span className="help-text">
              💡 可以从列表中选择，也可以直接输入新品牌
            </span>
          </div>
          
          <div className="form-group">
            <label>型号/款式</label>
            <input
              type="text"
              placeholder="例如：Air Jordan 1 High OG"
              value={formData.model}
              onChange={(e) => updateField('model', e.target.value)}
            />
          </div>
        </div>
        
        {/* 尺码和颜色（并排） */}
        <div className="form-row">
          <div className="form-group">
            <label>尺码/规格</label>
            <input
              type="text"
              placeholder="例如：42 或 M 或 10.5"
              value={formData.size}
              onChange={(e) => updateField('size', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>颜色</label>
            <input
              type="text"
              placeholder="例如：红黑配色"
              value={formData.color}
              onChange={(e) => updateField('color', e.target.value)}
            />
          </div>
        </div>
        
        {/* 新旧程度 */}
        <div className="form-group">
          <label>商品状态 <span className="required">*</span></label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="condition"
                value="new"
                checked={formData.condition === 'new'}
                onChange={() => updateField('condition', 'new')}
              />
              <span>🆕 全新</span>
              <span className="help-text">未使用过，带原包装</span>
            </label>
            
            <label className="radio-label">
              <input
                type="radio"
                name="condition"
                value="used"
                checked={formData.condition === 'used'}
                onChange={() => updateField('condition', 'used')}
              />
              <span>♻️ 二手</span>
              <span className="help-text">使用过，有使用痕迹</span>
            </label>
            
            <label className="radio-label">
              <input
                type="radio"
                name="condition"
                value="refurbished"
                checked={formData.condition === 'refurbished'}
                onChange={() => updateField('condition', 'refurbished')}
              />
              <span>🔧 翻新</span>
              <span className="help-text">经过翻新或维修</span>
            </label>
          </div>
        </div>
        
        {/* 生产日期和地点（并排） */}
        <div className="form-row">
          <div className="form-group">
            <label>生产日期</label>
            <input
              type="date"
              value={formData.productionDate}
              onChange={(e) => updateField('productionDate', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>生产地</label>
            <WorldAreaSelector
              value={formData.productionLocation}
              onChange={(value) => updateField('productionLocation', value)}
              placeholder="请选择生产地（中国/世界各国）"
            />
            <span className="help-text">
              💡 支持搜索，选择省市区后自动组合完整地址
            </span>
          </div>
        </div>
      </div>

      {/* ==================== 照片上传 ==================== */}
      <div className="form-section">
        <h3>📷 商品照片 <span className="required">*</span></h3>
        <p className="section-description">
          建议上传商品的多角度照片，包括正面、侧面、底部、细节等
        </p>
        
        <ImageUpload
          onUpload={setImageHashes}
          maxImages={5}
          apiUrl={API_URL}
        />
      </div>

      {/* ==================== 物理标识 ==================== */}
      <div className="form-section">
        <h3>🏷️ 物理标识（可选）</h3>
        
        {/* NFC 标签 ID */}
        <div className="form-group">
          <label>NFC 标签 ID</label>
          <input
            type="text"
            placeholder="例如：NFC-001234"
            value={formData.nfcTagId}
            onChange={(e) => updateField('nfcTagId', e.target.value)}
          />
          <span className="help-text">
            如果商品有 NFC 标签，请输入标签 ID（可用于防伪验证）
          </span>
        </div>
        
        {/* 证书链接 */}
        <div className="form-group">
          <label>品牌证书/鉴定报告</label>
          <input
            type="url"
            placeholder="https://..."
            value={formData.certificateUrl}
            onChange={(e) => updateField('certificateUrl', e.target.value)}
          />
          <span className="help-text">
            品牌官方证书或第三方鉴定报告的链接
          </span>
        </div>
      </div>

      {/* ==================== 上架设置 ==================== */}
      <div className="form-section">
        <h3>💰 上架设置（可选）</h3>
        
        {/* 是否立即上架 */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.listImmediately}
              onChange={(e) => updateField('listImmediately', e.target.checked)}
            />
            <span>注册后立即上架销售</span>
          </label>
          <span className="help-text">
            勾选后，资产注册成功后会自动上架到市场
          </span>
        </div>
        
        {/* 价格（仅在立即上架时显示） */}
        {formData.listImmediately && (
          <div className="form-group">
            <label>售价 (ETH) <span className="required">*</span></label>
            <input
              type="number"
              step="0.001"
              min="0"
              placeholder="0.5"
              value={formData.price}
              onChange={(e) => updateField('price', e.target.value)}
              required={formData.listImmediately}
            />
            <span className="help-text">
              设置合理的价格有助于快速成交
            </span>
          </div>
        )}
      </div>

      {/* ==================== 表单验证错误 ==================== */}
      {errors.length > 0 && (
        <div className="validation-errors">
          <h4>⚠️ 请完善以下信息：</h4>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ==================== 提交按钮 ==================== */}
      <div className="form-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={resetForm}
          disabled={uploading}
        >
          🔄 重置表单
        </button>
        
        <button
          type="submit"
          className="btn-primary"
          disabled={uploading || imageHashes.length === 0}
        >
          {uploading ? (
            <>
              <span className="spinner"></span>
              {txStatus || '处理中...'}
              {uploadProgress > 0 && ` (${uploadProgress}%)`}
            </>
          ) : (
            <>
              ✅ 注册资产
              {formData.listImmediately && ' 并上架'}
            </>
          )}
        </button>
      </div>

      {/* ==================== 交易状态 ==================== */}
      {txStatus && (
        <div className={`tx-status ${txStatus.includes('成功') ? 'success' : ''}`}>
          <p>{txStatus}</p>
          {txHash && (
            <p className="tx-hash">
              交易哈希: 
              <a 
                href={`https://etherscan.io/tx/${txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            </p>
          )}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* ==================== 表单说明 ==================== */}
      <div className="form-info">
        <h4>💡 填写提示：</h4>
        <ul>
          <li><span className="required">*</span> 标记的为必填项</li>
          <li>序列号必须全局唯一，建议使用商品标签上的编号</li>
          <li>至少上传一张商品照片，建议上传多角度照片</li>
          <li>品牌方注册的资产会自动验证，用户注册需要等待验证</li>
          <li>立即上架需要设置价格，也可以稍后再上架</li>
        </ul>
      </div>
    </form>
  );
};

export default AssetRegistrationForm;

