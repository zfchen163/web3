/**
 * 美化的模态框组件
 * 用于替代原生的 prompt() 和 confirm()
 */

import React, { useState, useEffect } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  icon?: string;
  placeholder?: string;
  hint?: string;
  inputType?: 'text' | 'number' | 'select';
  selectOptions?: { value: string; label: string }[];
  defaultValue?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  icon = '💰',
  placeholder = '请输入',
  hint,
  inputType = 'text',
  selectOptions = [],
  defaultValue = ''
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputType !== 'select') {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-inner">
          <div className="modal-header">
            <span className="modal-icon">{icon}</span>
            <h2 className="modal-title">{title}</h2>
          </div>

          <div className="modal-body">
            <label className="modal-label">
              {inputType === 'number' && '价格 (ETH)'}
              {inputType === 'text' && '地址'}
              {inputType === 'select' && '选择账户'}
            </label>
            
            {inputType === 'select' ? (
              <select
                className="modal-select"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              >
                <option value="">-- 请选择 --</option>
                {selectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={inputType}
                className="modal-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                autoFocus
                step={inputType === 'number' ? '0.01' : undefined}
                min={inputType === 'number' ? '0' : undefined}
              />
            )}
            
            {hint && (
              <div className="modal-hint">
                💡 {hint}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              className="modal-btn modal-btn-cancel"
              onClick={onClose}
            >
              取消
            </button>
            <button
              className="modal-btn modal-btn-confirm"
              onClick={handleConfirm}
              disabled={!value.trim()}
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
