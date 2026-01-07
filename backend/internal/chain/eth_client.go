package chain

import (
	"chain-vault-backend/internal/config"
	"context"
	"fmt"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

// AssetRegistryABI 是合约的 ABI（简化版，只包含我们需要的事件）
const AssetRegistryABI = `[
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "name": "assetId", "type": "uint256"},
			{"indexed": true, "name": "owner", "type": "address"},
			{"indexed": false, "name": "name", "type": "string"}
		],
		"name": "AssetRegistered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "name": "assetId", "type": "uint256"},
			{"indexed": true, "name": "from", "type": "address"},
			{"indexed": true, "name": "to", "type": "address"}
		],
		"name": "AssetTransferred",
		"type": "event"
	}
]`

type Client struct {
	client        *ethclient.Client
	contractAddr common.Address
	contractABI  abi.ABI
}

func NewClient(cfg *config.Config) (*Client, error) {
	client, err := ethclient.Dial(cfg.EthRPCURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum node: %w", err)
	}

	contractAddr := common.HexToAddress(cfg.ContractAddress)
	if contractAddr == (common.Address{}) {
		return nil, fmt.Errorf("invalid contract address: %s", cfg.ContractAddress)
	}

	parsedABI, err := abi.JSON(strings.NewReader(AssetRegistryABI))
	if err != nil {
		return nil, fmt.Errorf("failed to parse ABI: %w", err)
	}

	return &Client{
		client:        client,
		contractAddr: contractAddr,
		contractABI:  parsedABI,
	}, nil
}

func (c *Client) GetClient() *ethclient.Client {
	return c.client
}

func (c *Client) GetContractAddress() common.Address {
	return c.contractAddr
}

func (c *Client) GetContractABI() abi.ABI {
	return c.contractABI
}

// WatchEvents 监听合约事件
func (c *Client) WatchEvents(ctx context.Context, fromBlock uint64, eventChan chan<- *AssetRegisteredEvent) error {
	query := ethereum.FilterQuery{
		Addresses: []common.Address{c.contractAddr},
		FromBlock: new(big.Int).SetUint64(fromBlock),
	}

	logs := make(chan types.Log)
	sub, err := c.client.SubscribeFilterLogs(ctx, query, logs)
	if err != nil {
		return fmt.Errorf("failed to subscribe to logs: %w", err)
	}

	go func() {
		defer close(logs)
		defer sub.Unsubscribe()

		for {
			select {
			case err := <-sub.Err():
				if err != nil {
					fmt.Printf("Subscription error: %v\n", err)
				}
				return
			case log := <-logs:
				// 验证事件签名（Topics[0] 是事件签名的哈希）
				eventSig := c.contractABI.Events["AssetRegistered"].ID
				if len(log.Topics) == 0 || log.Topics[0] != eventSig {
					continue
				}

				event := new(AssetRegisteredEvent)

				// 解析 indexed 参数（从 Topics 中）
				// Topics[0] = 事件签名
				// Topics[1] = assetId (uint256, indexed)
				// Topics[2] = owner (address, indexed)
				if len(log.Topics) > 1 {
					// Topics[1] = assetId (uint256)
					event.AssetId = new(big.Int).SetBytes(log.Topics[1].Bytes()).Uint64()
				}
				if len(log.Topics) > 2 {
					// Topics[2] = owner (address)
					event.Owner = common.BytesToAddress(log.Topics[2].Bytes())
				}

				// 解析非 indexed 参数（从 Data 中）
				// Data 只包含 name (string, non-indexed)
				if len(log.Data) > 0 {
					// 使用 UnpackIntoMap 解析事件数据
					eventMap := make(map[string]interface{})
					err := c.contractABI.UnpackIntoMap(eventMap, "AssetRegistered", log.Data)
					if err == nil {
						if name, ok := eventMap["name"].(string); ok {
							event.Name = name
						}
					} else {
						// 备用方法：直接解析字符串
						unpacked, err := c.contractABI.Unpack("AssetRegistered", log.Data)
						if err == nil && len(unpacked) > 0 {
							if nameStr, ok := unpacked[0].(string); ok {
								event.Name = nameStr
							}
						} else {
							fmt.Printf("Failed to unpack event name: %v\n", err)
							continue
						}
					}
				}

				event.BlockNumber = log.BlockNumber
				event.TxHash = log.TxHash.Hex()

				eventChan <- event
			case <-ctx.Done():
				return
			}
		}
	}()

	return nil
}

// AssetRegisteredEvent 事件结构
type AssetRegisteredEvent struct {
	AssetId     uint64
	Owner       common.Address
	Name        string
	BlockNumber uint64
	TxHash      string
}

// AssetTransferredEvent 资产转移事件结构
type AssetTransferredEvent struct {
	AssetId     uint64
	From        common.Address
	To          common.Address
	BlockNumber uint64
	TxHash      string
}

// GetLatestBlock 获取最新区块号
func (c *Client) GetLatestBlock(ctx context.Context) (uint64, error) {
	header, err := c.client.HeaderByNumber(ctx, nil)
	if err != nil {
		return 0, err
	}
	return header.Number.Uint64(), nil
}
