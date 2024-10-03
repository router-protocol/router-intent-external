import axios from 'axios';
import {ExternalQuoteData, ExternalCrossChainQuoteResponse, ExternalResponseData} from "./interface"
async function callPostRequest(title: string,postData: any): Promise<any> {
  try {
    const url =  "https://api.pod.routerintents.com/router-intent"+title
    const response = await axios.post(url, postData);
    return response
  } catch (error) {
    console.error('Error creating post:', error);
  }
}

async function getForwarderQuotesRequest(data:ExternalQuoteData): Promise<ExternalCrossChainQuoteResponse>
{
    const forwarderQuote = await callPostRequest("/get-cross-chain-quote", data);
    return forwarderQuote
}

async function getForwarderEncodedDataRequest(data:ExternalCrossChainQuoteResponse, message: string, receiverAddress: string): Promise<ExternalResponseData>
{
    const forwarderQuoteEncoded = await callPostRequest("/get-cross-chain-encoding", {data, message, receiverAddress});
    return forwarderQuoteEncoded
}

async function getSwapEncodedDataRequest(data:ExternalQuoteData): Promise<ExternalResponseData>
{
    const forwarderQuoteEncoded = await callPostRequest("/get-swap-encoding", data);
    return forwarderQuoteEncoded
}
export {
    callPostRequest,
    getForwarderQuotesRequest,
    getSwapEncodedDataRequest,
    getForwarderEncodedDataRequest
}