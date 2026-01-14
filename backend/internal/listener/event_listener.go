package listener

import (
	"chain-vault-backend/internal/chain"
	"chain-vault-backend/internal/config"
	"chain-vault-backend/internal/service"
	"context"
	"fmt"
	logpkg "log"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
)

type EventListener struct {
	ethClient    *chain.Client
	assetService *service.AssetService
	cfg          *config.Config
}

func NewEventListener(cfg *config.Config) (*EventListener, error) {
	ethClient, err := chain.NewClient(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create Ethereum client: %w", err)
	}

	return &EventListener{
		ethClient:    ethClient,
		assetService: service.NewAssetService(),
		cfg:          cfg,
	}, nil
}

func (l *EventListener) Start(ctx context.Context) error {
	logpkg.Println("Starting event listener...")

	// 获取最新区块号
	latestBlock, err := l.ethClient.GetLatestBlock(ctx)
	if err != nil {
		return fmt.Errorf("failed to get latest block: %w", err)
	}

	startBlock := l.cfg.StartBlock
	if startBlock == 0 {
		// 如果 START_BLOCK=0，从区块 0 开始扫描历史事件
		startBlock = 0
		logpkg.Printf("START_BLOCK=0, scanning from block 0 to catch historical events")
		// 先扫描历史区块
		go l.scanHistoricalBlocks(ctx, 0, latestBlock)
	} else {
		logpkg.Printf("Starting from configured block: %d", startBlock)
	}

	// 启动事件监听（使用轮询方式，因为 Hardhat 不支持 WebSocket 订阅）
	go l.watchWithPolling(ctx, latestBlock)

	logpkg.Println("Event listener started successfully")
	return nil
}

// scanHistoricalBlocks 扫描历史区块中的事件
func (l *EventListener) scanHistoricalBlocks(ctx context.Context, fromBlock, toBlock uint64) {
	logpkg.Printf("Scanning historical blocks from %d to %d", fromBlock, toBlock)

	// 使用 FilterLogs 查询历史事件
	query := ethereum.FilterQuery{
		Addresses: []common.Address{l.ethClient.GetContractAddress()},
		FromBlock: new(big.Int).SetUint64(fromBlock),
		ToBlock:   new(big.Int).SetUint64(toBlock),
	}

	logs, err := l.ethClient.GetClient().FilterLogs(ctx, query)
	if err != nil {
		logpkg.Printf("Failed to filter historical logs: %v", err)
		return
	}

	logpkg.Printf("Found %d historical events", len(logs))

	contractABI := l.ethClient.GetContractABI()
	registeredEventSig := contractABI.Events["AssetRegistered"].ID
	transferredEventSig := contractABI.Events["AssetTransferred"].ID
	listedEventSig := contractABI.Events["AssetListed"].ID
	unlistedEventSig := contractABI.Events["AssetUnlisted"].ID

	for _, logEntry := range logs {
		if len(logEntry.Topics) == 0 {
			continue
		}

		eventSig := logEntry.Topics[0]

		// 处理 AssetRegistered 事件
		if eventSig == registeredEventSig {
			event := new(chain.AssetRegisteredEvent)

			// 解析事件
			if len(logEntry.Topics) > 1 {
				event.AssetId = new(big.Int).SetBytes(logEntry.Topics[1].Bytes()).Uint64()
			}
			if len(logEntry.Topics) > 2 {
				event.Owner = common.BytesToAddress(logEntry.Topics[2].Bytes())
			}
			if len(logEntry.Topics) > 3 {
				event.Brand = common.BytesToAddress(logEntry.Topics[3].Bytes())
			}

			// 解析 name 和 serialNumber
			if len(logEntry.Data) > 0 {
				eventMap := make(map[string]interface{})
				err := contractABI.UnpackIntoMap(eventMap, "AssetRegistered", logEntry.Data)
				if err == nil {
					if name, ok := eventMap["name"].(string); ok {
						event.Name = name
					}
					if serialNumber, ok := eventMap["serialNumber"].(string); ok {
						event.SerialNumber = serialNumber
					}
				} else {
					unpacked, err := contractABI.Unpack("AssetRegistered", logEntry.Data)
					if err == nil && len(unpacked) >= 2 {
						if nameStr, ok := unpacked[0].(string); ok {
							event.Name = nameStr
						}
						if serialNumberStr, ok := unpacked[1].(string); ok {
							event.SerialNumber = serialNumberStr
						}
					}
				}
			}

			event.BlockNumber = logEntry.BlockNumber
			event.TxHash = logEntry.TxHash.Hex()

			// 处理事件（检查重复并保存）
			// 1. 检查 AssetID 是否已存在
			existing, _ := l.assetService.GetAsset(event.AssetId)
			if existing != nil {
				logpkg.Printf("Asset %d already exists, skipping", event.AssetId)
				continue
			}

			// 2. 检查 SerialNumber 是否已存在 (如果序列号不为空)
			if event.SerialNumber != "" {
				existingBySN, _ := l.assetService.GetAssetBySerialNumber(event.SerialNumber)
				if existingBySN != nil {
					logpkg.Printf("Asset with SerialNumber %s already exists (ID: %d), skipping duplicate registration for AssetID %d", 
						event.SerialNumber, existingBySN.ID, event.AssetId)
					continue
				}
			}

			// 使用 CreateAssetV3 保存完整信息
			if err := l.assetService.CreateAssetV3(
				event.AssetId,
				event.Owner.Hex(),
				event.Brand.Hex(),
				event.Name,
				event.SerialNumber,
				"", // metadataURI 暂时为空
				event.TxHash,
				event.BlockNumber,
				0, // status 默认为 0 (未验证)
			); err != nil {
				logpkg.Printf("Failed to save historical asset %d: %v", event.AssetId, err)
			} else {
				logpkg.Printf("Historical asset %d saved successfully: %s (SN: %s)", event.AssetId, event.Name, event.SerialNumber)
			}
		}

		// 处理 AssetTransferred 事件
		if eventSig == transferredEventSig {
			event := new(chain.AssetTransferredEvent)

			if len(logEntry.Topics) > 1 {
				event.AssetId = new(big.Int).SetBytes(logEntry.Topics[1].Bytes()).Uint64()
			}
			if len(logEntry.Topics) > 2 {
				event.From = common.BytesToAddress(logEntry.Topics[2].Bytes())
			}
			if len(logEntry.Topics) > 3 {
				event.To = common.BytesToAddress(logEntry.Topics[3].Bytes())
			}

			event.BlockNumber = logEntry.BlockNumber
			event.TxHash = logEntry.TxHash.Hex()

			if err := l.assetService.UpdateAssetOwner(
				event.AssetId,
				event.To.Hex(),
				event.TxHash,
				event.BlockNumber,
			); err != nil {
				logpkg.Printf("Failed to update asset %d owner: %v", event.AssetId, err)
			} else {
				logpkg.Printf("Asset %d transferred from %s to %s", event.AssetId, event.From.Hex(), event.To.Hex())
			}
		}

		// 处理 AssetListed 事件
		if eventSig == listedEventSig {
			event := new(chain.AssetListedEvent)

			if len(logEntry.Topics) > 1 {
				event.AssetId = new(big.Int).SetBytes(logEntry.Topics[1].Bytes()).Uint64()
			}
			if len(logEntry.Topics) > 2 {
				event.Seller = common.BytesToAddress(logEntry.Topics[2].Bytes())
			}

			if len(logEntry.Data) >= 32 {
				event.Price = new(big.Int).SetBytes(logEntry.Data[:32])
			}

			event.BlockNumber = logEntry.BlockNumber
			event.TxHash = logEntry.TxHash.Hex()

			priceWei := event.Price.String()
			if err := l.assetService.ListAsset(event.AssetId, priceWei); err != nil {
				logpkg.Printf("Failed to list asset %d: %v", event.AssetId, err)
			} else {
				logpkg.Printf("Asset %d listed with price %s wei", event.AssetId, priceWei)
			}
		}

		// 处理 AssetUnlisted 事件
		if eventSig == unlistedEventSig {
			event := new(chain.AssetUnlistedEvent)

			if len(logEntry.Topics) > 1 {
				event.AssetId = new(big.Int).SetBytes(logEntry.Topics[1].Bytes()).Uint64()
			}

			event.BlockNumber = logEntry.BlockNumber
			event.TxHash = logEntry.TxHash.Hex()

			if err := l.assetService.UnlistAsset(event.AssetId); err != nil {
				logpkg.Printf("Failed to unlist asset %d: %v", event.AssetId, err)
			} else {
				logpkg.Printf("Asset %d unlisted", event.AssetId)
			}
		}
	}

	logpkg.Println("Historical block scanning completed")
}

// watchWithPolling 使用轮询方式监听新事件（适用于不支持 WebSocket 订阅的节点）
func (l *EventListener) watchWithPolling(ctx context.Context, startBlock uint64) {
	pollInterval := 3 * time.Second // 每3秒轮询一次
	lastProcessedBlock := startBlock

	logpkg.Printf("Starting polling-based event watcher from block %d", startBlock)

	// 立即扫描一次，确保不遗漏任何事件
	latestBlock, err := l.ethClient.GetLatestBlock(ctx)
	if err == nil && latestBlock > lastProcessedBlock {
		logpkg.Printf("Initial scan: scanning blocks from %d to %d", lastProcessedBlock+1, latestBlock)
		l.scanHistoricalBlocks(ctx, lastProcessedBlock+1, latestBlock)
		lastProcessedBlock = latestBlock
	}

	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			logpkg.Println("Polling watcher stopped")
			return
		case <-ticker.C:
			// 获取最新区块号
			latestBlock, err := l.ethClient.GetLatestBlock(ctx)
			if err != nil {
				logpkg.Printf("Failed to get latest block: %v", err)
				continue
			}

			// 如果有新区块，扫描新事件
			if latestBlock > lastProcessedBlock {
				logpkg.Printf("Scanning new blocks from %d to %d", lastProcessedBlock+1, latestBlock)
				l.scanHistoricalBlocks(ctx, lastProcessedBlock+1, latestBlock)
				lastProcessedBlock = latestBlock
			}
		}
	}
}

func (l *EventListener) monitorConnection(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			_, err := l.ethClient.GetLatestBlock(ctx)
			if err != nil {
				logpkg.Printf("Connection check failed: %v", err)
			}
		case <-ctx.Done():
			return
		}
	}
}
