# 🎨 oh-my-zsh 配置指南

---

## ✅ 安装完成

oh-my-zsh 已成功安装！

- ✅ 安装位置：`~/.oh-my-zsh`
- ✅ 配置文件：`~/.zshrc`
- ✅ 备份文件：`~/.zshrc.pre-oh-my-zsh`（您的原始配置已备份）

---

## 🚀 立即使用

### 方法 1：重新加载配置（推荐）

```bash
source ~/.zshrc
```

### 方法 2：打开新终端窗口

打开新的终端窗口，oh-my-zsh 会自动加载。

---

## 🎨 推荐主题

### 1. Powerlevel10k（最流行）⭐⭐⭐⭐⭐

```bash
# 安装
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k

# 编辑 ~/.zshrc
ZSH_THEME="powerlevel10k/powerlevel10k"
```

### 2. Spaceship（现代美观）⭐⭐⭐⭐⭐

```bash
# 安装
git clone https://github.com/spaceship-prompt/spaceship-prompt.git "$ZSH_CUSTOM/themes/spaceship-prompt" --depth=1
ln -s "$ZSH_CUSTOM/themes/spaceship-prompt/spaceship.zsh-theme" "$ZSH_CUSTOM/themes/spaceship.zsh-theme"

# 编辑 ~/.zshrc
ZSH_THEME="spaceship"
```

### 3. 内置主题推荐

编辑 `~/.zshrc`，修改 `ZSH_THEME`：

```bash
# 简洁现代
ZSH_THEME="robbyrussell"  # 默认主题

# 多彩主题
ZSH_THEME="agnoster"      # 需要特殊字体支持

# 简洁实用
ZSH_THEME="bureau"        # 轻量级
ZSH_THEME="ys"            # 简洁美观
```

**查看所有内置主题：**
```bash
ls ~/.oh-my-zsh/themes/
```

---

## 🔌 推荐插件

### 必装插件

编辑 `~/.zshrc`，修改 `plugins` 行：

```bash
plugins=(
  git           # Git 命令补全和别名
  z             # 快速跳转目录
  extract       # 解压任何格式文件（x filename）
  colored-man-pages  # 彩色 man 手册
  zsh-autosuggestions  # 自动建议（需安装）
  zsh-syntax-highlighting  # 语法高亮（需安装）
)
```

### 安装额外插件

#### zsh-autosuggestions（自动建议）

```bash
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

#### zsh-syntax-highlighting（语法高亮）

```bash
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

### 完整推荐配置

```bash
plugins=(
  git
  z
  extract
  colored-man-pages
  docker
  docker-compose
  kubectl
  npm
  node
  yarn
  brew
  macos
  zsh-autosuggestions
  zsh-syntax-highlighting
)
```

---

## ⚙️ 常用配置

编辑 `~/.zshrc`，在文件末尾添加：

### 1. 别名（Aliases）

```bash
# Git 别名
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline --graph --decorate'

# 目录导航
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'

# 系统命令
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias grep='grep --color=auto'

# 开发工具
alias vim='nvim'  # 如果使用 neovim
alias cat='bat'   # 如果安装了 bat
```

### 2. 环境变量

```bash
# 编辑器
export EDITOR='vim'
export VISUAL='vim'

# 语言环境
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# 路径
export PATH="$HOME/.local/bin:$PATH"
export PATH="/usr/local/bin:$PATH"
```

### 3. 历史记录配置

```bash
# 历史记录数量
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000

# 历史记录选项
setopt HIST_VERIFY
setopt SHARE_HISTORY
setopt APPEND_HISTORY
setopt INC_APPEND_HISTORY
setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_ALL_DUPS
setopt HIST_REDUCE_BLANKS
setopt HIST_IGNORE_SPACE
```

---

## 🎯 快速配置脚本

运行以下命令快速配置常用插件和主题：

```bash
# 安装自动建议插件
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# 安装语法高亮插件
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# 编辑配置文件
nano ~/.zshrc
# 或
vim ~/.zshrc
```

然后修改：
```bash
ZSH_THEME="robbyrussell"  # 或您喜欢的主题

plugins=(
  git
  z
  extract
  colored-man-pages
  zsh-autosuggestions
  zsh-syntax-highlighting
)
```

保存后运行：
```bash
source ~/.zshrc
```

---

## 📚 常用命令

### oh-my-zsh 管理

```bash
# 更新 oh-my-zsh
omz update

# 卸载 oh-my-zsh
uninstall_oh_my_zsh

# 查看帮助
omz help
```

### 插件管理

```bash
# 查看已安装的插件
ls ~/.oh-my-zsh/plugins/

# 查看自定义插件
ls ~/.oh-my-zsh/custom/plugins/
```

### 主题管理

```bash
# 查看内置主题
ls ~/.oh-my-zsh/themes/

# 查看自定义主题
ls ~/.oh-my-zsh/custom/themes/
```

---

## 🎨 主题预览

访问以下网站查看主题预览：
- https://github.com/ohmyzsh/ohmyzsh/wiki/Themes
- https://github.com/romkatv/powerlevel10k#meslo-nerd-font-patched-for-powerlevel10k

---

## 💡 实用技巧

### 1. 快速跳转目录（z 插件）

```bash
# 输入目录名的一部分，自动跳转
z chain-vault  # 跳转到包含 chain-vault 的目录
z frontend     # 跳转到包含 frontend 的目录
```

### 2. 自动建议（zsh-autosuggestions）

输入命令时，灰色文字是自动建议，按 `→` 键接受。

### 3. 语法高亮（zsh-syntax-highlighting）

- 绿色 = 有效命令
- 红色 = 无效命令
- 黄色 = 别名

### 4. Git 快捷命令

```bash
gst    # git status
gaa    # git add --all
gcmsg  # git commit -m
gco    # git checkout
gcb    # git checkout -b
gl     # git pull
gp     # git push
```

---

## 🔧 故障排除

### 问题 1：配置不生效

```bash
# 重新加载配置
source ~/.zshrc

# 或重启终端
```

### 问题 2：插件冲突

注释掉可能有冲突的插件，逐个测试。

### 问题 3：主题显示异常

某些主题需要特殊字体，安装 Nerd Fonts：
```bash
brew install --cask font-hack-nerd-font
```

然后在终端设置中选择该字体。

---

## 📖 更多资源

- **官方文档**：https://ohmyz.sh/
- **GitHub**：https://github.com/ohmyzsh/ohmyzsh
- **Wiki**：https://github.com/ohmyzsh/ohmyzsh/wiki
- **主题列表**：https://github.com/ohmyzsh/ohmyzsh/wiki/Themes
- **插件列表**：https://github.com/ohmyzsh/ohmyzsh/wiki/Plugins

---

## 🎉 完成！

现在您的终端已经配置了 oh-my-zsh！

**下一步：**
1. 运行 `source ~/.zshrc` 重新加载配置
2. 或打开新终端窗口
3. 开始享受更强大的终端体验！

---

**💡 提示：** 编辑 `~/.zshrc` 来自定义您的终端体验！

