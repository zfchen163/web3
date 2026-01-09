/**
 * 世界地区选择组件
 * 支持中国省市区 + 世界各国
 * 
 * 功能：
 * - 中国：完整的省市区三级联动
 * - 其他国家：国家 + 城市（可选）
 */

import React from 'react';
import { Cascader } from 'antd';
import type { CascaderProps } from 'antd';
import { regionData, codeToText } from 'element-china-area-data';

interface WorldAreaSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// 世界主要国家列表（按地区分组）
const worldCountries = [
  {
    value: 'china',
    label: '🇨🇳 中国',
    children: regionData  // 使用完整的中国省市区数据
  },
  {
    value: 'asia',
    label: '亚洲',
    children: [
      { value: 'japan', label: '🇯🇵 日本' },
      { value: 'korea', label: '🇰🇷 韩国' },
      { value: 'singapore', label: '🇸🇬 新加坡' },
      { value: 'thailand', label: '🇹🇭 泰国' },
      { value: 'vietnam', label: '🇻🇳 越南' },
      { value: 'malaysia', label: '🇲🇾 马来西亚' },
      { value: 'indonesia', label: '🇮🇩 印度尼西亚' },
      { value: 'philippines', label: '🇵🇭 菲律宾' },
      { value: 'india', label: '🇮🇳 印度' },
      { value: 'pakistan', label: '🇵🇰 巴基斯坦' },
      { value: 'bangladesh', label: '🇧🇩 孟加拉国' },
      { value: 'myanmar', label: '🇲🇲 缅甸' },
      { value: 'cambodia', label: '🇰🇭 柬埔寨' },
      { value: 'laos', label: '🇱🇦 老挝' },
    ]
  },
  {
    value: 'europe',
    label: '欧洲',
    children: [
      { value: 'uk', label: '🇬🇧 英国' },
      { value: 'france', label: '🇫🇷 法国' },
      { value: 'germany', label: '🇩🇪 德国' },
      { value: 'italy', label: '🇮🇹 意大利' },
      { value: 'spain', label: '🇪🇸 西班牙' },
      { value: 'portugal', label: '🇵🇹 葡萄牙' },
      { value: 'netherlands', label: '🇳🇱 荷兰' },
      { value: 'belgium', label: '🇧🇪 比利时' },
      { value: 'switzerland', label: '🇨🇭 瑞士' },
      { value: 'austria', label: '🇦🇹 奥地利' },
      { value: 'sweden', label: '🇸🇪 瑞典' },
      { value: 'norway', label: '🇳🇴 挪威' },
      { value: 'denmark', label: '🇩🇰 丹麦' },
      { value: 'finland', label: '🇫🇮 芬兰' },
      { value: 'poland', label: '🇵🇱 波兰' },
      { value: 'russia', label: '🇷🇺 俄罗斯' },
      { value: 'greece', label: '🇬🇷 希腊' },
      { value: 'turkey', label: '🇹🇷 土耳其' },
    ]
  },
  {
    value: 'americas',
    label: '美洲',
    children: [
      { value: 'usa', label: '🇺🇸 美国' },
      { value: 'canada', label: '🇨🇦 加拿大' },
      { value: 'mexico', label: '🇲🇽 墨西哥' },
      { value: 'brazil', label: '🇧🇷 巴西' },
      { value: 'argentina', label: '🇦🇷 阿根廷' },
      { value: 'chile', label: '🇨🇱 智利' },
      { value: 'colombia', label: '🇨🇴 哥伦比亚' },
      { value: 'peru', label: '🇵🇪 秘鲁' },
    ]
  },
  {
    value: 'oceania',
    label: '大洋洲',
    children: [
      { value: 'australia', label: '🇦🇺 澳大利亚' },
      { value: 'new-zealand', label: '🇳🇿 新西兰' },
    ]
  },
  {
    value: 'africa',
    label: '非洲',
    children: [
      { value: 'south-africa', label: '🇿🇦 南非' },
      { value: 'egypt', label: '🇪🇬 埃及' },
      { value: 'nigeria', label: '🇳🇬 尼日利亚' },
      { value: 'kenya', label: '🇰🇪 肯尼亚' },
      { value: 'morocco', label: '🇲🇦 摩洛哥' },
    ]
  },
  {
    value: 'middle-east',
    label: '中东',
    children: [
      { value: 'uae', label: '🇦🇪 阿联酋' },
      { value: 'saudi-arabia', label: '🇸🇦 沙特阿拉伯' },
      { value: 'israel', label: '🇮🇱 以色列' },
      { value: 'qatar', label: '🇶🇦 卡塔尔' },
    ]
  }
];

const WorldAreaSelector: React.FC<WorldAreaSelectorProps> = ({
  value,
  onChange,
  placeholder = '请选择生产地',
  disabled = false
}) => {
  
  const handleChange: CascaderProps['onChange'] = (selectedValues, selectedOptions) => {
    if (!selectedValues || selectedValues.length === 0) {
      onChange?.('');
      return;
    }
    
    // 获取选择的文本标签
    const labels = selectedOptions?.map(option => {
      // 移除 emoji 和空格
      const label = option.label as string;
      return label.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    }) || [];
    
    let formattedText = '';
    
    // 如果选择的是中国
    if (selectedValues[0] === 'china') {
      // 中国省市区：使用原有逻辑
      const texts = labels.slice(1); // 去掉 "中国"
      if (texts.length === 3 && texts[0] === texts[1]) {
        // 直辖市
        formattedText = `${texts[0]} ${texts[2]}`;
      } else {
        formattedText = texts.join(' ');
      }
    } else {
      // 其他国家：只显示国家名
      formattedText = labels[labels.length - 1]; // 取最后一个（国家名）
    }
    
    onChange?.(formattedText);
  };

  const displayRender = (labels: string[]) => {
    // 移除 emoji 用于显示
    const cleanLabels = labels.map(label => 
      label.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()
    );
    
    // 如果是中国的省市区，优化显示
    if (cleanLabels[0] === '中国' && cleanLabels.length > 3) {
      const provinceCity = cleanLabels.slice(1);
      if (provinceCity[0] === provinceCity[1]) {
        return `${cleanLabels[0]} / ${provinceCity[0]} / ${provinceCity[2]}`;
      }
    }
    
    return cleanLabels.join(' / ');
  };

  return (
    <Cascader
      options={worldCountries}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      displayRender={displayRender}
      style={{ width: '100%' }}
      showSearch={{
        filter: (inputValue, path) =>
          path.some(
            option =>
              (option.label as string).toLowerCase().indexOf(inputValue.toLowerCase()) > -1
          ),
      }}
      changeOnSelect
    />
  );
};

export default WorldAreaSelector;
