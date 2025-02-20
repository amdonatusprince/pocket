import {
  composeContext,
  elizaLogger,
  generateObjectDeprecated,
  type HandlerCallback,
  ModelClass,
  type IAgentRuntime,
  type Memory,
  type State,
  Action,
} from "@elizaos/core";
import { perplexityTemplate } from "../templates";

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export class PerplexityAction {
  async getFinancialInfo(query: string): Promise<{ status: string; message: string; }> {
    try {
      const systemPrompt = `You are an experienced Chief Financial Officer and Financial Advisor with expertise in both traditional finance and cryptocurrency markets.`;

      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Perplexity API error: ${JSON.stringify(error)}`);
      }

      const result = await response.json();
      return {
        status: "success",
        message: result.choices[0].message.content,
      };
    } catch (error: any) {
      elizaLogger.error("Perplexity API error:", error);
      return {
        status: "error",
        message: `Failed to get financial analysis: ${error.message}`,
      };
    }
  }
}

export const perplexityAction: Action = {
  name: "GET_FINANCIAL_INFO",
  description: "Get professional financial analysis and advice",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: Record<string, unknown>,
    callback?: HandlerCallback
  ): Promise<unknown> => {
    if (!state) return false;
    elizaLogger.log("Starting financial analysis action...");

    // Initialize or update state
    let currentState = state;
    if (!currentState) {
      currentState = (await runtime.composeState(message)) as State;
    } else {
      currentState = await runtime.updateRecentMessageState(currentState);
    }

    // Compose context
    const context = composeContext({
      state: currentState,
      template: perplexityTemplate,
    });
    
    const content = await generateObjectDeprecated({
      runtime,
      context,
      modelClass: ModelClass.LARGE,
    });

    const action = new PerplexityAction();
    try {
      const result = await action.getFinancialInfo(content.query);
      
      callback?.({
        text: result.message,
        content: { status: result.status },
      });
      
      return true;
    } catch (error: any) {
      elizaLogger.error("Error during financial analysis:", error.message);
      callback?.({
        text: `Analysis failed: ${error.message}`,
        content: { error: error.message },
      });
      return false;
    }
  },
  validate: async (_runtime: IAgentRuntime) => {
    return !!process.env.PERPLEXITY_API_KEY;
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "What's the current market sentiment for Bitcoin?",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Let me analyze the current Bitcoin market sentiment for you.",
          action: "GET_FINANCIAL_INFO",
          content: {
            query: "What's the current market sentiment for Bitcoin?",
          },
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Can you explain the tokenomics of $SOL?",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll analyze Solana's tokenomics for you.",
          action: "GET_FINANCIAL_INFO",
          content: {
            query: "Can you explain the tokenomics of $SOL?",
          },
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "What are the key factors affecting DeFi yields right now?",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll analyze the current DeFi yield landscape for you.",
          action: "GET_FINANCIAL_INFO",
          content: {
            query: "What are the key factors affecting DeFi yields right now?",
          },
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "How does staking work in Proof of Stake networks?",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll explain the concept of staking in PoS networks.",
          action: "GET_FINANCIAL_INFO",
          content: {
            query: "How does staking work in Proof of Stake networks?",
          },
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "What's your analysis on the current crypto market conditions?",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll provide a comprehensive analysis of current crypto market conditions.",
          action: "GET_FINANCIAL_INFO",
          content: {
            query: "What's your analysis on the current crypto market conditions?",
          },
        },
      },
    ]
  ],
  similes: [
    "analyze token performance",
    "check market trends",
    "get investment advice",
    "explain financial terms",
    "provide risk assessment",
    "evaluate market conditions",
    "analyze crypto trends",
    "explain DeFi concepts",
    "assess investment opportunities",
    "review token fundamentals",
    "examine market dynamics",
    "study price movements",
    "research crypto projects",
    "investigate market sentiment",
    "explore trading strategies"
  ],
};