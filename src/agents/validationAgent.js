/**
 * Validation Agent
 * Verifies required output fields and validates node output structures.
 */
class ValidationAgent {
  constructor() {
    this.name = 'validation';
  }

  /**
   * Validate the output of an executed node
   * @param {object} node - Workflow node definition
   * @param {object} executionResult - Result emitted by ExecutionAgent
   * @returns {object} { isValid: boolean, missingFields: Array<string>, details: object }
   */
  async validate(node, executionResult) {
    const { output, nodeType } = executionResult;
    const requiredFields = node.data?.config?.requiredFields || [];
    const missingFields = [];

    if (!output) {
      return {
        isValid: false,
        missingFields: ['output_payload'],
        message: `Node ${node.id} produced null or empty output`,
      };
    }

    // Check specific required fields if configured
    if (Array.isArray(requiredFields) && requiredFields.length > 0) {
      requiredFields.forEach((field) => {
        if (output[field] === undefined || output[field] === null || output[field] === '') {
          missingFields.push(field);
        }
      });
    }

    // Standard structural checks based on node type
    if (nodeType.startsWith('ai_') && !output.analysis && !output.result && !output.text && !output.status) {
      missingFields.push('ai_content_result');
    }

    const isValid = missingFields.length === 0;

    return {
      isValid,
      missingFields,
      message: isValid
        ? `Node ${node.id} output verified successfully (${Object.keys(output).length} keys present)`
        : `Node ${node.id} validation failed: missing fields [${missingFields.join(', ')}]`,
    };
  }
}

module.exports = new ValidationAgent();
