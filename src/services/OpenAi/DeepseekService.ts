import OpenAI from "openai";
import config from '@/config/openAi'

const openai = new OpenAI({
    baseURL: config.deepseek.baseURL,
    apiKey: config.deepseek.apiKey,
});

interface OpenAiOptions {
    model: string;
    messages: Array<{ role: string; content: string }>;
    thinking: string;
    webSearch: boolean;
    fileUpload: boolean;
}

interface streamBackFn {
    type: string;
    content: string | null;
    tokensUsed?: number;
    messageId?: string;
}

export async function sendToDeepSeek(options:OpenAiOptions) {
    const {
        messages,
        model,
        thinking,
        webSearch,
        fileUpload,
    } = options

    let thinkingP = {}
    const params:any = {
        model,
        messages,
        stream: false,
    }
    switch(thinking){
        case 'fast':
            params.thinking = {"type": "disabled"}
            break
        case 'balanced':
            params.extra_body = {"type": "enabled"}
            params.reasoning_effort = "high"
            break
        case 'deep':
            params.extra_body = {"type": "enabled"}
            params.reasoning_effort = "max"
    }


    try {
        // 使用 as any 绕过 TypeScript 对非标准字段（thinking）的严格检查
        const completion = await openai.chat.completions.create(params as any);
        const result = {...completion.choices[0].message, tokensUsed: completion.usage?.total_tokens || 0}
        return result;
        
    } catch (error) {
        console.error("DeepSeek API Error:", error);
        throw error;
    }
}

export async function sendToDeepSeekStream(options:OpenAiOptions,onChunk:(back:streamBackFn)=>void) {
    const {
        messages,
        model,
        thinking,
        webSearch,
        fileUpload,
    } = options

    let thinkingP = {}
    const params:any = {
        model,
        messages,
        stream: true,
    }
    switch(thinking){
        case 'fast':
            params.thinking = {"type": "disabled"}
            break
        case 'balanced':
            params.extra_body = {"type": "enabled"}
            params.reasoning_effort = "high"
            break
        case 'deep':
            params.extra_body = {"type": "enabled"}
            params.reasoning_effort = "max"
    }
    if(webSearch){
        params.extra_body.enable_search = true
    }


    try {
        // 使用 as any 绕过 TypeScript 对非标准字段（thinking）的严格检查
        let result = {}
        try{
            const completion:any = await openai.chat.completions.create(params as any);
            for await (let chunk of completion){
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