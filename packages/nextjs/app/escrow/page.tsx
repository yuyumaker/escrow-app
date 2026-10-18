"use client";

import { useMemo, useState } from "react";
import { Address, formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import {
  useDeployedContractInfo,
  useScaffoldEventHistory,
  useScaffoldReadContract,
  useScaffoldWriteContract,
} from "~~/hooks/scaffold-eth";

/* eslint-disable @typescript-eslint/no-unused-vars */

const STATUS = ["Created", "Paid", "Completed", "Refunded", "Disputed"];

type Order = {
  buyer: Address;
  seller: Address;
  token: Address;
  amount: bigint;
  deadline: bigint;
  status: number;
  description: string;
};

function OrderRow({ id }: { id: bigint }) {
  const { address } = useAccount();
  const { data: order } = useScaffoldReadContract({
    contractName: "Escrow",
    functionName: "getOrder",
    args: [id],
  });
  const { data: arbiter } = useScaffoldReadContract({
    contractName: "Escrow",
    functionName: "arbiter",
  });
  const { writeContractAsync: writeEscrow } = useScaffoldWriteContract({
    contractName: "Escrow",
  });

  const o = order as unknown as Order | undefined;
  if (!o)
    return (
      <tr>
        <td colSpan={8} className="p-2">
          加载订单 {id.toString()}…
        </td>
      </tr>
    );

  const role = address === o.buyer ? "买家" : address === o.seller ? "卖家" : address === arbiter ? "仲裁人" : "旁观者";
  const isPaid = o.status === 1;
  const isDisputed = o.status === 4;

  return (
    <tr className="border-t">
      <td className="p-2">{id.toString()}</td>
      <td className="p-2">
        {o.buyer.slice(0, 6)}…{o.buyer.slice(-4)}
      </td>
      <td className="p-2">
        {o.seller.slice(0, 6)}…{o.seller.slice(-4)}
      </td>
      <td className="p-2">{formatUnits(o.amount, 18)}</td>
      <td className="p-2 font-bold text-blue-600">{STATUS[o.status]}</td>
      <td className="p-2">{role}</td>
      <td className="p-2">{o.description}</td>
      <td className="p-2 space-x-2">
        {role === "买家" && isPaid && (
          <button
            className="btn btn-sm btn-success"
            onClick={() => writeEscrow({ functionName: "confirm", args: [id] })}
          >
            确认收货
          </button>
        )}
        {(role === "买家" || role === "卖家") && isPaid && !isDisputed && (
          <button
            className="btn btn-sm btn-warning"
            onClick={() => writeEscrow({ functionName: "dispute", args: [id] })}
          >
            争议
          </button>
        )}
        {role === "仲裁人" && isDisputed && (
          <>
            <button
              className="btn btn-sm btn-success"
              onClick={() => writeEscrow({ functionName: "resolve", args: [id, true] })}
            >
              判给卖家
            </button>
            <button
              className="btn btn-sm btn-error"
              onClick={() => writeEscrow({ functionName: "resolve", args: [id, false] })}
            >
              退给买家
            </button>
          </>
        )}
      </td>
    </tr>
  );
}

export default function EscrowPage() {
  const { address } = useAccount();
  const { data: arbiter } = useScaffoldReadContract({
    contractName: "Escrow",
    functionName: "arbiter",
  });
  const { data: created } = useScaffoldEventHistory({
    contractName: "Escrow",
    eventName: "OrderCreated",
    fromBlock: 0n,
    watch: true,
    blocksBatchSize: 10,
  });
  const { writeContractAsync: writeEscrow } = useScaffoldWriteContract({
    contractName: "Escrow",
  });
  const { writeContractAsync: writeToken } = useScaffoldWriteContract({
    contractName: "PQYToken",
  });
  const { data: escrowInfo } = useDeployedContractInfo({ contractName: "Escrow" });
  const { data: tokenInfo } = useDeployedContractInfo({ contractName: "PQYToken" });

  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("");
  const [minutes, setMinutes] = useState("");
  const [desc, setDesc] = useState("");

  const ids = useMemo(() => (created ? created.map((e: any) => e.args.id as bigint) : []), [created]);

  const createOrder = async () => {
    if (!seller || !amount || !minutes || !tokenInfo?.address) return alert("请填写完整");
    await writeEscrow({
      functionName: "createOrder",
      args: [
        seller as Address,
        tokenInfo.address,
        parseUnits(amount, 18),
        BigInt(Math.floor(Date.now() / 1000) + +minutes * 60),
        desc,
      ],
    });
    setSeller("");
    setAmount("");
    setMinutes("");
    setDesc("");
  };

  const pay = async (id: bigint, amt: bigint) => {
    if (!escrowInfo?.address) return alert("合约地址未加载");
    await writeToken({ functionName: "approve", args: [escrowInfo.address, amt] });
    await writeEscrow({ functionName: "deposit", args: [id] });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">代币托管 Escrow</h1>
      <p className="mb-2">
        当前账户：{address ?? "未连接"}
        {address === arbiter && <span className="text-amber-600 font-bold ml-2">（你是仲裁人）</span>}
      </p>

      <div className="card bg-base-200 p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">创建订单</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input input-bordered"
            placeholder="卖家地址 0x…"
            value={seller}
            onChange={e => setSeller(e.target.value)}
          />
          <input
            className="input input-bordered"
            placeholder="金额（个）"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <input
            className="input input-bordered"
            placeholder="多少分钟后到期"
            value={minutes}
            onChange={e => setMinutes(e.target.value)}
          />
          <input
            className="input input-bordered"
            placeholder="描述"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </div>
        <button className="btn btn-primary mt-3" onClick={createOrder}>
          创建订单
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>买家</th>
              <th>卖家</th>
              <th>金额</th>
              <th>状态</th>
              <th>角色</th>
              <th>描述</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {ids.map(id => (
              <OrderRow key={id.toString()} id={id} />
            ))}
            {ids.length === 0 && (
              <tr>
                <td colSpan={8}>暂无订单</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
