# Escrow App — POTOS 测试网代币托管应用

基于 POTOS 测试网（`chainId: 60600`）的代币托管（Escrow）去中心化应用，使用 scaffold-eth 2 搭建。买方支付 PQY 代币锁定到合约，卖方确认收款后释放，任何一方均可退款或仲裁。

## 目录

- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [本地开发](#本地开发)
- [部署到 POTOS 测试网](#部署到-potos-测试网)
- [合约地址](#合约地址)
- [网络配置](#网络配置)
- [项目结构](#项目结构)
- [常见问题](#常见问题)

## 环境要求

| 工具 | 版本 | 说明 |
|---|---|---|
| Node.js | `>= 18.18.0` | 必须，corepack 已随 Node 自带 |
| Yarn | `3.2.3`（项目锁定） | 见下方 corepack 说明 |
| Git | 任意较新版本 | 拉取代码 |
| 浏览器 | Chrome / Edge / Firefox | 需安装 MetaMask |

无需安装 Ganache、Hardhat 全局版本或 Python。

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/yuyumaker/escrow-app.git
cd escrow-app

# 2. 启用项目锁定的 Yarn 版本（必需，否则会回退到系统 Yarn 1.x）
corepack enable
corepack prepare yarn@3.2.3 --activate
yarn --version   # 应输出 3.2.3

# 3. 安装依赖
yarn install

# 4. 配置环境变量
cp packages/hardhat/.env.example packages/hardhat/.env
# 然后编辑 .env，填入你的私钥（见下节）

# 5. 启动前端
cd packages/nextjs
yarn dev
```

浏览器打开 `http://localhost:3000`。

## 环境变量

hardhat 目录下的 `.env` 必须包含以下内容（可参考 `.env.example`）：

| 变量名 | 说明 | 是否必填 |
|---|---|---|
| `__RUNTIME_DEPLOYER_PRIVATE_KEY` | 部署者钱包私钥，用于部署合约。以 `0x` 开头的 64 位十六进制 | 部署时必填 |
| `ALCHEMY_API_KEY` | Alchemy API Key，用于 mainnet fork（默认已内置） | 可选 |
| `ETHERSCAN_V2_API_KEY` | 合约验证用 API Key（默认已内置） | 可选 |

示例 `.env`：

```env
__RUNTIME_DEPLOYER_PRIVATE_KEY=0x你的私钥
ALCHEMY_API_KEY=oKxs-03sij-U_N0iOlrSsZFr29-IqbuF
ETHERSCAN_V2_API_KEY=DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW
```

> 私钥对应地址需在 POTOS 测试网持有 PQY 以支付部署 gas，见 [领水](#领水)。

## 本地开发

### 方式一：仅前端（推荐协作）

合约已部署在 POTOS 测试网，组员无需重新部署，直接拉代码即可：

```bash
git pull origin main
cd packages/nextjs
yarn install
yarn dev
```

> **不要运行 `yarn deploy`**。重新部署会生成新合约地址，订单将不再共享。

### 方式二：完整本地链

```bash
# 终端 1：启动本地 hardhat 链
cd packages/hardhat
yarn chain

# 终端 2：部署到本地链
yarn deploy --network localhost

# 终端 3：启动前端
cd packages/nextjs
yarn dev
```

## 部署到 POTOS 测试网

```bash
cd packages/hardhat

# 确认网络配置中存在 potos_testnet（hardhat.config.ts 已内置）
# 网络名是 potos_testnet，不是 potos

yarn deploy --network potos_testnet
```

部署成功后控制台会输出两个地址，并自动写入 `packages/nextjs/contracts/deployedContracts.ts`。将此文件提交到仓库：

```bash
cd ../..
git add packages/nextjs/contracts/deployedContracts.ts
git commit -m "chore: update deployed contract addresses"
git push origin main
```

### 领水

部署前需确保部署者地址有 PQY 余额：

https://faucet-testnet.potos.hk/

## 合约地址

已部署在 POTOS 测试网（`chainId: 60600`）：

| 合约 | 地址 | 说明 |
|---|---|---|
| Escrow | `0x42Fcaa73Aca956749Fe272fd3308999931bcEDb7` | 托管主合约 |
| PQYToken | `0x6b02e4F5B972d11478Db35DC70B51ee8b54ee133` | 测试代币（ERC-20） |
| YourContract | `0xfC3983DE3F7cBe1Ba01084469779470AD0BbeFfa` | 脚手架示例合约 |

区块浏览器：

https://scan-testnet.potos.hk/

## 网络配置

在 MetaMask 中手动添加 POTOS 测试网：

| 字段 | 值 |
|---|---|
| 网络名称 | POTOS Testnet |
| RPC URL | `https://rpc-testnet.potos.hk` |
| 链 ID | `60600` |
| 货币符号 | PQY |
| 区块浏览器 | `https://scan-testnet.potos.hk` |

或通过 ChainList 一键添加：`https://chainlist.org/chain/60600`。

也可在浏览器控制台确认当前网络：

```javascript
await window.ethereum.request({ method: 'eth_chainId' });
// 应返回 "0xec88"，对应十进制 60600
```

## 项目结构

```
escrow-app/
├── packages/
│   ├── hardhat/              # 合约与部署脚本
│   │   ├── contracts/        # Solidity 合约源码
│   │   ├── deploy/           # 部署脚本
│   │   ├── deployments/      # 部署产物（按网络分目录）
│   │   └── hardhat.config.ts
│   └── nextjs/               # 前端
│       ├── app/              # 页面（Next.js App Router）
│       ├── contracts/
│       │   └── deployedContracts.ts  # 自动生成的合约地址
│       └── constants.ts
├── .gitignore
├── package.json
└── README.md
```
## 常见问题

**Q：执行 `yarn deploy` 报 `Error HH100: Network potos doesn't exist`**
网络名是 `potos_testnet` 而非 `potos`，正确命令为 `yarn deploy --network potos_testnet`。

**Q：执行 `git commit` 时报 `packageManager: yarn@3.2.3` 与全局 Yarn 1.x 冲突**
需启用 corepack：`corepack enable && corepack prepare yarn@3.2.3 --activate`，详见[环境要求](#环境要求)。

**Q：组员看不到我创建的订单**
请按以下顺序排查：① MetaMask 当前网络是否为 POTOS Testnet（`chainId 60600`）；② 前端 `deployedContracts.ts` 中的合约地址是否为上文地址；③ 是否误执行了 `yarn deploy` 导致合约地址被覆盖。

**Q：部署时报 `insufficient funds for gas`
部署者地址 PQY 余额不足，前往 `https://faucet-testnet.potos.hk/` 领取测试币。

## 许可

## 交易记录
仅供课程大作业演示使用。
| 方法 | 交易哈希 | 区块浏览器链接 | 发起账号 |
|部署 Escrow	     | 0xe002d948e99dc66e9acfb26e47f94af8e9acbe399cd1708a25652c10384414a4	|POTOS Testnet transaction  |0xe002d948e99dc66e9acfb26e47f94af8e9acbe399cd1708a25652c10384414a4 /| Blockscout	|0xebc26A08a9fE0E7421A03D0BC8b3a678E6063c7d
|createOrder 订单0| 0x8b1a626caa03e01344c51a72e7cc638993f21b8880ce6cf868affd0a53bc5f6e	|POTOS Testnet transaction |0x8b1a626caa03e01344c51a72e7cc638993f21b8880ce6cf868affd0a53bc5f6e /| Blockscout	|0xebc26A08a9fE0E7421A03D0BC8b3a678E6063c7d
|approve	         |0x32811034e9e036bb99eff00d543063a9a61375e7ca7fe60f6a653f16e1820c59	|POTOS Testnet transaction |0x32811034e9e036bb99eff00d543063a9a61375e7ca7fe60f6a653f16e1820c59 /| Blockscout	|0xebc26A08a9fE0E7421A03D0BC8b3a678E6063c7d
|deposit 订单 0	|0x6485a2b616af2369ce1f99dec05fa464e1855237556a5542443b31749c373edc	|POTOS Testnet transaction |0x6485a2b616af2369ce1f99dec05fa464e1855237556a5542443b31749c373edc /| Blockscout	|0xebc26A08a9fE0E7421A03D0BC8b3a678E6063c7d
|dispute 订单 1	|0xcfc48f020adc69441cf003be380389beede5feb7d667f907ab5dde9dd15829de	|POTOS Testnet transaction |0xcfc48f020adc69441cf003be380389beede5feb7d667f907ab5dde9dd15829de /| Blockscout	|0xB8f31201580d62B5b3eeabaEEA07F34000b20537
|resolve 订单 1	|0x09caee34603dacb88dce17f7235a811506e73d19ab36e7060dd50d8282523398	|POTOS Testnet transaction |0x09caee34603dacb88dce17f7235a811506e73d19ab36e7060dd50d8282523398 /| Blockscout	|0xaCD3de09F8517C5Fc41c459CF92174D9cEDbf195
|confirm 订单 0	|0x6485a2b616af2369ce1f99dec05fa464e1855237556a5542443b31749c373edc	|POTOS Testnet transaction 0x6485a2b616af2369ce1f99dec05fa464e1855237556a5542443b31749c373edc /| Blockscout	|0xebc26A08a9fE0E7421A03D0BC8b3a678E6063c7d
resolve 失败（路线 A）			
