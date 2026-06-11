export default {
    port: process.env.PORT || 3000,
    deepseek: {
        apiKey: process.env.OPENAI_DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
    }
};