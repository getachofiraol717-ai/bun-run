/**
 * Safe Math Expression Parser
 * Evaluates basic arithmetic expressions WITHOUT using eval() or new Function()
 */

export function safeMathEval(expr: string): number | string {
  const sanitized = expr.trim();
  
  // Verify expression contains ONLY digits, spaces, decimal points, and basic arithmetic operators
  if (!/^[\d\s+\-*/().%]+$/.test(sanitized)) {
    return sanitized;
  }

  try {
    // Tokenize
    const tokens: string[] = [];
    let numberBuffer = '';

    for (let i = 0; i < sanitized.length; i++) {
      const char = sanitized[i];
      if (/\d|\./.test(char)) {
        numberBuffer += char;
      } else {
        if (numberBuffer) {
          tokens.push(numberBuffer);
          numberBuffer = '';
        }
        if (/\+|\-|\*|\/|\%|\(|\)/.test(char)) {
          tokens.push(char);
        }
      }
    }
    if (numberBuffer) tokens.push(numberBuffer);

    // Simple Shunting-yard algorithm for precedence parsing
    const outputQueue: string[] = [];
    const operatorStack: string[] = [];
    const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };

    for (const token of tokens) {
      if (!isNaN(Number(token))) {
        outputQueue.push(token);
      } else if (token in precedence) {
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== '(' &&
          precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
        ) {
          outputQueue.push(operatorStack.pop()!);
        }
        operatorStack.push(token);
      } else if (token === '(') {
        operatorStack.push(token);
      } else if (token === ')') {
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
          outputQueue.push(operatorStack.pop()!);
        }
        if (operatorStack[operatorStack.length - 1] === '(') {
          operatorStack.pop();
        }
      }
    }

    while (operatorStack.length > 0) {
      outputQueue.push(operatorStack.pop()!);
    }

    // Evaluate RPN
    const stack: number[] = [];
    for (const token of outputQueue) {
      if (!isNaN(Number(token))) {
        stack.push(Number(token));
      } else {
        const b = stack.pop() ?? 0;
        const a = stack.pop() ?? 0;
        switch (token) {
          case '+': stack.push(a + b); break;
          case '-': stack.push(a - b); break;
          case '*': stack.push(a * b); break;
          case '/': stack.push(b !== 0 ? a / b : 0); break;
          case '%': stack.push(b !== 0 ? a % b : 0); break;
        }
      }
    }

    return stack.length > 0 ? stack[0] : sanitized;
  } catch {
    return sanitized;
  }
}
