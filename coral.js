(function () {
'use strict';

/* ============================================================
   SECTION 1 — LEXER
   ============================================================ */

const TK = {
  INTEGER:'INTEGER', FLOAT:'FLOAT',
  IDENTIFIER:'IDENTIFIER',
  INT_LIT:'INT_LIT', FLOAT_LIT:'FLOAT_LIT', STRING_LIT:'STRING_LIT',
  ASSIGN:'ASSIGN',
  PLUS:'PLUS', MINUS:'MINUS', STAR:'STAR', SLASH:'SLASH', PERCENT:'PERCENT',
  LPAREN:'LPAREN', RPAREN:'RPAREN', LBRACKET:'LBRACKET', RBRACKET:'RBRACKET',
  COMMA:'COMMA', SEMICOLON:'SEMICOLON', DOT:'DOT', QUESTION:'QUESTION',
  LT:'LT', GT:'GT', LTE:'LTE', GTE:'GTE', EQ:'EQ', NEQ:'NEQ',
  AND:'AND', OR:'OR', NOT:'NOT',
  IF:'IF', ELSEIF:'ELSEIF', ELSE:'ELSE', WHILE:'WHILE', FOR:'FOR',
  PUT:'PUT', TO:'TO', OUTPUT:'OUTPUT', GET:'GET', NEXT:'NEXT', INPUT:'INPUT',
  FUNCTION:'FUNCTION', RETURNS:'RETURNS', NOTHING:'NOTHING',
  ARRAY:'ARRAY', SIZE:'SIZE', WITH:'WITH', DECIMAL:'DECIMAL', PLACES:'PLACES',
  SQUAREROOT:'SQUAREROOT', RAISETOPOWER:'RAISETOPOWER',
  ABSOLUTEVALUE:'ABSOLUTEVALUE', RANDOMNUMBER:'RANDOMNUMBER',
  SEEDRANDOMNUMBERS:'SEEDRANDOMNUMBERS',
  NEWLINE:'NEWLINE', INDENT:'INDENT', EOF:'EOF'
};

const KEYWORDS = new Map([
  ['integer', TK.INTEGER], ['float', TK.FLOAT],
  ['if', TK.IF], ['elseif', TK.ELSEIF], ['else', TK.ELSE],
  ['while', TK.WHILE], ['for', TK.FOR],
  ['Put', TK.PUT], ['to', TK.TO], ['output', TK.OUTPUT],
  ['Get', TK.GET], ['next', TK.NEXT], ['input', TK.INPUT],
  ['Function', TK.FUNCTION], ['returns', TK.RETURNS], ['nothing', TK.NOTHING],
  ['array', TK.ARRAY], ['size', TK.SIZE], ['with', TK.WITH],
  ['decimal', TK.DECIMAL], ['places', TK.PLACES],
  ['and', TK.AND], ['or', TK.OR], ['not', TK.NOT],
  ['SquareRoot', TK.SQUAREROOT], ['RaiseToPower', TK.RAISETOPOWER],
  ['AbsoluteValue', TK.ABSOLUTEVALUE], ['RandomNumber', TK.RANDOMNUMBER],
  ['SeedRandomNumbers', TK.SEEDRANDOMNUMBERS],
]);

function LexError(message, line) {
  return { name:'LexError', message, line };
}

function lex(src) {
  const tokens = [];
  const lines = src.split('\n');

  for (let li = 0; li < lines.length; li++) {
    const lineNum = li + 1;
    const raw = lines[li];
    const trimmed = raw.trimStart();

    // Blank lines
    if (trimmed === '') {
      tokens.push({ type: TK.NEWLINE, value: '\n', line: lineNum });
      continue;
    }

    // Full-line comment
    if (trimmed.startsWith('//')) {
      tokens.push({ type: TK.NEWLINE, value: '\n', line: lineNum });
      continue;
    }

    // Detect inline comment
    const commentIdx = findInlineComment(raw);
    if (commentIdx !== -1) {
      throw LexError(
        `Line ${lineNum}: Comments must appear on their own line. Move the // comment to a separate line.`,
        lineNum
      );
    }

    // Indent
    let col = 0;
    while (col < raw.length && raw[col] === ' ') col++;
    if (col > 0) {
      tokens.push({ type: TK.INDENT, value: col, line: lineNum });
    }

    // Lex the rest of the line
    let i = col;
    while (i < raw.length) {
      const ch = raw[i];

      // Whitespace
      if (ch === ' ' || ch === '\t') { i++; continue; }

      // String literal
      if (ch === '"') {
        let str = '';
        i++;
        while (i < raw.length && raw[i] !== '"') {
          if (raw[i] === '\\' && i + 1 < raw.length) {
            const esc = raw[i+1];
            if (esc === 'n') { str += '\n'; i += 2; }
            else if (esc === '"') { str += '"'; i += 2; }
            else if (esc === '\\') { str += '\\'; i += 2; }
            else { str += raw[i]; i++; }
          } else {
            str += raw[i]; i++;
          }
        }
        if (raw[i] !== '"') throw LexError(`Line ${lineNum}: Unterminated string literal.`, lineNum);
        i++;
        tokens.push({ type: TK.STRING_LIT, value: str, line: lineNum });
        continue;
      }

      // Numeric literal
      if (ch >= '0' && ch <= '9') {
        let num = '';
        let isFloat = false;
        while (i < raw.length && ((raw[i] >= '0' && raw[i] <= '9') || raw[i] === '.')) {
          if (raw[i] === '.') {
            if (isFloat) break;
            isFloat = true;
          }
          num += raw[i++];
        }
        tokens.push({ type: isFloat ? TK.FLOAT_LIT : TK.INT_LIT, value: isFloat ? parseFloat(num) : parseInt(num, 10), line: lineNum });
        continue;
      }

      // Identifier or keyword
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
        let word = '';
        while (i < raw.length && ((raw[i] >= 'a' && raw[i] <= 'z') || (raw[i] >= 'A' && raw[i] <= 'Z') || (raw[i] >= '0' && raw[i] <= '9') || raw[i] === '_')) {
          word += raw[i++];
        }
        const kwType = KEYWORDS.get(word);
        tokens.push({ type: kwType || TK.IDENTIFIER, value: word, line: lineNum });
        continue;
      }

      // Two-char operators
      if (i + 1 < raw.length) {
        const two = raw.slice(i, i+2);
        if (two === '<=') { tokens.push({ type: TK.LTE, value: '<=', line: lineNum }); i += 2; continue; }
        if (two === '>=') { tokens.push({ type: TK.GTE, value: '>=', line: lineNum }); i += 2; continue; }
        if (two === '==') { tokens.push({ type: TK.EQ,  value: '==', line: lineNum }); i += 2; continue; }
        if (two === '!=') { tokens.push({ type: TK.NEQ, value: '!=', line: lineNum }); i += 2; continue; }
      }

      // Single-char operators / punctuation
      const ONE = {
        '=': TK.ASSIGN, '+': TK.PLUS, '-': TK.MINUS, '*': TK.STAR,
        '/': TK.SLASH,  '%': TK.PERCENT, '(': TK.LPAREN, ')': TK.RPAREN,
        '[': TK.LBRACKET, ']': TK.RBRACKET, ',': TK.COMMA,
        ';': TK.SEMICOLON, '.': TK.DOT, '?': TK.QUESTION,
        '<': TK.LT, '>': TK.GT
      };
      if (ONE[ch]) {
        tokens.push({ type: ONE[ch], value: ch, line: lineNum }); i++; continue;
      }

      throw LexError(`Line ${lineNum}: Unexpected character '${ch}'.`, lineNum);
    }

    tokens.push({ type: TK.NEWLINE, value: '\n', line: lineNum });
  }

  tokens.push({ type: TK.EOF, value: '', line: lines.length + 1 });
  return tokens;
}

function findInlineComment(raw) {
  let inStr = false;
  for (let i = 0; i < raw.length - 1; i++) {
    if (raw[i] === '"') inStr = !inStr;
    if (!inStr && raw[i] === '/' && raw[i+1] === '/') return i;
  }
  return -1;
}

/* ============================================================
   SECTION 2 — PARSER
   ============================================================ */

function ParseError(message, line, hint) {
  return { name:'ParseError', message, line, hint: hint || '' };
}

const SOFT_KW_AS_NAME = new Set([TK.SIZE, TK.WITH, TK.DECIMAL, TK.PLACES, TK.NOTHING,
  TK.TO, TK.OUTPUT, TK.NEXT, TK.INPUT, TK.RETURNS, TK.AND, TK.OR, TK.NOT]);

const RESERVED_JS_NAMES = new Set(['__proto__','constructor','prototype','__defineGetter__','__defineSetter__']);

function validateIdentifier(name, line) {
  if (RESERVED_JS_NAMES.has(name))
    throw ParseError(`'${name}' cannot be used as a variable name.`, line,
      `Line ${line}: '${name}' is a reserved name and cannot be used as a Coral identifier.`);
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() { return this.tokens[this.pos] || { type: TK.EOF, value: '', line: -1 }; }
  advance() { const t = this.tokens[this.pos]; if (t.type !== TK.EOF) this.pos++; return t; }
  check(type) { return this.peek().type === type; }
  getLine() { return this.peek().line; }
  curLoc() { return { line: this.peek().line }; }

  eat(type, msg) {
    if (this.peek().type === type) return this.advance();
    const t = this.peek();
    throw ParseError(msg || `Expected ${type} but got '${t.value}' (${t.type})`, t.line);
  }

  eatName() {
    const t = this.peek();
    if (t.type === TK.IDENTIFIER || SOFT_KW_AS_NAME.has(t.type)) {
      this.advance();
      return t.value;
    }
    throw ParseError(`Expected identifier but got '${t.value}'`, t.line,
      `Line ${t.line}: Expected a variable name here.`);
  }

  skipNewlines() {
    while (true) {
      if (this.check(TK.NEWLINE)) { this.advance(); continue; }
      if (this.check(TK.INDENT)) {
        // peek ahead: if next after INDENT is NEWLINE, skip both
        const saved = this.pos;
        this.advance(); // skip INDENT
        if (this.check(TK.NEWLINE)) { this.advance(); continue; }
        this.pos = saved; // restore
        break;
      }
      break;
    }
  }

  currentIndentLevel() {
    if (this.check(TK.INDENT)) return this.peek().value;
    if (this.check(TK.NEWLINE) || this.check(TK.EOF)) return -1;
    return 0;
  }

  parse() {
    this.skipNewlines();
    // Detect if any FUNCTION tokens exist
    const hasFunctions = this.tokens.some(t => t.type === TK.FUNCTION);
    let body;
    if (hasFunctions) {
      body = this.parseFunctionList();
      return { type:'Program', hasFunctions: true, functions: body };
    } else {
      const stmts = this.parseBlock(0);
      return { type:'Program', hasFunctions: false,
        functions: [{ type:'FunctionDef', name:'Main', params:[], returnVar:null, returnType:'nothing', body: stmts }] };
    }
  }

  parseFunctionList() {
    const fns = [];
    this.skipNewlines();
    while (!this.check(TK.EOF)) {
      if (this.check(TK.FUNCTION)) {
        fns.push(this.parseFunctionDef());
      } else {
        throw ParseError(`Expected 'Function' keyword`, this.getLine());
      }
      this.skipNewlines();
    }
    return fns;
  }

  parseFunctionDef() {
    const line = this.getLine();
    this.eat(TK.FUNCTION, `Expected 'Function'`);
    const name = this.eatName();
    validateIdentifier(name, line);
    this.eat(TK.LPAREN, `Expected '(' after function name '${name}'`);
    const params = this.parseParamList();
    this.eat(TK.RPAREN, `Expected ')' after parameter list`);
    this.eat(TK.RETURNS, `Expected 'returns' after ')'`);
    // ReturnSpec: 'nothing' 'nothing' | Type Name
    let returnType, returnVar;
    if (this.check(TK.NOTHING)) {
      this.advance(); // 'nothing' (type)
      this.eat(TK.NOTHING, `Expected second 'nothing' after 'returns nothing'`);
      returnType = 'nothing'; returnVar = null;
    } else if (this.check(TK.INTEGER) || this.check(TK.FLOAT)) {
      const rt = this.advance();
      returnType = rt.type === TK.INTEGER ? 'integer' : 'float';
      returnVar = this.eatName();
      validateIdentifier(returnVar, this.getLine());
    } else {
      throw ParseError(`Expected return type after 'returns'`, this.getLine());
    }
    this.eat(TK.NEWLINE, `Expected newline after function signature`);
    const body = this.parseBlock(3);
    return { type:'FunctionDef', name, params, returnVar, returnType, body, line };
  }

  parseParamList() {
    const params = [];
    if (this.check(TK.RPAREN)) return params;
    params.push(this.parseParam());
    while (this.check(TK.COMMA)) {
      this.advance();
      params.push(this.parseParam());
    }
    return params;
  }

  parseParam() {
    const line = this.getLine();
    if (!this.check(TK.INTEGER) && !this.check(TK.FLOAT))
      throw ParseError(`Expected parameter type (integer or float)`, line);
    const typeToken = this.advance();
    const ptype = typeToken.type === TK.INTEGER ? 'integer' : 'float';
    // Check for array param: float array(?) name
    let isArray = false;
    if (this.check(TK.ARRAY)) {
      this.advance();
      this.eat(TK.LPAREN, `Expected '(' after 'array'`);
      this.eat(TK.QUESTION, `Expected '?'`);
      this.eat(TK.RPAREN, `Expected ')'`);
      isArray = true;
    }
    const name = this.eatName();
    validateIdentifier(name, line);
    return { name, ptype, isArray, line };
  }

  parseBlock(expectedIndent) {
    const stmts = [];
    let seenNonDecl = false;
    this.skipNewlines();

    while (true) {
      // Check indent level
      const indentLevel = this.currentIndentLevel();
      if (indentLevel < 0) break; // NEWLINE/EOF = done
      if (indentLevel !== expectedIndent) break;

      // Consume indent token if present
      if (this.check(TK.INDENT)) this.advance();

      if (this.check(TK.NEWLINE) || this.check(TK.EOF)) break;

      const stmt = this.parseStatement(expectedIndent);
      if (!stmt) break;

      // Declarations must precede non-decl statements
      const isDecl = stmt.type === 'VarDecl' || stmt.type === 'ArrayDecl';
      if (isDecl && seenNonDecl) {
        throw ParseError(
          `Line ${stmt.line}: Variable declarations must appear at the top of the function, before any statements. Move the declaration of '${stmt.name}' to the top.`,
          stmt.line
        );
      }
      if (!isDecl) seenNonDecl = true;

      stmts.push(stmt);
      this.skipNewlines();
    }
    return stmts;
  }

  parseStatement(indentLevel) {
    const t = this.peek();

    if (t.type === TK.INTEGER || t.type === TK.FLOAT) return this.parseVarOrArrayDecl();
    if (t.type === TK.IF)    return this.parseBranch(indentLevel);
    if (t.type === TK.WHILE) return this.parseWhile(indentLevel);
    if (t.type === TK.FOR)   return this.parseFor(indentLevel);
    if (t.type === TK.PUT)   return this.parsePut();

    // Built-in functions used as statements (SeedRandomNumbers)
    if (t.type === TK.SEEDRANDOMNUMBERS) return this.parseExprStmt();

    // Identifier or soft keyword → assignment or input
    if (t.type === TK.IDENTIFIER || SOFT_KW_AS_NAME.has(t.type)) {
      return this.parseAssignOrInput();
    }

    throw ParseError(`Unexpected token '${t.value}'`, t.line,
      `Line ${t.line}: '${t.value}' is not a valid statement here.`);
  }

  parseVarOrArrayDecl() {
    const line = this.getLine();
    const typeToken = this.advance(); // INTEGER or FLOAT
    const dataType = typeToken.type === TK.INTEGER ? 'integer' : 'float';

    // Check for array: integer array(N) name  OR  integer array(?) name
    if (this.check(TK.ARRAY)) {
      this.advance();
      this.eat(TK.LPAREN, `Expected '(' after 'array'`);
      let size = null;
      if (this.check(TK.QUESTION)) {
        this.advance();
        size = null;
      } else if (this.check(TK.INT_LIT)) {
        size = this.advance().value;
      } else {
        throw ParseError(`Expected array size or '?'`, this.getLine());
      }
      this.eat(TK.RPAREN, `Expected ')'`);
      const name = this.eatName();
      validateIdentifier(name, line);
      this.eat(TK.NEWLINE, `Expected newline after array declaration`);
      return { type:'ArrayDecl', name, dataType, size, line };
    }

    const name = this.eatName();
    validateIdentifier(name, line);
    this.eat(TK.NEWLINE, `Expected newline after variable declaration`);
    return { type:'VarDecl', name, dataType, line };
  }

  parseAssignOrInput() {
    const line = this.getLine();
    const name = this.eatName();

    // Array element assignment or input: name[expr] = ...
    if (this.check(TK.LBRACKET)) {
      this.advance();
      const index = this.parseCondExpr();
      this.eat(TK.RBRACKET, `Expected ']'`);
      this.eat(TK.ASSIGN, `Expected '=' after array access`);
      if (this.check(TK.GET)) {
        this.advance();
        this.eat(TK.NEXT, `Expected 'next' after 'Get'`);
        this.eat(TK.INPUT, `Expected 'input' after 'Get next'`);
        this.eat(TK.NEWLINE, `Expected newline`);
        return { type:'ArrayInput', name, index, line };
      }
      const value = this.parseCondExpr();
      this.eat(TK.NEWLINE, `Expected newline after assignment`);
      return { type:'ArrayAssign', name, index, value, line };
    }

    // .size access
    if (this.check(TK.DOT)) {
      this.advance();
      this.eat(TK.SIZE, `Expected 'size' after '.'`);
      this.eat(TK.ASSIGN, `Expected '=' after '.size'`);
      if (this.check(TK.GET)) {
        this.advance();
        this.eat(TK.NEXT, `Expected 'next'`);
        this.eat(TK.INPUT, `Expected 'input'`);
        this.eat(TK.NEWLINE, `Expected newline`);
        return { type:'SizeInput', name, line };
      }
      const value = this.parseCondExpr();
      this.eat(TK.NEWLINE, `Expected newline`);
      return { type:'SizeAssign', name, value, line };
    }

    // Regular assignment or user-function call as statement
    if (this.check(TK.LPAREN)) {
      // Function call as statement
      this.advance();
      const args = this.parseArgList();
      this.eat(TK.RPAREN, `Expected ')'`);
      this.eat(TK.NEWLINE, `Expected newline`);
      return { type:'ExprStmt', expr:{ type:'Call', name, args, line }, line };
    }

    this.eat(TK.ASSIGN, `Expected '=' after '${name}'`);

    // Get next input
    if (this.check(TK.GET)) {
      this.advance();
      this.eat(TK.NEXT, `Expected 'next' after 'Get'`);
      this.eat(TK.INPUT, `Expected 'input' after 'Get next'`);
      this.eat(TK.NEWLINE, `Expected newline`);
      return { type:'Input', name, line };
    }

    const value = this.parseCondExpr();
    this.eat(TK.NEWLINE, `Expected newline after assignment`);
    return { type:'Assign', name, value, line };
  }

  parsePut() {
    const line = this.getLine();
    this.eat(TK.PUT);
    const expr = this.parseCondExpr();
    let decimals = null;
    if (this.check(TK.WITH)) {
      this.advance();
      const n = this.eat(TK.INT_LIT, `Expected integer after 'with'`);
      decimals = n.value;
      this.eat(TK.DECIMAL, `Expected 'decimal' after number`);
      this.eat(TK.PLACES, `Expected 'places' after 'decimal'`);
    }
    this.eat(TK.TO, `Expected 'to' after expression in Put statement`);
    this.eat(TK.OUTPUT, `Expected 'output' after 'to'`);
    this.eat(TK.NEWLINE, `Expected newline after Put statement`);
    return { type:'Put', expr, decimals, line };
  }

  parseBranch(indentLevel) {
    const line = this.getLine();
    this.eat(TK.IF);
    const condLoc = { line };
    const condition = this.parseCondExpr();
    this.eat(TK.NEWLINE, `Expected newline after 'if' condition`);
    const consequent = this.parseBlock(indentLevel + 3);
    const elseifs = [];
    let alternate = null;

    this.skipNewlines();
    while (this.currentIndentLevel() === indentLevel && this.check(TK.ELSEIF) ||
           (this.check(TK.INDENT) && this._peekAfterIndent(indentLevel) === TK.ELSEIF)) {
      if (this.check(TK.INDENT)) this.advance();
      const eiLine = this.getLine();
      this.eat(TK.ELSEIF);
      const eiCondLoc = { line: eiLine };
      const cond = this.parseCondExpr();
      this.eat(TK.NEWLINE, `Expected newline after 'elseif' condition`);
      const body = this.parseBlock(indentLevel + 3);
      elseifs.push({ condLoc: eiCondLoc, cond, body, line: eiLine });
      this.skipNewlines();
    }

    if (this._atTokenAtIndent(indentLevel, TK.ELSE)) {
      if (this.check(TK.INDENT)) this.advance();
      this.eat(TK.ELSE);
      this.eat(TK.NEWLINE, `Expected newline after 'else'`);
      alternate = this.parseBlock(indentLevel + 3);
    }

    return { type:'If', condLoc, condition, consequent, elseifs, alternate, line };
  }

  _peekAfterIndent(expectedIndent) {
    if (!this.check(TK.INDENT)) return null;
    if (this.peek().value !== expectedIndent) return null;
    const saved = this.pos;
    this.advance();
    const t = this.peek().type;
    this.pos = saved;
    return t;
  }

  _atTokenAtIndent(expectedIndent, tokenType) {
    const saved = this.pos;
    this.skipNewlines();
    const indentLevel = this.currentIndentLevel();
    if (indentLevel === expectedIndent) {
      if (this.check(TK.INDENT)) { this.advance(); }
      if (this.check(tokenType)) { this.pos = saved; return true; }
    }
    this.pos = saved;
    return false;
  }

  parseWhile(indentLevel) {
    const line = this.getLine();
    const condLoc = { line };
    this.eat(TK.WHILE);
    const condition = this.parseCondExpr();
    this.eat(TK.NEWLINE, `Expected newline after 'while' condition`);
    const body = this.parseBlock(indentLevel + 3);
    return { type:'While', condLoc, condition, body, line };
  }

  parseFor(indentLevel) {
    const line = this.getLine();
    const initLoc = { line };
    const condLoc = { line };
    const updateLoc = { line };
    this.eat(TK.FOR);
    // init: name = expr
    const initName = this.eatName();
    this.eat(TK.ASSIGN, `Expected '=' in for-loop initializer`);
    const initValue = this.parseCondExpr();
    const init = { type:'Assign', name: initName, value: initValue, line };
    this.eat(TK.SEMICOLON, `Expected ';' after for-loop initializer`);
    // condition
    const condition = this.parseCondExpr();
    this.eat(TK.SEMICOLON, `Expected ';' after for-loop condition`);
    // update: name = expr
    const updateName = this.eatName();
    this.eat(TK.ASSIGN, `Expected '=' in for-loop update`);
    const updateValue = this.parseCondExpr();
    const update = { type:'Assign', name: updateName, value: updateValue, line };
    this.eat(TK.NEWLINE, `Expected newline after for-loop header`);
    const body = this.parseBlock(indentLevel + 3);
    return { type:'For', initLoc, condLoc, updateLoc, init, condition, update, body, line };
  }

  parseExprStmt() {
    const line = this.getLine();
    const expr = this.parsePrimary();
    this.eat(TK.NEWLINE, `Expected newline after statement`);
    return { type:'ExprStmt', expr, line };
  }

  parseArgList() {
    const args = [];
    if (this.check(TK.RPAREN)) return args;
    args.push(this.parseCondExpr());
    while (this.check(TK.COMMA)) {
      this.advance();
      args.push(this.parseCondExpr());
    }
    return args;
  }

  // Expression parsers (correct precedence)
  parseCondExpr() { return this.parseOr(); }

  parseOr() {
    let left = this.parseAnd();
    while (this.check(TK.OR)) {
      const line = this.getLine();
      this.advance();
      const right = this.parseAnd();
      left = { type:'BinOp', op:'or', left, right, line };
    }
    return left;
  }

  parseAnd() {
    let left = this.parseNot();
    while (this.check(TK.AND)) {
      const line = this.getLine();
      this.advance();
      const right = this.parseNot();
      left = { type:'BinOp', op:'and', left, right, line };
    }
    return left;
  }

  parseNot() {
    if (this.check(TK.NOT)) {
      const line = this.getLine();
      this.advance();
      const operand = this.parseNot();
      return { type:'UnaryOp', op:'not', operand, line };
    }
    return this.parseComparison();
  }

  parseComparison() {
    let left = this.parseArith();
    const CMP_OPS = { [TK.LT]:'<', [TK.GT]:'>', [TK.LTE]:'<=', [TK.GTE]:'>=', [TK.EQ]:'==', [TK.NEQ]:'!=' };
    if (CMP_OPS[this.peek().type]) {
      const line = this.getLine();
      const op = CMP_OPS[this.advance().type];
      const right = this.parseArith();
      return { type:'BinOp', op, left, right, line };
    }
    return left;
  }

  parseArith() {
    let left = this.parseTerm();
    while (this.check(TK.PLUS) || this.check(TK.MINUS)) {
      const line = this.getLine();
      const op = this.advance().value;
      const right = this.parseTerm();
      left = { type:'BinOp', op, left, right, line };
    }
    return left;
  }

  parseTerm() {
    let left = this.parseUnary();
    while (this.check(TK.STAR) || this.check(TK.SLASH) || this.check(TK.PERCENT)) {
      const line = this.getLine();
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { type:'BinOp', op, left, right, line };
    }
    return left;
  }

  parseUnary() {
    if (this.check(TK.MINUS)) {
      const line = this.getLine();
      this.advance();
      const operand = this.parsePrimary();
      return { type:'UnaryOp', op:'-', operand, line };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const t = this.peek();
    const line = t.line;

    if (t.type === TK.LPAREN) {
      this.advance();
      const expr = this.parseCondExpr();
      this.eat(TK.RPAREN, `Expected ')'`);
      return expr;
    }

    if (t.type === TK.INT_LIT) { this.advance(); return { type:'Literal', dataType:'integer', value: t.value, line }; }
    if (t.type === TK.FLOAT_LIT) { this.advance(); return { type:'Literal', dataType:'float', value: t.value, line }; }
    if (t.type === TK.STRING_LIT) { this.advance(); return { type:'Literal', dataType:'string', value: t.value, line }; }

    // Built-in function calls
    const BUILTINS = { [TK.SQUAREROOT]:'SquareRoot', [TK.RAISETOPOWER]:'RaiseToPower',
      [TK.ABSOLUTEVALUE]:'AbsoluteValue', [TK.RANDOMNUMBER]:'RandomNumber',
      [TK.SEEDRANDOMNUMBERS]:'SeedRandomNumbers' };
    if (BUILTINS[t.type]) {
      this.advance();
      this.eat(TK.LPAREN, `Expected '(' after '${BUILTINS[t.type]}'`);
      const args = this.parseArgList();
      this.eat(TK.RPAREN, `Expected ')'`);
      return { type:'Call', name: BUILTINS[t.type], args, line };
    }

    // Identifier: array access, size access, function call, or variable
    if (t.type === TK.IDENTIFIER || SOFT_KW_AS_NAME.has(t.type)) {
      const name = this.eatName();

      if (this.check(TK.LBRACKET)) {
        this.advance();
        const index = this.parseCondExpr();
        this.eat(TK.RBRACKET, `Expected ']'`);
        return { type:'ArrayAccess', name, index, line };
      }

      if (this.check(TK.DOT)) {
        this.advance();
        this.eat(TK.SIZE, `Expected 'size' after '.'`);
        return { type:'SizeAccess', name, line };
      }

      if (this.check(TK.LPAREN)) {
        this.advance();
        const args = this.parseArgList();
        this.eat(TK.RPAREN, `Expected ')'`);
        return { type:'Call', name, args, line };
      }

      return { type:'Var', name, line };
    }

    throw ParseError(`Unexpected token '${t.value}' in expression`, line,
      `Line ${line}: '${t.value}' is not valid here in an expression.`);
  }
}

/* ============================================================
   SECTION 3 — RUNTIME TYPES
   ============================================================ */

function RuntimeError(message, line, hint) {
  return { name:'RuntimeError', message, line: line || null, hint: hint || '' };
}

class CoralArray {
  constructor(size, dataType) {
    this.dataType = dataType;
    this._size = size !== null ? size : 0;
    this._sizeSet = size !== null;
    this.data = size !== null ? new Array(size).fill(0) : [];
  }

  get size() { return this._size; }

  setSize(n, line) {
    const MAX = 100000;
    if (this._sizeSet) throw RuntimeError(`Array size already set`, line,
      `Line ${line}: This array's size was already set and cannot be changed.`);
    if (n > MAX) throw RuntimeError(`Array size ${n} exceeds maximum`, line,
      `Line ${line}: Array size ${n} is too large. Maximum is ${MAX.toLocaleString()}.`);
    if (n < 0) throw RuntimeError(`Array size cannot be negative`, line,
      `Line ${line}: Array size must be a non-negative integer.`);
    this._size = n;
    this._sizeSet = true;
    this.data = new Array(n).fill(0);
  }

  get(idx, line) {
    if (!this._sizeSet) throw RuntimeError(`Array size not set`, line,
      `Line ${line}: You must set this array's size before accessing elements.`);
    if (idx < 0 || idx >= this._size) throw RuntimeError(`Index ${idx} out of bounds`, line,
      `Line ${line}: Index ${idx} is out of bounds for an array of size ${this._size}. Valid indices are 0 to ${this._size - 1}.`);
    return this.data[idx];
  }

  set(idx, val, line) {
    if (!this._sizeSet) throw RuntimeError(`Array size not set`, line,
      `Line ${line}: You must set this array's size before assigning elements.`);
    if (idx < 0 || idx >= this._size) throw RuntimeError(`Index ${idx} out of bounds`, line,
      `Line ${line}: Index ${idx} is out of bounds for an array of size ${this._size}. Valid indices are 0 to ${this._size - 1}.`);
    this.data[idx] = val;
  }

  clone() {
    const c = new CoralArray(null, this.dataType);
    c._size = this._size; c._sizeSet = this._sizeSet;
    c.data = [...this.data];
    return c;
  }
}

class Scope {
  constructor() { this._vars = new Map(); }

  declare(name, value, declaredType) {
    this._vars.set(name, { value, declaredType, initialized: false });
  }

  get(name, line) {
    const entry = this._vars.get(name);
    if (!entry) throw RuntimeError(`Variable '${name}' is not declared`, line,
      `Line ${line}: '${name}' has not been declared. Add 'integer ${name}' or 'float ${name}' at the top of your function.`);
    if (!entry.initialized && !(entry.value instanceof CoralArray))
      throw RuntimeError(`Variable '${name}' used before assignment`, line,
        `Line ${line}: '${name}' has been declared but not yet assigned a value.`);
    return entry.value;
  }

  set(name, value, line) {
    const entry = this._vars.get(name);
    if (!entry) throw RuntimeError(`Variable '${name}' is not declared`, line,
      `Line ${line}: '${name}' has not been declared.`);
    entry.value = value;
    entry.initialized = true;
  }

  getType(name) { return this._vars.get(name)?.declaredType; }
  isInitialized(name) { return this._vars.get(name)?.initialized ?? false; }
  allVars() { return new Map(this._vars); }
}

function formatValue(val, declaredType, decimals) {
  if (decimals !== null && decimals !== undefined) return Number(val).toFixed(decimals);
  if (declaredType === 'float') {
    return Number.isInteger(val) ? val.toFixed(1) : String(val);
  }
  return String(Math.trunc(Number(val)));
}

/* ============================================================
   SECTION 4 — INTERPRETER (expression evaluation)
   ============================================================ */

class Interpreter {
  constructor() {
    this._rngState = 0;
    this.functions = new Map();
  }

  seedRng(n) { this._rngState = (n >>> 0); }
  rng() {
    this._rngState = (Math.imul(this._rngState, 1664525) + 1013904223) >>> 0;
    return this._rngState / 0x100000000;
  }

  coerce(val, type, line) {
    if (type === 'integer') return Math.trunc(Number(val));
    if (type === 'float')   return Number(val);
    return val;
  }

  evalTyped(node, scope) {
    switch (node.type) {
      case 'Literal':
        return { val: node.value, isFloat: node.dataType === 'float' };

      case 'Var': {
        const val = scope.get(node.name, node.line);
        return { val, isFloat: scope.getType(node.name) === 'float' };
      }

      case 'ArrayAccess': {
        const arr = scope.get(node.name, node.line);
        if (!(arr instanceof CoralArray))
          throw RuntimeError(`'${node.name}' is not an array`, node.line);
        const idx = Math.trunc(this.eval(node.index, scope));
        return { val: arr.get(idx, node.line), isFloat: arr.dataType === 'float' };
      }

      case 'SizeAccess': {
        const arr = scope.get(node.name, node.line);
        if (!(arr instanceof CoralArray))
          throw RuntimeError(`'${node.name}' is not an array`, node.line);
        return { val: arr.size, isFloat: false };
      }

      case 'UnaryOp': {
        if (node.op === '-') {
          const { val, isFloat } = this.evalTyped(node.operand, scope);
          return { val: -val, isFloat };
        }
        if (node.op === 'not') {
          const { val } = this.evalTyped(node.operand, scope);
          if (typeof val !== 'boolean')
            throw RuntimeError(`'not' requires a boolean`, node.line,
              `Line ${node.line}: 'not' can only be applied to a boolean (true/false) expression.`);
          return { val: !val, isFloat: false };
        }
        break;
      }

      case 'BinOp': {
        const L = this.evalTyped(node.left, scope);
        const R = this.evalTyped(node.right, scope);
        const lv = L.val, rv = R.val;

        if (node.op === 'and') return { val: Boolean(lv) && Boolean(rv), isFloat: false };
        if (node.op === 'or')  return { val: Boolean(lv) || Boolean(rv), isFloat: false };

        const CMP = { '<': (a,b)=>a<b, '>': (a,b)=>a>b, '<=': (a,b)=>a<=b,
                      '>=': (a,b)=>a>=b, '==': (a,b)=>a===b, '!=': (a,b)=>a!==b };
        if (CMP[node.op]) return { val: CMP[node.op](lv, rv), isFloat: false };

        const isFloat = L.isFloat || R.isFloat;
        if (node.op === '+') return { val: lv + rv, isFloat };
        if (node.op === '-') return { val: lv - rv, isFloat };
        if (node.op === '*') return { val: lv * rv, isFloat };
        if (node.op === '/') {
          if (rv === 0) throw RuntimeError(`Division by zero`, node.line,
            `Line ${node.line}: Cannot divide by zero.`);
          const result = lv / rv;
          return { val: isFloat ? result : Math.trunc(result), isFloat };
        }
        if (node.op === '%') {
          if (rv === 0) throw RuntimeError(`Modulo by zero`, node.line,
            `Line ${node.line}: Cannot compute remainder with divisor zero.`);
          return { val: isFloat ? lv % rv : Math.trunc(lv) % Math.trunc(rv), isFloat };
        }
        break;
      }

      case 'Call':
        return this.evalCall(node, scope);
    }
    throw RuntimeError(`Unknown expression node '${node.type}'`, node.line);
  }

  eval(node, scope) { return this.evalTyped(node, scope).val; }

  evalCall(node, scope) {
    const BUILTINS = {
      'SquareRoot':        (args) => ({ val: Math.sqrt(args[0]),       isFloat: true }),
      'RaiseToPower':      (args) => ({ val: Math.pow(args[0], args[1]), isFloat: true }),
      'AbsoluteValue':     (args) => ({ val: Math.abs(args[0]),         isFloat: true }),
      'RandomNumber':      ()     => ({ val: this.rng(),                isFloat: true }),
      'SeedRandomNumbers': (args) => { this.seedRng(args[0]); return { val: null, isFloat: false }; },
    };

    if (BUILTINS[node.name]) {
      const argVals = node.args.map(a => this.eval(a, scope));
      return BUILTINS[node.name](argVals);
    }

    // User-defined functions — sync evaluation for use in expressions
    const fn = this.functions.get(node.name);
    if (!fn) throw RuntimeError(`Unknown function '${node.name}'`, node.line,
      `Line ${node.line}: '${node.name}' is not defined.`);

    const fnScope = new Scope();
    // Bind params
    fn.params.forEach((p, i) => {
      const argVal = this.eval(node.args[i], scope);
      fnScope.declare(p.name, 0, p.ptype);
      fnScope.set(p.name, this.coerce(argVal, p.ptype, node.line), node.line);
    });
    if (fn.returnVar) {
      fnScope.declare(fn.returnVar, fn.returnType === 'integer' ? 0 : 0.0, fn.returnType);
    }
    // Declare all local vars
    fn.body.forEach(s => this._declareVars(s, fnScope));
    // Execute body synchronously (only for inline expression calls)
    this._execSync(fn.body, fnScope);
    if (fn.returnVar) {
      const rv = fnScope.get(fn.returnVar, node.line);
      return { val: rv, isFloat: fn.returnType === 'float' };
    }
    return { val: null, isFloat: false };
  }

  _declareVars(stmt, scope) {
    if (stmt.type === 'VarDecl') {
      scope.declare(stmt.name, stmt.dataType === 'integer' ? 0 : 0.0, stmt.dataType);
    } else if (stmt.type === 'ArrayDecl') {
      scope.declare(stmt.name, new CoralArray(stmt.size, stmt.dataType), stmt.dataType+'[]');
    }
  }

  _execSync(stmts, scope) {
    for (const stmt of stmts) {
      switch (stmt.type) {
        case 'VarDecl': case 'ArrayDecl': break; // already declared
        case 'Assign': {
          const v = this.eval(stmt.value, scope);
          scope.set(stmt.name, this.coerce(v, scope.getType(stmt.name), stmt.line), stmt.line);
          break;
        }
        case 'ArrayAssign': {
          const arr = scope.get(stmt.name, stmt.line);
          const idx = Math.trunc(this.eval(stmt.index, scope));
          const v = this.eval(stmt.value, scope);
          arr.set(idx, this.coerce(v, arr.dataType, stmt.line), stmt.line);
          break;
        }
        case 'SizeAssign': {
          const arr = scope.get(stmt.name, stmt.line);
          arr.setSize(Math.trunc(this.eval(stmt.value, scope)), stmt.line);
          break;
        }
        case 'If': {
          if (this.eval(stmt.condition, scope)) {
            this._execSync(stmt.consequent, scope);
          } else {
            let found = false;
            for (const ei of stmt.elseifs) {
              if (this.eval(ei.cond, scope)) { this._execSync(ei.body, scope); found = true; break; }
            }
            if (!found && stmt.alternate) this._execSync(stmt.alternate, scope);
          }
          break;
        }
        case 'While': {
          let guard = 0;
          while (this.eval(stmt.condition, scope)) {
            if (++guard > 100000) throw RuntimeError(`Infinite loop`, stmt.line);
            this._execSync(stmt.body, scope);
          }
          break;
        }
        case 'For': {
          const iv = this.eval(stmt.init.value, scope);
          scope.set(stmt.init.name, this.coerce(iv, scope.getType(stmt.init.name), stmt.line), stmt.line);
          let guard = 0;
          while (this.eval(stmt.condition, scope)) {
            if (++guard > 100000) throw RuntimeError(`Infinite loop`, stmt.line);
            this._execSync(stmt.body, scope);
            const uv = this.eval(stmt.update.value, scope);
            scope.set(stmt.update.name, this.coerce(uv, scope.getType(stmt.update.name), stmt.line), stmt.line);
          }
          break;
        }
      }
    }
  }
}

/* ============================================================
   SECTION 5 — GENERATOR EXECUTOR
   ============================================================ */

function* genBlock(stmts, scope, ctx) {
  for (const stmt of stmts) yield* genExec(stmt, scope, ctx);
}

function* genExec(node, scope, ctx) {
  switch (node.type) {

    case 'VarDecl':
      scope.declare(node.name, node.dataType === 'integer' ? 0 : 0.0, node.dataType);
      yield { loc: { line: node.line }, scope, callStack: ctx.callStack };
      break;

    case 'ArrayDecl':
      scope.declare(node.name, new CoralArray(node.size, node.dataType), node.dataType+'[]');
      yield { loc: { line: node.line }, scope, callStack: ctx.callStack };
      break;

    case 'Input': {
      yield { loc: { line: node.line }, scope, callStack: ctx.callStack };
      if (ctx.inputQueue.length === 0)
        throw RuntimeError(`No more inputs`, node.line,
          `Line ${node.line}: Input required but no more inputs are available. Add more values in the Program Inputs box and restart.`);
      const raw = ctx.inputQueue.shift();
      const parsed = parseFloat(raw);
      if (isNaN(parsed)) throw RuntimeError(`Invalid input '${raw}'`, node.line,
        `Line ${node.line}: '${raw}' is not a valid number.`);
      scope.set(node.name, ctx.interp.coerce(parsed, scope.getType(node.name), node.line), node.line);
      break;
    }

    case 'ArrayInput': {
      yield { loc: { line: node.line }, scope, callStack: ctx.callStack };
      const arr = scope.get(node.name, node.line);
      const idx = Math.trunc(ctx.interp.eval(node.index, scope));
      if (ctx.inputQueue.length === 0)
        throw RuntimeError(`No more inputs`, node.line,
          `Line ${node.line}: Input required but no more inputs are available.`);
      const raw = ctx.inputQueue.shift();
      const parsed = parseFloat(raw);
      if (isNaN(parsed)) throw RuntimeError(`Invalid input '${raw}'`, node.line);
      arr.set(idx, ctx.interp.coerce(parsed, arr.dataType, node.line), node.line);
      break;
    }

    case 'SizeInput': {
      yield { loc: { line: node.line }, scope, callStack: ctx.callStack };
      const arr = scope.get(node.name, node.line);
      if (ctx.inputQueue.length === 0)
        throw RuntimeError(`No more inputs`, node.line,
          `Line ${node.line}: Input required but no more inputs are available.`);
      const raw = ctx.inputQueue.shift();
      const n = Math.trunc(parseFloat(raw));
      arr.setSize(n, node.line);
      break;
    }

    case 'Assign': {
      yield { loc: { line: node.line }, scope, callStack: ctx.callStack };
      const rawVal = ctx.interp.eval(node.value, scope);
      const declType = scope.getType(node.name);
      scope.set(node.name, ctx.interp.coerce(rawVal, declType, node.line), node.line);
      break;
    }

    case 'ArrayAssign': {
      yield { loc: { line: node.line }, scope, callStack: ctx.callStack };
      const arr = scope.get(node.name, node.line);
      const idx = Math.trunc(ctx.interp.eval(node.index, scope));
      const rawVal = ctx.interp.eval(node.value, scope);
      arr.set(idx, ctx.interp.coerce(rawVal, arr.dataType, node.line), node.line);
      break;
    }

    case 'SizeAssign': {
      yield { loc: { line: node.line }, scope, callStack: ctx.callStack };
      const arr = scope.get(node.name, node.line);
      const n = Math.trunc(ctx.interp.eval(node.value, scope));
      arr.setSize(n, node.line);
      break;
    }

    case 'Put': {
      yield { loc: { line: node.line }, scope, callStack: ctx.callStack };
      const { val, isFloat } = ctx.interp.evalTyped(node.expr, scope);
      const exprType = node.expr.type === 'Var' ? scope.getType(node.expr.name) : (isFloat ? 'float' : 'integer');
      const str = typeof val === 'string' ? val : formatValue(val, exprType, node.decimals);
      ctx.output.push(str);
      break;
    }

    case 'If': {
      yield { loc: node.condLoc, scope, callStack: ctx.callStack };
      const taken = ctx.interp.eval(node.condition, scope);
      if (taken) {
        yield* genBlock(node.consequent, scope, ctx);
      } else {
        let found = false;
        for (const ei of node.elseifs) {
          yield { loc: ei.condLoc, scope, callStack: ctx.callStack };
          if (ctx.interp.eval(ei.cond, scope)) {
            yield* genBlock(ei.body, scope, ctx);
            found = true; break;
          }
        }
        if (!found && node.alternate) {
          yield* genBlock(node.alternate, scope, ctx);
        }
      }
      break;
    }

    case 'While': {
      let guard = 0;
      while (true) {
        yield { loc: node.condLoc, scope, callStack: ctx.callStack };
        if (!ctx.interp.eval(node.condition, scope)) break;
        if (++guard > 100000) throw RuntimeError(`Infinite loop`, node.line,
          `Line ${node.line}: Loop ran over 100,000 iterations. Check your loop condition — it may never become false.`);
        yield* genBlock(node.body, scope, ctx);
      }
      break;
    }

    case 'For': {
      // Init
      yield { loc: { line: node.line, part: 'forInit' }, scope, callStack: ctx.callStack };
      const initV = ctx.interp.eval(node.init.value, scope);
      scope.set(node.init.name, ctx.interp.coerce(initV, scope.getType(node.init.name), node.line), node.line);
      let forGuard = 0;
      while (true) {
        // Condition
        yield { loc: { line: node.line, part: 'forCond' }, scope, callStack: ctx.callStack };
        if (!ctx.interp.eval(node.condition, scope)) break;
        if (++forGuard > 100000) throw RuntimeError(`Infinite loop`, node.line,
          `Line ${node.line}: For loop ran over 100,000 iterations.`);
        // Body
        yield* genBlock(node.body, scope, ctx);
        // Update
        yield { loc: { line: node.line, part: 'forUpdate' }, scope, callStack: ctx.callStack };
        const updV = ctx.interp.eval(node.update.value, scope);
        scope.set(node.update.name, ctx.interp.coerce(updV, scope.getType(node.update.name), node.line), node.line);
      }
      break;
    }

    case 'ExprStmt': {
      yield { loc: { line: node.line }, scope, callStack: ctx.callStack };
      if (ctx.functions.has(node.expr.name)) {
        yield* genCall(node.expr, scope, ctx);
      } else {
        ctx.interp.evalCall(node.expr, scope);
      }
      break;
    }
  }
}

function* genCall(callNode, scope, ctx) {
  const fn = ctx.functions.get(callNode.name);
  if (!fn) throw RuntimeError(`Unknown function '${callNode.name}'`, callNode.line);

  if (++ctx.callDepth > 500)
    throw RuntimeError(`Maximum call depth exceeded`, callNode.line,
      `Line ${callNode.line}: Too many nested function calls. Check for infinite recursion.`);

  const argVals = callNode.args.map(a => ctx.interp.eval(a, scope));
  const fnScope = new Scope();

  fn.params.forEach((p, i) => {
    fnScope.declare(p.name, 0, p.ptype);
    fnScope.set(p.name, ctx.interp.coerce(argVals[i], p.ptype, callNode.line), callNode.line);
  });
  if (fn.returnVar) {
    fnScope.declare(fn.returnVar, fn.returnType === 'integer' ? 0 : 0.0, fn.returnType);
  }

  const frame = { label: fn.name, scope: fnScope, kind: 'function',
    paramNames: new Set(fn.params.map(p => p.name)), returnVar: fn.returnVar };
  ctx.callStack.push(frame);

  yield* genBlock(fn.body, fnScope, ctx);

  ctx.callStack.pop();
  ctx.callDepth--;

  if (fn.returnVar) {
    const rv = fnScope.get(fn.returnVar, callNode.line);
    return { val: rv, isFloat: fn.returnType === 'float' };
  }
  return { val: null, isFloat: false };
}

function* genProgram(ast, inputQueue, output) {
  const functions = new Map();
  for (const fn of ast.functions) functions.set(fn.name, fn);

  const interp = new Interpreter();
  interp.functions = functions;

  const mainFn = functions.get('Main');
  if (!mainFn) throw RuntimeError(`No Main function`, 1,
    `No 'Main' function found. When using Function definitions, you must include 'Function Main() returns nothing nothing'.`);

  const scope = new Scope();
  if (mainFn.returnVar) {
    scope.declare(mainFn.returnVar, mainFn.returnType === 'integer' ? 0 : 0.0, mainFn.returnType);
  }

  const callStack = [{ label:'Main', scope, kind:'main', paramNames: new Set(), returnVar: mainFn.returnVar }];
  const ctx = { interp, functions, output, inputQueue, callStack, callDepth: 0 };

  yield* genBlock(mainFn.body, scope, ctx);
  // Final yield exposes complete state
  yield { loc: null, scope, callStack };
}

/* ============================================================
   SECTION 6 — SYNTAX HIGHLIGHTING
   ============================================================ */

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const HL_CLASS = {
  [TK.INTEGER]:'hl-type', [TK.FLOAT]:'hl-type',
  [TK.IF]:'hl-keyword', [TK.ELSEIF]:'hl-keyword', [TK.ELSE]:'hl-keyword',
  [TK.WHILE]:'hl-keyword', [TK.FOR]:'hl-keyword',
  [TK.PUT]:'hl-keyword', [TK.TO]:'hl-keyword', [TK.OUTPUT]:'hl-keyword',
  [TK.GET]:'hl-keyword', [TK.NEXT]:'hl-keyword', [TK.INPUT]:'hl-keyword',
  [TK.FUNCTION]:'hl-keyword', [TK.RETURNS]:'hl-keyword', [TK.NOTHING]:'hl-keyword',
  [TK.ARRAY]:'hl-keyword', [TK.AND]:'hl-keyword', [TK.OR]:'hl-keyword', [TK.NOT]:'hl-keyword',
  [TK.SQUAREROOT]:'hl-builtin', [TK.RAISETOPOWER]:'hl-builtin',
  [TK.ABSOLUTEVALUE]:'hl-builtin', [TK.RANDOMNUMBER]:'hl-builtin',
  [TK.SEEDRANDOMNUMBERS]:'hl-builtin',
  [TK.STRING_LIT]:'hl-string',
  [TK.INT_LIT]:'hl-number', [TK.FLOAT_LIT]:'hl-number',
  [TK.PLUS]:'hl-operator', [TK.MINUS]:'hl-operator', [TK.STAR]:'hl-operator',
  [TK.SLASH]:'hl-operator', [TK.PERCENT]:'hl-operator',
  [TK.LT]:'hl-operator', [TK.GT]:'hl-operator', [TK.LTE]:'hl-operator',
  [TK.GTE]:'hl-operator', [TK.EQ]:'hl-operator', [TK.NEQ]:'hl-operator',
  [TK.ASSIGN]:'hl-operator',
};

function highlightSource(src) {
  if (!src) return '';
  let html = '';
  let pos = 0;

  // Process line by line for comment detection
  const lines = src.split('\n');
  let charPos = 0;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const lineStart = charPos;
    const lineEnd = charPos + line.length;

    // Check for full-line comment
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//')) {
      html += `<span class="hl-comment">${escHtml(line)}</span>`;
      if (li < lines.length - 1) html += '\n';
      charPos += line.length + 1;
      continue;
    }

    // Check for inline comment (error — just highlight in red to draw attention)
    const commentIdx = findInlineComment(line);
    if (commentIdx !== -1) {
      html += escHtml(line.slice(0, commentIdx));
      html += `<span class="hl-comment" style="color:var(--error)">${escHtml(line.slice(commentIdx))}</span>`;
      if (li < lines.length - 1) html += '\n';
      charPos += line.length + 1;
      continue;
    }

    // Lex the line for highlighting
    try {
      const tokens = lexLine(line, li + 1);
      let col = 0;
      for (const tok of tokens) {
        if (tok.col > col) html += escHtml(line.slice(col, tok.col));
        const cls = HL_CLASS[tok.type];
        if (cls) {
          html += `<span class="${cls}">${escHtml(tok.text)}</span>`;
        } else {
          html += escHtml(tok.text);
        }
        col = tok.col + tok.text.length;
      }
      if (col < line.length) html += escHtml(line.slice(col));
    } catch(e) {
      html += escHtml(line);
    }

    if (li < lines.length - 1) html += '\n';
    charPos += line.length + 1;
  }

  return html;
}

// Minimal line-level lexer returning {type, text, col} for highlighting
function lexLine(line, lineNum) {
  const toks = [];
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    if (ch === ' ' || ch === '\t') { i++; continue; }

    // String literal
    if (ch === '"') {
      const start = i; i++;
      while (i < line.length && line[i] !== '"') {
        if (line[i] === '\\') i++;
        i++;
      }
      if (i < line.length) i++; // closing "
      toks.push({ type: TK.STRING_LIT, text: line.slice(start, i), col: start });
      continue;
    }

    // Number
    if (ch >= '0' && ch <= '9') {
      const start = i;
      let isFloat = false;
      while (i < line.length && ((line[i] >= '0' && line[i] <= '9') || line[i] === '.')) {
        if (line[i] === '.') isFloat = true;
        i++;
      }
      toks.push({ type: isFloat ? TK.FLOAT_LIT : TK.INT_LIT, text: line.slice(start, i), col: start });
      continue;
    }

    // Identifier / keyword
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      const start = i;
      while (i < line.length && ((line[i] >= 'a' && line[i] <= 'z') || (line[i] >= 'A' && line[i] <= 'Z') || (line[i] >= '0' && line[i] <= '9') || line[i] === '_')) i++;
      const word = line.slice(start, i);
      const kw = KEYWORDS.get(word);
      toks.push({ type: kw || TK.IDENTIFIER, text: word, col: start });
      continue;
    }

    // Two-char operators
    if (i + 1 < line.length) {
      const two = line.slice(i, i+2);
      const twoMap = { '<=': TK.LTE, '>=': TK.GTE, '==': TK.EQ, '!=': TK.NEQ };
      if (twoMap[two]) { toks.push({ type: twoMap[two], text: two, col: i }); i += 2; continue; }
    }

    // Single-char
    const oneMap = { '=':TK.ASSIGN, '+':TK.PLUS, '-':TK.MINUS, '*':TK.STAR, '/':TK.SLASH,
      '%':TK.PERCENT, '<':TK.LT, '>':TK.GT };
    if (oneMap[ch]) { toks.push({ type: oneMap[ch], text: ch, col: i }); i++; continue; }

    i++; // unknown char — skip
  }
  return toks;
}

/* ============================================================
   SECTION 7 — FLOWCHART
   ============================================================ */

const FC = {
  NODE_W: 160, NODE_H: 40,
  DIAMOND_W: 180, DIAMOND_H: 80,
  OVAL_W: 120, OVAL_H: 36,
  VERT_GAP: 28,
  BRANCH_OFFSET: 230,  // horizontal offset from main cx to branch cx
  FONT_SIZE: 11, CHARS_PER_LINE: 22,
  PARA_SHEAR: 12,
};

let _nodeId = 0;
function newNodeId() { return 'fc' + (++_nodeId); }

function exprText(node) {
  if (!node) return '';
  switch (node.type) {
    case 'Literal': return typeof node.value === 'string'
      ? `"${node.value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`
      : String(node.value);
    case 'Var': return node.name;
    case 'ArrayAccess': return `${node.name}[${exprText(node.index)}]`;
    case 'SizeAccess': return `${node.name}.size`;
    case 'UnaryOp': return node.op === '-' ? `-${exprText(node.operand)}` : `not ${exprText(node.operand)}`;
    case 'BinOp': return `${exprText(node.left)} ${node.op} ${exprText(node.right)}`;
    case 'Call': return `${node.name}(${node.args.map(exprText).join(', ')})`;
    default: return '?';
  }
}

/*
  Layout strategy:
  - Main spine nodes sit centered at `ls.cx` stacking top-to-bottom.
  - Branch bodies (True/loop) are placed at `ls.cx + BRANCH_OFFSET`.
  - placeBlock() accepts and returns arrays of "previous IDs" (multi-exit support for If).
  - Positions are computed in a single recursive pass while building the graph.
*/

function buildFlowchartGraph(ast) {
  _nodeId = 0;

  // Layout state (mutated during traversal)
  const ls = {
    cx: 200,       // current center-x of the spine
    y:  30,        // current top-y of next node on the spine
    nodes: [],
    edges: [],
    lineToNodeId: new Map(),
    forCondMap: new Map(),   // line → For condition diamond id
    forUpdateMap: new Map(), // line → For update rect id
  };

  // Start oval
  const startId = newNodeId();
  _placeNode(ls, startId, 'oval', 'Start', FC.OVAL_W, FC.OVAL_H, null);
  ls.edges.push({ from: '__entry__', to: startId }); // placeholder removed below

  const mainFn = ast.functions[0];
  let prevIds = [startId];
  prevIds = _placeBlock(mainFn.body, prevIds, ls);

  // End oval
  const endId = newNodeId();
  _placeNode(ls, endId, 'oval', 'End', FC.OVAL_W, FC.OVAL_H, null);
  for (const pid of prevIds) {
    ls.edges.push({ from: pid, to: endId, fromSide:'bottom', toSide:'top' });
  }

  // Remove placeholder
  ls.edges = ls.edges.filter(e => e.from !== '__entry__');

  return {
    nodes: ls.nodes,
    edges: ls.edges,
    lineToNodeId: ls.lineToNodeId,
    forCondMap: ls.forCondMap,
    forUpdateMap: ls.forUpdateMap,
    startId, endId,
  };
}

// Place a node at current ls.cx, ls.y — advances ls.y
function _placeNode(ls, id, shape, label, w, h, line) {
  const n = { id, shape, label, w, h, x: ls.cx - w / 2, y: ls.y, line };
  ls.nodes.push(n);
  if (line !== null && line !== undefined) ls.lineToNodeId.set(line, id);
  ls.y += h + FC.VERT_GAP;
  return n;
}

// Place a node at an explicit cx (branch column) without touching ls.y
function _placeNodeAt(ls, id, shape, label, w, h, cx, y, line) {
  const n = { id, shape, label, w, h, x: cx - w / 2, y, line };
  ls.nodes.push(n);
  if (line !== null && line !== undefined) ls.lineToNodeId.set(line, id);
  return n;
}

// placeBlock: places a sequence of statements.
// prevIds: array of IDs to connect from (supports multi-exit from If).
// Returns array of exit IDs.
function _placeBlock(stmts, prevIds, ls) {
  let currentIds = prevIds;
  for (const stmt of stmts) {
    currentIds = _placeStmt(stmt, currentIds, ls);
  }
  return currentIds;
}

function _placeStmt(stmt, prevIds, ls) {
  const mainCx = ls.cx;

  // ── Simple linear nodes ──
  const simpleTypes = {
    VarDecl:    (s) => s.dataType + ' ' + s.name,
    ArrayDecl:  (s) => `${s.dataType} array(${s.size !== null ? s.size : '?'}) ${s.name}`,
    Assign:     (s) => `${s.name} = ${exprText(s.value)}`,
    ArrayAssign:(s) => `${s.name}[${exprText(s.index)}] = ${exprText(s.value)}`,
    SizeAssign: (s) => `${s.name}.size = ${exprText(s.value)}`,
    Input:      (s) => `${s.name} = Get next input`,
    ArrayInput: (s) => `${s.name}[${exprText(s.index)}] = Get next input`,
    SizeInput:  (s) => `${s.name}.size = Get next input`,
    Put:        (s) => `Put ${exprText(s.expr)}${s.decimals !== null ? ` with ${s.decimals} decimal places` : ''} to output`,
    ExprStmt:   (s) => exprText(s.expr),
  };
  const shapeFor = { Input:'para', ArrayInput:'para', SizeInput:'para', Put:'para' };

  if (simpleTypes[stmt.type]) {
    const id  = newNodeId();
    const lbl = simpleTypes[stmt.type](stmt);
    const shp = shapeFor[stmt.type] || 'rect';
    _placeNode(ls, id, shp, lbl, FC.NODE_W, FC.NODE_H, stmt.line);
    for (const pid of prevIds) ls.edges.push({ from: pid, to: id, fromSide:'bottom', toSide:'top' });
    return [id];
  }

  // ── While ──
  if (stmt.type === 'While') {
    const condId = newNodeId();
    _placeNode(ls, condId, 'diamond', exprText(stmt.condition), FC.DIAMOND_W, FC.DIAMOND_H, stmt.line);
    const condNode = ls.nodes.find(n => n.id === condId);
    const condTopY = condNode.y;
    const afterCondY = ls.y;  // where FALSE exit continues

    for (const pid of prevIds) ls.edges.push({ from: pid, to: condId, fromSide:'bottom', toSide:'top' });

    // Body in branch column — first node vertically centered with diamond right midpoint
    const branchCx = mainCx + FC.BRANCH_OFFSET;
    const savedCx = ls.cx, savedY = ls.y;
    ls.cx = branchCx;
    ls.y  = condTopY + FC.DIAMOND_H / 2 - FC.NODE_H / 2;

    const bodyExits = _placeBlock(stmt.body, [condId], ls);
    const bodyBottomY = ls.y;

    ls.cx = savedCx;
    ls.y  = Math.max(afterCondY, bodyBottomY);

    // Back edges from body exits to condition (arrive at right-bottom edge of diamond)
    for (const eid of bodyExits) {
      ls.edges.push({ from: eid, to: condId, fromSide:'bottom', isBack: true });
    }
    // Mark the cond→body edge: exits right side of diamond, arrives at left side of first body node
    _markFirstForwardEdgeSides(ls.edges, condId, 'yes', 'left');

    return [condId]; // FALSE exit = bottom of diamond
  }

  // ── For ──
  if (stmt.type === 'For') {
    // Init rect on spine
    const initId = newNodeId();
    _placeNode(ls, initId, 'rect', `${stmt.init.name} = ${exprText(stmt.init.value)}`, FC.NODE_W, FC.NODE_H, stmt.line);
    for (const pid of prevIds) ls.edges.push({ from: pid, to: initId, fromSide:'bottom', toSide:'top' });
    ls.lineToNodeId.set(stmt.line, initId); // init shown for first step

    // Condition diamond on spine
    const condId = newNodeId();
    _placeNode(ls, condId, 'diamond', exprText(stmt.condition), FC.DIAMOND_W, FC.DIAMOND_H, null);
    ls.forCondMap.set(stmt.line, condId);
    ls.edges.push({ from: initId, to: condId, fromSide:'bottom', toSide:'top' });
    const condNode = ls.nodes.find(n => n.id === condId);
    const condTopY = condNode.y;
    const afterCondY = ls.y;

    // Body in branch column — first node vertically centered with diamond right midpoint
    const branchCx = mainCx + FC.BRANCH_OFFSET;
    const savedCx = ls.cx, savedY = ls.y;
    ls.cx = branchCx;
    ls.y  = condTopY + FC.DIAMOND_H / 2 - FC.NODE_H / 2;

    const bodyExits = _placeBlock(stmt.body, [condId], ls);

    // Update rect in branch column, below body
    const updId = newNodeId();
    const updN = _placeNodeAt(ls, updId, 'rect',
      `${stmt.update.name} = ${exprText(stmt.update.value)}`,
      FC.NODE_W, FC.NODE_H, branchCx, ls.y, null);
    ls.forUpdateMap.set(stmt.line, updId);
    for (const eid of bodyExits) ls.edges.push({ from: eid, to: updId, fromSide:'bottom', toSide:'top' });
    const branchBottomY = ls.y + FC.NODE_H + FC.VERT_GAP;

    ls.cx = savedCx;
    ls.y  = Math.max(afterCondY, branchBottomY);

    // Back edge: update → condition (arrive at right-bottom edge of diamond)
    ls.edges.push({ from: updId, to: condId, fromSide:'bottom', isBack: true });

    // Mark cond→body edge: exits right side of diamond, arrives at left side of first body node
    _markFirstForwardEdgeSides(ls.edges, condId, 'yes', 'left');

    return [condId]; // FALSE exit
  }

  // ── If / elseif / else ──
  if (stmt.type === 'If') {
    // Build the full chain: if → [elseif...] → [else]
    const branches = [
      { cond: stmt.condition, body: stmt.consequent, line: stmt.line },
      ...stmt.elseifs.map(ei => ({ cond: ei.cond, body: ei.body, line: ei.line })),
    ];

    let chainPrevIds = prevIds;
    const allBranchExits = [];  // exits from all true-bodies
    let lastCondId = null;
    let branchColMaxY = ls.y;   // tracks furthest-down point in branch column

    for (const branch of branches) {
      const condId = newNodeId();
      _placeNode(ls, condId, 'diamond', exprText(branch.cond), FC.DIAMOND_W, FC.DIAMOND_H, branch.line);
      const condNode = ls.nodes.find(n => n.id === condId);
      const condTopY = condNode.y;
      const afterCondY = ls.y;

      for (const pid of chainPrevIds) ls.edges.push({ from: pid, to: condId, fromSide:'bottom', toSide:'top' });

      // TRUE body in branch column — first node vertically centered with diamond right midpoint
      const branchCx = mainCx + FC.BRANCH_OFFSET;
      const savedCx = ls.cx, savedY = ls.y;
      ls.cx = branchCx;
      ls.y  = condTopY + FC.DIAMOND_H / 2 - FC.NODE_H / 2;

      const trueExits = _placeBlock(branch.body, [condId], ls);
      const branchBottomY = ls.y;
      branchColMaxY = Math.max(branchColMaxY, branchBottomY);
      allBranchExits.push(...trueExits);

      ls.cx = savedCx;
      ls.y  = Math.max(afterCondY, branchBottomY);

      // Mark cond→true body edge: exits right side, arrives at left side of first body node
      _markFirstForwardEdgeSides(ls.edges, condId, 'yes', 'left');

      // The FALSE path from this condition leads to the next elseif/else/merge
      chainPrevIds = [condId]; // condId FALSE exit feeds next condition
      lastCondId = condId;
    }

    // Else body or pass-through
    if (stmt.alternate) {
      // Else body in branch column, placed below all TRUE branch bodies
      const branchCx = mainCx + FC.BRANCH_OFFSET;
      const savedCx = ls.cx, savedY = ls.y;
      ls.cx = branchCx;
      ls.y  = branchColMaxY;  // start after all TRUE branch bodies in branch column

      const elseExits = _placeBlock(stmt.alternate, chainPrevIds, ls);
      const elseBottomY = ls.y;
      allBranchExits.push(...elseExits);

      ls.cx = savedCx;
      ls.y  = Math.max(savedY, elseBottomY);
    } else {
      // No else: FALSE exit of last condition is also an exit
      allBranchExits.push(lastCondId);
    }

    // All exits from all branches converge → returned as multi-exit
    return allBranchExits;
  }

  return prevIds;
}

function _markFirstForwardEdgeSides(edges, fromId, fromSide, toSide) {
  const e = edges.find(e => e.from === fromId && !e.isBack);
  if (e) { e.fromSide = fromSide; if (toSide !== undefined) e.toSide = toSide; }
}

function renderFlowchartSVG(graph, activeNodeId) {
  const { nodes, edges } = graph;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const visibleNodes = nodes.filter(n => n.shape !== 'merge');
  if (visibleNodes.length === 0) return '<svg></svg>';

  const pad = 60;
  const rightBound = Math.max(...visibleNodes.map(n => n.x + n.w));
  const maxX = rightBound + pad + 40;  // extra space for right-rail routing
  const maxY = Math.max(...visibleNodes.map(n => n.y + n.h)) + pad;

  const svgParts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${maxY}" viewBox="0 0 ${maxX} ${maxY}">`,
    `<defs>`,
    `<marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">`,
    `<path d="M0,0 L0,6 L8,3 z" fill="var(--fc-arrow)"/></marker>`,
    `</defs>`,
  ];

  // Helper: get connection point on a node
  function connPt(n, side) {
    const cx = n.x + n.w / 2, cy = n.y + n.h / 2;
    if (side === 'top')              return [cx, n.y];
    if (side === 'bottom')           return [cx, n.y + n.h];
    if (side === 'left')             return [n.x, cy];
    if (side === 'right' || side === 'yes') return [n.x + n.w, cy];
    return [cx, n.y + n.h]; // default bottom
  }

  // Draw edges
  for (const e of edges) {
    const from = nodeMap.get(e.from);
    const to   = nodeMap.get(e.to);
    if (!from || !to) continue;
    if (from.shape === 'merge' || to.shape === 'merge') continue;

    const fromSide = e.fromSide || 'bottom';
    const toSide   = e.toSide   || 'top';
    const [fx, fy] = connPt(from, fromSide);
    const [tx, ty] = connPt(to, toSide);

    let d;
    if (e.isBack) {
      // Back edge (loop return): arrive at midpoint of diamond's right-bottom edge
      // (halfway between right corner and bottom corner — between TRUE and FALSE exits)
      const atx = to.x + to.w * 3 / 4;           // right-bottom edge x
      const aty = to.y + to.h * 3 / 4;           // right-bottom edge y
      const routingY = Math.max(fy + 10, aty + 30); // safely below diamond's bottom corner
      d = `M${fx},${fy} L${fx},${routingY} L${atx},${routingY} L${atx},${aty}`;
    } else if (fromSide === 'yes' || fromSide === 'right') {
      // TRUE branch: from diamond right point, horizontal to left side of first body node
      // (fy === ty when first body node is properly aligned with diamond mid-Y)
      d = `M${fx},${fy} L${tx},${fy} L${tx},${ty}`;
    } else if (Math.abs(fx - tx) < 4) {
      // Same column: straight vertical line
      d = `M${fx},${fy} L${tx},${ty}`;
    } else if (fx > tx) {
      // Branch column → spine (converging exits): route via right rail to avoid crossing shapes
      const rightRailX = rightBound + 20;
      d = `M${fx},${fy} L${rightRailX},${fy} L${rightRailX},${ty} L${tx},${ty}`;
    } else {
      // Spine → branch column (e.g. else body edge): go down on spine then right to branch
      d = `M${fx},${fy} L${fx},${ty} L${tx},${ty}`;
    }

    svgParts.push(`<path class="fc-edge" d="${d}" marker-end="url(#arrow)"/>`);

    // Edge labels on diamond exits
    if (from.shape === 'diamond') {
      if (fromSide === 'yes' || fromSide === 'right') {
        // Label just above the horizontal segment, right of the diamond right point
        svgParts.push(`<text class="fc-edge-label" x="${fx+6}" y="${fy-4}">TRUE</text>`);
      } else if (fromSide === 'bottom' || fromSide === 'no') {
        // Label just below-left of the diamond's bottom vertex, adjacent to the downward arrow
        svgParts.push(`<text class="fc-edge-label" x="${fx - 44}" y="${fy + 14}">FALSE</text>`);
      }
    }
  }

  // Draw nodes
  for (const n of visibleNodes) {
    const active = n.id === activeNodeId;
    const cls = `fc-node${active ? ' fc-active' : ''}`;
    const cx = n.x + n.w / 2;
    const cy = n.y + n.h / 2;
    const lines = wrapText(n.label, FC.CHARS_PER_LINE);

    let shape = '';
    if (n.shape === 'oval') {
      shape = `<ellipse class="fc-shape" cx="${cx}" cy="${cy}" rx="${n.w/2}" ry="${n.h/2}" fill="var(--fc-oval)" stroke="var(--fc-border)" stroke-width="1.5"/>`;
    } else if (n.shape === 'rect') {
      shape = `<rect class="fc-shape" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="4" fill="var(--fc-rect)" stroke="var(--fc-border)" stroke-width="1.5"/>`;
    } else if (n.shape === 'para') {
      const s = FC.PARA_SHEAR;
      const pts = `${n.x+s},${n.y} ${n.x+n.w+s},${n.y} ${n.x+n.w},${n.y+n.h} ${n.x},${n.y+n.h}`;
      shape = `<polygon class="fc-shape" points="${pts}" fill="var(--fc-para)" stroke="var(--fc-border)" stroke-width="1.5"/>`;
    } else if (n.shape === 'diamond') {
      const pts = `${cx},${n.y} ${n.x+n.w},${cy} ${cx},${n.y+n.h} ${n.x},${cy}`;
      shape = `<polygon class="fc-shape" points="${pts}" fill="var(--fc-diamond)" stroke="var(--fc-border)" stroke-width="1.5"/>`;
    }

    const lineHeight = FC.FONT_SIZE * 1.45;
    const totalH = lines.length * lineHeight;
    const textY = cy - totalH / 2 + FC.FONT_SIZE * 0.85;
    const tspans = lines.map((l, i) =>
      `<tspan x="${cx}" dy="${i === 0 ? 0 : lineHeight}">${escHtml(l)}</tspan>`).join('');

    svgParts.push(`<g class="${cls}" id="${n.id}">${shape}<text class="fc-node-text" x="${cx}" y="${textY}" text-anchor="middle">${tspans}</text></g>`);
  }

  svgParts.push('</svg>');
  return svgParts.join('');
}

function wrapText(text, charsPerLine) {
  if (!text) return [''];
  if (text.length <= charsPerLine) return [text];
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > charsPerLine) { lines.push(cur); cur = w; }
    else { cur = cur ? cur + ' ' + w : w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ============================================================
   SECTION 8 — SAMPLE PROGRAMS
   ============================================================ */

const SAMPLES = {
  hello: {
    label: 'Hello World',
    code: `Put "Hello, World!" to output`,
    inputs: ''
  },
  math: {
    label: 'Simple Math',
    code: `integer a\ninteger b\ninteger sum\na = Get next input\nb = Get next input\nsum = a + b\nPut "Sum: " to output\nPut sum to output`,
    inputs: '10 3'
  },
  branch: {
    label: 'If/Else Branch',
    code: `integer score\nscore = Get next input\nif score >= 90\n   Put "A" to output\nelseif score >= 80\n   Put "B" to output\nelseif score >= 70\n   Put "C" to output\nelse\n   Put "F" to output`,
    inputs: '85'
  },
  while: {
    label: 'While Loop',
    code: `integer total\ninteger num\ntotal = 0\nnum = Get next input\nwhile num != -1\n   total = total + num\n   num = Get next input\nPut "Total: " to output\nPut total to output`,
    inputs: '5 10 15 20 -1'
  },
  for: {
    label: 'For Loop',
    code: `integer i\nfor i = 0; i < 5; i = i + 1\n   Put i to output\n   Put "\\n" to output`,
    inputs: ''
  },
  array: {
    label: 'Array Example',
    code: `integer array(5) nums\ninteger i\nfor i = 0; i < 5; i = i + 1\n   nums[i] = Get next input\nfor i = 0; i < 5; i = i + 1\n   Put nums[i] to output\n   Put "\\n" to output`,
    inputs: '10 20 30 40 50'
  },
  func: {
    label: 'Function Example (F→C)',
    code: `Function FahrenheitToCelsius(float fahr) returns float celsius\n   celsius = (fahr - 32.0) * 5.0 / 9.0\n\nFunction Main() returns nothing nothing\n   float temp\n   float result\n   temp = Get next input\n   result = FahrenheitToCelsius(temp)\n   Put "Celsius: " to output\n   Put result with 1 decimal places to output`,
    inputs: '98.6'
  }
};

/* ============================================================
   SECTION 9 — UI CONTROLLER
   ============================================================ */

// DOM refs
const editor         = document.getElementById('code-editor');
const overlay        = document.getElementById('highlight-overlay');
const gutter         = document.getElementById('gutter');
const activeLineDiv  = document.getElementById('active-line-highlight');
const inputTextarea  = document.getElementById('input-textarea');
const outputEl       = document.getElementById('output');
const varsTbody      = document.getElementById('vars-tbody');
const statusBar      = document.getElementById('status-bar');
const statusState    = document.getElementById('status-state');
const statusDetail   = document.getElementById('status-detail');
const statusStep     = document.getElementById('status-step');
const btnExecuteEdit = document.getElementById('btn-execute-edit');
const btnStep        = document.getElementById('btn-step');
const btnRestart     = document.getElementById('btn-restart');
const btnRunPause    = document.getElementById('btn-run-pause');
const speedSlider    = document.getElementById('speed-slider');
const btnInstant     = document.getElementById('btn-instant');
const sampleSelect   = document.getElementById('sample-select');
const btnHelp        = document.getElementById('btn-help');
const btnTheme       = document.getElementById('btn-theme');
const helpModal      = document.getElementById('help-modal');
const btnHelpClose   = document.getElementById('btn-help-close');
const btnClearOutput = document.getElementById('btn-clear-output');
const urlBanner      = document.getElementById('url-banner');
const btnUrlClose    = document.getElementById('btn-url-banner-close');
const panelCode      = document.getElementById('panel-code');
const panelFlowchart = document.getElementById('panel-flowchart');
const tabCode        = document.getElementById('tab-code');
const tabFlowchart   = document.getElementById('tab-flowchart');
const flowchartSvg   = document.getElementById('flowchart-svg');
const chartRoot      = document.getElementById('chart-root');
const fcPlaceholder  = document.getElementById('flowchart-placeholder');
const fcViewport     = document.getElementById('flowchart-viewport');
const btnFit         = document.getElementById('btn-fit');
const btnZoomIn      = document.getElementById('btn-zoom-in');
const btnZoomOut     = document.getElementById('btn-zoom-out');

// State
const STATE = { EDIT:'EDIT', READY:'READY', RUNNING:'RUNNING', PAUSED:'PAUSED', COMPLETE:'COMPLETE' };
let state = STATE.EDIT;
let currentGenerator = null;
let genOutput = [];
let genInputQueue = [];
let ast = null;
let flowchartGraph = null;
let lineToNodeId = new Map();
let forCondMap   = new Map();
let forUpdateMap = new Map();
let stepIndex = 0;
let runTimer = null;
let outputLineCount = 0;
let currentOutputLine = null;
let prevVarSnapshot = new Map(); // for flash detection
let fcScale = 1, fcTx = 0, fcTy = 0;
let fcPanActive = false, fcPanStartX = 0, fcPanStartY = 0, fcPanStartTx = 0, fcPanStartTy = 0;
let activeTab = 'code';

// ── State machine ──
function setState(newState) {
  state = newState;
  const isEdit     = state === STATE.EDIT;
  const isRunning  = state === STATE.RUNNING;
  const isPaused   = state === STATE.PAUSED;
  const isReady    = state === STATE.READY;
  const isComplete = state === STATE.COMPLETE;
  const inExec     = !isEdit;

  btnExecuteEdit.textContent = isEdit ? 'Execute' : 'Edit';
  btnExecuteEdit.setAttribute('aria-label', isEdit ? 'Execute program' : 'Return to edit mode');

  btnStep.disabled = !(isReady || isPaused);
  btnRestart.disabled = isEdit;
  btnRunPause.disabled = isEdit || isComplete;
  btnRunPause.textContent = isRunning ? 'Pause' : 'Run';
  btnRunPause.setAttribute('aria-pressed', isRunning ? 'true' : 'false');
  btnRunPause.setAttribute('aria-label', isRunning ? 'Pause execution' : 'Run program');
  btnInstant.disabled = !(isReady || isPaused);

  speedSlider.disabled = isEdit || isComplete;
  editor.readOnly = inExec;
  inputTextarea.readOnly = inExec;
  sampleSelect.disabled = inExec;

  // Status bar state class
  statusBar.className = 'state-' + state.toLowerCase();
  const labels = { EDIT:'Edit Mode', READY:'Ready', RUNNING:'Running', PAUSED:'Paused', COMPLETE:'Complete' };
  statusState.textContent = labels[state] || state;

  if (isEdit) {
    statusDetail.textContent = '';
    statusStep.textContent = '';
    clearActiveLineHighlight();
  }

  updateSpeedAriaText();
}

function currentSpeedMs() {
  const pos = Number(speedSlider.value);
  return Math.round(3000 * Math.pow(750 / 3000, (pos - 1) / 8));
}

function updateSpeedAriaText() {
  const ms = currentSpeedMs();
  const secs = (ms / 1000).toFixed(1);
  speedSlider.setAttribute('aria-valuenow', speedSlider.value);
  speedSlider.setAttribute('aria-valuetext', `Step every ${secs} seconds`);
}

// ── Execute / Edit ──
btnExecuteEdit.addEventListener('click', () => {
  if (state !== STATE.EDIT) {
    exitToEdit();
    return;
  }

  const src = editor.value;
  if (!src.trim()) {
    showError({ message:'Nothing to run — write some Coral code first.', line: null });
    return;
  }

  let tokens, parsedAst;
  try {
    tokens = lex(src);
    parsedAst = new Parser(tokens).parse();
  } catch(e) {
    showError(e);
    return;
  }

  ast = parsedAst;
  genOutput = [];
  outputLineCount = 0;
  currentOutputLine = null;
  clearOutput();
  clearVars();

  genInputQueue = inputTextarea.value.trim().split(/\s+/).filter(Boolean);
  stepIndex = 0;
  currentGenerator = genProgram(ast, genInputQueue, genOutput);

  // Build flowchart graph if no user functions
  if (!ast.hasFunctions) {
    try {
      flowchartGraph = buildFlowchartGraph(ast);
      lineToNodeId   = flowchartGraph.lineToNodeId;
      forCondMap     = flowchartGraph.forCondMap;
      forUpdateMap   = flowchartGraph.forUpdateMap;
      fcPlaceholder.style.display = 'none';
    } catch(e) {
      flowchartGraph = null;
      lineToNodeId = new Map();
      forCondMap   = new Map();
      forUpdateMap = new Map();
    }
  } else {
    flowchartGraph = null;
    lineToNodeId = new Map();
    forCondMap   = new Map();
    forUpdateMap = new Map();
    fcPlaceholder.style.display = 'flex';
    fcPlaceholder.textContent = 'Flowchart not available for programs with user-defined functions.';
  }

  if (activeTab === 'flowchart') renderFlowchart(null);

  setState(STATE.READY);
});

// ── Restart ──
btnRestart.addEventListener('click', () => {
  if (!ast) return;
  if (runTimer) { clearInterval(runTimer); runTimer = null; }
  genOutput = [];
  outputLineCount = 0;
  currentOutputLine = null;
  clearOutput();
  clearVars();
  clearActiveLineHighlight();
  if (activeTab === 'flowchart') renderFlowchart(null);

  genInputQueue = inputTextarea.value.trim().split(/\s+/).filter(Boolean);
  stepIndex = 0;
  currentGenerator = genProgram(ast, genInputQueue, genOutput);
  setState(STATE.READY);
});

function exitToEdit() {
  if (runTimer) { clearInterval(runTimer); runTimer = null; }
  currentGenerator = null;
  genOutput = [];
  genInputQueue = [];
  stepIndex = 0;
  ast = null;
  flowchartGraph = null;
  lineToNodeId = new Map();
  forCondMap   = new Map();
  forUpdateMap = new Map();
  clearOutput();
  clearVars();
  clearFlowchart();
  clearActiveLineHighlight();
  setState(STATE.EDIT);
}

// ── Step forward ──
btnStep.addEventListener('click', advanceOneStep);

function advanceOneStep() {
  if (!currentGenerator) return;
  try {
    const { value, done } = currentGenerator.next();
    flushOutput();
    if (done) {
      finishExecution();
      return;
    }
    if (value) applyStep(value);
    if (state !== STATE.RUNNING) setState(STATE.PAUSED);
  } catch(e) {
    flushOutput();
    showError(e);
    setState(STATE.COMPLETE);
    if (runTimer) { clearInterval(runTimer); runTimer = null; }
  }
}

function applyStep(yieldValue) {
  const { loc, scope, callStack } = yieldValue;
  if (loc) {
    highlightEditorLine(loc.line);
    syncFlowchartHighlight(loc.line, loc.part);
  } else {
    clearActiveLineHighlight();
  }
  renderVarsTable(callStack);
  stepIndex++;
  statusStep.textContent = `Step ${stepIndex}`;
}

function finishExecution() {
  clearActiveLineHighlight();
  setState(STATE.COMPLETE);
  if (runTimer) { clearInterval(runTimer); runTimer = null; }
  // Highlight the End node in the flowchart so students know execution is done
  if (flowchartGraph && activeTab === 'flowchart') {
    renderFlowchart(flowchartGraph.endId);
  }
  const done = document.createElement('div');
  done.className = 'out-warn';
  done.textContent = '— Program complete —';
  outputEl.appendChild(done);
  outputEl.scrollTop = outputEl.scrollHeight;
}

// ── Run / Pause ──
btnRunPause.addEventListener('click', () => {
  if (state === STATE.RUNNING) {
    clearInterval(runTimer); runTimer = null;
    setState(STATE.PAUSED);
  } else {
    setState(STATE.RUNNING);
    runTimer = setInterval(advanceOneStep, currentSpeedMs());
  }
});

speedSlider.addEventListener('input', () => {
  updateSpeedAriaText();
  if (state === STATE.RUNNING && runTimer) {
    clearInterval(runTimer);
    runTimer = setInterval(advanceOneStep, currentSpeedMs());
  }
});

// ── Instant ──
btnInstant.addEventListener('click', () => {
  if (!currentGenerator) return;
  if (runTimer) { clearInterval(runTimer); runTimer = null; }
  try {
    while (true) {
      const { value, done } = currentGenerator.next();
      flushOutput();
      if (done) { finishExecution(); return; }
      if (value && value.callStack) renderVarsTable(value.callStack);
    }
  } catch(e) {
    flushOutput();
    showError(e);
    setState(STATE.COMPLETE);
  }
});

// ── Output ──
function flushOutput() {
  for (const fragment of genOutput) appendOutputFragment(fragment);
  genOutput.length = 0;
}

function appendOutputFragment(text) {
  const OUTPUT_LINE_LIMIT = 10000;
  for (const ch of text) {
    if (ch === '\n') {
      currentOutputLine = null;
      outputLineCount++;
      if (outputLineCount >= OUTPUT_LINE_LIMIT) {
        const warn = document.createElement('div');
        warn.className = 'out-warn';
        warn.textContent = '\u26A0 Output truncated at 10,000 lines.';
        outputEl.appendChild(warn);
        throw RuntimeError('Output limit reached', null,
          'Output truncated at 10,000 lines. Reduce output in your program.');
      }
    } else {
      if (!currentOutputLine) {
        currentOutputLine = document.createElement('div');
        currentOutputLine.className = 'out-line';
        outputEl.appendChild(currentOutputLine);
      }
      currentOutputLine.textContent += ch;
    }
  }
  outputEl.scrollTop = outputEl.scrollHeight;
}

function clearOutput() {
  outputEl.textContent = '';
  outputLineCount = 0;
  currentOutputLine = null;
}

btnClearOutput.addEventListener('click', clearOutput);

// ── Error display ──
function showError(e) {
  const line  = e.line  || null;
  const hint  = e.hint  || '';
  const msg   = e.message || String(e);

  // Highlight line if available
  if (line) highlightEditorLine(line);

  const div = document.createElement('div');
  div.className = 'out-error';
  div.textContent = (line ? `Line ${line}: ` : '') + msg + (hint ? '\n' + hint : '');
  outputEl.appendChild(div);
  outputEl.scrollTop = outputEl.scrollHeight;
}

// ── Editor: active line highlight ──
function highlightEditorLine(lineNum) {
  if (!lineNum) { clearActiveLineHighlight(); return; }
  const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 20.8;
  const paddingTop = parseFloat(getComputedStyle(editor).paddingTop)  || 8;
  const top = paddingTop + (lineNum - 1) * lineHeight;

  activeLineDiv.style.display = 'block';
  activeLineDiv.style.top  = top + 'px';
  activeLineDiv.style.height = lineHeight + 'px';

  // Gutter highlight
  document.querySelectorAll('.gutter-line').forEach((el, idx) => {
    el.classList.toggle('active', idx + 1 === lineNum);
  });

  // Scroll editor to show line
  const editorRect = editor.getBoundingClientRect();
  const lineTop    = top - editor.scrollTop;
  if (lineTop < 0 || lineTop > editorRect.height - lineHeight) {
    editor.scrollTop = top - editorRect.height / 2;
  }
}

function clearActiveLineHighlight() {
  activeLineDiv.style.display = 'none';
  document.querySelectorAll('.gutter-line.active').forEach(el => el.classList.remove('active'));
}

// ── Editor: gutter & overlay ──
function updateEditorUI() {
  const src = editor.value;
  const lines = src.split('\n');

  // Gutter
  gutter.innerHTML = lines.map((_, i) =>
    `<span class="gutter-line">${i + 1}</span>`).join('');

  // Highlight overlay
  overlay.innerHTML = highlightSource(src);
  overlay.scrollTop  = editor.scrollTop;
  overlay.scrollLeft = editor.scrollLeft;
}

editor.addEventListener('input', updateEditorUI);

editor.addEventListener('scroll', () => {
  overlay.scrollTop  = editor.scrollTop;
  overlay.scrollLeft = editor.scrollLeft;
  gutter.scrollTop   = editor.scrollTop;
  // Reposition active line div relative to scroll
});

// Tab key inserts 3 spaces
editor.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    if (e.shiftKey) return; // ignore shift-tab for now
    const start = editor.selectionStart;
    const end   = editor.selectionEnd;
    const val   = editor.value;
    editor.value = val.slice(0, start) + '   ' + val.slice(end);
    editor.selectionStart = editor.selectionEnd = start + 3;
    updateEditorUI();
  }
  if (e.key === 'Escape') {
    editor.blur();
  }
});

// ── Variables panel ──
function renderVarsTable(callStack) {
  if (!callStack || callStack.length === 0) return;

  const rows = [];
  // Only show current frame for simplicity (could show all frames)
  const frame = callStack[callStack.length - 1];
  const vars = frame.scope.allVars();

  vars.forEach((entry, name) => {
    const initialized = entry.initialized;
    const val = entry.value;
    const type = entry.declaredType;

    let valueCell;
    if (val instanceof CoralArray) {
      valueCell = `<td>${renderArraySubTable(val, name)}</td>`;
    } else {
      const cls = type === 'float' ? 'var-float' : 'var-int';
      const dispVal = type === 'float' ? formatValue(val, 'float', null) : String(Math.trunc(Number(val)));
      valueCell = `<td class="${cls}">${escHtml(dispVal)}</td>`;
    }

    const typeDisplay = type.replace('integer[]','int[]').replace('float[]','float[]');
    rows.push({ name, type: typeDisplay, valueCell, key: name + ':' + (val instanceof CoralArray ? JSON.stringify(val.data) : val) });
  });

  // Build DOM
  varsTbody.innerHTML = '';
  if (rows.length === 0) {
    varsTbody.innerHTML = '<tr id="vars-empty-row"><td colspan="3" class="vars-empty">No variables yet</td></tr>';
    return;
  }

  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="var-name">${escHtml(row.name)}</td><td class="var-type">${escHtml(row.type)}</td>${row.valueCell}`;
    varsTbody.appendChild(tr);

    // Flash if value changed
    const prevKey = prevVarSnapshot.get(row.name);
    if (prevKey !== undefined && prevKey !== row.key) {
      tr.classList.add('flashing');
      setTimeout(() => tr.classList.remove('flashing'), 650);
    }
  }

  // Update snapshot
  prevVarSnapshot = new Map(rows.map(r => [r.name, r.key]));
}

function renderArraySubTable(arr, name) {
  if (!arr._sizeSet) {
    return `<table class="array-subtable"><thead><tr><th>Index</th><th>Value</th></tr></thead><tbody><tr><td colspan="2" style="color:var(--muted);font-style:italic">Size not yet set</td></tr></tbody></table>`;
  }
  const rowsHtml = arr.data.map((v, i) =>
    `<tr><th scope="row">${i}</th><td>${escHtml(String(v))}</td></tr>`).join('');
  return `<table class="array-subtable"><thead><tr><th scope="col">Index</th><th scope="col">Value</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
}

function clearVars() {
  varsTbody.innerHTML = '<tr id="vars-empty-row"><td colspan="3" class="vars-empty">No variables yet</td></tr>';
  prevVarSnapshot = new Map();
}

// ── Flowchart ──
function renderFlowchart(activeNodeId) {
  if (!flowchartGraph) {
    fcPlaceholder.style.display = 'flex';
    chartRoot.innerHTML = '';
    return;
  }
  fcPlaceholder.style.display = 'none';
  const svgHtml = renderFlowchartSVG(flowchartGraph, activeNodeId);
  // Set SVG content via temporary element to avoid script injection
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgHtml, 'image/svg+xml');
  const svgEl = doc.documentElement;

  // Copy attributes & content to our existing SVG element
  flowchartSvg.setAttribute('width',   svgEl.getAttribute('width')   || '600');
  flowchartSvg.setAttribute('height',  svgEl.getAttribute('height')  || '400');
  flowchartSvg.setAttribute('viewBox', svgEl.getAttribute('viewBox') || '0 0 600 400');
  chartRoot.innerHTML = svgEl.innerHTML;
  updateFcTransform();
}

function syncFlowchartHighlight(lineNum, part) {
  if (activeTab !== 'flowchart' || !flowchartGraph) return;
  let nodeId;
  if (part === 'forCond')   nodeId = forCondMap.get(lineNum);
  else if (part === 'forUpdate') nodeId = forUpdateMap.get(lineNum);
  else                      nodeId = lineToNodeId.get(lineNum);
  renderFlowchart(nodeId || null);
}

function clearFlowchart() {
  chartRoot.innerHTML = '';
  if (flowchartGraph === null) {
    fcPlaceholder.style.display = 'flex';
    fcPlaceholder.textContent = 'Press Execute to generate the flowchart.';
  }
}

// Zoom / pan
function updateFcTransform() {
  chartRoot.setAttribute('transform', `translate(${fcTx},${fcTy}) scale(${fcScale})`);
}

function fitFlowchart() {
  if (!flowchartGraph) return;
  const svgW = parseFloat(flowchartSvg.getAttribute('width'))  || 600;
  const svgH = parseFloat(flowchartSvg.getAttribute('height')) || 400;
  const vpW = fcViewport.clientWidth  || 400;
  const vpH = fcViewport.clientHeight || 300;
  fcScale = Math.min(vpW / svgW, vpH / svgH, 1);
  fcTx = (vpW - svgW * fcScale) / 2;
  fcTy = (vpH - svgH * fcScale) / 2;
  updateFcTransform();
}

fcViewport.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 1.1 : 0.9;
  fcScale = Math.min(3, Math.max(0.2, fcScale * delta));
  updateFcTransform();
}, { passive: false });

fcViewport.addEventListener('pointerdown', e => {
  fcPanActive = true; fcViewport.setPointerCapture(e.pointerId);
  fcPanStartX = e.clientX; fcPanStartY = e.clientY;
  fcPanStartTx = fcTx; fcPanStartTy = fcTy;
});
fcViewport.addEventListener('pointermove', e => {
  if (!fcPanActive) return;
  fcTx = fcPanStartTx + (e.clientX - fcPanStartX);
  fcTy = fcPanStartTy + (e.clientY - fcPanStartY);
  updateFcTransform();
});
fcViewport.addEventListener('pointerup',   () => { fcPanActive = false; });
fcViewport.addEventListener('pointerleave', () => { fcPanActive = false; });

btnFit.addEventListener('click', fitFlowchart);
btnZoomIn.addEventListener('click',  () => { fcScale = Math.min(3, fcScale * 1.2); updateFcTransform(); });
btnZoomOut.addEventListener('click', () => { fcScale = Math.max(0.2, fcScale / 1.2); updateFcTransform(); });

// ── Tabs ──
tabCode.addEventListener('click',      () => switchToTab('code'));
tabFlowchart.addEventListener('click', () => switchToTab('flowchart'));

document.getElementById('tab-bar').addEventListener('keydown', e => {
  const tabs = [tabCode, tabFlowchart];
  const idx  = tabs.indexOf(document.activeElement);
  if (idx === -1) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); tabs[(idx + 1) % tabs.length].focus(); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); tabs[(idx - 1 + tabs.length) % tabs.length].focus(); }
});

function switchToTab(name) {
  activeTab = name;
  const isCode = name === 'code';
  panelCode.hidden      = !isCode;
  panelFlowchart.hidden = isCode;
  tabCode.setAttribute('aria-selected', isCode ? 'true' : 'false');
  tabFlowchart.setAttribute('aria-selected', isCode ? 'false' : 'true');
  tabCode.tabIndex      = isCode ? 0 : -1;
  tabFlowchart.tabIndex = isCode ? -1 : 0;
  if (!isCode && flowchartGraph) {
    const activeId = state === STATE.COMPLETE ? flowchartGraph.endId : null;
    renderFlowchart(activeId);
  }
}

// ── Theme toggle ──
(function initTheme() {
  const saved = localStorage.getItem('coral-theme');
  if (saved === 'light') {
    document.documentElement.classList.add('light');
    btnTheme.textContent = '\u263E\uFE0E';
    btnTheme.setAttribute('aria-label', 'Switch to dark mode');
  }
})();

btnTheme.addEventListener('click', () => {
  const isLight = document.documentElement.classList.toggle('light');
  btnTheme.textContent = isLight ? '\u263E\uFE0E' : '\u2600\uFE0E';
  btnTheme.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
  try { localStorage.setItem('coral-theme', isLight ? 'light' : 'dark'); } catch(e) {}
});

// ── Help modal ──
btnHelp.addEventListener('click',      () => helpModal.showModal());
btnHelpClose.addEventListener('click', () => { helpModal.close(); btnHelp.focus(); });
helpModal.addEventListener('close',    () => btnHelp.focus());

// ── Sample programs ──
sampleSelect.addEventListener('change', () => {
  const key = sampleSelect.value;
  if (!key || !SAMPLES[key]) return;
  const s = SAMPLES[key];
  editor.value = s.code;
  inputTextarea.value = s.inputs;
  sampleSelect.value = '';
  updateEditorUI();
  editor.focus();
});

// ── URL banner ──
btnUrlClose.addEventListener('click', () => { urlBanner.hidden = true; });

// ── URL parameter loading ──
function loadUrlParams() {
  let params;
  try { params = new URLSearchParams(window.location.search); }
  catch(e) { return; }

  const code  = params.get('code');
  const input = params.get('input');
  const autorun = params.has('autorun');

  if (code !== null) {
    editor.value = code.slice(0, 50000);
    updateEditorUI();
  }
  if (input !== null) {
    inputTextarea.value = input.slice(0, 10000);
  }
  if (code !== null || input !== null) {
    urlBanner.hidden = false;
    document.getElementById('url-banner-msg').textContent =
      '\u2139\uFE0E Code pre-loaded from shared link. Review it below, then press Execute.';
  }
  if (autorun && code !== null) {
    requestAnimationFrame(() => btnExecuteEdit.click());
  }
}

// ── Initialization ──
updateEditorUI();
setState(STATE.EDIT);
loadUrlParams();

})();
