/**
 * Security Analyzer
 * Identifies potential security vulnerabilities in code
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';

export interface SecurityAnalysis {
  vulnerabilities: Vulnerability[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  categories: Record<string, number>;
  recommendations: string[];
}

export interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  file?: string;
  line?: number;
  cwe?: string;
  owasp?: string;
  suggestion: string;
  example?: string;
  fixExample?: string;
  educational?: string;
}

export class SecurityAnalyzer {
  private static instance: SecurityAnalyzer | null = null;

  private static readonly VULNERABILITY_PATTERNS: Array<{
    pattern: RegExp;
    severity: Vulnerability['severity'];
    category: string;
    title: string;
    description: string;
    suggestion: string;
    example?: string;
    fixExample?: string;
    cwe?: string;
    owasp?: string;
    educational?: string;
  }> = [
    // Injection vulnerabilities
    {
      pattern: /eval\s*\(/g,
      severity: 'critical',
      category: 'Injection',
      title: 'Use of eval()',
      description: 'The eval() function executes arbitrary code, which can be exploited by attackers.',
      suggestion: 'Avoid eval(). Use safer alternatives like JSON.parse() for JSON or Function constructor with extreme caution.',
      example: 'eval(userInput)',
      fixExample: 'JSON.parse(userInput)',
      cwe: 'CWE-95',
      owasp: 'A1:2017-Injection',
      educational: 'eval() treats its argument as executable code. User-controlled input passed to eval() can lead to arbitrary code execution.',
    },
    {
      pattern: /new\s+Function\s*\(/g,
      severity: 'high',
      category: 'Injection',
      title: 'Dynamic Function Creation',
      description: 'Creating functions dynamically from user input can lead to code injection.',
      suggestion: 'Avoid creating functions from user input. Use predefined functions or safe evaluation methods.',
      example: 'new Function(userInput)',
      fixExample: 'const handlers = { action: () => {} }; handlers[userInput]();',
      cwe: 'CWE-95',
      owasp: 'A1:2017-Injection',
    },
    {
      pattern: /\.innerHTML\s*=/g,
      severity: 'high',
      category: 'XSS',
      title: 'Potential XSS via innerHTML',
      description: 'Directly setting innerHTML with untrusted data can allow Cross-Site Scripting (XSS) attacks.',
      suggestion: 'Use textContent for text or sanitize HTML before setting innerHTML. Consider using DOMPurify.',
      example: 'element.innerHTML = userInput',
      fixExample: 'element.textContent = userInput',
      cwe: 'CWE-79',
      owasp: 'A7:2017-Cross-Site Scripting (XSS)',
      educational: 'XSS allows attackers to inject client-side scripts into web pages viewed by other users.',
    },
    {
      pattern: /document\.write\s*\(/g,
      severity: 'high',
      category: 'XSS',
      title: 'Use of document.write()',
      description: 'document.write() can be exploited to inject malicious scripts.',
      suggestion: 'Use DOM manipulation methods (createElement, appendChild) or textContent instead.',
      example: 'document.write(htmlContent)',
      fixExample: 'element.textContent = safeText',
      cwe: 'CWE-79',
      owasp: 'A7:2017-Cross-Site Scripting (XSS)',
    },
    {
      pattern: /dangerouslySetInnerHTML/g,
      severity: 'medium',
      category: 'XSS',
      title: 'React dangerouslySetInnerHTML',
      description: 'This React property allows setting raw HTML and can be dangerous if used with user input.',
      suggestion: 'Sanitize HTML using DOMPurify before passing to dangerouslySetInnerHTML.',
      example: '<div dangerouslySetInnerHTML={{ __html: rawHtml }} />',
      fixExample: '<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml) }} />',
      cwe: 'CWE-79',
      owasp: 'A7:2017-Cross-Site Scripting (XSS)',
    },
    {
      pattern: /\bsql\s*\|\s*\$\{[^}]+\}/g,
      severity: 'critical',
      category: 'SQL Injection',
      title: 'Potential SQL Injection',
      description: 'String concatenation in SQL queries can allow SQL injection attacks.',
      suggestion: 'Use parameterized queries or an ORM to prevent SQL injection.',
      example: '"SELECT * FROM users WHERE id=" + userId',
      fixExample: 'db.query("SELECT * FROM users WHERE id=?", [userId])',
      cwe: 'CWE-89',
      owasp: 'A1:2017-Injection',
      educational: 'SQL injection allows attackers to execute arbitrary SQL commands through user input fields.',
    },
    {
      pattern: /execute\s*\(\s*['"]SELECT|INSERT|UPDATE|DELETE/g,
      severity: 'high',
      category: 'SQL Injection',
      title: 'Raw SQL Execution',
      description: 'Direct SQL execution without parameterized queries is vulnerable to injection.',
      suggestion: 'Use parameterized queries or an ORM like Prisma, Sequelize, or SQLAlchemy.',
      cwe: 'CWE-89',
      owasp: 'A1:2017-Injection',
    },
    // Authentication issues
    {
      pattern: /password\s*==\s*['"]|===?\s*['"][^'"]+['"]/g,
      severity: 'high',
      category: 'Authentication',
      title: 'Hardcoded Password Comparison',
      description: 'Comparing passwords with hardcoded strings is insecure.',
      suggestion: 'Use proper password hashing (bcrypt, Argon2) and comparison functions.',
      example: 'if (password === "admin123")',
      fixExample: 'if (await bcrypt.compare(password, hashedPassword))',
      cwe: 'CWE-259',
      owasp: 'A2:2017-Broken Authentication',
    },
    {
      pattern: /crypto\.createCipher\s*\(/g,
      severity: 'high',
      category: 'Cryptography',
      title: 'Deprecated Crypto API',
      description: 'crypto.createCipher is deprecated and should not be used for new code.',
      suggestion: 'Use crypto.createCipheriv with explicit IV and algorithm.',
      cwe: 'CWE-327',
      owasp: 'A3:2017-Sensitive Data Exposure',
      educational: 'Deprecated encryption methods may have known weaknesses. Always use current, secure algorithms.',
    },
    {
      pattern: /md5\s*\(|hashlib\.md5\s*\(/g,
      severity: 'medium',
      category: 'Cryptography',
      title: 'MD5 Hash Usage',
      description: 'MD5 is cryptographically broken and should not be used for security purposes.',
      suggestion: 'Use SHA-256 or SHA-3 for hashing. For passwords, use bcrypt or Argon2.',
      example: 'crypto.createHash("md5")',
      fixExample: 'crypto.createHash("sha256")',
      cwe: 'CWE-327',
      owasp: 'A3:2017-Sensitive Data Exposure',
    },
    {
      pattern: /sha1\s*\(/g,
      severity: 'medium',
      category: 'Cryptography',
      title: 'SHA-1 Hash Usage',
      description: 'SHA-1 is considered weak for security applications.',
      suggestion: 'Use SHA-256 or SHA-3 for cryptographic hashing.',
      cwe: 'CWE-327',
      owasp: 'A3:2017-Sensitive Data Exposure',
    },
    // Information disclosure
    {
      pattern: /console\.(log|warn|error)\s*\(.*(?:password|secret|token|key|api)/gi,
      severity: 'medium',
      category: 'Information Disclosure',
      title: 'Sensitive Data in Console',
      description: 'Logging sensitive information can expose it to attackers with access to logs.',
      suggestion: 'Remove or mask sensitive data in console logs. Use environment variables for secrets.',
      cwe: 'CWE-532',
      owasp: 'A3:2017-Sensitive Data Exposure',
    },
    {
      pattern: /\.env(?:\.local|\.development)?(?!\/)/g,
      severity: 'info',
      category: 'Configuration',
      title: 'Environment File Reference',
      description: 'Environment files may contain sensitive configuration.',
      suggestion: 'Ensure .env files are in .gitignore and never committed to version control.',
      cwe: 'CWE-215',
      owasp: 'A5:2017-Security Misconfiguration',
    },
    {
      pattern: /debug\s*\(\s*true\s*\)/gi,
      severity: 'low',
      category: 'Configuration',
      title: 'Debug Mode Enabled',
      description: 'Debug mode may expose internal application details.',
      suggestion: 'Disable debug mode in production.',
      cwe: 'CWE-11',
      owasp: 'A5:2017-Security Misconfiguration',
    },
    // Path traversal
    {
      pattern: /\b(?:readFile|readFileSync|open)\s*\([^)]*\$_(?:GET|POST|REQUEST)/g,
      severity: 'high',
      category: 'Path Traversal',
      title: 'Potential Path Traversal',
      description: 'User input in file operations can lead to path traversal attacks.',
      suggestion: 'Validate and sanitize file paths. Use whitelisting for allowed paths.',
      cwe: 'CWE-22',
      owasp: 'A1:2017-Injection',
    },
    {
      pattern: /path\.join\s*\([^)]*\$_(?:GET|POST|REQUEST)/g,
      severity: 'medium',
      category: 'Path Traversal',
      title: 'Path Join with User Input',
      description: 'Combining user input with path operations can allow path traversal.',
      suggestion: 'Validate and sanitize user input before using in file paths.',
      cwe: 'CWE-22',
      owasp: 'A1:2017-Injection',
    },
    // Security headers / CORS
    {
      pattern: /Access-Control-Allow-Origin:\s*\*/g,
      severity: 'medium',
      category: 'CORS',
      title: 'Wildcard CORS Policy',
      description: 'Allowing all origins (*) in CORS policy can expose APIs to unauthorized access.',
      suggestion: 'Specify exact allowed origins or use environment-based configuration.',
      example: 'Access-Control-Allow-Origin: *',
      fixExample: 'Access-Control-Allow-Origin: https://trusted-domain.com',
      cwe: 'CWE-346',
      owasp: 'A1:2017-Injection',
    },
    // Insecure dependencies (checking for common vulnerable patterns)
    {
      pattern: /process\.env\.(?:DATABASE_URL|SECRET|TOKEN|KEY|PASSWORD)(?!\s*\|\|)/g,
      severity: 'low',
      category: 'Configuration',
      title: 'Direct Environment Variable Access',
      description: 'Direct access to environment variables without defaults or validation.',
      suggestion: 'Consider adding validation and default values for environment variables.',
      cwe: 'CWE-349',
      owasp: 'A10:2017-Insufficient Logging & Monitoring',
    },
    // CSRF
    {
      pattern: /axios\.(?:post|put|patch)\s*\([^,)]+,[^)]*\)(?!\s*\.then)/g,
      severity: 'low',
      category: 'Request Security',
      title: 'POST Request Without CSRF Token',
      description: 'Mutating requests should include CSRF tokens to prevent cross-site request forgery.',
      suggestion: 'Include CSRF tokens in state-changing requests, especially for cookies-based auth.',
      cwe: 'CWE-352',
      owasp: 'A8:2017-Insufficient Cross-Site Request Forgery (CSRF) Protections',
    },
  ];

  private constructor() {}

  static getInstance(): SecurityAnalyzer {
    if (!SecurityAnalyzer.instance) {
      SecurityAnalyzer.instance = new SecurityAnalyzer();
    }
    return SecurityAnalyzer.instance;
  }

  analyze(project: Project): SecurityAnalysis {
    const files = this.flattenFiles(project.rootFolder);
    const codeFiles = files.filter((f) => this.isCodeFile(f.extension) && f.content);
    const vulnerabilities = this.scanForVulnerabilities(codeFiles);
    const categories = this.categorizeVulnerabilities(vulnerabilities);
    const riskScore = this.calculateRiskScore(vulnerabilities);
    const overallRisk = this.determineOverallRisk(riskScore);
    const recommendations = this.generateRecommendations(vulnerabilities);

    return {
      vulnerabilities,
      overallRisk,
      riskScore,
      categories,
      recommendations,
    };
  }

  private flattenFiles(folder: ProjectFolder): ProjectFile[] {
    const files: ProjectFile[] = [...folder.files];

    for (const subfolder of folder.subfolders) {
      files.push(...this.flattenFiles(subfolder));
    }

    return files;
  }

  private isCodeFile(ext: string): boolean {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.php', '.go', '.rb'];
    return codeExtensions.includes(ext.toLowerCase());
  }

  private scanForVulnerabilities(files: ProjectFile[]): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    let vulnId = 1;

    for (const file of files) {
      if (!file.content) continue;

      for (const pattern of SecurityAnalyzer.VULNERABILITY_PATTERNS) {
        const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
        const matches = file.content.matchAll(regex);

        for (const match of matches) {
          const lineNumber = file.content.slice(0, match.index).split('\n').length;

          vulnerabilities.push({
            id: `VULN-${vulnId++}`,
            severity: pattern.severity,
            category: pattern.category,
            title: pattern.title,
            description: pattern.description,
            file: file.path,
            line: lineNumber,
            suggestion: pattern.suggestion,
            example: pattern.example,
            fixExample: pattern.fixExample,
            cwe: pattern.cwe,
            owasp: pattern.owasp,
            educational: pattern.educational,
          });
        }
      }
    }

    return vulnerabilities.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private categorizeVulnerabilities(vulnerabilities: Vulnerability[]): Record<string, number> {
    const categories: Record<string, number> = {};

    for (const vuln of vulnerabilities) {
      categories[vuln.category] = (categories[vuln.category] || 0) + 1;
    }

    return categories;
  }

  private calculateRiskScore(vulnerabilities: Vulnerability[]): number {
    let score = 0;

    for (const vuln of vulnerabilities) {
      switch (vuln.severity) {
        case 'critical':
          score += 25;
          break;
        case 'high':
          score += 15;
          break;
        case 'medium':
          score += 5;
          break;
        case 'low':
          score += 2;
          break;
        case 'info':
          score += 0.5;
          break;
      }
    }

    return Math.min(100, score);
  }

  private determineOverallRisk(riskScore: number): SecurityAnalysis['overallRisk'] {
    if (riskScore >= 50) return 'critical';
    if (riskScore >= 30) return 'high';
    if (riskScore >= 15) return 'medium';
    return 'low';
  }

  private generateRecommendations(vulnerabilities: Vulnerability[]): string[] {
    const recommendations: string[] = [];

    const criticalCount = vulnerabilities.filter((v) => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter((v) => v.severity === 'high').length;

    if (criticalCount > 0) {
      recommendations.push(
        `URGENT: Address ${criticalCount} critical vulnerability(ies) immediately. These can lead to code execution or data breaches.`
      );
    }

    if (highCount > 0) {
      recommendations.push(
        `Address ${highCount} high-severity issue(s) to prevent significant security risks.`
      );
    }

    const categories = this.categorizeVulnerabilities(vulnerabilities);

    if (categories['Injection'] > 0) {
      recommendations.push(
        'Implement input validation and parameterized queries to prevent injection attacks.'
      );
    }

    if (categories['XSS'] > 0) {
      recommendations.push(
        'Use output encoding and Content Security Policy (CSP) to prevent XSS attacks.'
      );
    }

    if (categories['Cryptography'] > 0) {
      recommendations.push(
        'Update cryptographic implementations to use modern, secure algorithms (SHA-256+, bcrypt, Argon2).'
      );
    }

    if (categories['CORS'] > 0) {
      recommendations.push(
        'Restrict CORS policies to specific trusted origins instead of using wildcards.'
      );
    }

    if (vulnerabilities.length === 0) {
      recommendations.push(
        'No obvious security vulnerabilities detected. Consider running automated security scanners for deeper analysis.'
      );
    }

    recommendations.push(
      'Regular security audits and dependency updates help maintain a strong security posture.'
    );

    return recommendations;
  }

  getSecurityReport(analysis: SecurityAnalysis): string {
    const lines: string[] = [];

    lines.push('# Security Analysis Report\n');
    lines.push(`**Overall Risk:** ${analysis.overallRisk.toUpperCase()}`);
    lines.push(`**Risk Score:** ${analysis.riskScore}/100`);
    lines.push(`**Total Issues:** ${analysis.vulnerabilities.length}\n`);

    lines.push('## Summary by Category\n');
    for (const [category, count] of Object.entries(analysis.categories)) {
      lines.push(`- **${category}:** ${count}`);
    }

    lines.push('\n## Critical & High Issues\n');
    const criticalHigh = analysis.vulnerabilities.filter(
      (v) => v.severity === 'critical' || v.severity === 'high'
    );

    for (const vuln of criticalHigh) {
      lines.push(`### ${vuln.title} (${vuln.severity.toUpperCase()})`);
      if (vuln.file) lines.push(`**File:** ${vuln.file}${vuln.line ? `:${vuln.line}` : ''}`);
      lines.push(`**Description:** ${vuln.description}`);
      if (vuln.example) lines.push(`**Example:** \`${vuln.example}\``);
      if (vuln.fixExample) lines.push(`**Fix:** \`${vuln.fixExample}\``);
      lines.push('');
    }

    if (criticalHigh.length === 0) {
      lines.push('No critical or high-severity issues found.\n');
    }

    lines.push('## Recommendations\n');
    for (const rec of analysis.recommendations) {
      lines.push(`- ${rec}`);
    }

    return lines.join('\n');
  }
}

export default SecurityAnalyzer.getInstance();
