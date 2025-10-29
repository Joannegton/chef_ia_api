import { GoogleGenAI, Type } from '@google/genai';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema'; 


const RecipeSchema = z.object({
  nome: z.string().min(1).describe('O nome da receita.'),
  descricao: z.string().min(1).describe('Breve descrição criativa da receita.'),
  tempo: z.string().min(1).describe('Tempo total de preparo, ex: "25 min" ou "1 hora".'),
  dificuldade: z.enum(['Fácil', 'Médio', 'Difícil']).describe('Nível de dificuldade.'),
  porcoes: z.number().int().min(1).describe('Número de porções que a receita serve.'),
  ingredientes: z.array(z.string().min(1)).describe('Lista de ingredientes com quantidades, ex: ["200g frango", "2 dentes de alho"].'),
  preparo: z.array(z.string().min(1)).describe('Passos detalhados do preparo (pelo menos 3).'),
  dica: z.string().describe('Uma dica útil sobre a receita ou ingredientes opcionais.'),
});

const RecipesArraySchema = z.array(RecipeSchema);
export type Recipe = z.infer<typeof RecipeSchema>;


const itemSchema = zodToJsonSchema(RecipeSchema, { 
    target: 'openApi3',
}) as any;

const cleanSchema = {
    type: 'object',
    properties: itemSchema.properties,
    required: itemSchema.required || Object.keys(itemSchema.properties || {}),
};

const GEMINI_RECIPES_SCHEMA = {
    type: 'array',
    items: cleanSchema,
};


@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly ia: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY não encontrada nas variáveis de ambiente');
    }
    
    this.ia = new GoogleGenAI({ apiKey }); 
  }

  /**
   * Gera receitas usando o Structured Output (JSON Mode) da API Gemini.
   */
  async generateRecipes(ingredients: string[]): Promise<Recipe[]> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY não configurada');
      throw new ServiceUnavailableException(
        'Serviço de geração de receitas indisponível. Por favor, verifique a chave de API.',
      );
    }

    try {
      const prompt = this.buildPrompt(ingredients);

      const response = await this.ia.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RECIPES_SCHEMA,
        },
      });

      if (!response.text) {
        this.logger.warn('Conteúdo vazio recebido da API Gemini');
        throw new ServiceUnavailableException(
          'Nenhuma receita foi gerada. Por favor, tente novamente.',
        );
      }

      const startIdx = response.text.indexOf('[');
      const endIdx = response.text.lastIndexOf(']');

      if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        this.logger.error('Nenhum JSON válido encontrado na resposta:', response.text.substring(0, 300));
        throw new ServiceUnavailableException(
          'Resposta inválida da IA. Por favor, tente novamente.',
        );
      }

      const jsonString = response.text.substring(startIdx, endIdx + 1);
      
      const parsedRecipes = JSON.parse(jsonString);
      
      const validatedRecipes = RecipesArraySchema.parse(parsedRecipes);

      return validatedRecipes;

    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error('Falha na validação Zod da resposta do Gemini:', error.issues);
        throw new ServiceUnavailableException(
          'O serviço de IA gerou um formato inválido. Por favor, tente novamente.',
        );
      }
      
      if (error instanceof SyntaxError) {
        this.logger.error('Erro ao fazer parse do JSON da resposta:', error.message);
        throw new ServiceUnavailableException(
          'Resposta malformada da IA. Por favor, tente novamente.',
        );
      }
      
      // Captura erros de rede/serviço
      if (error && (error as any).status === 429) {
          this.logger.error('Limite de requisições excedido para Gemini API');
          throw new ServiceUnavailableException(
              'Limite de requisições atingido. Por favor, tente novamente em alguns minutos.',
          );
      }
      
      this.logger.error('Erro ao chamar a API Gemini:', error);
      throw new ServiceUnavailableException(
        'Erro desconhecido ao conectar com o serviço de IA.',
      );
    }
  }

  /**
   * Constrói o prompt para o Gemini
   */
  private buildPrompt(ingredients: string[]): string {
    const ingredientsList = ingredients.map(i => i.trim()).filter(Boolean).join(', ');
    
    const exampleRecipes = [
      {
        nome: "Frango Grelhado com Arroz e Tomate",
        descricao: "Prato principal saudável e rápido, com proteína magra e legumes.",
        tempo: "25 min",
        dificuldade: "Fácil",
        porcoes: 2,
        ingredientes: ["300g frango", "1 xícara arroz", "2 tomates", "sal", "pimenta"],
        preparo: [
          "1. Tempere o frango com sal, pimenta e azeite.",
          "2. Grelhe o frango em fogo médio por 10-12 minutos.",
          "3. Cozinhe o arroz e refogue com tomate e temperos."
        ],
        dica: "Deixe o frango descansar 3 minutos antes de cortar para manter a suculência."
      },
      {
        nome: "Torta Doce de Abóbora",
        descricao: "Sobremesa clássica, morna e reconfortante, perfeita para qualquer ocasião.",
        tempo: "50 min",
        dificuldade: "Médio",
        porcoes: 6,
        ingredientes: ["500g abóbora", "200g farinha", "100g açúcar", "2 ovos", "manteiga"],
        preparo: [
          "1. Cozinhe a abóbora até ficar macia e faça um purê.",
          "2. Misture com açúcar, ovos e manteiga derretida.",
          "3. Despeje em forma com massa e asse a 180°C por 35-40 minutos."
        ],
        dica: "Use abóbora cabotiá para melhor consistência no purê."
      }
    ];

    return `Você é um chef criativo e experiente. Crie EXATAMENTE 3 receitas criativas usando APENAS os ingredientes fornecidos + temperos básicos universais (sal, pimenta, óleo/azeite, alho, cebola).

INGREDIENTES DISPONÍVEIS: ${ingredientsList}

IMPORTANTE - ACEITE QUALQUER TIPO DE RECEITA:
- Pratos principais, acompanhamentos, sobremesas, aperitivos, bebidas, saladas
- Culinárias de qualquer região/país (Asiática, Mediterrânea, Brasileira, Mexicana, etc)
- Receitas vegetarianas, carnívoras, doces, salgadas, fritas, grelhadas, assadas

REGRAS OBRIGATÓRIAS:
1. Use APENAS os ingredientes listados (mais temperos básicos).
2. Crie receitas VARIADAS e DIFERENTES - não repita técnicas de preparo.
3. Inclua MÍNIMO 3 passos detalhados no preparo.
4. Retorne APENAS um JSON válido, sem explicações, sem markdown, sem blocos de código.
5. Estrutura EXATA esperada:

[
  {
    "nome": "Nome da Receita",
    "descricao": "Breve descrição (máx 80 caracteres)",
    "tempo": "Tempo em minutos ou horas (ex: 25 min, 1 hora)",
    "dificuldade": "Fácil | Médio | Difícil",
    "porcoes": Número inteiro de porções,
    "ingredientes": ["quantidade + ingrediente", "exemplo: 300g frango", "2 tomates", ...],
    "preparo": ["1. Passo detalhado...", "2. Próximo passo...", "3. Continuando..."],
    "dica": "Dica útil, sugestão de apresentação, ou variação opcional"
  }
]

EXEMPLOS DE SAÍDA (SIGA APENAS O FORMATO, NÃO COPIE O CONTEÚDO):
${JSON.stringify(exampleRecipes, null, 2)}

AGORA GERE 3 RECEITAS CRIATIVAS E DIFERENTES:`;
  }
}