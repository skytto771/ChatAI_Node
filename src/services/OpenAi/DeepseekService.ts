import OpenAI from "openai";
import config from '@/config/openAi'
import { ConversationSettingAttributes } from "@/models/ConversationSetting";
import { streamBackFn } from "./type";


const openai = new OpenAI({
    baseURL: config.deepseek.baseURL,
    apiKey: config.deepseek.apiKey,
});

interface OpenAiOptions extends ConversationSettingAttributes {
    model: string;
    messages: Array<{ role: string; content: string }>;
}

export async function sendToDeepSeekStream(options:OpenAiOptions,onChunk:(back:streamBackFn)=>void) {
    const {
        messages,
        model,
        isThinking,
        enableWebSearch,
        maxTokens,
        temperature,
        topP,
        logprobs,
        topLogprobs,
    } = options

    let thinkingP = {}
    const params:any = {
        model,
        messages,
        stream: true,
        extra_body: {},
    }
    
    if(isThinking){
        switch (options.thinkingMode) {
            case 'fast':
                params.thinking = {"type": "disabled"}
                break
            case 'balanced':
                params.thinking = {"type": "enabled"}
                params.reasoning_effort = "high"
                break
            case 'deep':
                params.thinking = {"type": "enabled"}
                params.reasoning_effort = "max"
        }
    }else{
        params.thinking = {"type": "disabled"}
    }
    // if(enableWebSearch){
    //     params.extra_body.enable_search = true
    // }
    if(maxTokens){
        params.max_tokens = maxTokens
    }
    if(temperature){
        params.temperature = +temperature
    }
    if(topP){
        params.top_p = +topP
    }
    // if(logprobs){
    //     params.logprobs = logprobs
    // }
    // if(topLogprobs){
    //     params.top_logprobs = topLogprobs
    // }

    try {
        // 使用 as any 绕过 TypeScript 对非标准字段（thinking）的严格检查
        let result = {}
        try{
            const completion:any = await openai.chat.completions.create(params as any);
            for await (let chunk of completion){
                // console.log(chunk.choices[0].delta)
                if(chunk.choices[0].finish_reason === 'stop'){
                    onChunk({type: 'finish', content: null, tokensUsed: chunk.usage.total_tokens})
                }
                if(chunk.choices[0].delta.reasoning_content){
                    onChunk({ type: 'reasoning_content', content: chunk.choices[0].delta.reasoning_content })
                }else{
                    onChunk({ type: 'content', content: chunk.choices[0].delta.content })
                }
            }
        }catch (error) {
            onChunk({ type: 'error', content: (error as Error).message })
        }
        
    } catch (error) {
        console.error("DeepSeek API Error:", error);
        throw error;
    }
}