/**
 * 完整的省市区选择组件
 * 使用 Ant Design Cascader + element-china-area-data
 * 
 * 功能：
 * - 完整的全国省市区数据
 * - 三级联动选择
 * - 自动格式化输出
 */

import React from 'react';
import { Cascader } from 'antd';
import type { CascaderProps } from 'antd';
import { regionData, codeToText } from 'element-china-area-data';

interface AreaSelectorProps {
  value?: string;           // 当前值（如："北京市 东城区"）
  onChange?: (value: string, codes?: string[]) => void;  // 值变化回调
  placeholder?: string;     // 占位符
  disabled?: boolean;       // 是否禁用
}

/**
 * 完整的省市区选择组件
 */
const AreaSelector: React.FC<AreaSelectorProps> = ({
  value,
  onChange,
  placeholder = '请选择省/市/区',
  disabled = false
}) => {
  
  /**
   * 处理选择变化
   */
  const handleChange: CascaderProps['onChange'] = (selectedValues, selectedOptions) => {
    if (!selectedValues || selectedValues.length === 0) {
      onChange?.('', []);
      return;
    }
    
    // selectedValues 是地区代码数组，如：['11', '1101', '110101']
    const codes = selectedValues as string[];
    
    // 从 selectedOptions 获取 labels（更可靠）
    const texts = selectedOptions?.map(option => option.label as string) || 
                  codes.map(code => codeToText[code] || code);
    
    // 优化：去除重复的市级名称（北京市、上海市等直辖市）
    let formattedText = '';
    if (texts.length === 3) {
      // 省市区三级
      if (texts[0] === texts[1]) {
        // 直辖市：北京市 = 北京市，只保留 "北京市 东城区"
        formattedText = `${texts[0]} ${texts[2]}`;
      } else {
        // 普通省份："广东省 广州市 天河区"
        formattedText = texts.join(' ');
      }
    } else if (texts.length === 2) {
      // 省市二级
      formattedText = texts.join(' ');
    } else {
      // 只有省级
      formattedText = texts[0];
    }
    
    onChange?.(formattedText, codes);
  };

  /**
   * 显示渲染
   */
  const displayRender = (labels: string[]) => {
    // 优化显示：去除重复
    if (labels.length === 3 && labels[0] === labels[1]) {
      return `${labels[0]} / ${labels[2]}`;
    }
    return labels.join(' / ');
  };

  return (
    <Cascader
      options={regionData}
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
      changeOnSelect  // 允许只选择省或市
    />
  );
};

export default AreaSelector;

