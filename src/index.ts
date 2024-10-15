import { ethers } from "ethers";
import { ExternalResponseData, Response,TokenData, ExternalQuoteData } from "./interface";
import {getEncodedFunctionValue, abiEncode, GetExternalBatchHandlerAddress} from "./utils"
import {getForwarderQuotesRequest, getForwarderEncodedDataRequest, getSwapEncodedDataRequest} from "./axios";
import {batchHandlerAbi} from "./constant/batchHandlerAbi"
import {NATIVE} from "./constant"
async function getAdapterData(data: ExternalQuoteData): Promise<ExternalResponseData> 
// PENPIE STAKE PENDLE
{
  const target = "0xD4Bd2bA9CED0aE7A951061fa5Fbc14C6FfdfC184" // The deployed adapter contract address goes here.
  const callType = 2; // Always send 2 for the call type.
  const value = 0;  // Always send 0 for the value field (as no ETH is transferred).

  const calldata = abiEncode(
    ["address", "uint256"],
    [data.receiverAddress, data.amount]
  );

  // Returning the structured response, including the calldata and token information.
  const response: ExternalResponseData = {
    callData: calldata,
    target: target,
    callType: callType,
    valueType: value, // Type of value, set to 0.
    destAmount: "0", // Amount after the adapter is called. Set to 0 if no further adapters will be called.
    destToken: data.destinationToken, // Destination token after the adapter is called. Empty if no further adapters will be called.
    destChainId: data.destinationToken.chainId, // Destination chain ID for cross-chain operations.
  };
  return(response);
}


/**
 * Main function to handle the batch of operations like swapping tokens or performing cross-chain transactions.
 * It handles both same-chain and cross-chain scenarios, dynamically selecting the right adapter and swap logic.
 * @returns {Promise<Response>} - Returns the final encoded transaction data and related information.
 */
async function main(): Promise<Response> {
  const userAddress = "0xF23CE9CCc0714Be94349D918b61826021b5BF07e"; // The user's wallet address initiating the transaction.

  // Defining the source token the user will be swapping (e.g., MATIC on Polygon).
  const sourceToken = {
    chainId: "8453",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  };

  // Defining the destination token needed by the adapter (e.g., USDC on Base).
  const destToken = {
    chainId: "42161",
    address: "0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8",
    name: "PENDLE",
    symbol: "PENDLE",
    decimals: 18
  };

  const sourceChain = sourceToken.chainId;
  const destinationChain = destToken.chainId;

  // Arrays to store multiple transaction details for batch processing.
  const targets: Array<string> = [];
  const calltypes: Array<number> = [];
  const values: Array<number> = [];
  const calldata: Array<string> = [];

  const sourceAmount: string = ethers.parseEther("1").toString();

  const appIds = [0]; // Always set to 0 in this case.
  const tokens = [sourceToken.address]; // Token address being supplied to the batch handler.
  const amounts = [sourceAmount]; // Amount of the token to be supplied to the batch handler. Ensure it's greater than 12 to avoid failures.

  const sourceBatchHandler = GetExternalBatchHandlerAddress(Number(sourceChain)); // The batch handler contract that processes all the transactions.
  if (String(sourceChain) == String(destinationChain)) {
    // For same-chain operations (e.g., swapping MATIC for USDC on the same chain).

    // Current token starts as the source token (MATIC).
    let currentToken: TokenData = sourceToken;
    let currentAmount = sourceAmount;

    // If the source token is different from the destination token, perform a swap.
    if (sourceToken.address.toLowerCase() !== destToken.address.toLowerCase()) 
    {
      const swapperData:ExternalQuoteData = {
        sourceToken: sourceToken,
        destinationToken: destToken,
        amount: sourceAmount,
        refundAddress: userAddress, // Address to refund any unused funds.
        receiverAddress: userAddress // Address to receive the swapped tokens. // set to batchTrnx for swapper and bridge by default
      };

      // Get the swap data from the swap service.
      const swapperResponse = await getSwapEncodedDataRequest(swapperData);

      // Append the swap details to the batch arrays.
      targets.push(swapperResponse.target);
      calltypes.push(swapperResponse.callType);
      calldata.push(swapperResponse.callData);
      values.push(swapperResponse.valueType);

      // Update the current token and amount after the swap.
      currentToken = swapperResponse.destToken as TokenData;
      currentAmount = swapperResponse.destAmount as string;
    }

    // Prepare the adapter data after the swap.
    const adapterData = {
      sourceToken: currentToken,
      destinationToken: destToken,
      amount: currentAmount,
      refundAddress: userAddress, // userAddress
      receiverAddress: userAddress
    };

    // Get the adapter call data.
    const adapterResponse = await getAdapterData(adapterData);

    // Append the adapter details to the batch arrays.
    targets.push(adapterResponse.target);
    calltypes.push(adapterResponse.callType);
    calldata.push(adapterResponse.callData);
    values.push(adapterResponse.valueType);

  } else {
    // For cross-chain operations (e.g., swapping MATIC on Polygon and sending USDC to Base).
    // Similar flow to the same-chain, but includes bridging.
    let currentToken: TokenData = sourceToken;
    let currentAmount = sourceAmount;
    // Get the bridge quote details for the cross-chain operation.
    const brigdingData = {
      sourceToken: sourceToken,
      destinationToken: destToken,
      amount: sourceAmount,
      refundAddress: userAddress, // userAddress
      receiverAddress: userAddress
    };
    const bridgeQuote = await getForwarderQuotesRequest(brigdingData);

    // Update the token and amount after bridging.
    currentToken = bridgeQuote.destToken;
    currentAmount = bridgeQuote.destAmount;

    // Arrays for handling transactions on the destination side.
    const targetDest: Array<string> = [];
    const calltypesDest: Array<number> = [];
    const valuesDest: Array<number> = [];
    const calldataDest: Array<string> = [];

    // Prepare the adapter data for the destination side.
    const adapterData = {
        sourceToken: currentToken,
        destinationToken: destToken,
        amount: currentAmount,
        refundAddress: userAddress, // userAddress
        receiverAddress: userAddress
    };

    // Get the adapter response for the destination.
    const adapterResponse = await getAdapterData(adapterData);

    // Append the destination adapter details to the arrays.
    targetDest.push(adapterResponse.target);
    calltypesDest.push(adapterResponse.callType);
    calldataDest.push(adapterResponse.callData);
    valuesDest.push(adapterResponse.valueType);

    // Encode the final message that will be sent via the bridge.
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

    // Get the encoded data for the bridge transaction.
    const bridgeResponse = await getForwarderEncodedDataRequest(bridgeQuote, message, userAddress);

    // Append the bridge transaction details to the batch arrays.
    targets.push(bridgeResponse.target);
    calltypes.push(bridgeResponse.callType);
    calldata.push(bridgeResponse.callData);
    values.push(bridgeResponse.valueType);
  }
  // Encode all the function calls for batch execution on the same chain.
  const encodedData = await getEncodedFunctionValue(
    batchHandlerAbi,
    "executeBatchCallsSameChain",
    [appIds, tokens, amounts, targets, values, calltypes, calldata]
  );

  // Return the final transaction data to be sent.
  const response = {
    calldata: encodedData,
    to: sourceBatchHandler,
    from: userAddress,
    value: sourceToken.address == NATIVE ? sourceAmount : "0x00",
  };

  return response;
}

