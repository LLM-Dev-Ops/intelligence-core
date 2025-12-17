export interface SchemaDefinition {
  schemaId: string;
  version: string;
  schema: Record<string, unknown>;
  timestamp: number;
}

export interface SchemaRegistryAdapter {
  getSchema(schemaId: string, version?: string): Promise<SchemaDefinition | null>;
  listSchemas(): Promise<SchemaDefinition[]>;
  validateAgainstSchema(schemaId: string, data: unknown): Promise<{ valid: boolean; errors?: string[] }>;
}

export function createSchemaRegistryAdapter(config?: { baseUrl?: string }): SchemaRegistryAdapter {
  return {
    async getSchema(schemaId: string, version?: string): Promise<SchemaDefinition | null> {
      return null;
    },
    async listSchemas(): Promise<SchemaDefinition[]> {
      return [];
    },
    async validateAgainstSchema(schemaId: string, data: unknown): Promise<{ valid: boolean; errors?: string[] }> {
      return { valid: true };
    },
  };
}
