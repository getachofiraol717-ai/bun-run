// @ts-nocheck
// Reference Book Engine — CitationEngine
// Feature 5: Source Citations - Generate academic citations
import type { ReferenceSource } from "../models/ReferenceBook";
import type { SourceMetadata, Citation, CitationStyle } from "../models/ReferenceBook";
import type { UnifiedConcept, SourceCitation } from "../models/SourceComparison";

export interface CitationConfig {
  style: CitationStyle;
  includeDoi: boolean;
  includeUrl: boolean;
  includePageNumbers: boolean;
}

/**
 * Generates academic citations in various formats
 */
export class CitationEngine {
  private defaultStyle: CitationStyle;

  constructor(defaultStyle: CitationStyle = "apa") {
    this.defaultStyle = defaultStyle;
  }

  /**
   * Generate citation for a source
   */
  async generateCitation(
    metadata: SourceMetadata,
    style?: CitationStyle
  ): Promise<string> {
    const s = style || this.defaultStyle;

    switch (s) {
      case "apa":
        return this.generateAPACitation(metadata);
      case "mla":
        return this.generateMLACitation(metadata);
      case "chicago":
        return this.generateChicagoCitation(metadata);
      case "ieee":
        return this.generateIEEECitation(metadata);
      case "harvard":
        return this.generateHarvardCitation(metadata);
      case "vancouver":
        return this.generateVancouverCitation(metadata);
      default:
        return this.generateAPACitation(metadata);
    }
  }

  /**
   * Generate citations for a unified concept
   */
  async generateCitations(
    concept: UnifiedConcept,
    style?: CitationStyle
  ): Promise<SourceCitation[]> {
    return concept.contributingSources.map(cs => ({
      sourceId: cs.sourceId,
      sourceName: this.getSourceName(concept, cs.sourceId),
      citationText: "", // Would be filled by generateCitation
      directQuote: undefined,
      paraphrased: true
    }));
  }

  private getSourceName(concept: UnifiedConcept, sourceId: string): string {
    const source = concept.contributingSources.find(cs => cs.sourceId === sourceId);
    return source ? source.contribution : "Unknown Source";
  }

  // APA Style (7th edition)
  private generateAPACitation(metadata: SourceMetadata): string {
    const authors = this.formatAPAAuthors(metadata.authors);
    const year = metadata.publicationDate?.slice(0, 4) || "n.d.";
    const title = metadata.title;
    const publisher = metadata.publisher ? `*${metadata.publisher}*` : "";

    let citation = `${authors} (${year}). ${title}.`;

    if (publisher) {
      citation += ` ${publisher}.`;
    }

    if (metadata.doi) {
      citation += ` https://doi.org/${metadata.doi}`;
    } else if (metadata.url) {
      citation += ` ${metadata.url}`;
    }

    return citation;
  }

  private formatAPAAuthors(authors: string[]): string {
    if (authors.length === 0) return "Unknown Author";
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
    if (authors.length <= 20) {
      const lastAuthor = authors[authors.length - 1];
      const otherAuthors = authors.slice(0, -1).join(", ");
      return `${otherAuthors}, & ${lastAuthor}`;
    }
    // More than 20 authors
    return `${authors.slice(0, 19).join(", ")}, ... ${authors[authors.length - 1]}`;
  }

  // MLA Style (9th edition)
  private generateMLACitation(metadata: SourceMetadata): string {
    const authors = this.formatMLAAuthors(metadata.authors);
    const title = `"${metadata.title}."`;
    const container = metadata.publisher ? `*${metadata.publisher}*,` : "";
    const year = metadata.publicationDate?.slice(0, 4) || "n.d.";

    return `${authors} ${title} ${container} ${year}.`;
  }

  private formatMLAAuthors(authors: string[]): string {
    if (authors.length === 0) return "Unknown Author.";
    if (authors.length === 1) return `${authors[0]}.`;
    if (authors.length === 2) return `${authors[0]}, and ${authors[1]}.`;
    return `${authors[0]}, et al.`;
  }

  // Chicago Style (17th edition - Notes-Bibliography)
  private generateChicagoCitation(metadata: SourceMetadata): string {
    const authors = this.formatChicagoAuthors(metadata.authors);
    const title = `*${metadata.title}*.`;
    const location = metadata.publisher ? `${metadata.publisher},` : "";
    const year = metadata.publicationDate?.slice(0, 4) || "n.d.";

    return `${authors} ${title} ${location} ${year}.`;
  }

  private formatChicagoAuthors(authors: string[]): string {
    if (authors.length === 0) return "Unknown Author.";
    if (authors.length === 1) return `${authors[0]}.`;
    if (authors.length === 2) return `${authors[0]} and ${authors[1]}.`;
    if (authors.length === 3) return `${authors[0]}, ${authors[1]}, and ${authors[2]}.`;
    return `${authors[0]} et al.`;
  }

  // IEEE Style
  private generateIEEECitation(metadata: SourceMetadata): string {
    const authors = this.formatIEEEAuthors(metadata.authors);
    const title = `"${metadata.title},"`;
    const source = metadata.publisher ? `*${metadata.publisher}*` : "";
    const year = metadata.publicationDate?.slice(0, 4) || "";

    return `${authors}, ${title} ${source}, ${year}.`;
  }

  private formatIEEEAuthors(authors: string[]): string {
    if (authors.length === 0) return "Unknown Author";
    const formatted = authors.map(a => {
      const parts = a.split(" ");
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}. ${parts.slice(1).join(" ")}`;
      }
      return a;
    });

    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
    if (formatted.length <= 6) {
      const last = formatted.pop();
      return `${formatted.join(", ")}, and ${last}`;
    }
    return `${formatted.slice(0, 3).join(", ")}, et al.`;
  }

  // Harvard Style
  private generateHarvardCitation(metadata: SourceMetadata): string {
    const authors = this.formatHarvardAuthors(metadata.authors);
    const year = metadata.publicationDate?.slice(0, 4) || "n.d.";
    const title = `'${metadata.title}'`;
    const edition = metadata.edition ? `, ${metadata.edition} edn.` : "";
    const publisher = metadata.publisher ? `*${metadata.publisher}*` : "";
    const doi = metadata.doi ? `doi: ${metadata.doi}` : "";

    return `${authors} (${year}) ${title}${edition}. ${publisher}. ${doi}`.trim();
  }

  private formatHarvardAuthors(authors: string[]): string {
    if (authors.length === 0) return "Unknown Author";
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
    if (authors.length === 3) return `${authors[0]}, ${authors[1]} and ${authors[2]}`;
    return `${authors[0]} et al.`;
  }

  // Vancouver Style
  private generateVancouverCitation(metadata: SourceMetadata): string {
    const authors = this.formatVancouverAuthors(metadata.authors);
    const title = metadata.title + ".";
    const source = metadata.publisher ? `${metadata.publisher};` : "";
    const year = metadata.publicationDate?.slice(0, 4) || "";

    return `${authors} ${title} ${source} ${year}.`;
  }

  private formatVancouverAuthors(authors: string[]): string {
    if (authors.length === 0) return "Unknown.";
    if (authors.length <= 6) {
      return authors.map(a => {
        const parts = a.split(" ");
        if (parts.length >= 2) {
          return `${parts[parts.length - 1]} ${parts.slice(0, -1).map(p => p.charAt(0)).join(" ")}.`;
        }
        return a + ".";
      }).join(", ");
    }
    // More than 6 authors
    const first6 = authors.slice(0, 6).map(a => {
      const parts = a.split(" ");
      if (parts.length >= 2) {
        return `${parts[parts.length - 1]} ${parts.slice(0, -1).map(p => p.charAt(0)).join(" ")}.`;
      }
      return a;
    });
    return `${first6.join(", ")}, et al.`;
  }

  /**
   * Generate in-text citation
   */
  generateInTextCitation(
    metadata: SourceMetadata,
    style: CitationStyle,
    pageNumber?: number
  ): string {
    const author = metadata.authors[0]?.split(" ")[0] || "Unknown";
    const year = metadata.publicationDate?.slice(0, 4) || "n.d.";

    switch (style) {
      case "apa":
      case "harvard":
        let apa = `(${author}, ${year})`;
        if (pageNumber) apa += `, p. ${pageNumber}`;
        return apa;

      case "mla":
        let mla = `(${author}`;
        if (pageNumber) mla += ` ${pageNumber}`;
        return mla + ")";

      case "chicago":
        let chicago = `(${author} ${year}`;
        if (pageNumber) chicago += `, ${pageNumber}`;
        return chicago + ")";

      case "ieee":
        return `[${pageNumber || "1"}]`;

      case "vancouver":
        return `[${author} ${year}${pageNumber ? `:${pageNumber}` : ""}]`;

      default:
        return `(${author}, ${year})`;
    }
  }

  /**
   * Generate reference list entry
   */
  generateReferenceListEntry(
    metadata: SourceMetadata,
    style: CitationStyle
  ): string {
    return this.generateCitation(metadata, style);
  }

  /**
   * Generate bibliography
   */
  generateBibliography(
    sources: ReferenceSource[],
    style: CitationStyle
  ): string[] {
    return sources.map(s => this.generateCitation(s.metadata, style));
  }

  /**
   * Generate citation for a specific concept reference
   */
  generateConceptCitation(
    source: ReferenceSource,
    conceptName: string,
    style: CitationStyle
  ): string {
    const baseCitation = this.generateCitation(source.metadata, style);

    // Add concept reference
    switch (style) {
      case "apa":
        return `${baseCitation.split(".")[0]} (discussed concept: ${conceptName}).`;
      case "mla":
        return `${baseCitation.split(".")[0]} (concept: ${conceptName}).`;
      default:
        return baseCitation;
    }
  }
}
