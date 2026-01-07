#!/bin/bash

echo "=========================================="
echo "🚀 ChainVault V3 - GitHub 推送脚本"
echo "=========================================="
echo ""

# 检查是否在正确的目录
if [ ! -d ".git" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

echo "📊 项目统计："
echo "- 文件数：88 个"
echo "- 代码量：33,488 行"
echo "- 远程仓库：https://github.com/zfchen163/web3.git"
echo ""

# 检查 gh 是否安装
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI 已安装"
    echo ""
    echo "🔐 正在登录 GitHub..."
    gh auth login
    
    echo ""
    echo "📤 正在推送到 GitHub..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "=========================================="
        echo "🎉 推送成功！"
        echo "=========================================="
        echo ""
        echo "📍 访问您的仓库："
        echo "   https://github.com/zfchen163/web3"
        echo ""
        echo "✨ 您的 ChainVault V3 已成功上传到 GitHub！"
        echo ""
        
        # 可选：在浏览器中打开
        read -p "是否在浏览器中打开仓库？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open https://github.com/zfchen163/web3
        fi
    else
        echo "❌ 推送失败，请检查错误信息"
        exit 1
    fi
else
    echo "⚠️  GitHub CLI 未安装"
    echo ""
    echo "请选择推送方法："
    echo ""
    echo "【方法一】安装 GitHub CLI（推荐）"
    echo "1. 在终端中运行："
    echo "   brew install gh"
    echo "2. 然后再次运行此脚本："
    echo "   ./push-to-github.sh"
    echo ""
    echo "【方法二】使用 Personal Access Token"
    echo "1. 访问：https://github.com/settings/tokens"
    echo "2. 点击 'Generate new token (classic)'"
    echo "3. 勾选 'repo' 权限"
    echo "4. 生成并复制 token"
    echo "5. 运行："
    echo "   git push https://YOUR_TOKEN@github.com/zfchen163/web3.git main"
    echo ""
    echo "【方法三】使用 GitHub Desktop"
    echo "1. 下载：https://desktop.github.com/"
    echo "2. 登录您的 GitHub 账号"
    echo "3. 添加本地仓库：/Users/h/practice/chain-vault"
    echo "4. 点击 'Publish repository'"
    echo ""
    echo "📖 详细说明请查看：GITHUB_PUSH_GUIDE.md"
    echo ""
    
    read -p "是否现在安装 GitHub CLI？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "📥 正在安装 GitHub CLI..."
        brew install gh
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ GitHub CLI 安装成功！"
            echo ""
            echo "🔐 正在登录 GitHub..."
            gh auth login
            
            echo ""
            echo "📤 正在推送到 GitHub..."
            git push -u origin main
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "=========================================="
                echo "🎉 推送成功！"
                echo "=========================================="
                echo ""
                echo "📍 访问您的仓库："
                echo "   https://github.com/zfchen163/web3"
                echo ""
                open https://github.com/zfchen163/web3
            fi
        else
            echo "❌ 安装失败，请手动安装"
        fi
    fi
fi

echo ""
echo "=========================================="

