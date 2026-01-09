/**
 * ChainVault V3 后端服务主程序
 * 
 * 功能概述：
 * 1. 加载配置文件（.env）
 * 2. 连接 MySQL 数据库
 * 3. 启动区块链事件监听器（自动同步链上数据）
 * 4. 启动 RESTful API 服务器
 * 5. 处理优雅关闭
 * 
 * 架构说明：
 * - 事件监听器：监听智能合约事件，自动同步到数据库
 * - API 服务器：提供 HTTP 接口供前端调用
 * - 数据库：缓存链上数据，提供快速查询
 * 
 * 运行方式：
 * go run cmd/api/main.go
 */

package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"chain-vault-backend/internal/api"
	"chain-vault-backend/internal/config"
	"chain-vault-backend/internal/database"
	"chain-vault-backend/internal/listener"

	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("🚀 ChainVault V3 后端服务启动中...")
	log.Println(strings.Repeat("=", 60))

	// ==================== 1. 加载配置 ====================
	// 从 .env 文件或环境变量加载配置
	// 包括：合约地址、RPC地址、数据库连接等
	cfg := config.Load()
	log.Printf("✅ 配置加载成功")
	log.Printf("   合约地址: %s", cfg.ContractAddress)
	log.Printf("   RPC地址: %s", cfg.EthRPCURL)
	log.Printf("   数据库: %s", maskPassword(cfg.DatabaseURL))

	// ==================== 2. 连接数据库 ====================
	// 连接 MySQL 数据库，用于缓存链上数据
	// 优点：查询速度快，支持复杂查询，减少区块链调用
	log.Println("\n🗄️  正在连接数据库...")
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatalf("❌ 数据库连接失败: %v", err)
	}
	log.Println("✅ 数据库连接成功")

	// ==================== 3. 启动事件监听器 ====================
	// 事件监听器的作用：
	// 1. 监听智能合约发出的事件（AssetRegistered, OrderCreated等）
	// 2. 自动将事件数据同步到数据库
	// 3. 扫描历史区块，确保数据完整性
	if cfg.ContractAddress != "" {
		log.Println("\n📡 正在启动事件监听器...")
		log.Printf("   监听合约: %s", cfg.ContractAddress)
		
		// 创建事件监听器实例
		eventListener, err := listener.NewEventListener(cfg)
		if err != nil {
			log.Fatalf("❌ 事件监听器创建失败: %v", err)
		}

		// 创建可取消的上下文（用于优雅关闭）
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		// 在后台 goroutine 中启动事件监听
		// 这样不会阻塞主程序，API服务器可以同时运行
		go func() {
			log.Println("✅ 事件监听器已启动（后台运行）")
			if err := eventListener.Start(ctx); err != nil {
				log.Printf("⚠️  事件监听器错误: %v", err)
			}
		}()

		// 设置优雅关闭处理
		// 当收到 Ctrl+C 或 SIGTERM 信号时，优雅地关闭服务
		go func() {
			sigChan := make(chan os.Signal, 1)
			signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
			<-sigChan
			log.Println("\n🛑 收到关闭信号，正在优雅关闭...")
			cancel()
		}()
	} else {
		log.Println("\n⚠️  警告: CONTRACT_ADDRESS 未设置，事件监听器已禁用")
		log.Println("   请在 .env 文件中设置 CONTRACT_ADDRESS")
	}

	// ==================== 4. 启动 API 服务器 ====================
	log.Println("\n🌐 正在启动 API 服务器...")
	
	// 创建 Gin 路由器（使用默认配置，包含日志和恢复中间件）
	r := gin.Default()

	// ==================== CORS 跨域中间件 ====================
	// 允许前端（localhost:5173）访问后端 API
	// 在生产环境中应该限制为特定域名
	r.Use(func(c *gin.Context) {
		// 允许所有来源（开发环境）
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		// 允许携带凭证
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		// 允许的请求头
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		// 允许的请求方法
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		// 处理预检请求（OPTIONS）
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// ==================== API 路由配置 ====================
	
	// 健康检查接口
	// 用于监控服务是否正常运行
	r.GET("/health", api.HealthCheck)
	
	// -------------------- 资产相关 API --------------------
	// 资产列表：GET /assets?limit=20&offset=0&owner=0x...
	//   - 支持分页（limit, offset）
	//   - 支持按所有者筛选（owner）
	r.GET("/assets", api.ListAssets)
	
	// 资产详情：GET /assets/123
	//   - 返回指定ID的资产完整信息
	r.GET("/assets/:id", api.GetAsset)
	
	// 更新资产图片：PUT /assets/:id/images
	//   - 请求体：{"images": ["data:image/jpeg;base64,...", ...]}
	//   - 用于在资产注册后更新图片
	r.PUT("/assets/:id/images", api.UpdateAssetImages)
	
	// 通过序列号查询：GET /assets/serial/NK-AJ1-001
	//   - 用于扫描NFC标签后查询资产
	r.GET("/assets/serial/:serialNumber", api.GetAssetBySerialNumber)
	
	// 在售资产列表：GET /assets/listed?limit=20&offset=0
	//   - 返回所有isListed=true的资产
	r.GET("/assets/listed", api.GetListedAssets)
	
	// -------------------- 搜索 API --------------------
	// 搜索资产：GET /search?q=Nike&limit=20&offset=0
	//   - 支持按名称或序列号搜索
	//   - 支持分页
	r.GET("/search", api.SearchAssets)
	
	// -------------------- 品牌相关 API --------------------
	// 品牌列表：GET /brands?limit=20&offset=0&authorized=true
	//   - 支持分页
	//   - 支持只查询已授权品牌（authorized=true）
	r.GET("/brands", api.ListBrands)
	
	// 品牌详情：GET /brands/0x123...
	//   - 返回指定地址的品牌信息
	r.GET("/brands/:address", api.GetBrand)
	
	// 授权品牌：POST /brands/authorize
	//   - 管理员功能
	//   - 请求体：{"address": "0x...", "authorized": true}
	r.POST("/brands/authorize", api.AuthorizeBrand)
	
	// -------------------- 订单相关 API --------------------
	// 订单列表：GET /orders?user=0x...&limit=20&offset=0
	//   - 必须指定user（买家或卖家地址）
	//   - 支持分页
	r.GET("/orders", api.ListOrders)
	
	// 订单详情：GET /orders/123
	//   - 返回指定ID的订单完整信息
	r.GET("/orders/:id", api.GetOrder)
	
	// 资产交易历史：GET /orders/asset/123
	//   - 返回指定资产的所有订单记录
	r.GET("/orders/asset/:assetId", api.GetOrdersByAsset)
	
	// -------------------- 用户信誉相关 API --------------------
	// 获取用户信誉：GET /reputation/0x...
	//   - 返回用户等级、星级、经验值等信息
	r.GET("/reputation/:address", api.GetUserReputation)
	
	// 创建评价：POST /reviews
	//   - 请求体：{"orderId": 123, "reviewerAddress": "0x...", "revieweeAddress": "0x...", "role": "seller", "rating": 5, "comment": "..."}
	r.POST("/reviews", api.CreateReview)
	
	// 获取用户评价列表：GET /reviews/0x...?role=seller
	//   - 返回用户收到的评价列表
	//   - role参数可选（seller或buyer）
	r.GET("/reviews/:address", api.GetUserReviews)
	
	// -------------------- IPFS 相关 API --------------------
	// 上传单张图片：POST /ipfs/upload/image
	//   - 表单字段：image (文件)
	//   - 返回：{"hash": "QmXxx...", "uri": "ipfs://QmXxx..."}
	r.POST("/ipfs/upload/image", api.UploadImage)
	
	// 批量上传图片：POST /ipfs/upload/images
	//   - 表单字段：images (多个文件)
	//   - 返回：{"hashes": ["QmXxx...", ...], "uris": [...]}
	r.POST("/ipfs/upload/images", api.UploadMultipleImages)
	
	// 生成元数据：POST /ipfs/metadata
	//   - 请求体：{name, serialNumber, imageHashes, ...}
	//   - 返回：{"uri": "ipfs://QmMetadata..."}
	r.POST("/ipfs/metadata", api.GenerateMetadata)
	
	// 获取元数据：GET /ipfs/metadata?uri=ipfs://QmXxx...
	//   - 返回：完整的元数据JSON对象
	r.GET("/ipfs/metadata", api.GetMetadata)
	
	// 获取文件：GET /ipfs/file/QmXxx...
	//   - 返回：文件二进制内容
	r.GET("/ipfs/file/:hash", api.GetFile)
	
	// -------------------- 统计相关 API --------------------
	// 统计数据：GET /stats
	//   - 返回：总资产数、总订单数、每日统计等
	r.GET("/stats", api.GetStats)

	// ==================== 启动服务器 ====================
	log.Println("\n✅ API 服务器配置完成")
	log.Println("📡 监听端口: :8080")
	log.Println("🌐 API 地址: http://localhost:8080")
	log.Println("\n可用的 API 端点:")
	log.Println("  - GET  /health              健康检查")
	log.Println("  - GET  /assets              资产列表")
	log.Println("  - GET  /search              搜索资产")
	log.Println("  - GET  /brands              品牌列表")
	log.Println("  - GET  /orders              订单列表")
	log.Println("  - POST /ipfs/upload/image   上传图片")
	log.Println("\n🎉 服务器启动成功，等待请求...")
	log.Println(strings.Repeat("=", 60))
	
	// 启动 HTTP 服务器（阻塞）
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("❌ 服务器启动失败: %v", err)
	}
}

// maskPassword 隐藏数据库连接字符串中的密码
// 用于日志输出时保护敏感信息
func maskPassword(dbURL string) string {
	// 简单实现：只显示前20个字符
	if len(dbURL) > 20 {
		return dbURL[:20] + "***"
	}
	return dbURL
}

