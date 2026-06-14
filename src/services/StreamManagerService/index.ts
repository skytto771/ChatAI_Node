// ===== 消息流管理器 =====
export class MessageStreamManager {
    // 存储活跃的流和其监听器
    private static streams: Map<string, {
        messageId: string;
        listeners: Map<string, (chunk: any) => void>;
        status: 'generating' | 'completed';
        buffer: any[]; // 缓冲区，用于新连接的客户端
        fullContent: string; // 完整内容
        fullReasoning: string; // 完整推理内容
    }> = new Map();
    
    // 创建新的流
    static createStream(messageId: string) {
        const stream = {
            messageId,
            listeners: new Map(),
            status: 'generating' as 'generating',
            buffer: [],
            fullContent: '',
            fullReasoning: '',
        };
        this.streams.set(messageId, stream);
        return messageId;
    }
    
    // 添加监听器并返回唯一ID
    static addListener(messageId: string, listener: (chunk: any) => void): string | null {
        const stream = this.streams.get(messageId);
        if (!stream) return null;
        
        const listenerId = `listener_${Date.now()}_${Math.random()}`;
        stream.listeners.set(listenerId, listener);
        return listenerId;
    }
    
    // 移除监听器
    static removeListener(messageId: string) {
        const stream = this.streams.get(messageId);
        if (stream) {
            // 注意：这里简化处理，实际需要传入具体的listener引用
            stream.listeners.clear();
        }
    }

    // 获取流信息
    static getStream(messageId: string) {
        return this.streams.get(messageId);
    }

    static pushChunk(messageId: string, chunk: any) {
        const stream = this.streams.get(messageId);
        if (!stream) return;
        
        // 更新缓冲区
        stream.buffer.push(chunk);
        
        // 更新完整内容
        if (chunk.type === 'content' && chunk.content) {
            stream.fullContent += chunk.content;
        }
        if (chunk.type === 'reasoning_content' && chunk.content) {
            stream.fullReasoning += chunk.content;
        }
        
        // 🔥 广播给所有监听器
        stream.listeners.forEach((listener, listenerId) => {
            try {
                listener(chunk);
            } catch (error) {
                console.error(`Listener ${listenerId} error:`, error);
            }
        });
    }
    
    // 广播数据到所有监听器
    static broadcast(messageId: string, chunk: any) {
        const stream = this.streams.get(messageId);
        if (stream) {
            // 保存到缓冲区
            stream.buffer.push(chunk);
            
            // 通知所有监听器
            stream.listeners.forEach(listener => {
                try {
                    listener(chunk);
                } catch (error) {
                    console.error('Broadcast error:', error);
                }
            });
        }
    }
    
    // 完成流
    static completeStream(messageId: string) {
        const stream = this.streams.get(messageId);
        if (stream) {
            stream.status = 'completed';
            // 通知所有监听器
            stream.listeners.forEach(listener => {
                try {
                    listener({ type: 'finish', messageId });
                } catch (error) {
                    console.error('Complete notification error:', error);
                }
            });
            
            // 延迟清理（给重连留时间）
            setTimeout(() => {
                this.streams.delete(messageId);
            }, 5*60*1000); // 5分钟后清理
        }
    }
    
    // 获取缓冲区数据（从指定位置开始）
    static getBufferedChunks(messageId: string, fromPosition: number) {
        const stream = this.streams.get(messageId);
        if (stream) {
            return stream.buffer.filter(chunk => 
                chunk.position >= fromPosition
            );
        }
        return [];
    }
}