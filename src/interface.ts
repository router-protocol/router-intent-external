export interface ExternalQuoteData
{
    sourceToken: TokenData,
    destinationToken: TokenData,
    amount: string,
    refundAddress: string, // userAddress
    receiverAddress: string
}
export interface AdapterIdParamsResponse
{
    adapterId: string;
    adapterType: string;
    sourceChainId: number;
    destChainId: number;
    adapterOptions?: {
        srcToken: TokenData;
        amountIn: string;
        amountOut: string;
        destToken: TokenData;
        receiverAddress: string;
        senderAddress?: string;
        data: ExternalParamsData;
    };
}

export interface ExternalParamsData
{
    actionType: number,
    refundAddress: string,
    partnerId: number,
    isSingleEntry: boolean,
    receiverAddress: string,
    message: string,
    slippageTolerance: number,
    sourceQuote: {
        chainId: string,
        stableReserveAssetDecimal : number,
        path: Array<string>,
        srcReserveTokenWithSlippage: string,
        dataTx: Array<string>,
        flags: Array<string>,
        tokenAmount : string,
    },
    destQuote: {
        chainId: string,
        stableReserveAssetDecimal: number,
        path : Array<string>,
        tokenAmount : string,
        assetResourceId: string,
        stableReseverResourceId: string,
        dataTx: Array<string>,
        flags: Array<string>,
        destReserveTokenWithSlippage: string
    }
}
export interface ExternalResponseData
{
    callData: string;
    target: string;
    callType: number;
    valueType: number;
    destAmount: string;
    destToken: TokenData;
    destChainId: string // userAddress
}

export interface ExternalCrossChainQuoteResponse extends AdapterIdParamsResponse
{
    destToken : TokenData,
    destAmount : string,
    destChain : string
}


export interface TokenData
{
    chainId: string,
    address: string,
    name: string,
    symbol: string,
    decimals: number
}
export interface Response
{
    calldata: string,
    to: string,
    from: string,
    value: string,
}
export interface swapperDataInterface
{
    sourceToken: TokenData,
    destinationToken: TokenData,
    amount: string,
    refundAddress: string, // userAddress
}

export interface responseInterface
{
    callData: string;
    target: string;
    callType: number;
    valueType: number;
    destAmount: string;
    destToken: TokenData;
    destChainId: string // userAddress
}
