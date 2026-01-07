package config

import (
	"bufio"
	"os"
	"strings"
)

type Config struct {
	DatabaseURL    string
	EthRPCURL      string
	ContractAddress string
	StartBlock     uint64
}

func Load() *Config {
	// 加载 .env 文件
	loadEnvFile(".env")
	
	return &Config{
		DatabaseURL:    getEnv("DATABASE_URL", "chainvault:chainvault@tcp(localhost:3306)/chainvault?charset=utf8mb4&parseTime=True&loc=Local"),
		EthRPCURL:      getEnv("ETH_RPC_URL", "http://127.0.0.1:8545"),
		ContractAddress: getEnv("CONTRACT_ADDRESS", ""),
		StartBlock:     0, // 从 0 开始监听，实际部署后应该从部署区块开始
	}
}

func loadEnvFile(filename string) {
	// 尝试多个路径
	paths := []string{
		filename,                    // 当前目录
		"./" + filename,             // 当前目录（显式）
		"../" + filename,            // 上一级目录
		"backend/" + filename,       // backend 目录
	}
	
	var file *os.File
	var err error
	for _, path := range paths {
		file, err = os.Open(path)
		if err == nil {
			break
		}
	}
	
	if err != nil {
		return // 所有路径都找不到文件时忽略错误
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		// 跳过空行和注释
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		// 解析 KEY=VALUE 格式
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])
			// 移除引号
			value = strings.Trim(value, "\"'")
			// 只设置未存在的环境变量
			if os.Getenv(key) == "" {
				os.Setenv(key, value)
			}
		}
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

