class ValidationAgent {
  constructor() {
    this.name = 'validation';
  }

  async validateNodeOutput(node, result) {
    if (!result) {
      return {
        isValid: false,
        reason: 'Empty result returned from execution step',
        missingFields: ['output'],
      };
    }

    if (result.status !== 'SUCCESS') {
      return {
        isValid: false,
        reason: result.error || 'Execution status did not report SUCCESS',
      };
    }

    // Check required fields defined in node data
    const requiredOutputs = node.data?.requiredOutputs || [];
    const missing = [];
    if (result.output && typeof result.output === 'object') {
      for (const field of requiredOutputs) {
        if (!(field in result.output) || result.output[field] === undefined) {
          missing.push(field);
        }
      }
    }

    if (missing.length > 0) {
      return {
        isValid: false,
        reason: `Missing mandatory output fields: ${missing.join(', ')}`,
        missingFields: missing,
      };
    }

    return {
      isValid: true,
      nodeId: node.id,
      validatedFieldsCount: Object.keys(result.output || {}).length,
      validatedAt: new Date().toISOString(),
    };
  }
}

module.exports = new ValidationAgent();
