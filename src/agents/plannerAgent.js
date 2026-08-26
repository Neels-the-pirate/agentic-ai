/**
 * Planner Agent
 * Decides node ordering, resolves topological dependencies, and outputs confidence score.
 */
class PlannerAgent {
  constructor() {
    this.name = 'planner';
  }

  /**
   * Plan the execution path of a workflow graph
   * @param {object} workflow - { nodes: Array, edges: Array }
   * @returns {object} { success: boolean, plan: Array<string>, confidence: number, warnings: Array<string> }
   */
  async plan(workflow) {
    const { nodes = [], edges = [] } = workflow;
    const warnings = [];

    if (!nodes || nodes.length === 0) {
      return {
        success: false,
        error: 'Workflow contains no nodes to execute',
        plan: [],
        confidence: 0,
      };
    }

    // Build adjacency list & in-degree mapping
    const inDegree = {};
    const adjList = {};
    const nodeMap = {};

    nodes.forEach((node) => {
      const id = String(node.id);
      inDegree[id] = 0;
      adjList[id] = [];
      nodeMap[id] = node;
    });

    edges.forEach((edge) => {
      const source = String(edge.source);
      const target = String(edge.target);
      if (adjList[source] && inDegree[target] !== undefined) {
        adjList[source].push(target);
        inDegree[target] += 1;
      }
    });

    // Kahn's algorithm for topological sorting
    const queue = [];
    Object.keys(inDegree).forEach((nodeId) => {
      if (inDegree[nodeId] === 0) {
        queue.push(nodeId);
      }
    });

    const executionPlan = [];
    while (queue.length > 0) {
      const current = queue.shift();
      executionPlan.push(current);

      for (const neighbor of adjList[current] || []) {
        inDegree[neighbor] -= 1;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Cycle detection
    if (executionPlan.length !== nodes.length) {
      warnings.push('Circular dependency or unreachable node cluster detected in workflow graph.');
      // Append remaining nodes
      nodes.forEach((n) => {
        if (!executionPlan.includes(String(n.id))) {
          executionPlan.push(String(n.id));
        }
      });
    }

    // Calculate confidence score (based on connectivity and node configuration)
    let confidence = 0.98;
    if (warnings.length > 0) confidence -= 0.25;
    if (nodes.length > 10) confidence -= 0.05;

    return {
      success: true,
      plan: executionPlan,
      confidence: Math.max(0.5, Math.min(1.0, confidence)),
      warnings,
      totalSteps: executionPlan.length,
    };
  }
}

module.exports = new PlannerAgent();
