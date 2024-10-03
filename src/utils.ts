import {ethers} from "ethers"
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
  