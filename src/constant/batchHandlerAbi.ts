export const batchHandlerAbi = [
    {
        inputs: [
            {
                internalType: "uint256",
                name: "appId",
                type: "uint256"
            },
            {
                internalType: "address[]",
                name: "tokens",
                type: "address[]"
            },
            {
                internalType: "uint256[]",
                name: "amounts",
                type: "uint256[]"
            },
            {
                internalType: "bytes",
                name: "feeData",
                type: "bytes"
            },
            {
                internalType: "address[]",
                name: "target",
                type: "address[]"
            },
            {
                internalType: "uint256[]",
                name: "value",
                type: "uint256[]"
            },
            {
                internalType: "uint256[]",
                name: "callType",
                type: "uint256[]"
            },
            {
                internalType: "bytes[]",
                name: "data",
                type: "bytes[]"
            }
        ],
        name: "executeBatchCallsSameChain",
        outputs: [] as any,
        stateMutability: "payable",
        type: "function"
    }
]
