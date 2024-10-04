import { ethers } from "ethers";
import { ExternalIntentBatchTransactionContract } from "./constant";
export const getEncodedFunctionValue = (
  abi: any,
  functionName: string,
  args: Array<any>
): string => {
  // const argArray = Object.entries(args);
  // const abi = abiName == "aaveV3LendingAdapter" ? aaveV3LendingAdapter : aaveV3Pool
  const iface = new ethers.Interface(abi);
  const response = iface.encodeFunctionData(functionName, args);
  return response;
};

export const abiEncode = (types: any[], values: any[]) => {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const res = abiCoder.encode(types, values);
  return res;
};

export const GetExternalBatchHandlerAddress = (chainId: number) => {
  if (!ExternalIntentBatchTransactionContract[chainId]) {
    const error = {
      title: "Batch Contract Not Available",
      message: "Batch Trnx not allowed on this chain",
    };
    throw error;
  }
  return ExternalIntentBatchTransactionContract[chainId];
};
