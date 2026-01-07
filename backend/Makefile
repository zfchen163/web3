.PHONY: run build test clean docker-up docker-down migrate

# 运行服务
run:
	go run cmd/api/main.go

# 构建
build:
	go build -o bin/api cmd/api/main.go

# 测试
test:
	go test ./...

# 清理
clean:
	rm -rf bin/

# 启动 PostgreSQL
docker-up:
	docker-compose up -d

# 停止 PostgreSQL
docker-down:
	docker-compose down

# 数据库迁移（GORM 自动处理）
migrate:
	@echo "GORM 会自动处理迁移，无需手动运行"

# 安装依赖
deps:
	go mod tidy
	go mod download

# 格式化代码
fmt:
	go fmt ./...

# 代码检查
lint:
	golangci-lint run ./...

