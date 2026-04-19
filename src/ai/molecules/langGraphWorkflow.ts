/**
 * MOLECULE: LangGraph Workflow Service
 * Atomic Design Pattern - Combination of atoms for AI workflow orchestration
 */

import { StateGraph, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { AIConfiguration, ConfigAtom } from "../atoms/aiConfig";
import { AIEmbeddingService, EmbeddingMolecule } from "./aiEmbedding";

export interface FashionWorkflowState {
  messages: BaseMessage[];
  userQuery: string;
  userPreferences?: any;
  budget?: number;
  category?: string;
  style?: string;
  occasion?: string;
  searchResults: any[];
  embeddings: number[];
  recommendations: any[];
  alternatives: any[];
  marketingInsights: any[];
  priceComparisons?: any[];
  error?: string;
  currentStep: string;
}

export interface WorkflowStep {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  duration?: number;
}

// LangGraph workflow molecule
export class FashionLangGraphWorkflow {
  private config: ConfigAtom;
  private embeddingService: EmbeddingMolecule;
  private llm: ChatOpenAI;

  constructor() {
    this.config = AIConfiguration;
    this.embeddingService = new AIEmbeddingService();
    this.llm = new ChatOpenAI({
      modelName: this.config.getModelConfig('chat'),
      temperature: this.config.getSetting('temperature'),
      openAIApiKey: this.config.getApiKey('openai'),
    });
  }

  // Molecule: Create complete fashion search workflow
  createFashionSearchWorkflow(): StateGraph<FashionWorkflowState> {
    const workflow = new StateGraph<FashionWorkflowState>({
      channels: {
        messages: {
          value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
          default: () => [],
        },
        userQuery: { default: () => "" },
        userPreferences: { default: () => undefined },
        budget: { default: () => undefined },
        category: { default: () => undefined },
        style: { default: () => undefined },
        occasion: { default: () => undefined },
        searchResults: { default: () => [] },
        embeddings: { default: () => [] },
        recommendations: { default: () => [] },
        alternatives: { default: () => [] },
        marketingInsights: { default: () => [] },
        error: { default: () => undefined },
        currentStep: { default: () => "initialized" },
      },
    });

    // Add workflow nodes
    this.addWorkflowNodes(workflow);
    this.addWorkflowEdges(workflow);

    return workflow;
  }

  // Molecule: Add all workflow nodes
  private addWorkflowNodes(workflow: StateGraph<FashionWorkflowState>): void {
    // Node: Process user query
    workflow.addNode("process_query", async (state: FashionWorkflowState) => {
      try {
        state.currentStep = "process_query";
        const lastMessage = state.messages[state.messages.length - 1];
        const query = state.userQuery || (lastMessage as HumanMessage).content as string;
        
        // Extract budget from query
        const budgetMatch = query.match(/under \$?(\d+)/i);
        const budget = budgetMatch ? parseInt(budgetMatch[1]) : state.budget;
        
        // Extract category and style
        const category = this.extractCategory(query) || state.category;
        const style = this.extractStyle(query) || state.style;
        const occasion = this.extractOccasion(query) || state.occasion;

        return {
          ...state,
          userQuery: query.replace(/under \$?\d+/i, '').trim(),
          budget,
          category,
          style,
          occasion,
        };
      } catch (error) {
        return {
          ...state,
          error: `Query processing failed: ${error}`,
          currentStep: "error",
        };
      }
    });

    // Node: Generate embeddings
    workflow.addNode("generate_embeddings", async (state: FashionWorkflowState) => {
      try {
        state.currentStep = "generate_embeddings";
        
        const textsToEmbed = [
          state.userQuery,
          ...(state.category ? [state.category] : []),
          ...(state.style ? [state.style] : []),
          ...(state.occasion ? [state.occasion] : []),
        ];

        const embeddings = await Promise.all(
          textsToEmbed.map(text => 
            this.embeddingService.generateEmbedding({ text })
          )
        );

        return {
          ...state,
          embeddings: embeddings.map(e => e.embedding),
        };
      } catch (error) {
        return {
          ...state,
          error: `Embedding generation failed: ${error}`,
          currentStep: "error",
        };
      }
    });

    // Node: Search similar items
    workflow.addNode("search_similar", async (state: FashionWorkflowState) => {
      try {
        state.currentStep = "search_similar";
        
        const searchResults = await Promise.all(
          state.embeddings.map(embedding =>
            this.embeddingService.searchSimilarItems({
              query: embedding,
              topK: 10,
              filter: state.budget ? { maxPrice: state.budget } : undefined,
            })
          )
        );

        // Flatten and deduplicate results
        const allResults = searchResults.flatMap(result => result.matches || []);
        const uniqueResults = this.deduplicateResults(allResults);

        return {
          ...state,
          searchResults: uniqueResults,
        };
      } catch (error) {
        return {
          ...state,
          error: `Similarity search failed: ${error}`,
          currentStep: "error",
        };
      }
    });

    // Node: Generate recommendations
    workflow.addNode("generate_recommendations", async (state: FashionWorkflowState) => {
      try {
        state.currentStep = "generate_recommendations";
        
        const prompt = `
          Based on these search results for "${state.userQuery}":
          ${JSON.stringify(state.searchResults.slice(0, 5), null, 2)}
          
          User preferences:
          ${JSON.stringify(state.userPreferences || {}, null, 2)}
          
          Budget: ${state.budget || 'Not specified'}
          Category: ${state.category || 'Not specified'}
          Style: ${state.style || 'Not specified'}
          Occasion: ${state.occasion || 'Not specified'}
          
          Provide 5 personalized fashion recommendations considering:
          1. Style compatibility with user preferences
          2. Price value within budget constraints
          3. Quality indicators from search results
          4. Current fashion trends
          5. Versatility and styling options
          
          Format as JSON array of recommendation objects with:
          {
            "item": "Item name and description",
            "reason": "Why it's recommended",
            "styleMatch": "How it matches user style",
            "valueScore": "Score from 1-10",
            "trendiness": "How trendy this item is",
            "price": "Item price",
            "withinBudget": true/false
          }
        `;

        const response = await this.llm.invoke([new HumanMessage(prompt)]);
        const recommendations = JSON.parse(response.content as string);

        return {
          ...state,
          recommendations,
          messages: [...state.messages, new AIMessage("Generated fashion recommendations")],
        };
      } catch (error) {
        return {
          ...state,
          error: `Recommendation generation failed: ${error}`,
          currentStep: "error",
        };
      }
    });

    // Node: Find cheaper alternatives
    workflow.addNode("find_alternatives", async (state: FashionWorkflowState) => {
      try {
        state.currentStep = "find_alternatives";
        
        if (!state.budget) {
          return {
            ...state,
            alternatives: [],
            currentStep: "skipped_alternatives",
          };
        }

        const prompt = `
          For these fashion items, find cheaper alternatives within $${state.budget} budget:
          ${JSON.stringify(state.searchResults.slice(0, 3), null, 2)}
          
          Find alternatives that:
          1. Cost significantly less than original items
          2. Maintain similar style and quality
          3. Are from reputable retailers
          4. Have good customer ratings
          5. Are currently in stock
          
          Format as JSON array of alternative objects with:
          {
            "originalItem": "Reference to original item",
            "alternative": "Alternative item details",
            "savings": "Amount saved",
            "savingsPercentage": "Percentage saved",
            "retailer": "Alternative retailer",
            "qualityScore": "Quality rating 1-10",
            "availability": "Stock status"
          }
        `;

        const response = await this.llm.invoke([new HumanMessage(prompt)]);
        const alternatives = JSON.parse(response.content as string);

        return {
          ...state,
          alternatives,
          messages: [...state.messages, new AIMessage("Found cheaper alternatives")],
        };
      } catch (error) {
        return {
          ...state,
          error: `Alternative search failed: ${error}`,
          currentStep: "error",
        };
      }
    });

    // Node: Generate marketing insights
    workflow.addNode("marketing_insights", async (state: FashionWorkflowState) => {
      try {
        state.currentStep = "marketing_insights";
        
        const prompt = `
          Analyze these fashion search results for marketing insights:
          ${JSON.stringify(state.searchResults, null, 2)}
          
          Query: "${state.userQuery}"
          Category: ${state.category || 'Not specified'}
          Style: ${state.style || 'Not specified'}
          
          Provide insights on:
          1. Current pricing strategies in this category
          2. Popular brands and their positioning
          3. Consumer behavior patterns
          4. Emerging trends and opportunities
          5. Competitive landscape analysis
          
          Format as JSON array of insight objects with:
          {
            "category": "pricing|trends|competition|behavior",
            "insight": "Detailed analysis",
            "actionable": "How to use this insight",
            "confidence": "Confidence score 1-10"
          }
        `;

        const response = await this.llm.invoke([new HumanMessage(prompt)]);
        const insights = JSON.parse(response.content as string);

        return {
          ...state,
          marketingInsights: insights,
          messages: [...state.messages, new AIMessage("Generated marketing insights")],
        };
      } catch (error) {
        return {
          ...state,
          error: `Marketing analysis failed: ${error}`,
          currentStep: "error",
        };
      }
    });

    // Node: Finalize results
    workflow.addNode("finalize", async (state: FashionWorkflowState) => {
      try {
        state.currentStep = "finalize";
        
        const finalResults = {
          query: state.userQuery,
          searchResults: state.searchResults,
          recommendations: state.recommendations,
          alternatives: state.alternatives,
          marketingInsights: state.marketingInsights,
          budget: state.budget,
          category: state.category,
          style: state.style,
          occasion: state.occasion,
          userPreferences: state.userPreferences,
          workflowSteps: this.getWorkflowSteps(state),
          completedAt: new Date().toISOString(),
        };

        return {
          ...state,
          messages: [...state.messages, new AIMessage("Fashion workflow completed")],
        };
      } catch (error) {
        return {
          ...state,
          error: `Finalization failed: ${error}`,
          currentStep: "error",
        };
      }
    });
  }

  // Molecule: Define workflow edges
  private addWorkflowEdges(workflow: StateGraph<FashionWorkflowState>): void {
    workflow.addEdge("process_query", "generate_embeddings");
    workflow.addEdge("generate_embeddings", "search_similar");
    workflow.addEdge("search_similar", "generate_recommendations");
    workflow.addEdge("generate_recommendations", "find_alternatives");
    workflow.addEdge("find_alternatives", "marketing_insights");
    workflow.addEdge("marketing_insights", "finalize");
    workflow.addEdge("finalize", END);

    // Error handling edges
    workflow.addEdge("process_query", "error");
    workflow.addEdge("generate_embeddings", "error");
    workflow.addEdge("search_similar", "error");
    workflow.addEdge("generate_recommendations", "error");
    workflow.addEdge("find_alternatives", "error");
    workflow.addEdge("marketing_insights", "error");
    workflow.addEdge("error", END);
  }

  // Molecule: Execute workflow
  async executeWorkflow(initialState: Partial<FashionWorkflowState>): Promise<FashionWorkflowState> {
    try {
      const workflow = this.createFashionSearchWorkflow();
      const compiledWorkflow = workflow.compile();
      
      const fullInitialState: FashionWorkflowState = {
        messages: [new HumanMessage(initialState.userQuery || "")],
        userQuery: initialState.userQuery || "",
        userPreferences: initialState.userPreferences,
        budget: initialState.budget,
        category: initialState.category,
        style: initialState.style,
        occasion: initialState.occasion,
        searchResults: [],
        embeddings: [],
        recommendations: [],
        alternatives: [],
        marketingInsights: [],
        currentStep: "initialized",
      };

      const result = await compiledWorkflow.invoke(fullInitialState);
      return result;
    } catch (error) {
      console.error('Workflow execution failed:', error);
      return {
        messages: [new HumanMessage(initialState.userQuery || "")],
        userQuery: initialState.userQuery || "",
        searchResults: [],
        recommendations: [],
        alternatives: [],
        marketingInsights: [],
        error: `Workflow execution failed: ${error}`,
        currentStep: "error",
      };
    }
  }

  // Molecule: Helper methods
  private extractCategory(query: string): string | null {
    const categories = ['clothing', 'shoes', 'accessories', 'bags', 'jewelry'];
    const found = categories.find(cat => query.toLowerCase().includes(cat.toLowerCase()));
    return found || null;
  }

  private extractStyle(query: string): string | null {
    const styles = ['casual', 'formal', 'sporty', 'vintage', 'streetwear', 'minimalist'];
    const found = styles.find(style => query.toLowerCase().includes(style.toLowerCase()));
    return found || null;
  }

  private extractOccasion(query: string): string | null {
    const occasions = ['work', 'party', 'wedding', 'casual', 'date', 'interview'];
    const found = occasions.find(occasion => query.toLowerCase().includes(occasion.toLowerCase()));
    return found || null;
  }

  private deduplicateResults(results: any[]): any[] {
    const seen = new Set();
    return results.filter(item => {
      const id = item.id || item.metadata?.id;
      if (id && !seen.has(id)) {
        seen.add(id);
        return true;
      }
      return false;
    });
  }

  private getWorkflowSteps(state: FashionWorkflowState): WorkflowStep[] {
    return [
      { name: "process_query", description: "Process user query", status: "completed" },
      { name: "generate_embeddings", description: "Generate embeddings", status: "completed" },
      { name: "search_similar", description: "Search similar items", status: "completed" },
      { name: "generate_recommendations", description: "Generate recommendations", status: "completed" },
      { name: "find_alternatives", description: "Find alternatives", status: "completed" },
      { name: "marketing_insights", description: "Generate marketing insights", status: "completed" },
      { name: "finalize", description: "Finalize results", status: state.currentStep === "finalize" ? "completed" : "pending" },
    ];
  }

  // Molecule: Get workflow status
  async getWorkflowStatus(workflowId: string): Promise<{
    status: 'running' | 'completed' | 'failed';
    currentStep: string;
    progress: number;
  }> {
    // This would integrate with a workflow storage system
    return {
      status: 'completed',
      currentStep: 'finalize',
      progress: 100,
    };
  }

  // Molecule: Cancel workflow
  async cancelWorkflow(workflowId: string): Promise<boolean> {
    // This would implement workflow cancellation logic
    return true;
  }
}

// Export molecule for composition
export { FashionLangGraphWorkflow as LangGraphMolecule };
