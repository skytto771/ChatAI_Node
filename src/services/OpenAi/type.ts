export interface streamBackFn {
    type: string;
    content: string | null;
    tokensUsed?: number;
    messageId?: string;
}