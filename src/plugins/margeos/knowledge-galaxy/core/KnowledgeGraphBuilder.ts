// @ts-nocheck
// Knowledge Galaxy — KnowledgeGraphBuilder
// Builds the knowledge graph from various educational sources

import type { KnowledgeNode, KnowledgeEdge, GalaxyCluster, NodeType } from "../models";
import { createKnowledgeNode, createKnowledgeEdge } from "../models";

interface PDFContent {
  title: string;
  subject: string;
  chapters: PDFChapter[];
}

interface PDFChapter {
  title: string;
  topics: PDFTopic[];
}

interface PDFTopic {
  title: string;
  concepts: string[];
  formulas?: string[];
  definitions?: string[];
}

interface TutorContent {
  topic: string;
  subject: string;
  explanation: string;
  relatedConcepts: string[];
  prerequisites: string[];
}

interface FormulaContent {
  name: string;
  expression: string;
  variables: string[];
  subject: string;
  relatedFormulas: string[];
}

export class KnowledgeGraphBuilder {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private edges: Map<string, KnowledgeEdge> = new Map();
  private initialized: boolean = false;

  public async initialize(
    nodes: Map<string, KnowledgeNode>,
    edges: Map<string, KnowledgeEdge>
  ): Promise<void> {
    this.nodes = nodes;
    this.edges = edges;
    this.initialized = true;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("KnowledgeGraphBuilder not initialized");
    }
  }

  // Generate from PDF content
  public async generateFromPDF(content: PDFContent): Promise<KnowledgeNode[]> {
    this.ensureInitialized();

    const newNodes: KnowledgeNode[] = [];

    // Create subject node
    let subjectNode = this.findNodeByTitle(content.subject, "subject");
    if (!subjectNode) {
      subjectNode = createKnowledgeNode("subject", content.subject, content.subject, {
        sourceEngine: "pdf",
        description: `Subject: ${content.subject}`
      });
      newNodes.push(subjectNode);
    }

    // Process chapters
    for (let i = 0; i < content.chapters.length; i++) {
      const chapter = content.chapters[i];

      // Create chapter node
      let chapterNode = this.findNodeByTitle(chapter.title, "chapter");
      if (!chapterNode) {
        chapterNode = createKnowledgeNode("chapter", chapter.title, content.subject, {
          parentId: subjectNode.id,
          sourceEngine: "pdf",
          description: `Chapter ${i + 1}: ${chapter.title}`,
          position: { x: i * 200, y: 0 }
        });
        newNodes.push(chapterNode);

        // Link chapter to subject
        this.addEdge(subjectNode.id, chapterNode.id, "part_of");
      }

      // Process topics
      for (let j = 0; j < chapter.topics.length; j++) {
        const topic = chapter.topics[j];

        // Create topic node
        let topicNode = this.findNodeByTitle(topic.title, "topic");
        if (!topicNode) {
          topicNode = createKnowledgeNode("topic", topic.title, content.subject, {
            parentId: chapterNode.id,
            chapter: chapter.title,
            sourceEngine: "pdf",
            description: `Topic: ${topic.title}`,
            position: { x: i * 200 + 100, y: j * 100 }
          });
          newNodes.push(topicNode);

          // Link topic to chapter
          this.addEdge(chapterNode.id, topicNode.id, "part_of");
        }

        // Create concept nodes
        for (const concept of topic.concepts) {
          let conceptNode = this.findNodeByTitle(concept, "concept");
          if (!conceptNode) {
            conceptNode = createKnowledgeNode("concept", concept, content.subject, {
              parentId: topicNode.id,
              sourceEngine: "pdf",
              sourceName: content.title,
              tags: [topic.title, chapter.title]
            });
            newNodes.push(conceptNode);

            // Link concept to topic
            this.addEdge(topicNode.id, conceptNode.id, "part_of");
          }
        }

        // Create formula nodes
        if (topic.formulas) {
          for (const formula of topic.formulas) {
            let formulaNode = this.findNodeByTitle(formula, "formula");
            if (!formulaNode) {
              formulaNode = createKnowledgeNode("formula", formula, content.subject, {
                parentId: topicNode.id,
                sourceEngine: "pdf",
                sourceName: content.title,
                tags: [topic.title]
              });
              newNodes.push(formulaNode);

              // Link formula to topic
              this.addEdge(topicNode.id, formulaNode.id, "part_of");
            }
          }
        }

        // Create definition nodes
        if (topic.definitions) {
          for (const def of topic.definitions) {
            let defNode = this.findNodeByTitle(def.substring(0, 50), "definition");
            if (!defNode) {
              defNode = createKnowledgeNode("definition", def.substring(0, 50), content.subject, {
                description: def,
                parentId: topicNode.id,
                sourceEngine: "pdf",
                sourceName: content.title,
                tags: [topic.title]
              });
              newNodes.push(defNode);

              this.addEdge(topicNode.id, defNode.id, "part_of");
            }
          }
        }
      }
    }

    return newNodes;
  }

  // Generate from AI Tutor content
  public async generateFromTutor(content: TutorContent): Promise<KnowledgeNode[]> {
    this.ensureInitialized();

    const newNodes: KnowledgeNode[] = [];

    // Create or find topic node
    let topicNode = this.findNodeByTitle(content.topic, "topic");
    if (!topicNode) {
      topicNode = createKnowledgeNode("topic", content.topic, content.subject, {
        sourceEngine: "tutor",
        description: content.explanation.substring(0, 200)
      });
      newNodes.push(topicNode);
    }

    // Create concept nodes for related concepts
    for (const concept of content.relatedConcepts) {
      let conceptNode = this.findNodeByTitle(concept, "concept");
      if (!conceptNode) {
        conceptNode = createKnowledgeNode("concept", concept, content.subject, {
          sourceEngine: "tutor",
          sourceName: content.topic
        });
        newNodes.push(conceptNode);

        // Link related concepts
        this.addEdge(topicNode.id, conceptNode.id, "related_to");
      }
    }

    // Create prerequisite nodes
    for (const prereq of content.prerequisites) {
      let prereqNode = this.findNodeByTitle(prereq, "concept");
      if (!prereqNode) {
        prereqNode = createKnowledgeNode("concept", prereq, content.subject, {
          sourceEngine: "tutor",
          sourceName: content.topic
        });
        newNodes.push(prereqNode);
      }

      // Link as prerequisite
      this.addEdge(prereqNode.id, topicNode.id, "prerequisite");
    }

    return newNodes;
  }

  // Generate from formulas
  public async generateFromFormulas(formulas: FormulaContent[]): Promise<KnowledgeNode[]> {
    this.ensureInitialized();

    const newNodes: KnowledgeNode[] = [];

    for (const formula of formulas) {
      // Create formula node
      let formulaNode = this.findNodeByTitle(formula.name, "formula");
      if (!formulaNode) {
        formulaNode = createKnowledgeNode("formula", formula.name, formula.subject, {
          description: formula.expression,
          sourceEngine: "formula",
          keywords: formula.variables,
          tags: formula.relatedFormulas
        });
        newNodes.push(formulaNode);
      }

      // Create variable nodes
      for (const variable of formula.variables) {
        let varNode = this.findNodeByTitle(variable, "concept");
        if (!varNode) {
          varNode = createKnowledgeNode("concept", variable, formula.subject, {
            sourceEngine: "formula",
            sourceName: formula.name,
            description: `${variable} is used in ${formula.name}`
          });
          newNodes.push(varNode);

          // Link variable to formula
          this.addEdge(formulaNode.id, varNode.id, "uses");
        }
      }

      // Link related formulas
      for (const related of formula.relatedFormulas) {
        let relatedNode = this.findNodeByTitle(related, "formula");
        if (!relatedNode) {
          relatedNode = createKnowledgeNode("formula", related, formula.subject, {
            sourceEngine: "formula"
          });
          newNodes.push(relatedNode);
        }

        this.addEdge(formulaNode.id, relatedNode.id, "related_to");
      }
    }

    return newNodes;
  }

  // Build subject cluster
  public buildSubjectCluster(
    subject: string,
    nodes: KnowledgeNode[]
  ): GalaxyCluster {
    const subjectNodes = nodes.filter(n => n.subject === subject);

    const primaryNode = subjectNodes.find(n => n.type === "subject");

    return {
      id: `cluster-subject-${subject.toLowerCase().replace(/\s+/g, "-")}`,
      name: subject,
      type: "subject",
      description: `Knowledge cluster for ${subject}`,
      nodeIds: subjectNodes.map(n => n.id),
      primaryNodeId: primaryNode?.id,
      position: { x: 0, y: 0 },
      size: Math.max(100, subjectNodes.length * 20),
      color: this.getSubjectColor(subject),
      icon: "globe",
      status: "active",
      isExpanded: true,
      isHighlighted: false,
      totalNodes: subjectNodes.length,
      masteredNodes: subjectNodes.filter(n => n.masteryScore >= 80).length,
      inProgressNodes: subjectNodes.filter(n => n.status === "in_progress").length,
      averageMastery: this.calculateAverageMastery(subjectNodes),
      ariaLabel: `Subject cluster: ${subject}`,
      screenReaderDescription: `${subject} cluster with ${subjectNodes.length} nodes`,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [subject]
    };
  }

  // Build chapter clusters
  public buildChapterClusters(chapters: string[], subject: string): GalaxyCluster[] {
    return chapters.map((chapter, index) => ({
      id: `cluster-chapter-${index}`,
      name: chapter,
      type: "chapter" as const,
      description: `Chapter: ${chapter}`,
      nodeIds: [],
      parentSubject: subject,
      position: { x: index * 300, y: 100 },
      size: 150,
      color: this.getSubjectColor(subject),
      icon: "book-open",
      status: "active" as const,
      isExpanded: true,
      isHighlighted: false,
      totalNodes: 0,
      masteredNodes: 0,
      inProgressNodes: 0,
      averageMastery: 0,
      ariaLabel: `Chapter cluster: ${chapter}`,
      screenReaderDescription: `Chapter ${chapter}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [subject, chapter]
    }));
  }

  // Helper methods
  private findNodeByTitle(title: string, type?: NodeType): KnowledgeNode | undefined {
    const normalizedTitle = title.toLowerCase().trim();

    for (const node of this.nodes.values()) {
      if (node.title.toLowerCase().trim() === normalizedTitle) {
        if (!type || node.type === type) {
          return node;
        }
      }
    }
    return undefined;
  }

  private addEdge(sourceId: string, targetId: string, type: string): void {
    // Check if edge already exists
    for (const edge of this.edges.values()) {
      if (edge.sourceNodeId === sourceId && edge.targetNodeId === targetId) {
        return;
      }
    }

    const edge = createKnowledgeEdge(sourceId, targetId, type as any, {
      sourceEngine: "builder"
    });

    this.edges.set(edge.id, edge);
  }

  private calculateAverageMastery(nodes: KnowledgeNode[]): number {
    if (nodes.length === 0) return 0;
    const total = nodes.reduce((sum, n) => sum + n.masteryScore, 0);
    return Math.round(total / nodes.length);
  }

  private getSubjectColor(subject: string): string {
    const colors = [
      "#6366F1", "#8B5CF6", "#A855F7", "#EC4899",
      "#EF4444", "#F59E0B", "#10B981", "#06B6D4",
      "#3B82F6", "#14B8A6"
    ];

    const hash = subject.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  }

  // Merge knowledge from multiple sources
  public async mergeKnowledge(knowledgeSources: any[]): Promise<{
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
    clusters: GalaxyCluster[];
  }> {
    const allNodes: KnowledgeNode[] = [];
    const allEdges: KnowledgeEdge[] = [];
    const subjectNodes = new Map<string, KnowledgeNode[]>();

    for (const source of knowledgeSources) {
      if (source.type === "pdf") {
        const nodes = await this.generateFromPDF(source.content);
        allNodes.push(...nodes);
      } else if (source.type === "tutor") {
        const nodes = await this.generateFromTutor(source.content);
        allNodes.push(...nodes);
      } else if (source.type === "formula") {
        const nodes = await this.generateFromFormulas(source.content);
        allNodes.push(...nodes);
      }
    }

    // Group by subject
    for (const node of allNodes) {
      const existing = subjectNodes.get(node.subject) || [];
      existing.push(node);
      subjectNodes.set(node.subject, existing);
    }

    // Build clusters
    const clusters: GalaxyCluster[] = [];
    for (const [subject, nodes] of subjectNodes) {
      const cluster = this.buildSubjectCluster(subject, nodes);
      clusters.push(cluster);
    }

    return {
      nodes: allNodes,
      edges: allEdges,
      clusters
    };
  }
}

// Singleton export
export const knowledgeGraphBuilder = new KnowledgeGraphBuilder();
