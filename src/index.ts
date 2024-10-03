import { ethers } from "ethers";
import { ExternalResponseData, Response,TokenData, ExternalQuoteData } from "./interface";
import {getEncodedFunctionValue, abiEncode} from "./utils"
import {getForwarderQuotesRequest, getForwarderEncodedDataRequest, getSwapEncodedDataRequest} from "./axios";
import {batchHandlerAbi} from "./constant/batchHandlerAbi"

async function getAdapterData(data: ExternalQuoteData): Promise<ExternalResponseData> 
{
  const target = "" // Your Deployed Adapter Contract
  const callType = 2; // send it 2 always
  const value = 0;  // send it 0 always

  // your execute data params
  const calldata = abiEncode(
    ["address"],
    [data]
  ); 
  const response: ExternalResponseData = {
    callData: calldata,
    target: target,
    callType: callType,
    valueType: value,
    destAmount: data.amount, // destAmount after your adapter is called, send it zero if no adapter is called after your adatper
    destToken: data.destinationToken, // destToken after your adapter is called, send it empty if no adapter is called after your adatper
    destChainId: data.destinationToken.chainId, // chainId after your adapter is called
  };
  return(response);
}

async function main(): Promise<Response> {
  // token u want to start with
  const userAddress = "";
  const sourceToken = {
    chainId: "137",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  };

  // token ur adapter needs, let say I want to design a adapter which takes usdc at Base
  const destToken = {
    chainId: "8453",
    address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
    resourceID: "usdc-circle",
    isMintable: false,
    isWrappedAsset: false,
  };

  const sourceChain = sourceToken.chainId;
  const destinationChain = destToken.chainId;

  const targets: Array<string> = [];
  const calltypes: Array<number> = [];
  const values: Array<number> = [];
  const calldata: Array<string> = [];

  const sourceAmount: string = ethers.parseEther("1").toString();

  const appIds = [0]; //it will be always zero for u
  const tokens = [sourceToken.address]; //source token supplying to batch handler, token deducted from user wallet
  const amounts = [sourceAmount]; //amount of source token supplying to batch handler, token deducted from user wallet
  // make sure the sourceAmount is >12, to avoid trnx failing at destination side

  const sourceBatchHandler = "";
  if (String(sourceChain) == String(destinationChain)) {
    // Calling Swapper Data
    let currentToken: TokenData = sourceToken;
    let currentAmount = sourceAmount;
    if (sourceToken.address.toLowerCase() !== destToken.address.toLowerCase()) 
    {
      const swapperData:ExternalQuoteData = {
        sourceToken: sourceToken,
        destinationToken: destToken,
        amount: sourceAmount,
        refundAddress: userAddress, // userAddress
        receiverAddress: userAddress
      };
      const swapperResponse = await getSwapEncodedDataRequest(swapperData);
      targets.push(swapperResponse.target);
      calltypes.push(swapperResponse.callType);
      calldata.push(swapperResponse.callData);
      values.push(swapperResponse.valueType);

      currentToken = swapperResponse.destToken as TokenData;
      currentAmount = swapperResponse.destAmount as string;
    }

    const adapterData = {
      sourceToken: currentToken,
      destinationToken: destToken,
      amount: currentAmount,
      refundAddress: userAddress, // userAddress
      receiverAddress: userAddress
    };
    const adapterResponse = await getAdapterData(adapterData);
    targets.push(adapterResponse.target);
    calltypes.push(adapterResponse.callType);
    calldata.push(adapterResponse.callData);
    values.push(adapterResponse.valueType);

  } else {
    // Calling CrossChain Data
    // Calling Swapper Data
    let currentToken: TokenData = sourceToken;
    let currentAmount = sourceAmount;
    const brigdingData = {
      sourceToken: sourceToken,
      destinationToken: destToken,
      amount: sourceAmount,
      refundAddress: userAddress, // userAddress
      receiverAddress: userAddress
    };
    const bridgeQuote = await getForwarderQuotesRequest(brigdingData);
    currentToken = bridgeQuote.destToken;
    currentAmount = bridgeQuote.destAmount;

    const targetDest: Array<string> = [];
    const calltypesDest: Array<number> = [];
    const valuesDest: Array<number> = [];
    const calldataDest: Array<string> = [];

    const adapterData = {
        sourceToken: currentToken,
        destinationToken: destToken,
        amount: currentAmount,
        refundAddress: userAddress, // userAddress
        receiverAddress: userAddress
    };
    const adapterResponse = await getAdapterData(adapterData);

    targetDest.push(adapterResponse.target);
    calltypesDest.push(adapterResponse.callType);
    calldataDest.push(adapterResponse.callData);
    valuesDest.push(adapterResponse.valueType);

    const message = abiEncode(
      ["uint256", "address", "address[]", "uint256[]", "uint256[]", "bytes[]"],
      [
        appIds,
        userAddress,
        targetDest,
        valuesDest,
        calltypesDest,
        calldataDest,
      ]
    );

    const bridgeResponse = await getForwarderEncodedDataRequest(bridgeQuote, message, userAddress);
    targets.push(bridgeResponse.target);
    calltypes.push(bridgeResponse.callType);
    calldata.push(bridgeResponse.callData);
    values.push(bridgeResponse.valueType);
  }

  const encodedData = await getEncodedFunctionValue(
    batchHandlerAbi,
    "executeBatchCallsSameChain",
    [appIds, tokens, amounts, targets, values, calltypes, calldata]
  );

  const response = {
    calldata: encodedData,
    to: sourceBatchHandler,
    from: userAddress,
    value: sourceToken.address == "0xoee" ? sourceAmount : "0x00",
  };

  return response;
}

